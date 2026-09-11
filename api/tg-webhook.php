<?php
/**
 * Vape Club Dubai — Telegram Bot Webhook Handler (2-Way Live Chat)
 * Receives incoming messages from Admin via Telegram Bot,
 * routes replies to the active website visitor session,
 * and pushes the response directly into the visitor's live chat stream.
 */
declare(strict_types=1);

require_once dirname(__DIR__) . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'bootstrap.php';

if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
}

// Always return 200 OK to Telegram to acknowledge update receipt
http_response_code(200);

$raw = (string) file_get_contents('php://input');
if ($raw === '') {
    echo json_encode(['ok' => true, 'status' => 'empty_payload']);
    exit;
}

$update = json_decode($raw, true);
if (!is_array($update)) {
    echo json_encode(['ok' => true, 'status' => 'invalid_json']);
    exit;
}

$message = $update['message'] ?? null;
if (!$message || !isset($message['text'])) {
    echo json_encode(['ok' => true, 'status' => 'no_text_message']);
    exit;
}

$settings = vcd_load('settings');
$botToken = trim((string) ($settings['telegram_bot_token'] ?? ''));
$configuredChatId = trim((string) ($settings['telegram_chat_id'] ?? ''));

$fromChatId = (string) ($message['chat']['id'] ?? '');
$fromUserId = (string) ($message['from']['id'] ?? '');
$text = trim((string) $message['text']);

// Security check: Only allow messages from the configured admin chat or user ID
$isAuthorized = ($configuredChatId === '' || $fromChatId === $configuredChatId || $fromUserId === $configuredChatId);
if (!$isAuthorized) {
    // Silently ignore unauthorized users
    echo json_encode(['ok' => true, 'status' => 'unauthorized_sender']);
    exit;
}

// -------------------------------------------------------------
// COMMAND: /start or /help
// -------------------------------------------------------------
if (preg_match('/^\/(?:start|help)$/i', $text)) {
    $helpMsg = "🤖 <b>IQOS Dubai Live Chat Controller Active</b>\n"
             . "━━━━━━━━━━━━━━━━━━━━\n"
             . "Welcome Admin! You can chat with online website visitors directly from here:\n\n"
             . "💬 <b>How to Reply to a Visitor:</b>\n"
             . "1. <b>Swipe & Reply</b> directly to any Visitor Chat Alert.\n"
             . "2. Or type: <code>/reply [ID] your message</code>\n"
             . "   <i>Example:</i> <code>/reply 5821 Yes, available for 1-hour delivery!</code>\n\n"
             . "📊 <b>Other Commands:</b>\n"
             . "• <code>/status</code> — Check active website chats\n"
             . "• <code>/ping</code> — Test server response\n"
             . "━━━━━━━━━━━━━━━━━━━━";

    vcd_telegram_send($helpMsg, $botToken, $fromChatId, 'HTML');
    echo json_encode(['ok' => true, 'status' => 'help_dispatched']);
    exit;
}

// -------------------------------------------------------------
// COMMAND: /status
// -------------------------------------------------------------
if (preg_match('/^\/status$/i', $text)) {
    $sessionsFile = VCD_DATA . DIRECTORY_SEPARATOR . 'chat_sessions.json';
    $sessions = [];
    if (is_file($sessionsFile)) {
        $sessions = json_decode((string) file_get_contents($sessionsFile), true) ?: [];
    }
    $count = count($sessions);
    $recent = array_slice($sessions, -5, 5, true);

    $statusMsg = "📊 <b>Website Live Chat Status</b>\n"
               . "━━━━━━━━━━━━━━━━━━━━\n"
               . "• Total Chat Sessions: <b>{$count}</b>\n"
               . "• Webhook: <b>Connected & Active (HTTPS)</b>\n"
               . "• Server Time: <b>" . date('Y-m-d h:i:s A') . "</b>\n"
               . "━━━━━━━━━━━━━━━━━━━━";

    vcd_telegram_send($statusMsg, $botToken, $fromChatId, 'HTML');
    echo json_encode(['ok' => true, 'status' => 'status_dispatched']);
    exit;
}

// -------------------------------------------------------------
// COMMAND: /ping
// -------------------------------------------------------------
if (preg_match('/^\/ping$/i', $text)) {
    vcd_telegram_send("🏓 <b>Pong!</b> Webhook server is live and responsive.", $botToken, $fromChatId, 'HTML');
    echo json_encode(['ok' => true, 'status' => 'pong']);
    exit;
}

// -------------------------------------------------------------
// DETECT VISITOR REPLY (Direct Reply or /reply command)
// -------------------------------------------------------------
$targetSessionId = '';
$agentReplyText = '';

// Check Case 1: Direct Reply to previous message
if (!empty($message['reply_to_message']['text'])) {
    $quotedText = (string) $message['reply_to_message']['text'];
    if (preg_match('/#(?:CHAT-)?([A-Za-z0-9_-]{3,12})/i', $quotedText, $m)) {
        $rawId = strtoupper($m[1]);
        $targetSessionId = str_starts_with($rawId, 'CHAT-') ? $rawId : 'CHAT-' . $rawId;
        $agentReplyText = $text;
    }
}

// Check Case 2: Slash command /reply [ID] [Text] or /r [ID] [Text]
if ($targetSessionId === '' && preg_match('/^\/(?:reply|r)\s+([A-Za-z0-9_-]+)\s+(.+)$/isu', $text, $m)) {
    $rawId = strtoupper(trim($m[1]));
    $targetSessionId = str_starts_with($rawId, 'CHAT-') ? $rawId : 'CHAT-' . $rawId;
    $agentReplyText = trim($m[2]);
}

// If no matching session found
if ($targetSessionId === '' || $agentReplyText === '') {
    echo json_encode(['ok' => true, 'status' => 'ignored_no_target_session']);
    exit;
}

// -------------------------------------------------------------
// SAVE AGENT REPLY TO CHAT SESSION
// -------------------------------------------------------------
$sessionsFile = VCD_DATA . DIRECTORY_SEPARATOR . 'chat_sessions.json';
$sessions = [];
if (is_file($sessionsFile)) {
    $sessions = json_decode((string) file_get_contents($sessionsFile), true) ?: [];
}

if (!isset($sessions[$targetSessionId])) {
    $sessions[$targetSessionId] = [
        'session_id' => $targetSessionId,
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s'),
        'messages'   => []
    ];
}

$agentMsgId = 'agent_' . time() . '_' . rand(100, 999);
$newAgentMessage = [
    'id'        => $agentMsgId,
    'sender'    => 'agent',
    'text'      => $agentReplyText,
    'time'      => date('h:i A'),
    'timestamp' => time()
];

$sessions[$targetSessionId]['messages'][] = $newAgentMessage;
$sessions[$targetSessionId]['updated_at'] = date('Y-m-d H:i:s');

// Keep max 150 sessions
if (count($sessions) > 150) {
    $sessions = array_slice($sessions, -150, null, true);
}
@file_put_contents($sessionsFile, json_encode($sessions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);

// -------------------------------------------------------------
// CONFIRM DELIVERY TO ADMIN ON TELEGRAM
// -------------------------------------------------------------
$cleanReply = htmlspecialchars($agentReplyText, ENT_QUOTES, 'UTF-8');
$cleanSession = htmlspecialchars($targetSessionId, ENT_QUOTES, 'UTF-8');

$confirmMsg = "✅ <b>Message Delivered to Visitor (#{$cleanSession}):</b>\n"
            . "<i>\"{$cleanReply}\"</i>\n"
            . "<span style=\"color:#888;\">Visitor will see this live in their website chat window.</span>";

vcd_telegram_send($confirmMsg, $botToken, $fromChatId, 'HTML');

echo json_encode([
    'ok'         => true,
    'session_id' => $targetSessionId,
    'message_id' => $agentMsgId,
    'status'     => 'reply_recorded'
]);
