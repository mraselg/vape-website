<?php
/**
 * Public order intake — the checkout JS POSTs every order here
 * (both WhatsApp and online-form checkouts) so the admin panel
 * has a real order history. No auth; heavily sanitized.
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
if (strlen($raw) > 20000) {
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

$clean = fn($v, $max = 200) => mb_substr(trim(preg_replace('/[\x00-\x1F\x7F]/', '', (string) $v)), 0, $max);

$items = [];
foreach ((array) ($in['items'] ?? []) as $it) {
    if (!is_array($it)) continue;
    $items[] = [
        'id'    => $clean($it['id'] ?? '', 80),
        'name'  => $clean($it['name'] ?? '', 250),
        'price' => (float) ($it['price'] ?? 0),
        'qty'   => max(1, min(99, (int) ($it['qty'] ?? 1))),
    ];
    if (count($items) >= 50) break;
}

if (!$items) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'no_items']);
    exit;
}

$store  = vcd_load('orders');
$orders = $store['orders'] ?? [];

$order = [
    'id'        => $clean($in['id'] ?? '', 30) ?: ($VCD_SETTINGS['order_prefix'] ?? 'VCD') . '-' . random_int(10000, 99999),
    'date'      => date('c'),
    'source'    => in_array($in['source'] ?? '', ['whatsapp', 'form', 'express'], true) ? $in['source'] : 'form',
    'name'      => $clean($in['name'] ?? '', 120),
    'phone'     => $clean($in['phone'] ?? '', 40),
    'emirate'   => $clean($in['emirate'] ?? '', 60),
    'area'      => $clean($in['area'] ?? '', 120),
    'address'   => $clean($in['address'] ?? '', 200),
    'notes'     => $clean($in['notes'] ?? '', 300),
    'payment'   => $clean($in['paymentMethod'] ?? '', 60),
    'subtotal'  => (float) ($in['subtotal'] ?? 0),
    'delivery'  => (float) ($in['delivery'] ?? 0),
    'total'     => (float) ($in['total'] ?? 0),
    'items'     => $items,
    'status'    => 'new',
    'ip'        => (string) ($_SERVER['REMOTE_ADDR'] ?? ''),
];

array_unshift($orders, $order);
$orders = array_slice($orders, 0, 500);

if (!vcd_save('orders', ['orders' => $orders])) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'write_failed']);
    exit;
}

// Dispatch instant notification to Telegram Bot if enabled
$settings = vcd_load('settings');
$botToken = trim((string) ($settings['telegram_bot_token'] ?? ''));
$chatId   = trim((string) ($settings['telegram_chat_id'] ?? ''));
$orderAlertsEnabled = (bool) ($settings['telegram_order_alerts_enabled'] ?? true);

if ($orderAlertsEnabled && $botToken !== '' && $chatId !== '') {
    $itemLines = [];
    foreach ($items as $it) {
        $itemLines[] = "• " . $it['qty'] . "x " . $it['name'] . " (" . number_format((float) ($it['price'] * $it['qty'])) . " AED)";
    }
    $itemsSummary = implode("\n", $itemLines);

    $tgMsg = "🛍️ *NEW ORDER RECEIVED!* (`#" . ($order['id']) . "`)\n";
    $tgMsg .= "━━━━━━━━━━━━━━━━━━━━━━\n";
    $tgMsg .= "👤 *Customer*: " . ($order['name'] ?: 'Guest') . "\n";
    $tgMsg .= "📞 *Phone*: `" . ($order['phone']) . "`\n";
    if ($order['emirate'] !== '' || $order['area'] !== '') {
        $tgMsg .= "📍 *Location*: " . trim($order['emirate'] . ', ' . $order['area']) . "\n";
    }
    if ($order['address'] !== '') {
        $tgMsg .= "🏠 *Address*: " . $order['address'] . "\n";
    }
    $tgMsg .= "💳 *Payment*: " . ($order['payment'] ?: 'Cash on Delivery') . "\n";
    $tgMsg .= "━━━━━━━━━━━━━━━━━━━━━━\n";
    $tgMsg .= "📦 *Ordered Items*:\n" . $itemsSummary . "\n";
    $tgMsg .= "━━━━━━━━━━━━━━━━━━━━━━\n";
    $tgMsg .= "💵 *Subtotal*: " . number_format((float) $order['subtotal']) . " AED\n";
    $tgMsg .= "🚚 *Delivery*: " . ($order['delivery'] > 0 ? number_format((float) $order['delivery']) . " AED" : "FREE") . "\n";
    $tgMsg .= "💰 *Grand Total*: *" . number_format((float) $order['total']) . " AED*\n";
    if ($order['notes'] !== '') {
        $tgMsg .= "📝 *Notes*: " . $order['notes'] . "\n";
    }
    $tgMsg .= "🕒 *Time*: " . date('d M Y, h:i A') . " GST\n";
    $tgMsg .= "━━━━━━━━━━━━━━━━━━━━━━\n";
    $tgMsg .= "⚡ *Vape Club Dubai Order Dispatch*";

    vcd_telegram_send($tgMsg, $botToken, $chatId);
}

echo json_encode(['ok' => true, 'id' => $order['id']]);
