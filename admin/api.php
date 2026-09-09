<?php
/**
 * Admin JSON API — session auth + CSRF + per-section CRUD over the data store.
 * Sections: settings, home, products, categories, seo, orders + backup/restore.
 */
declare(strict_types=1);

require_once __DIR__ . '/../lib/bootstrap.php';

session_name('VCDADMIN');
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'path' => '/']);
session_start();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function authed(): bool
{
    return !empty($_SESSION['admin_ok']) && ($_SESSION['admin_exp'] ?? 0) > time();
}

function renew(): void
{
    $_SESSION['admin_exp'] = time() + 12 * 3600;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$body   = json_decode((string) file_get_contents('php://input'), true);
$action = (string) ($_GET['action'] ?? ($body['action'] ?? ''));

/* ---------- auth actions ---------- */
if ($action === 'login') {
    $u = (string) ($body['username'] ?? '');
    $p = (string) ($body['password'] ?? '');
    $fails = (int) ($_SESSION['login_fails'] ?? 0);
    if ($fails >= 8) {
        out(['ok' => false, 'error' => 'too_many_attempts'], 429);
    }
    $adm = vcd_load('admin');
    if ($u === ($adm['username'] ?? 'admin') && password_verify($p, (string) ($adm['password_hash'] ?? ''))) {
        session_regenerate_id(true);
        $_SESSION['admin_ok']    = true;
        $_SESSION['login_fails'] = 0;
        $_SESSION['csrf']        = bin2hex(random_bytes(16));
        renew();
        out(['ok' => true, 'csrf' => $_SESSION['csrf'], 'must_change' => $p === 'admin123']);
    }
    $_SESSION['login_fails'] = $fails + 1;
    usleep(400000);
    out(['ok' => false, 'error' => 'invalid_credentials'], 401);
}

if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    out(['ok' => true]);
}

if (!authed()) {
    out(['ok' => false, 'error' => 'auth_required'], 401);
}
renew();

/* CSRF on all mutating actions */
$mutating = !in_array($action, ['get', 'images', 'backup'], true);
if ($mutating) {
    $token = (string) ($_SERVER['HTTP_X_CSRF'] ?? ($body['csrf'] ?? ''));
    if ($token === '' || $token !== ($_SESSION['csrf'] ?? '')) {
        out(['ok' => false, 'error' => 'csrf'], 403);
    }
}

const SECTIONS = ['settings', 'home', 'products', 'categories', 'seo', 'orders', 'leads'];

switch ($action) {

    case 'get': {
        $data = [];
        foreach (SECTIONS as $s) {
            $data[$s] = vcd_load($s);
        }
        $data['admin_user'] = vcd_load('admin')['username'] ?? 'admin';
        out(['ok' => true, 'data' => $data]);
    }

    case 'save': {
        $section = (string) ($body['section'] ?? '');
        $payload = $body['data'] ?? null;
        if (!in_array($section, ['settings', 'home', 'products', 'categories', 'seo'], true) || !is_array($payload)) {
            out(['ok' => false, 'error' => 'bad_section'], 422);
        }
        if ($section === 'products' && !isset($payload['products'])) $payload = ['products' => $payload];
        if ($section === 'categories' && !isset($payload['cats'])) {
            out(['ok' => false, 'error' => 'categories_needs_cats'], 422);
        }
        if (!vcd_save($section, $payload)) {
            out(['ok' => false, 'error' => 'write_failed'], 500);
        }
        /* Keep robots.txt sitemap URL in sync with the canonical site URL */
        if ($section === 'seo') {
            $seo = $payload;
            $robots = "User-agent: *\nAllow: /\n\nDisallow: /admin/\nDisallow: /lib/\nDisallow: /includes/\nDisallow: /data/\nDisallow: /scratch/\nDisallow: /api/\n\nSitemap: " . rtrim((string) ($seo['site_url'] ?? ''), '/') . "/sitemap.xml\n";
            @file_put_contents(VCD_ROOT . '/robots.txt', $robots, LOCK_EX);
        }
        out(['ok' => true]);
    }

    case 'change_password': {
        $cur = (string) ($body['current'] ?? '');
        $new = (string) ($body['new'] ?? '');
        if (strlen($new) < 8) {
            out(['ok' => false, 'error' => 'password_min_8'], 422);
        }
        $adm = vcd_load('admin');
        if (!password_verify($cur, (string) ($adm['password_hash'] ?? ''))) {
            out(['ok' => false, 'error' => 'wrong_current'], 403);
        }
        $adm['password_hash'] = password_hash($new, PASSWORD_DEFAULT);
        if (isset($body['username']) && preg_match('/^[a-z0-9_.-]{3,32}$/i', (string) $body['username'])) {
            $adm['username'] = (string) $body['username'];
        }
        vcd_save('admin', $adm);
        out(['ok' => true]);
    }

    case 'order_status': {
        $id     = (string) ($body['id'] ?? '');
        $status = (string) ($body['status'] ?? '');
        if (!in_array($status, ['new', 'confirmed', 'delivered', 'cancelled'], true)) {
            out(['ok' => false, 'error' => 'bad_status'], 422);
        }
        $store = vcd_load('orders');
        $found = false;
        foreach (($store['orders'] ?? []) as &$o) {
            if (($o['id'] ?? '') === $id) {
                $o['status'] = $status;
                $found = true;
            }
        }
        unset($o);
        if (!$found) out(['ok' => false, 'error' => 'not_found'], 404);
        vcd_save('orders', $store);
        out(['ok' => true]);
    }

    case 'order_delete': {
        $id = (string) ($body['id'] ?? '');
        $store = vcd_load('orders');
        $store['orders'] = array_values(array_filter(($store['orders'] ?? []), fn($o) => ($o['id'] ?? '') !== $id));
        vcd_save('orders', $store);
        out(['ok' => true]);
    }

    case 'leads_clear': {
        vcd_save('leads', ['leads' => []]);
        out(['ok' => true]);
    }

    case 'lead_delete': {
        $id = (string) ($body['id'] ?? '');
        $store = vcd_load('leads');
        $store['leads'] = array_values(array_filter(($store['leads'] ?? []), fn($l) => ($l['id'] ?? '') !== $id));
        vcd_save('leads', $store);
        out(['ok' => true]);
    }

    case 'images': {
        $imgs = [];
        $patterns = [
            VCD_ROOT . '/assets/images/*.{jpg,jpeg,png,webp,svg}',
            VCD_ROOT . '/assets/images/products/*.{jpg,jpeg,png,webp,svg}',
            VCD_ROOT . '/assets/images/hero/*.{jpg,jpeg,png,webp,svg}',
            VCD_ROOT . '/assets/images/branding/*.{jpg,jpeg,png,webp,svg}',
        ];
        foreach ($patterns as $pattern) {
            foreach (glob($pattern, GLOB_BRACE) as $f) {
                $rel = str_replace('\\', '/', substr($f, strlen(VCD_ROOT) + 1));
                $imgs[] = $rel;
            }
        }
        $imgs = array_values(array_unique($imgs));
        sort($imgs);
        out(['ok' => true, 'images' => $imgs]);
    }

    case 'image_upload': {
        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            out(['ok' => false, 'error' => 'upload_failed'], 422);
        }
        $ext = strtolower(pathinfo((string) $_FILES['file']['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'svg'], true)) {
            out(['ok' => false, 'error' => 'bad_type'], 422);
        }
        if ($_FILES['file']['size'] > 6 * 1024 * 1024) {
            out(['ok' => false, 'error' => 'too_large_max_6mb'], 422);
        }
        $dir = in_array(($_POST['dir'] ?? ''), ['products', 'hero', 'branding'], true) ? $_POST['dir'] : 'products';
        $targetDir = VCD_ROOT . '/assets/images/' . $dir;
        if (!is_dir($targetDir)) {
            @mkdir($targetDir, 0775, true);
        }
        $slug = preg_replace('/[^a-z0-9]+/', '_', strtolower(pathinfo((string) $_FILES['file']['name'], PATHINFO_FILENAME)));
        $filename = $slug . '_' . time() . '.' . $ext;
        $dest = $targetDir . '/' . $filename;
        if (!move_uploaded_file($_FILES['file']['tmp_name'], $dest)) {
            out(['ok' => false, 'error' => 'move_failed'], 500);
        }
        out(['ok' => true, 'path' => 'assets/images/' . $dir . '/' . $filename]);
    }

    case 'backup': {
        $bundle = [];
        foreach (array_merge(SECTIONS, ['admin']) as $s) {
            $bundle[$s] = vcd_load($s);
        }
        unset($bundle['admin']); // never export credentials
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="vape-site-backup-' . date('Ymd-His') . '.json"');
        echo json_encode($bundle, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    case 'restore': {
        $bundle = $body['bundle'] ?? null;
        if (!is_array($bundle)) {
            out(['ok' => false, 'error' => 'bad_bundle'], 422);
        }
        $done = [];
        foreach (['settings', 'home', 'products', 'categories', 'seo', 'orders'] as $s) {
            if (isset($bundle[$s]) && is_array($bundle[$s])) {
                vcd_save($s, $bundle[$s]);
                $done[] = $s;
            }
        }
        out(['ok' => true, 'restored' => $done]);
    }

    default:
        out(['ok' => false, 'error' => 'unknown_action'], 404);
}
