<?php
$flash = ['enabled' => true, 'text' => 'FLASH DEAL — Free TEREA pack with every ILUMA device · Today only', 'cta_label' => 'Shop now', 'cta_href' => '#shop'];
$t = (string) ($flash['text'] ?? '');
$first = strtok($t, '—');
$rest = trim(substr($t, strlen($first) + 1));
echo 'FIRST: ' . bin2hex($first) . " (" . $first . ")\n";
echo 'REST: ' . bin2hex($rest) . " (" . $rest . ")\n";
echo 'OUTPUT: <strong>' . $first . '</strong> — ' . $rest . "\n";
