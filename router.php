<?php
/**
 * Router for PHP's built-in web server (used on the VPS: php -S 0.0.0.0:8010 router.php).
 * - Serves /sitemap.xml from sitemap.php
 * - Blocks direct access to internal paths (/data, /lib, /includes, /scratch, dotfiles)
 * - Everything else falls through to the normal static/PHP handling
 */
declare(strict_types=1);

$path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';

/* Block internal directories & dotfiles */
if (preg_match('#^/(data|lib|includes|scratch|\.|composer)#i', $path)) {
    http_response_code(403);
    header('Content-Type: text/plain');
    echo '403 Forbidden';
    return true;
}

/* Sitemap alias */
if ($path === '/sitemap.xml') {
    require __DIR__ . '/sitemap.php';
    return true;
}

/* Pretty root */
if ($path === '/') {
    require __DIR__ . '/index.php';
    return true;
}

/* Old .html URLs permanently redirect to the PHP versions (SEO) */
$legacy = ['/index.html' => '/', '/category.html' => '/category.php', '/product.html' => '/product.php'];
if (isset($legacy[$path])) {
    $qs = (string) ($_SERVER['QUERY_STRING'] ?? '');
    header('Location: ' . $legacy[$path] . ($qs !== '' ? '?' . $qs : ''), true, 301);
    return true;
}

return false; // let the built-in server serve the file (static or .php)
