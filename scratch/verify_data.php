<?php
/* R1 verification — explicit root-relative paths (no __DIR__ trap). */
$root = 'C:/xampp/htdocs/Vape Website/data';
$p = json_decode((string) file_get_contents($root . '/products.json'), true);
$c = json_decode((string) file_get_contents($root . '/categories.json'), true);
echo 'products=' . count($p['products'] ?? []) . PHP_EOL;
echo 'cats=' . count($c['cats'] ?? []) . PHP_EOL;
echo 'labels=' . count($c['labels'] ?? []) . PHP_EOL;
$ids = array_column($p['products'] ?? [], 'id');
echo 'unique_ids=' . count(array_unique($ids)) . PHP_EOL;
echo 'sample=' . ($p['products'][0]['id'] ?? '?') . PHP_EOL;
