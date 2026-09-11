<?php
/**
 * Vape Club Dubai — In-Page Live Chat API
 * Handles visitor message dispatch, polling for agent replies from Telegram,
 * and session chat persistence.
 */
declare(strict_types=1);

require_once dirname(__DIR__) . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'bootstrap.php';

if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
}

$action = (string) ($_GET['action'] ?? $_POST['action'] ?? 'send');
$sessionsFile = VCD_DATA . DIRECTORY_SEPARATOR . 'chat_sessions.json';

function vcd_load_chat_sessions(string $file): array {
    if (!is_file($file)) return [];
    $raw = @file_get_contents($file);
    $arr = json_decode((string) $raw, true);
    return is_array($arr) ? $arr : [];
}

function vcd_save_chat_sessions(string $file, array $sessions): bool {
    // Keep max 150 sessions
    if (count($sessions) > 150) {
        $sessions = array_slice($sessions, -150, null, true);
    }
    return @file_put_contents($file, json_encode($sessions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX) !== false;
}

// -------------------------------------------------------------
// ACTION: SEND (Visitor submits a message or phone number)
// -------------------------------------------------------------
if ($action === 'send') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
        exit;
    }

    $raw = (string) file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) $data = $_POST;

    $sessionId = trim((string) ($data['session_id'] ?? ''));
    if ($sessionId === '') {
        $sessionId = 'CHAT-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
    }

    $message = trim((string) ($data['message'] ?? ''));
    $phone = trim((string) ($data['phone'] ?? $data['full_phone'] ?? ''));
    $page = trim((string) ($data['page'] ?? '/'));
    $product = trim((string) ($data['product_name'] ?? ''));
    $cartSummary = trim((string) ($data['cart_summary'] ?? ''));
    $device = trim((string) ($data['device'] ?? 'Mobile/Desktop'));

    if ($message === '' && $phone === '') {
        echo json_encode(['ok' => false, 'error' => 'empty_payload']);
        exit;
    }

    $sessions = vcd_load_chat_sessions($sessionsFile);
    if (!isset($sessions[$sessionId])) {
        $sessions[$sessionId] = [
            'session_id' => $sessionId,
            'phone'      => $phone,
            'page'       => $page,
            'product'    => $product,
            'device'     => $device,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
            'messages'   => []
        ];
    } else {
        if ($phone !== '') $sessions[$sessionId]['phone'] = $phone;
        if ($page !== '') $sessions[$sessionId]['page'] = $page;
        $sessions[$sessionId]['updated_at'] = date('Y-m-d H:i:s');
    }

    $msgId = 'msg_' . time() . '_' . rand(100, 999);
    $newMsg = [
        'id'        => $msgId,
        'sender'    => 'user',
        'text'      => $message ?: "📞 Customer connected phone: {$phone}",
        'time'      => date('h:i A'),
        'timestamp' => time()
    ];
    $sessions[$sessionId]['messages'][] = $newMsg;
    vcd_save_chat_sessions($sessionsFile, $sessions);

    // Telegram Notification Dispatch
    $settings = vcd_load('settings');
    $alertsEnabled = (bool) ($settings['telegram_alerts_enabled'] ?? true);
    $botToken = trim((string) ($settings['telegram_bot_token'] ?? ''));
    $chatId = trim((string) ($settings['telegram_chat_id'] ?? ''));
    $telegramSent = false;

    if ($alertsEnabled && $botToken !== '' && $chatId !== '') {
        $phoneDisplay = $phone !== '' ? '<code>' . htmlspecialchars($phone, ENT_QUOTES, 'UTF-8') . '</code>' : '<i>Guest (No phone yet)</i>';
        $cleanPage = htmlspecialchars($page, ENT_QUOTES, 'UTF-8');
        $cleanMsg = htmlspecialchars($message ?: "Customer entered phone number for inquiry", ENT_QUOTES, 'UTF-8');
        $cleanProduct = $product ? htmlspecialchars($product, ENT_QUOTES, 'UTF-8') : 'Store General';
        $shortId = str_replace('CHAT-', '', $sessionId);

        $tgAlert = "💬 <b>Live Visitor Chat Message</b>\n"
                 . "━━━━━━━━━━━━━━━━━━━━\n"
                 . "🆔 <b>Session:</b> <code>#{$sessionId}</code>\n"
                 . "📞 <b>Phone:</b> {$phoneDisplay}\n"
                 . "📍 <b>Page:</b> {$cleanPage}\n"
                 . "🛍️ <b>Context:</b> {$cleanProduct}\n"
                 . ($cartSummary ? "🛒 <b>Cart:</b> " . htmlspecialchars($cartSummary, ENT_QUOTES, 'UTF-8') . "\n" : "")
                 . "💬 <b>Message:</b>\n"
                 . "<i>\"{$cleanMsg}\"</i>\n"
                 . "━━━━━━━━━━━━━━━━━━━━\n"
                 . "👉 <b>To Reply to Visitor:</b>\n"
                 . "• <b>Swipe/Reply</b> directly to this message on Telegram.\n"
                 . "• Or send: <code>/reply {$shortId} your message</code>";

        $res = vcd_telegram_send($tgAlert, $botToken, $chatId, 'HTML');
        $telegramSent = !empty($res['ok']);
    }

    echo json_encode([
        'ok'            => true,
        'session_id'    => $sessionId,
        'message_id'    => $msgId,
        'telegram_sent' => $telegramSent
    ]);
    exit;
}

// -------------------------------------------------------------
// ACTION: POLL (Visitor polls for new messages from Telegram Admin)
// -------------------------------------------------------------
if ($action === 'poll') {
    $sessionId = trim((string) ($_GET['session_id'] ?? $_POST['session_id'] ?? ''));
    $afterTimestamp = (int) ($_GET['after'] ?? $_POST['after'] ?? 0);
    $afterId = trim((string) ($_GET['after_id'] ?? $_POST['after_id'] ?? ''));

    if ($sessionId === '') {
        echo json_encode(['ok' => false, 'error' => 'missing_session_id']);
        exit;
    }

    $sessions = vcd_load_chat_sessions($sessionsFile);
    $session = $sessions[$sessionId] ?? null;

    if (!$session || empty($session['messages'])) {
        echo json_encode(['ok' => true, 'messages' => []]);
        exit;
    }

    $filtered = [];
    $foundAfterId = false;

    foreach ($session['messages'] as $m) {
        if ($afterId !== '') {
            if ($m['id'] === $afterId) {
                $foundAfterId = true;
                continue;
            }
            if ($foundAfterId) {
                $filtered[] = $m;
            }
        } elseif ($afterTimestamp > 0) {
            if (($m['timestamp'] ?? 0) > $afterTimestamp) {
                $filtered[] = $m;
            }
        } else {
            $filtered[] = $m;
        }
    }

    echo json_encode([
        'ok'       => true,
        'messages' => $filtered,
        'count'    => count($filtered)
    ]);
    exit;
}

// -------------------------------------------------------------
// ACTION: HISTORY (Returns full conversation history)
// -------------------------------------------------------------
if ($action === 'history') {
    $sessionId = trim((string) ($_GET['session_id'] ?? ''));
    if ($sessionId === '') {
        echo json_encode(['ok' => false, 'error' => 'missing_session_id']);
        exit;
    }

    $sessions = vcd_load_chat_sessions($sessionsFile);
    $session = $sessions[$sessionId] ?? null;

    echo json_encode([
        'ok'       => true,
        'messages' => $session ? ($session['messages'] ?? []) : []
    ]);
    exit;
}

echo json_encode(['ok' => false, 'error' => 'unknown_action']);
