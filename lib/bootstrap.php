<?php
/**
 * VCD Bootstrap — loads JSON data store + shared helpers.
 * Included by every public page, the admin API and the order API.
 */
declare(strict_types=1);

define('VCD_ROOT', dirname(__DIR__));
define('VCD_DATA', VCD_ROOT . DIRECTORY_SEPARATOR . 'data');

function vcd_load(string $name): array
{
    static $cache = [];
    if (isset($cache[$name])) {
        return $cache[$name];
    }
    $file = VCD_DATA . DIRECTORY_SEPARATOR . $name . '.json';
    if (!is_file($file)) {
        return $cache[$name] = [];
    }
    $data = json_decode((string) file_get_contents($file), true);
    return $cache[$name] = is_array($data) ? $data : [];
}

function vcd_save(string $name, array $data): bool
{
    $file = VCD_DATA . DIRECTORY_SEPARATOR . $name . '.json';
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return false;
    }
    return file_put_contents($file, $json, LOCK_EX) !== false;
}

/* ---------- Global data (loaded once per request) ---------- */
$VCD_SETTINGS = vcd_load('settings');
$VCD_PRODUCTS = vcd_load('products')['products'] ?? [];
$_cats        = vcd_load('categories');
$VCD_CATS     = $_cats['cats'] ?? [];
$VCD_LABELS   = $_cats['labels'] ?? [];
$VCD_HOME     = vcd_load('home');
$VCD_SEO      = vcd_load('seo');

/* ---------- Small helpers ---------- */
function e($s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

function aed($n): string
{
    return number_format((float) $n) . ' AED';
}

/** Absolute URL for a site-relative path, driven by SEO settings. */
function site_url(string $path = ''): string
{
    global $VCD_SEO;
    $base = rtrim((string) ($VCD_SEO['site_url'] ?? ''), '/');
    if ($path !== '' && $path[0] !== '/') {
        $path = '/' . $path;
    }
    return $base . $path;
}

function wa_link(string $text): string
{
    global $VCD_SETTINGS;
    return 'https://wa.me/' . ($VCD_SETTINGS['wa_number'] ?? '') . '?text=' . rawurlencode($text);
}

function product_by_id(string $id): ?array
{
    global $VCD_PRODUCTS;
    foreach ($VCD_PRODUCTS as $p) {
        if (($p['id'] ?? '') === $id) {
            return $p;
        }
    }
    return null;
}

/** Mirrors catProducts() in catalog.js */
function cat_products(string $key): array
{
    global $VCD_PRODUCTS;
    if ($key === 'all') {
        return $VCD_PRODUCTS;
    }
    if ($key === 'terea') {
        return array_values(array_filter($VCD_PRODUCTS, fn($p) => str_starts_with((string) ($p['cat'] ?? ''), 'terea-')));
    }
    return array_values(array_filter($VCD_PRODUCTS, fn($p) => ($p['cat'] ?? '') === $key));
}

/** Current script name without extension: index | category | product */
function current_page(): string
{
    return pathinfo((string) ($_SERVER['SCRIPT_NAME'] ?? ''), PATHINFO_FILENAME) ?: 'index';
}
