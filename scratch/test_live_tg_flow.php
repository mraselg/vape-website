<?php
require_once __DIR__ . '/../lib/bootstrap.php';

echo "=== 1. Simulating Website Visitor sending message ===\n";
$sessionId = 'CHAT-TEST1';
$postData = json_encode([
    'session_id'   => $sessionId,
    'message'      => 'Is IQOS ILUMA Prime Remix in stock for delivery now?',
    'full_phone'   => '+971 50 123 4567',
    'phone'        => '501234567',
    'product_name' => 'IQOS ILUMA i PRIME Remix'
]);

// Send message to chat-message.php
$ch = curl_init('http://localhost:8010/api/chat-message.php?action=send');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$res = curl_exec($ch);
curl_close($ch);
echo "Send result: " . $res . "\n";

echo "\n=== 2. Simulating Telegram Admin typing /reply TEST1 Yes sir in stock! ===\n";
$webhookPayload = json_encode([
    'update_id' => 999999,
    'message' => [
        'message_id' => 101,
        'from' => [
            'id' => 1827362508,
            'first_name' => 'Rasel'
        ],
        'chat' => [
            'id' => 1827362508,
            'type' => 'private'
        ],
        'date' => time(),
        'text' => '/reply TEST1 Yes sir, we have it in stock for immediate 1-hour delivery!'
    ]
]);

$ch = curl_init('http://localhost:8010/api/tg-webhook.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $webhookPayload);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$resWebhook = curl_exec($ch);
curl_close($ch);
echo "Webhook result: " . $resWebhook . "\n";

echo "\n=== 3. Simulating Website Visitor polling for new messages ===\n";
$pollUrl = 'http://localhost:8010/api/chat-message.php?action=poll&session_id=' . urlencode($sessionId) . '&after=0';
$pollRes = file_get_contents($pollUrl);
echo "Poll result: " . $pollRes . "\n";

$pollArr = json_decode((string)$pollRes, true);
if (!empty($pollArr['messages'])) {
    echo "SUCCESS! Messages found in poll: " . count($pollArr['messages']) . "\n";
    foreach ($pollArr['messages'] as $m) {
        echo "  - [{$m['sender']}] {$m['text']}\n";
    }
} else {
    echo "FAILED! No messages found in poll!\n";
}
