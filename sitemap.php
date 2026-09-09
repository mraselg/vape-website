<?php
/**
 * Dynamic XML sitemap — generated live from the JSON catalog so it is
 * always in sync with the admin panel. Served at /sitemap.xml via router.
 */
declare(strict_types=1);

require_once __DIR__ . '/lib/bootstrap.php';

header('Content-Type: application/xml; charset=utf-8');

$urls = [];
$urls[] = ['loc' => site_url('/'), 'changefreq' => 'daily', 'priority' => '1.0'];

foreach ($VCD_CATS as $key => $cat) {
    $urls[] = ['loc' => site_url('/category.php?cat=' . rawurlencode((string) $key)), 'changefreq' => 'weekly', 'priority' => '0.8'];
}

foreach ($VCD_PRODUCTS as $p) {
    $urls[] = ['loc' => site_url('/product.php?id=' . rawurlencode((string) ($p['id'] ?? ''))), 'changefreq' => 'weekly', 'priority' => '0.9'];
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<?php foreach ($urls as $u): ?>
  <url>
    <loc><?= e($u['loc']) ?></loc>
    <changefreq><?= e($u['changefreq']) ?></changefreq>
    <priority><?= e($u['priority']) ?></priority>
  </url>
<?php endforeach; ?>
</urlset>
