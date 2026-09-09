<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/bootstrap.php';

$missing = [];

// Check products
foreach ($VCD_PRODUCTS as $p) {
    if (!empty($p['photo'])) {
        $cleanPath = ltrim($p['photo'], '/');
        if (!file_exists(__DIR__ . '/../' . $cleanPath)) {
            $missing[] = "Product {$p['id']} photo missing: {$p['photo']}";
        }
    }
}

// Check categories
foreach ($VCD_CATS as $k => $c) {
    if (!empty($c['photo'])) {
        $cleanPath = ltrim($c['photo'], '/');
        if (!file_exists(__DIR__ . '/../' . $cleanPath)) {
            $missing[] = "Category {$k} photo missing: {$c['photo']}";
        }
    }
}

// Check hero slides
foreach (($VCD_HOME['hero_slides'] ?? []) as $i => $s) {
    if (!empty($s['img'])) {
        $cleanPath = ltrim($s['img'], '/');
        if (!file_exists(__DIR__ . '/../' . $cleanPath)) {
            $missing[] = "Hero slide {$i} img missing: {$s['img']}";
        }
    }
}

// Check static icon assets
$icons = [
    'assets/images/icons/favicon-32.png',
    'assets/images/icons/apple-touch-icon.png',
    'assets/css/style.css',
    'assets/js/catalog.js',
    'assets/js/shop-shared.js',
    'assets/js/main.js',
    'admin/assets/admin.css',
    'admin/assets/admin.js',
    'api/order.php',
];

foreach ($icons as $ico) {
    if (!file_exists(__DIR__ . '/../' . $ico)) {
        $missing[] = "Core asset missing: {$ico}";
    }
}

if ($missing) {
    echo "FAILED:\n" . implode("\n", $missing) . "\n";
    exit(1);
} else {
    echo "ALL 100% OK: Every single photo, script, stylesheet, and icon exists!\n";
    exit(0);
}
