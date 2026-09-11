<?php
/**
 * VCD Bootstrap — loads JSON data store + shared helpers.
 * Included by every public page, the admin API and the order API.
 */
declare(strict_types=1);

define('VCD_ROOT', dirname(__DIR__));
define('VCD_DATA', VCD_ROOT . DIRECTORY_SEPARATOR . 'data');
define('VCD_ASSET_VER', '3.2');

// Send HTTP headers to prevent aggressive browser/reverse proxy caching of dynamic HTML
if (!headers_sent() && php_sapi_name() !== 'cli') {
    header('Cache-Control: no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
}

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
        if (($p['id'] ?? '') === $id || (!empty($p['slug']) && $p['slug'] === $id)) {
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

/**
 * Universal Telegram Message Dispatcher
 * Sends a message via Telegram Bot API with Markdown formatting.
 *
 * @param string      $text      Markdown-formatted message text
 * @param string|null $botToken  Optional specific Bot Token (or falls back to settings.json)
 * @param string|null $chatId    Optional specific Chat ID (or falls back to settings.json)
 * @return array{ok: bool, error?: string, message?: string, response?: array}
 */
function vcd_telegram_send(string $text, ?string $botToken = null, ?string $chatId = null): array
{
    global $VCD_SETTINGS;
    $botToken = trim((string) ($botToken !== null ? $botToken : ($VCD_SETTINGS['telegram_bot_token'] ?? '')));
    $chatId   = trim((string) ($chatId !== null ? $chatId : ($VCD_SETTINGS['telegram_chat_id'] ?? '')));

    if ($botToken === '' || $chatId === '') {
        return ['ok' => false, 'error' => 'credentials_missing', 'message' => 'Telegram Bot Token or Chat ID not configured.'];
    }

    $tgUrl = "https://api.telegram.org/bot{$botToken}/sendMessage";
    $payload = [
        'chat_id'                  => $chatId,
        'text'                     => $text,
        'parse_mode'               => 'Markdown',
        'disable_web_page_preview' => true,
    ];

    if (function_exists('curl_init')) {
        $ch = curl_init($tgUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_TIMEOUT        => 6,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $raw = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);
        if ($raw === false) {
            return ['ok' => false, 'error' => 'curl_error', 'message' => $err ?: 'cURL request failed'];
        }
        $resp = json_decode((string) $raw, true);
        if ($code === 200 && !empty($resp['ok'])) {
            return ['ok' => true, 'response' => $resp];
        }
        return [
            'ok'      => false,
            'error'   => 'telegram_api_error',
            'code'    => $code,
            'message' => $resp['description'] ?? 'HTTP ' . $code
        ];
    }

    $ctx = stream_context_create([
        'http' => [
            'method'        => 'POST',
            'header'        => "Content-Type: application/json\r\n",
            'content'       => json_encode($payload),
            'timeout'       => 6,
            'ignore_errors' => true,
        ],
        'ssl' => [
            'verify_peer'      => false,
            'verify_peer_name' => false,
        ]
    ]);
    $raw = @file_get_contents($tgUrl, false, $ctx);
    if ($raw === false) {
        return ['ok' => false, 'error' => 'network_error', 'message' => 'Failed to connect to Telegram API.'];
    }
    $resp = json_decode((string) $raw, true);
    if (!empty($resp['ok'])) {
        return ['ok' => true, 'response' => $resp];
    }
    return [
        'ok'      => false,
        'error'   => 'telegram_api_error',
        'message' => $resp['description'] ?? 'Telegram API returned an error.'
    ];
}

/**
 * Query Telegram Bot profile info (/getMe)
 */
function vcd_telegram_get_me(string $botToken): array
{
    $botToken = trim($botToken);
    if ($botToken === '') {
        return ['ok' => false, 'error' => 'empty_token', 'message' => 'Bot Token is required.'];
    }
    $url = "https://api.telegram.org/bot{$botToken}/getMe";
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 6,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $raw = curl_exec($ch);
        curl_close($ch);
        if ($raw === false) {
            return ['ok' => false, 'error' => 'curl_error', 'message' => 'cURL connection failed.'];
        }
        $resp = json_decode((string) $raw, true);
        return is_array($resp) ? $resp : ['ok' => false, 'error' => 'bad_json'];
    }
    $ctx = stream_context_create([
        'ssl'  => ['verify_peer' => false, 'verify_peer_name' => false],
        'http' => ['timeout' => 6, 'ignore_errors' => true]
    ]);
    $raw = @file_get_contents($url, false, $ctx);
    $resp = json_decode((string) $raw, true);
    return is_array($resp) ? $resp : ['ok' => false, 'error' => 'request_failed'];
}

/**
 * Fetch recent updates from Telegram Bot to discover user chats (/getUpdates)
 */
function vcd_telegram_get_updates(string $botToken): array
{
    $botToken = trim($botToken);
    if ($botToken === '') {
        return ['ok' => false, 'error' => 'empty_token', 'message' => 'Bot Token is required.'];
    }
    $url = "https://api.telegram.org/bot{$botToken}/getUpdates";
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 6,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $raw = curl_exec($ch);
        curl_close($ch);
        if ($raw === false) {
            return ['ok' => false, 'error' => 'curl_error', 'message' => 'cURL connection failed.'];
        }
        $resp = json_decode((string) $raw, true);
        return is_array($resp) ? $resp : ['ok' => false, 'error' => 'bad_json'];
    }
    $ctx = stream_context_create([
        'ssl'  => ['verify_peer' => false, 'verify_peer_name' => false],
        'http' => ['timeout' => 6, 'ignore_errors' => true]
    ]);
    $raw = @file_get_contents($url, false, $ctx);
    $resp = json_decode((string) $raw, true);
    return is_array($resp) ? $resp : ['ok' => false, 'error' => 'request_failed'];
}


