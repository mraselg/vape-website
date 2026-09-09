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
function cur_role(): string
{
    return (string) ($_SESSION['admin_role'] ?? 'admin');
}

function require_role(array $allowed): void
{
    if (!in_array(cur_role(), $allowed, true)) {
        out(['ok' => false, 'error' => 'permission_denied', 'message' => 'Role ' . cur_role() . ' not authorized'], 403);
    }
}

if ($action === 'login') {
    $u = trim((string) ($body['username'] ?? ''));
    $p = (string) ($body['password'] ?? '');
    $fails = (int) ($_SESSION['login_fails'] ?? 0);
    if ($fails >= 8) {
        out(['ok' => false, 'error' => 'too_many_attempts'], 429);
    }
    $adm = vcd_load('admin');
    $matchedUser = null;

    // Check against users array if present
    if (!empty($adm['users']) && is_array($adm['users'])) {
        foreach ($adm['users'] as $user) {
            $userIdentifier = strtolower(trim((string) ($user['username'] ?? '')));
            $userDigits = preg_replace('/\D/', '', (string) ($user['phone'] ?? ''));
            $inputClean = strtolower($u);
            $inputDigits = preg_replace('/\D/', '', $u);

            $idMatches = ($inputClean !== '' && $inputClean === $userIdentifier);

            // Normalize UAE/international phone matching
            $userCore = ltrim($userDigits, '0');
            $inputCore = ltrim($inputDigits, '0');
            if (str_starts_with($userCore, '971')) $userCore = substr($userCore, 3);
            if (str_starts_with($inputCore, '971')) $inputCore = substr($inputCore, 3);
            $userCore = ltrim($userCore, '0');
            $inputCore = ltrim($inputCore, '0');

            $phoneMatches = false;
            if ($userCore !== '' && $inputCore !== '') {
                $phoneMatches = ($userCore === $inputCore)
                    || (strlen($inputCore) >= 7 && str_ends_with($userCore, $inputCore))
                    || (strlen($userCore) >= 7 && str_ends_with($inputCore, $userCore));
            }

            if (($idMatches || $phoneMatches) && password_verify($p, (string) ($user['password_hash'] ?? ''))) {
                if (($user['status'] ?? 'active') !== 'active') {
                    out(['ok' => false, 'error' => 'account_suspended'], 403);
                }
                $matchedUser = $user;
                break;
            }
        }
    }

    // Fallback check against root admin credentials
    if (!$matchedUser && $u === ($adm['username'] ?? 'admin') && password_verify($p, (string) ($adm['password_hash'] ?? ''))) {
        $matchedUser = [
            'id'       => 'usr_admin',
            'username' => $adm['username'] ?? 'admin',
            'name'     => 'Super Admin',
            'role'     => 'admin',
            'phone'    => ''
        ];
    }

    if ($matchedUser) {
        session_regenerate_id(true);
        $_SESSION['admin_ok']    = true;
        $_SESSION['admin_user']  = $matchedUser['username'] ?? 'admin';
        $_SESSION['admin_name']  = $matchedUser['name'] ?? $matchedUser['username'] ?? 'Admin';
        $_SESSION['admin_role']  = $matchedUser['role'] ?? 'admin';
        $_SESSION['admin_id']    = $matchedUser['id'] ?? 'usr_admin';
        $_SESSION['admin_phone'] = $matchedUser['phone'] ?? '';
        $_SESSION['login_fails'] = 0;
        $_SESSION['csrf']        = bin2hex(random_bytes(16));
        renew();
        out([
            'ok'          => true,
            'csrf'        => $_SESSION['csrf'],
            'username'    => $_SESSION['admin_user'],
            'name'        => $_SESSION['admin_name'],
            'role'        => $_SESSION['admin_role'],
            'phone'       => $_SESSION['admin_phone'],
            'must_change' => $p === 'admin123'
        ]);
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
        $allowedSections = SECTIONS;
        $role = cur_role();
        if ($role === 'author') {
            $allowedSections = ['products'];
        }
        foreach ($allowedSections as $s) {
            $data[$s] = vcd_load($s);
        }
        $data['admin_user'] = $_SESSION['admin_user'] ?? 'admin';
        $data['admin_name'] = $_SESSION['admin_name'] ?? 'Admin';
        $data['admin_role'] = cur_role();

        if ($role === 'admin') {
            $adm = vcd_load('admin');
            $teamClean = [];
            foreach (($adm['users'] ?? []) as $u) {
                $teamClean[] = [
                    'id'         => $u['id'] ?? '',
                    'name'       => $u['name'] ?? '',
                    'username'   => $u['username'] ?? '',
                    'phone'      => $u['phone'] ?? '',
                    'role'       => $u['role'] ?? 'author',
                    'status'     => $u['status'] ?? 'active',
                    'created_at' => $u['created_at'] ?? ''
                ];
            }
            $data['team'] = $teamClean;
        }

        out(['ok' => true, 'data' => $data]);
    }

    case 'save': {
        $section = (string) ($body['section'] ?? '');
        $payload = $body['data'] ?? null;
        if (!in_array($section, ['settings', 'home', 'products', 'categories', 'seo'], true) || !is_array($payload)) {
            out(['ok' => false, 'error' => 'bad_section'], 422);
        }
        if ($section === 'products') {
            require_role(['admin', 'editor', 'author']);
        } else {
            require_role(['admin', 'editor']);
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

    case 'team_create': {
        require_role(['admin']);
        $name     = trim((string) ($body['name'] ?? ''));
        $username = strtolower(trim((string) ($body['username'] ?? '')));
        $phone    = trim((string) ($body['phone'] ?? ''));
        $role     = (string) ($body['role'] ?? 'author');
        $password = (string) ($body['password'] ?? '');

        if ($name === '') {
            out(['ok' => false, 'error' => 'name_required'], 422);
        }
        if ($username === '' && $phone === '') {
            out(['ok' => false, 'error' => 'username_or_phone_required'], 422);
        }
        if (strlen($password) < 6) {
            out(['ok' => false, 'error' => 'password_min_6'], 422);
        }
        if (!in_array($role, ['admin', 'editor', 'author'], true)) {
            $role = 'author';
        }

        $adm = vcd_load('admin');
        if (!isset($adm['users']) || !is_array($adm['users'])) {
            $adm['users'] = [];
        }

        // Check uniqueness
        foreach ($adm['users'] as $u) {
            if ($username !== '' && strtolower($u['username'] ?? '') === $username) {
                out(['ok' => false, 'error' => 'username_taken'], 422);
            }
            if ($phone !== '') {
                $pCleanNew = preg_replace('/\D/', '', $phone);
                $pCleanOld = preg_replace('/\D/', '', (string) ($u['phone'] ?? ''));
                if ($pCleanNew !== '' && $pCleanNew === $pCleanOld) {
                    out(['ok' => false, 'error' => 'phone_taken'], 422);
                }
            }
        }

        $newUser = [
            'id'            => 'usr_' . bin2hex(random_bytes(6)),
            'name'          => $name,
            'username'      => $username !== '' ? $username : ('user_' . substr(preg_replace('/\D/', '', $phone), -4)),
            'phone'         => $phone,
            'role'          => $role,
            'status'        => 'active',
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'created_at'    => date('c'),
            'updated_at'    => date('c')
        ];

        $adm['users'][] = $newUser;
        vcd_save('admin', $adm);

        unset($newUser['password_hash']);
        out(['ok' => true, 'user' => $newUser]);
    }

    case 'team_update': {
        require_role(['admin']);
        $id       = (string) ($body['id'] ?? '');
        $name     = trim((string) ($body['name'] ?? ''));
        $username = strtolower(trim((string) ($body['username'] ?? '')));
        $phone    = trim((string) ($body['phone'] ?? ''));
        $role     = (string) ($body['role'] ?? '');
        $status   = (string) ($body['status'] ?? 'active');
        $password = (string) ($body['password'] ?? '');

        if ($id === '') {
            out(['ok' => false, 'error' => 'id_required'], 422);
        }

        $adm = vcd_load('admin');
        if (!isset($adm['users']) || !is_array($adm['users'])) {
            out(['ok' => false, 'error' => 'user_not_found'], 404);
        }

        $found = false;
        foreach ($adm['users'] as &$u) {
            if (($u['id'] ?? '') === $id) {
                $found = true;
                if ($name !== '') $u['name'] = $name;
                if ($username !== '') $u['username'] = $username;
                if ($phone !== '') $u['phone'] = $phone;
                if (in_array($role, ['admin', 'editor', 'author'], true)) {
                    if ($id === ($_SESSION['admin_id'] ?? '') && $role !== 'admin') {
                        out(['ok' => false, 'error' => 'cannot_demote_self'], 403);
                    }
                    $u['role'] = $role;
                }
                if (in_array($status, ['active', 'inactive'], true)) {
                    if ($id === ($_SESSION['admin_id'] ?? '') && $status === 'inactive') {
                        out(['ok' => false, 'error' => 'cannot_deactivate_self'], 403);
                    }
                    $u['status'] = $status;
                }
                if ($password !== '') {
                    if (strlen($password) < 6) {
                        out(['ok' => false, 'error' => 'password_min_6'], 422);
                    }
                    $u['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
                    if ($id === 'usr_admin' || ($u['username'] ?? '') === ($adm['username'] ?? 'admin')) {
                        $adm['password_hash'] = $u['password_hash'];
                    }
                }
                $u['updated_at'] = date('c');
                break;
            }
        }
        unset($u);

        if (!$found) {
            out(['ok' => false, 'error' => 'user_not_found'], 404);
        }

        vcd_save('admin', $adm);
        out(['ok' => true]);
    }

    case 'team_delete': {
        require_role(['admin']);
        $id = (string) ($body['id'] ?? '');
        if ($id === '') {
            out(['ok' => false, 'error' => 'id_required'], 422);
        }
        if ($id === ($_SESSION['admin_id'] ?? '') || $id === 'usr_admin') {
            out(['ok' => false, 'error' => 'cannot_delete_primary_or_self'], 403);
        }

        $adm = vcd_load('admin');
        $adm['users'] = array_values(array_filter(($adm['users'] ?? []), fn($u) => ($u['id'] ?? '') !== $id));
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
