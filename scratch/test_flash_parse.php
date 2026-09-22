<?php
function parse_flash($flash) {
    $rawText = trim((string) ($flash['text'] ?? ''));
    $badge = trim((string) ($flash['badge'] ?? ''));
    $desc = $rawText;

    if ($badge === '') {
        if (preg_match('/^([^\—\-\:\·]+)\s*[\—\-\:]\s*(.+)$/u', $rawText, $matches)) {
            $badge = trim($matches[1]);
            $desc = trim($matches[2]);
        } else {
            $badge = 'FLASH DEAL';
            $desc = $rawText;
        }
    } else {
        if (preg_match('/^' . preg_quote($badge, '/') . '\s*[\—\-\:]\s*(.+)$/u', $rawText, $matches)) {
            $desc = trim($matches[1]);
        }
    }
    return ['badge' => $badge, 'desc' => $desc];
}

$cases = [
    ['text' => 'FLASH DEAL — Free TEREA pack with every ILUMA device · Today only'],
    ['badge' => 'FLASH DEAL', 'text' => 'Free TEREA pack with every ILUMA device · Today only'],
    ['badge' => 'SPECIAL OFFER', 'text' => 'Buy 2 Get 1 Free on all IQOS ILUMA'],
    ['text' => 'TODAY ONLY - Free Shipping across Dubai on all orders'],
    ['text' => 'Just a plain deal text without any dash']
];

foreach ($cases as $c) {
    $res = parse_flash($c);
    echo 'BADGE: ' . $res['badge'] . ' | DESC: ' . $res['desc'] . "\n";
}
