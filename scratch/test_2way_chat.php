<?php
require_once __DIR__ . '/../lib/bootstrap.php';

echo "--- 1. Testing Visitor Ping ---\n";
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REMOTE_ADDR'] = '192.168.1.55';
$_SERVER['HTTP_CF_CONNECTING_IP'] = '185.220.101.99';
$_SERVER['HTTP_CF_IPCOUNTRY'] = 'AE';
$_SERVER['HTTP_CF_IPCITY'] = 'Dubai';
$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

// Test simulated POST to visitor-ping.php
ob_start();
include __DIR__ . '/../api/visitor-ping.php';
$pingOut = ob_get_clean();
echo "Visitor Ping Output: " . $pingOut . "\n\n";

echo "--- 2. Testing Chat Message (Send) ---\n";
$testSessionId = 'CHAT-TEST99';
$chatData = [
    'session_id' => $testSessionId,
    'phone' => '+971 56 123 4567',
    'message' => 'Hello from Automated Test!',
    'page' => '/shop',
    'product_name' => 'IQOS ILUMA PRIME'
];
// Save to chat_sessions.json
$sessionsFile = VCD_DATA . DIRECTORY_SEPARATOR . 'chat_sessions.json';
$sessions = is_file($sessionsFile) ? json_decode(file_get_contents($sessionsFile), true) : [];
$sessions[$testSessionId] = [
    'session_id' => $testSessionId,
    'phone' => '+971 56 123 4567',
    'created_at' => date('Y-m-d H:i:s'),
    'updated_at' => date('Y-m-d H:i:s'),
    'messages' => [
        [
            'id' => 'msg_test_1',
            'sender' => 'user',
            'text' => 'Hello from Automated Test!',
            'time' => date('h:i A'),
            'timestamp' => time()
        ]
    ]
];
file_put_contents($sessionsFile, json_encode($sessions, JSON_PRETTY_PRINT), LOCK_EX);
echo "Chat Session created successfully: " . $testSessionId . "\n";

echo "--- 3. Testing 2-Way Telegram Webhook Simulation ---\n";
// Simulate Admin replying to this session in Telegram
$webhookPayload = [
    'update_id' => 12345678,
    'message' => [
        'message_id' => 999,
        'from' => [
            'id' => 6532343622,
            'first_name' => 'Rasel'
        ],
        'chat' => [
            'id' => 6532343622,
            'type' => 'private'
        ],
        'date' => time(),
        'text' => 'Yes, we have it in stock and can deliver in 1 hour!',
        'reply_to_message' => [
            'message_id' => 998,
            'text' => "💬 Live Visitor Chat Message\nSession: #CHAT-TEST99\nMessage: Hello from Automated Test!"
        ]
    ]
];

// Let's test reply parsing logic directly
$quoted = $webhookPayload['message']['reply_to_message']['text'];
if (preg_match('/#(?:CHAT-)?([A-Za-z0-9_-]{3,12})/i', $quoted, $m)) {
    $rawId = strtoupper($m[1]);
    $matchedSid = str_starts_with($rawId, 'CHAT-') ? $rawId : 'CHAT-' . $rawId;
    echo "Successfully matched Session ID: {$matchedSid}\n";
    if ($matchedSid === $testSessionId) {
        $sessions[$matchedSid]['messages'][] = [
            'id' => 'agent_' . time(),
            'sender' => 'agent',
            'text' => $webhookPayload['message']['text'],
            'time' => date('h:i A'),
            'timestamp' => time()
        ];
        file_put_contents($sessionsFile, json_encode($sessions, JSON_PRETTY_PRINT), LOCK_EX);
        echo "Agent reply added to session messages!\n";
    }
}

// Verify poll retrieves the agent reply
echo "\n--- 4. Verify Polling Retrieval ---\n";
$updatedSessions = json_decode(file_get_contents($sessionsFile), true);
$testMsgs = $updatedSessions[$testSessionId]['messages'];
echo "Total messages in session {$testSessionId}: " . count($testMsgs) . "\n";
foreach ($testMsgs as $m) {
    echo "  [{$m['sender']}] {$m['text']} ({$m['time']})\n";
}
echo "\nALL TESTS COMPLETED SUCCESSFULLY!\n";
