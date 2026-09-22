<?php
$testCases = [
    "/reply CS07E your message",
    "/reply #CS07E your message",
    "/reply CHAT-CS07E your message",
    "/reply #CHAT-CS07E your message",
    "/reply@iqosaibot CS07E your message",
    "/reply CS07E: your message",
    "/reply [CS07E] your message",
    "/r CS07E your message",
    "/reply +971501234567 your message",
    "/reply 0501234567 your message",
    "/reply CS07E",
    "/reply",
    "/reply CS07E \n your multiline message line 2"
];

function parseReplyCommand(string $text): array {
    $text = trim($text);
    // Pattern for command /reply or /r, optional @bot, followed by target ID/phone, followed by message
    if (preg_match('/^\/(?:reply|r)(?:@\w+)?(?:\s+|:\s*)(?:\[|#)?(?:CHAT-)?([A-Za-z0-9_\+\-]+)(?:\]|:)?(?:\s+(.+))?$/isu', $text, $m)) {
        $rawTarget = trim($m[1]);
        $msg = isset($m[2]) ? trim($m[2]) : '';
        return [
            'matched' => true,
            'target'  => $rawTarget,
            'message' => $msg
        ];
    }
    return ['matched' => false];
}

foreach ($testCases as $tc) {
    $res = parseReplyCommand($tc);
    echo "INPUT: " . str_replace("\n", " [NL] ", $tc) . "\n";
    echo "  -> " . json_encode($res, JSON_UNESCAPED_UNICODE) . "\n";
}
