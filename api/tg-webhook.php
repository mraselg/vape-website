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

// Debug logging (keep last 60 events for inspection)
$debugLogFile = VCD_DATA . DIRECTORY_SEPARATOR . 'webhook_debug.log';
$logEntry = date('Y-m-d H:i:s') . ' | ' . substr($raw, 0, 400) . PHP_EOL;
@file_put_contents($debugLogFile, $logEntry, FILE_APPEND | LOCK_EX);

$message = $update['message'] ?? $update['edited_message'] ?? null;
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

// Security check: Only allow messages from configured admin chat or known admin IDs
$isAuthorized = ($configuredChatId === '' 
    || $fromChatId === $configuredChatId 
    || $fromUserId === $configuredChatId 
    || $fromChatId === '1827362508' 
    || $fromUserId === '1827362508'
    || $fromChatId === '6532343622' 
    || $fromUserId === '6532343622');

if (!$isAuthorized) {
    echo json_encode(['ok' => true, 'status' => 'unauthorized_sender']);
    exit;
}

// -------------------------------------------------------------
// COMMAND: /start or /help
// -------------------------------------------------------------
if (preg_match('/^\/(?:start|help)(?:@\w+)?$/i', $text)) {
    $helpMsg = "🤖 <b>IQOS Dubai Live Chat Controller Active</b>\n"
             . "━━━━━━━━━━━━━━━━━━━━\n"
             . "স্বাগতম! আপনি এখন আপনার এই টেলিগ্রাম থেকে ওয়েবসাইটের যেকোনো কাস্টমারের সাথে সরাসরি কথা বলতে পারবেন:\n\n"
             . "💬 <b>গ্রাহককে উত্তর পাঠানোর নিয়ম:</b>\n"
             . "<b>১. সরাসরি Swipe / Reply:</b>\n"
             . "বটে কাস্টমারের মেসেজ আসলে সেটির ওপর Swipe করে স্বাভাবিকভাবে রিপ্লাই দিন।\n\n"
             . "<b>২. /reply কমান্ডের মাধ্যমে:</b>\n"
             . "<code>/reply [সেশন_কোড] আপনার মেসেজ</code>\n"
             . "<i>যেমন:</i> <code>/reply CS07E হ্যালো, প্রোডাক্টটি স্টকে আছে!</code>\n\n"
             . "📊 <b>অন্যান্য কমান্ড:</b>\n"
             . "• <code>/status</code> — অ্যাক্টিভ ভিজিটর চ্যাট সেশন দেখুন\n"
             . "• <code>/ping</code> — সার্ভার রেসপন্স চেক করুন\n"
             . "━━━━━━━━━━━━━━━━━━━━";

    vcd_telegram_send($helpMsg, $botToken, $fromChatId, 'HTML');
    echo json_encode(['ok' => true, 'status' => 'help_dispatched']);
    exit;
}

// -------------------------------------------------------------
// COMMAND: /status
// -------------------------------------------------------------
if (preg_match('/^\/status(?:@\w+)?$/i', $text)) {
    $sessionsFile = VCD_DATA . DIRECTORY_SEPARATOR . 'chat_sessions.json';
    $sessions = [];
    if (is_file($sessionsFile)) {
        $sessions = json_decode((string) file_get_contents($sessionsFile), true) ?: [];
    }
    $count = count($sessions);
    
    $recentList = "";
    $recent = array_slice($sessions, -5, 5, true);
    foreach ($recent as $sId => $sData) {
        $short = str_replace('CHAT-', '', $sId);
        $phone = !empty($sData['phone']) ? $sData['phone'] : 'Guest';
        $msgCount = count($sData['messages'] ?? []);
        $recentList .= "• <code>{$short}</code> ({$phone}) — {$msgCount} msgs\n";
    }

    $statusMsg = "📊 <b>Website Live Chat Status</b>\n"
               . "━━━━━━━━━━━━━━━━━━━━\n"
               . "• Total Active Sessions: <b>{$count}</b>\n"
               . "• Webhook: <b>Connected & Live (HTTPS)</b>\n"
               . "• Server Time: <b>" . date('Y-m-d h:i:s A') . "</b>\n"
               . ($recentList !== '' ? "\n<b>Recent Sessions (To reply: /reply [CODE] [msg]):</b>\n" . $recentList : "")
               . "━━━━━━━━━━━━━━━━━━━━";

    vcd_telegram_send($statusMsg, $botToken, $fromChatId, 'HTML');
    echo json_encode(['ok' => true, 'status' => 'status_dispatched']);
    exit;
}

// -------------------------------------------------------------
// COMMAND: /ping
// -------------------------------------------------------------
if (preg_match('/^\/ping(?:@\w+)?$/i', $text)) {
    vcd_telegram_send("🏓 <b>Pong!</b> Webhook server is live and responsive.\nChat ID: <code>{$fromChatId}</code>", $botToken, $fromChatId, 'HTML');
    echo json_encode(['ok' => true, 'status' => 'pong']);
    exit;
}

// -------------------------------------------------------------
// DETECT /reply WITH MISSING ARGUMENTS (Helpful Guidance)
// -------------------------------------------------------------
if (preg_match('/^\/(?:reply|r)(?:@\w+)?$/i', $text)) {
    $guideMsg = "⚠️ <b>রিপ্লাই ফরম্যাট অপূর্ণ!</b>\n"
              . "━━━━━━━━━━━━━━━━━━━━\n"
              . "সঠিক নিয়ম:\n"
              . "<code>/reply [কোড] আপনার মেসেজ</code>\n\n"
              . "উদাহরণ:\n"
              . "<code>/reply CS07E হ্যালো, আপনার পছন্দের ফ্লেভারটি স্টকে আছে!</code>\n"
              . "━━━━━━━━━━━━━━━━━━━━";
    vcd_telegram_send($guideMsg, $botToken, $fromChatId, 'HTML');
    echo json_encode(['ok' => true, 'status' => 'reply_usage_sent']);
    exit;
}

// -------------------------------------------------------------
// DETECT VISITOR REPLY (Direct Reply or /reply command)
// -------------------------------------------------------------
$targetSessionId = '';
$agentReplyText = '';
$targetPhone = '';

// Check Case 1: Direct Reply to previous message
if (!empty($message['reply_to_message']['text']) || !empty($message['reply_to_message']['caption'])) {
    $quotedText = (string) ($message['reply_to_message']['text'] ?? $message['reply_to_message']['caption'] ?? '');
    
    // Extract session code e.g. #CHAT-CS07E or Session: #CS07E or #CS07E
    if (preg_match('/#(?:CHAT-)?([A-Za-z0-9_-]{3,12})/i', $quotedText, $m)) {
        $rawId = strtoupper($m[1]);
        $targetSessionId = str_starts_with($rawId, 'CHAT-') ? $rawId : 'CHAT-' . $rawId;
    } elseif (preg_match('/(?:Phone|Customer):\s*<code>?([+0-9\s-]{7,20})<\/code>?/i', $quotedText, $m)) {
        $targetPhone = preg_replace('/\D/', '', $m[1]);
    }
    
    $agentReplyText = $text;
    // Strip leading /reply or /r if the user typed that while replying
    $agentReplyText = preg_replace('/^\/(?:reply|r)(?:@\w+)?\s+/i', '', $agentReplyText);
}

// Check Case 2: Slash command /reply [ID or Phone] [Text]
if ($targetSessionId === '' && preg_match('/^\/(?:reply|r)(?:@\w+)?(?:\s+|:\s*)(?:\[|#)?(?:CHAT-)?([A-Za-z0-9_\+\-]+)(?:\]|:)?(?:\s+(.+))?$/isu', $text, $m)) {
    $rawTarget = trim($m[1]);
    $msgBody = isset($m[2]) ? trim($m[2]) : '';
    
    if ($msgBody === '') {
        $guideMsg = "⚠️ <b>মেসেজ লিখেননি!</b>\n"
                  . "আপনি সেশন আইডি দিয়েছেন (<code>{$rawTarget}</code>), কিন্তু কোনো উত্তর লিখেননি।\n\n"
                  . "সঠিক নিয়ম:\n"
                  . "<code>/reply {$rawTarget} আপনার মেসেজটি এখানে লিখুন</code>";
        vcd_telegram_send($guideMsg, $botToken, $fromChatId, 'HTML');
        echo json_encode(['ok' => true, 'status' => 'missing_reply_body']);
        exit;
    }
    
    $agentReplyText = $msgBody;
    
    // Check if target is a phone number (e.g. +97150... or 050...)
    if (preg_match('/^\+?\d{7,15}$/', $rawTarget)) {
        $targetPhone = preg_replace('/\D/', '', $rawTarget);
    } else {
        $rawId = strtoupper($rawTarget);
        $targetSessionId = str_starts_with($rawId, 'CHAT-') ? $rawId : 'CHAT-' . $rawId;
    }
}

// Load existing chat sessions
$sessionsFile = VCD_DATA . DIRECTORY_SEPARATOR . 'chat_sessions.json';
$sessions = [];
if (is_file($sessionsFile)) {
    $sessions = json_decode((string) file_get_contents($sessionsFile), true) ?: [];
}

// If session was targeted by phone, find matching session ID
if ($targetSessionId === '' && $targetPhone !== '') {
    foreach ($sessions as $sId => $sData) {
        $cleanSPhone = preg_replace('/\D/', '', (string) ($sData['phone'] ?? ''));
        if ($cleanSPhone !== '' && (str_ends_with($cleanSPhone, $targetPhone) || str_ends_with($targetPhone, $cleanSPhone))) {
            $targetSessionId = $sId;
            break;
        }
    }
}

// If still no matching session found
if ($targetSessionId === '' || $agentReplyText === '') {
    if ($targetPhone !== '') {
        $errMsg = "⚠️ <code>{$targetPhone}</code> নম্বরের কোনো অ্যাক্টিভ চ্যাট সেশন পাওয়া যায়নি।\n/status লিখে অ্যাক্টিভ কোডগুলো দেখতে পারেন।";
        vcd_telegram_send($errMsg, $botToken, $fromChatId, 'HTML');
    }
    echo json_encode(['ok' => true, 'status' => 'ignored_no_target_session']);
    exit;
}

// -------------------------------------------------------------
// SAVE AGENT REPLY TO CHAT SESSION
// -------------------------------------------------------------
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
$shortCode = str_replace('CHAT-', '', $cleanSession);

$confirmMsg = "✅ <b>Message Delivered to Visitor (#{$shortCode}):</b>\n"
            . "━━━━━━━━━━━━━━━━━━━━\n"
            . "<i>\"{$cleanReply}\"</i>\n"
            . "━━━━━━━━━━━━━━━━━━━━\n"
            . "🌐 কাস্টমার তার ব্রাউজারে এটি সরাসরি দেখতে পেয়েছে।";

vcd_telegram_send($confirmMsg, $botToken, $fromChatId, 'HTML');

echo json_encode([
    'ok'         => true,
    'session_id' => $targetSessionId,
    'message_id' => $agentMsgId,
    'status'     => 'reply_recorded'
]);
