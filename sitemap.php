<?php
/**
 * Dynamic XML sitemap — generated live from the JSON catalog so it is
 * always in sync with the admin panel. Served at /sitemap.xml via router.
 * Includes Google Image sitemap extensions for maximum image discovery.
 */
declare(strict_types=1);

require_once __DIR__ . '/lib/bootstrap.php';

header('Content-Type: application/xml; charset=utf-8');

$today = date('Y-m-d');
$urls = [];

// Homepage
$urls[] = [
    'loc'        => site_url('/'),
    'lastmod'    => $today,
    'changefreq' => 'daily',
    'priority'   => '1.0'
];

// Guide Pages
$guides = [
    '/guide-terea.php' => 'TEREA UAE Flavor & Country Editions Guide — Japan, Swiss, Indonesia',
    '/guide-iluma.php' => 'IQOS ILUMA vs ILUMA PRIME vs ONE Comparison Guide Dubai',
];
foreach ($guides as $path => $guideTitle) {
    if (file_exists(__DIR__ . $path)) {
        $urls[] = [
            'loc'        => site_url($path),
            'lastmod'    => $today,
            'changefreq' => 'weekly',
            'priority'   => '0.8',
            'title'      => $guideTitle
        ];
    }
}

// Categories
foreach ($VCD_CATS as $key => $cat) {
    $urls[] = [
        'loc'        => site_url('/category.php?cat=' . rawurlencode((string) $key)),
        'lastmod'    => $today,
        'changefreq' => 'weekly',
        'priority'   => '0.85'
    ];
}

// Products with primary and gallery images
foreach ($VCD_PRODUCTS as $p) {
    $entry = [
        'loc'        => site_url('/product.php?id=' . rawurlencode((string) ($p['id'] ?? ''))),
        'lastmod'    => $today,
        'changefreq' => 'weekly',
        'priority'   => '0.9',
        'images'     => []
    ];
    $title = (string) ($p['name'] ?? 'Vape Product');
    if (!empty($p['photo'])) {
        $entry['images'][] = ['loc' => site_url((string) $p['photo']), 'title' => $title];
    }
    if (!empty($p['gallery']) && is_array($p['gallery'])) {
        foreach ($p['gallery'] as $gPhoto) {
            if (!empty($gPhoto) && $gPhoto !== ($p['photo'] ?? '')) {
                $entry['images'][] = ['loc' => site_url((string) $gPhoto), 'title' => $title];
            }
        }
    }
    $urls[] = $entry;
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
<?php foreach ($urls as $u): ?>
  <url>
    <loc><?= e($u['loc']) ?></loc>
    <lastmod><?= e($u['lastmod']) ?></lastmod>
    <changefreq><?= e($u['changefreq']) ?></changefreq>
    <priority><?= e($u['priority']) ?></priority>
<?php if (!empty($u['images'])): ?>
<?php foreach ($u['images'] as $img): ?>
    <image:image>
      <image:loc><?= e($img['loc']) ?></image:loc>
      <image:title><?= e($img['title']) ?></image:title>
    </image:image>
<?php endforeach; ?>
<?php endif; ?>
  </url>
<?php endforeach; ?>
</urlset>

