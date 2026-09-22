<?php
function testPayload($text) {
    $webhookPayload = json_encode([
        'update_id' => 999998,
        'message' => [
            'message_id' => 102,
            'from' => ['id' => 1827362508, 'first_name' => 'Rasel'],
            'chat' => ['id' => 1827362508, 'type' => 'private'],
            'date' => time(),
            'text' => $text
        ]
    ]);

    $ch = curl_init('http://localhost:8010/api/tg-webhook.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $webhookPayload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $res = curl_exec($ch);
    curl_close($ch);
    echo "Command: '{$text}' -> Result: {$res}\n";
}

testPayload('/reply');
testPayload('/reply TEST1');
testPayload('/reply #TEST1 Great service!');
testPayload('/reply@iqosaibot TEST1 Perfect delivery');
