<?php
/* Dump representative products + category schema for admin.js design */
$root = 'C:/xampp/htdocs/Vape Website/data';
$p = json_decode((string) file_get_contents($root . '/products.json'), true)['products'];
$c = json_decode((string) file_get_contents($root . '/categories.json'), true);

$byId = [];
foreach ($p as $prod) { $byId[$prod['id']] = $prod; }

/* keys used across all products */
$keys = [];
foreach ($p as $prod) { foreach (array_keys($prod) as $k) { $keys[$k] = true; } }
echo "ALL PRODUCT KEYS: " . implode(', ', array_keys($keys)) . PHP_EOL . PHP_EOL;

/* variant type coverage */
foreach ($p as $prod) {
    $v = $prod['variants'] ?? null;
    $vt = $v['type'] ?? '-';
    $groups = $v ? implode(',', array_filter(array_map(fn($g) => !empty($v[$g]) ? $g : null, ['packSizes','colors','flavors','strengths','resistance','bundles']))) : '';
    echo str_pad($prod['id'], 26) . " cat=" . str_pad($prod['cat'], 12) . " vtype=" . str_pad($vt, 10) . " groups=$groups" . PHP_EOL;
}

echo PHP_EOL . "=== SAMPLE iluma (colors+bundles) ===" . PHP_EOL;
echo json_encode($byId['iluma-prime-remix'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL;

echo PHP_EOL . "=== SAMPLE terea (packSizes) ===" . PHP_EOL;
$tid = null;
foreach ($p as $prod) { if (str_starts_with((string)$prod['cat'], 'terea-')) { $tid = $prod['id']; break; } }
echo json_encode($byId[$tid], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL;

echo PHP_EOL . "=== CATEGORIES cats ===" . PHP_EOL;
echo json_encode($c['cats'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL;
echo PHP_EOL . "=== CATEGORIES labels ===" . PHP_EOL;
echo json_encode($c['labels'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL;
