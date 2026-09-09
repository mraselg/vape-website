<?php
/**
 * CATEGORY PAGE — category.php?cat=<key>. Fully server-rendered for SEO.
 */
declare(strict_types=1);

require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/render.php';
require_once __DIR__ . '/lib/head.php';

$S = $VCD_SETTINGS;

$key  = preg_replace('/[^a-z0-9\-]/', '', (string) ($_GET['cat'] ?? 'all'));
$fallback = ['title' => 'All Products', 'sub' => 'Best vape shop in Dubai', 'desc' => 'The full Vape Club Dubai catalogue — original devices, sticks, disposables, pods and juices with express delivery.', 'photo' => '', 'theme' => 'art-emerald', 'art' => 'pack'];
$cat  = $VCD_CATS[$key] ?? $fallback;
$known = isset($VCD_CATS[$key]);
$list = cat_products($key);
$pageLabel = $VCD_LABELS[$key] ?? ($cat['title'] ?? 'All Products');

$seoPage = $VCD_SEO['pages']['category'] ?? [];
$title = str_replace('{category}', $pageLabel, (string) ($seoPage['title'] ?? '{category}'));
$desc = ($cat['desc'] ?? '') !== ''
    ? (string) $cat['desc']
    : str_replace('{category}', $pageLabel, (string) ($seoPage['description'] ?? ''));

$jsonld = [];
if ($VCD_SEO['schema_breadcrumb'] ?? true) {
    $jsonld[] = jsonld_breadcrumb([
        ['name' => 'Home', 'url' => site_url('/')],
        ['name' => $pageLabel, 'url' => site_url('/category.php?cat=' . rawurlencode($key))],
    ]);
}
if ($VCD_SEO['schema_product'] ?? true) {
    $jsonld[] = jsonld_item_list($list, $pageLabel);
}

render_head([
    'title'       => $title,
    'description' => $desc,
    'keywords'    => $seoPage['keywords'] ?? '',
    'robots'      => $known ? ($seoPage['robots'] ?? 'index, follow') : 'noindex, follow',
    'canonical'   => site_url('/category.php?cat=' . rawurlencode($key)),
    'og_type'     => 'website',
    'og_image'    => ($seoPage['og_image'] ?? '') !== '' ? $seoPage['og_image'] : (string) ($cat['photo'] ?? ''),
    'jsonld'      => $jsonld,
]);

$heroMedia = ($cat['photo'] ?? '') !== ''
    ? '<img class="cat-hero-photo" src="' . e($cat['photo']) . '" alt="' . e($cat['title'] ?? '') . '" onerror="this.remove()">'
    : '<div class="cat-hero-art ' . e($cat['theme'] ?? '') . '"><svg class="prod-art ' . e($cat['theme'] ?? '') . '"><use href="#art-' . e($cat['art'] ?? 'pack') . '"/></svg></div>';
?>
<body>

<?php require __DIR__ . '/includes/sprite.php'; ?>

<div class="backdrop" id="backdrop"></div>

<?php $backAnchor = '#categories'; require __DIR__ . '/includes/pdp-header.php'; ?>

<main class="pd-wrap container">
  <div id="catRoot"><section class="cat-hero <?= e($cat['theme'] ?? '') ?>">
      <div class="cat-hero-copy">
        <span class="eyebrow">Category</span>
        <h1><?= e($cat['title'] ?? '') ?></h1>
        <span class="cat-hero-sub"><?= e($cat['sub'] ?? '') ?></span>
        <p><?= e($cat['desc'] ?? '') ?></p>
        <div class="cat-hero-chips">
          <span><svg class="icon icon-sm"><use href="#i-truck"/></svg> 1-2h Dubai express</span>
          <span><svg class="icon icon-sm"><use href="#i-shield"/></svg> 100% original · ESMA</span>
          <span><svg class="icon icon-sm"><use href="#i-check"/></svg> <?= count($list) ?> product<?= count($list) === 1 ? '' : 's' ?></span>
        </div>
      </div>
      <div class="cat-hero-media"><?= $heroMedia ?></div>
    </section></div>

  <p class="result-note" id="catCount" aria-live="polite" style="margin-top:18px">Showing <b><?= count($list) ?></b> product<?= count($list) === 1 ? '' : 's' ?> — <?= e($cat['title'] ?? '') ?></p>
  <div class="product-grid" id="catGrid"><?php if (!$list): ?><div class="empty-state"><b>Nothing here yet</b>New stock lands weekly — ask us on WhatsApp.</div><?php endif; ?><?php foreach ($list as $p): echo cat_card_html($p); endforeach; ?></div>
</main>

<footer class="pd-foot">
  <div class="container">
    <p><strong>WARNING:</strong> Nicotine is addictive. 18+ only · ESMA certified · <?= e($S['copyright'] ?? '') ?></p>
  </div>
</footer>

<?php require __DIR__ . '/includes/modals.php'; ?>

<?php render_vcd_script(); ?>
<script src="/assets/js/catalog.js?v=2.6"></script>
<script src="/assets/js/shop-shared.js?v=2.6"></script>
<script src="/assets/js/category-page.js?v=2.6"></script>
</body>
</html>
