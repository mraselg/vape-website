<?php
/**
 * Vape Club Dubai — Real-time Website Visitor Activity Telemetry
 * Captures visitor IP, Geolocation (via Cloudflare/GeoIP), Device, Landing Page,
 * and Referrer, then dispatches an instant alert to the Telegram Bot.
 * Includes smart 15-minute de-duplication cache per IP to prevent spamming.
 */
declare(strict_types=1);

require_once dirname(__DIR__) . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'bootstrap.php';

if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

$settings = vcd_load('settings');
$trafficAlerts = (bool) ($settings['telegram_traffic_alerts_enabled'] ?? true);
$botToken = trim((string) ($settings['telegram_bot_token'] ?? ''));
$chatId = trim((string) ($settings['telegram_chat_id'] ?? ''));

// Read payload
$rawInput = (string) file_get_contents('php://input');
$input = json_decode($rawInput, true);
if (!is_array($input)) {
    $input = [];
}

// 1. Resolve Real IP Address
$ip = '127.0.0.1';
if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
    $ip = trim((string) $_SERVER['HTTP_CF_CONNECTING_IP']);
} elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
    $ip = trim((string) $_SERVER['HTTP_X_REAL_IP']);
} elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $parts = explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR']);
    $ip = trim($parts[0]);
} elseif (!empty($_SERVER['REMOTE_ADDR'])) {
    $ip = trim((string) $_SERVER['REMOTE_ADDR']);
}

// Ignore internal localhost or monitoring pings if needed
$isLocal = ($ip === '127.0.0.1' || $ip === '::1' || str_starts_with($ip, '192.168.'));

// 2. Resolve Country & Flag
$countryCode = strtoupper(trim((string) ($_SERVER['HTTP_CF_IPCOUNTRY'] ?? '')));
$city = trim((string) ($_SERVER['HTTP_CF_IPCITY'] ?? ''));

$countryNames = [
    'AE' => 'United Arab Emirates',
    'SA' => 'Saudi Arabia',
    'QA' => 'Qatar',
    'KW' => 'Kuwait',
    'OM' => 'Oman',
    'BH' => 'Bahrain',
    'BD' => 'Bangladesh',
    'IN' => 'India',
    'PK' => 'Pakistan',
    'US' => 'United States',
    'GB' => 'United Kingdom',
    'RU' => 'Russia',
    'CA' => 'Canada',
    'AU' => 'Australia',
    'DE' => 'Germany',
    'FR' => 'France',
];

function countryFlag(string $code): string {
    if (strlen($code) !== 2) return '🌐';
    $code = strtoupper($code);
    $first = ord($code[0]) - 65 + 0x1F1E6;
    $second = ord($code[1]) - 65 + 0x1F1E6;
    return mb_chr($first, 'UTF-8') . mb_chr($second, 'UTF-8');
}

$flag = $countryCode ? countryFlag($countryCode) : '🌐';
$countryName = $countryNames[$countryCode] ?? ($countryCode ?: ($isLocal ? 'Localhost / Office' : 'Global'));
$locationStr = $flag . ' ' . $countryName . ($city ? " ({$city})" : '');

// 3. Resolve Device & Browser from User-Agent
$ua = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');

$device = '🖥️ Desktop';
if (preg_match('/iPhone/i', $ua)) {
    $device = '📱 Mobile (iPhone / iOS)';
} elseif (preg_match('/iPad/i', $ua)) {
    $device = '📱 Tablet (iPad / iPadOS)';
} elseif (preg_match('/Android.*Mobile/i', $ua)) {
    $device = '📱 Mobile (Android)';
} elseif (preg_match('/Android/i', $ua)) {
    $device = '📱 Tablet (Android)';
} elseif (preg_match('/Macintosh/i', $ua)) {
    $device = '💻 Mac (macOS)';
} elseif (preg_match('/Windows/i', $ua)) {
    $device = '🖥️ Windows PC';
} elseif (preg_match('/Linux/i', $ua)) {
    $device = '🖥️ Linux';
}

$browser = 'Browser';
if (preg_match('/Edg/i', $ua)) {
    $browser = 'Microsoft Edge';
} elseif (preg_match('/Chrome/i', $ua)) {
    $browser = 'Google Chrome';
} elseif (preg_match('/Safari/i', $ua) && !preg_match('/Chrome/i', $ua)) {
    $browser = 'Apple Safari';
} elseif (preg_match('/Firefox/i', $ua)) {
    $browser = 'Mozilla Firefox';
} elseif (preg_match('/Opera|OPR/i', $ua)) {
    $browser = 'Opera';
}

// 4. Page, Referrer, and Screen
$page = trim((string) ($input['page'] ?? '/'));
$referrer = trim((string) ($input['referrer'] ?? ''));
if ($referrer === '' || $referrer === 'Direct / Bookmark') {
    $refText = 'Direct / Bookmark';
} elseif (stripos($referrer, 'google.') !== false) {
    $refText = '🔍 Google Search';
} elseif (stripos($referrer, 'facebook.') !== false || stripos($referrer, 'fb.') !== false) {
    $refText = '📘 Facebook';
} elseif (stripos($referrer, 'instagram.') !== false) {
    $refText = '📸 Instagram';
} elseif (stripos($referrer, 't.me') !== false || stripos($referrer, 'telegram') !== false) {
    $refText = '✈️ Telegram';
} elseif (stripos($referrer, 'tiktok.') !== false) {
    $refText = '🎵 TikTok';
} else {
    $refText = parse_url($referrer, PHP_URL_HOST) ?: substr($referrer, 0, 40);
}

$screen = trim((string) ($input['screen'] ?? ''));
$timestampStr = date('Y-m-d h:i:s A') . ' (GST / UAE)';

// 5. Anti-Spam / 15-Minute De-duplication per IP
$cacheFile = VCD_DATA . DIRECTORY_SEPARATOR . 'visitor_cache.json';
$cache = [];
if (is_file($cacheFile)) {
    $cachedData = json_decode((string) file_get_contents($cacheFile), true);
    if (is_array($cachedData)) {
        $cache = $cachedData;
    }
}

$now = time();
// Prune records older than 24 hours (86400 seconds)
$cleanedCache = [];
foreach ($cache as $cip => $ctime) {
    if ($now - $ctime < 86400) {
        $cleanedCache[$cip] = $ctime;
    }
}
$cache = $cleanedCache;

$ipKey = md5($ip . '_' . $page);
$lastSeen = $cache[$ipKey] ?? 0;

// If same IP on same page within 15 minutes (900 seconds), skip Telegram alert to avoid flooding
$isDuplicate = ($now - $lastSeen < 900);
$cache[$ipKey] = $now;
@file_put_contents($cacheFile, json_encode($cache, JSON_PRETTY_PRINT), LOCK_EX);

if ($isDuplicate) {
    echo json_encode([
        'ok' => true,
        'status' => 'cached',
        'message' => 'Visitor session already notified recently.'
    ]);
    exit;
}

// 6. Dispatch Telegram Alert if enabled
$telegramSent = false;
if ($trafficAlerts && $botToken !== '' && $chatId !== '') {
    $cleanPage = htmlspecialchars($page, ENT_QUOTES, 'UTF-8');
    $cleanIp = htmlspecialchars($ip, ENT_QUOTES, 'UTF-8');
    $cleanDevice = htmlspecialchars($device . ' · ' . $browser, ENT_QUOTES, 'UTF-8');
    $cleanLoc = htmlspecialchars($locationStr, ENT_QUOTES, 'UTF-8');
    $cleanRef = htmlspecialchars($refText, ENT_QUOTES, 'UTF-8');
    $cleanScreen = $screen ? htmlspecialchars($screen, ENT_QUOTES, 'UTF-8') : 'Standard';

    $msg = "🌐 <b>New Website Visitor Alert</b>\n"
         . "━━━━━━━━━━━━━━━━━━━━\n"
         . "📍 <b>Location:</b> {$cleanLoc}\n"
         . "🌐 <b>IP Address:</b> <code>{$cleanIp}</code>\n"
         . "📱 <b>Device:</b> {$cleanDevice}\n"
         . "🔗 <b>Landing Page:</b> <code>{$cleanPage}</code>\n"
         . "🧭 <b>Source:</b> {$cleanRef}\n"
         . "🖥️ <b>Screen:</b> {$cleanScreen}\n"
         . "⏰ <b>Time:</b> {$timestampStr}\n"
         . "━━━━━━━━━━━━━━━━━━━━";

    $res = vcd_telegram_send($msg, $botToken, $chatId, 'HTML');
    $telegramSent = !empty($res['ok']);
}

echo json_encode([
    'ok' => true,
    'telegram_sent' => $telegramSent,
    'ip' => $ip,
    'location' => $locationStr,
    'timestamp' => $timestampStr
]);
