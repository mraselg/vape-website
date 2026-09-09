<?php
/**
 * Public WhatsApp Lead Capture & Telegram Dispatcher API
 * Silently ingests visitor WhatsApp numbers, cart context, device telemetry,
 * logs to data/leads.json and instantly forwards to Telegram Bot.
 */
declare(strict_types=1);

require_once __DIR__ . '/../lib/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

$raw = (string) file_get_contents('php://input');
if (strlen($raw) > 30000) {
    http_response_code(413);
    echo json_encode(['ok' => false, 'error' => 'too_large']);
    exit;
}

$in = json_decode($raw, true);
if (!is_array($in)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'bad_json']);
    exit;
}

$clean = fn($v, $max = 300) => mb_substr(trim(preg_replace('/[\x00-\x1F\x7F]/', '', (string) ($v ?? ''))), 0, $max);

$phone = $clean($in['phone'] ?? '', 40);
$countryCode = $clean($in['country_code'] ?? '+971', 10);
$fullPhone = $clean($in['full_phone'] ?? '', 50);
if ($fullPhone === '' && $phone !== '') {
    $fullPhone = $countryCode . ' ' . $phone;
}

if ($fullPhone === '' || strlen(preg_replace('/\D/', '', $fullPhone)) < 7) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'invalid_phone']);
    exit;
}

// Client IP & telemetry
$ip = $_SERVER['HTTP_CF_CONNECTING_IP']
    ?? explode(',', (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''))[0]
    ?? $_SERVER['REMOTE_ADDR']
    ?? '127.0.0.1';
$ip = trim((string) $ip);

$userAgent = (string) ($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown');
$device = $clean($in['device'] ?? '', 100);
if ($device === '') {
    $isMobile = (bool) preg_match('/iPhone|Android|Mobile|iPad/i', $userAgent);
    $device = $isMobile ? 'Mobile Device' : 'Desktop Browser';
}

$page = $clean($in['page'] ?? '', 200);
$product = $clean($in['product_name'] ?? '', 150);
$cartTotal = (float) ($in['cart_total'] ?? 0);
$cartSummary = $clean($in['cart_summary'] ?? '', 400);
$message = $clean($in['message'] ?? '', 1000);
$leadId = 'LEAD-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));

$leadRecord = [
    'id'           => $leadId,
    'timestamp'    => date('c'),
    'formatted_time' => date('d M Y, h:i A T'),
    'phone'        => $fullPhone,
    'raw_phone'    => preg_replace('/\D/', '', $fullPhone),
    'country_code' => $countryCode,
    'message'      => $message,
    'product'      => $product,
    'cart_total'   => $cartTotal,
    'cart_summary' => $cartSummary,
    'page'         => $page,
    'ip'           => $ip,
    'device'       => $device,
    'user_agent'   => mb_substr($userAgent, 0, 150),
];

// 1. Save to data/leads.json
$leadsFile = VCD_ROOT . '/data/leads.json';
$leadsStore = [];
if (file_exists($leadsFile)) {
    $leadsStore = json_decode((string) file_get_contents($leadsFile), true) ?: [];
}
if (!isset($leadsStore['leads']) || !is_array($leadsStore['leads'])) {
    $leadsStore['leads'] = [];
}

// Check if duplicate within last 2 minutes from same phone & page to avoid spam
$isDupe = false;
$twoMinAgo = time() - 120;
foreach (array_slice($leadsStore['leads'], 0, 10) as $prev) {
    if (($prev['raw_phone'] ?? '') === $leadRecord['raw_phone'] && strtotime((string) ($prev['timestamp'] ?? '')) > $twoMinAgo) {
        if ($message === '' || ($prev['message'] ?? '') === $message) {
            $isDupe = true;
            break;
        }
    }
}

if (!$isDupe) {
    array_unshift($leadsStore['leads'], $leadRecord);
    // Keep last 500 leads
    if (count($leadsStore['leads']) > 500) {
        $leadsStore['leads'] = array_slice($leadsStore['leads'], 0, 500);
    }
    @file_put_contents($leadsFile, json_encode($leadsStore, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

// 2. Dispatch to Telegram Bot
$telegramSent = false;
$settings = vcd_load('settings');
$botToken = trim((string) ($settings['telegram_bot_token'] ?? ''));
$chatId = trim((string) ($settings['telegram_chat_id'] ?? ''));
$alertsEnabled = (bool) ($settings['telegram_alerts_enabled'] ?? true);

if ($alertsEnabled && $botToken !== '' && $chatId !== '' && !$isDupe) {
    $tgText = "🟢 *NEW WHATSAPP LEAD CAPTURED*\n";
    $tgText .= "━━━━━━━━━━━━━━━━━━━━\n";
    $tgText .= "📱 *WhatsApp*: `" . $fullPhone . "`\n";
    if ($message !== '') {
        $tgText .= "💬 *Message*: " . $message . "\n";
    }
    if ($product !== '') {
        $tgText .= "📦 *Product*: " . $product . "\n";
    }
    if ($cartTotal > 0) {
        $tgText .= "🛒 *Cart Total*: *" . $cartTotal . " AED*\n";
        if ($cartSummary !== '') {
            $tgText .= "📋 *Items*: " . $cartSummary . "\n";
        }
    }
    if ($page !== '') {
        $tgText .= "🌐 *Page*: " . $page . "\n";
    }
    $tgText .= "📍 *IP*: `" . $ip . "`\n";
    $tgText .= "💻 *Device*: " . $device . "\n";
    $tgText .= "🕒 *Time*: " . date('d M Y, h:i A') . " GST\n";
    $tgText .= "━━━━━━━━━━━━━━━━━━━━\n";
    $tgText .= "⚡ *Vape Club Dubai Concierge Lead*";

    $tgUrl = "https://api.telegram.org/bot{$botToken}/sendMessage";
    $tgPayload = [
        'chat_id'                  => $chatId,
        'text'                     => $tgText,
        'parse_mode'               => 'Markdown',
        'disable_web_page_preview' => true,
    ];

    if (function_exists('curl_init')) {
        $ch = curl_init($tgUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS     => json_encode($tgPayload),
            CURLOPT_TIMEOUT        => 4,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $telegramSent = ($code === 200);
    } else {
        $ctx = stream_context_create([
            'http' => [
                'method'  => 'POST',
                'header'  => "Content-Type: application/json\r\n",
                'content' => json_encode($tgPayload),
                'timeout' => 4,
            ]
        ]);
        $res = @file_get_contents($tgUrl, false, $ctx);
        $telegramSent = ($res !== false);
    }
}

echo json_encode([
    'ok'            => true,
    'lead_id'       => $leadId,
    'telegram_sent' => $telegramSent,
    'verified'      => true,
], JSON_UNESCAPED_SLASHES);
