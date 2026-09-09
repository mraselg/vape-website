<?php
/**
 * PRODUCT PAGE — product.php?id=<product-id>. Fully server-rendered for SEO.
 * Unknown IDs get a real 404 (HTTP status + noindex), not a silent fallback.
 */
declare(strict_types=1);

require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/render.php';
require_once __DIR__ . '/lib/head.php';

$S = $VCD_SETTINGS;
$threshold = (float) ($S['free_ship_threshold'] ?? 450);
$ratingVal = (string) ($S['rating_value'] ?? '4.9');
$ratingCnt = (string) ($S['rating_count'] ?? '214');
$showRating = (bool) ($S['show_rating'] ?? true);

$id = preg_replace('/[^a-z0-9\-]/', '', (string) ($_GET['id'] ?? ''));
$p  = $id !== '' ? product_by_id($id) : null;

if (!$p) {
    http_response_code(404);
    render_head([
        'title'       => 'Product Not Found — Vape Club Dubai',
        'description' => 'The product you are looking for is no longer available. Browse our full catalogue of IQOS, TEREA and vapes in Dubai.',
        'robots'      => 'noindex, follow',
        'canonical'   => site_url('/product.php'),
    ]);
    ?>
<body class="pd-body">
<?php require __DIR__ . '/includes/sprite.php'; ?>
<div class="backdrop" id="backdrop"></div>
<?php require __DIR__ . '/includes/pdp-header.php'; ?>
<main class="pd-wrap container">
  <section class="cat-hero art-slate" style="margin-top:22px">
    <div class="cat-hero-copy">
      <span class="eyebrow">404 — Not Found</span>
      <h1>Product Not Available</h1>
      <span class="cat-hero-sub">This item may have sold out or the link is incorrect.</span>
      <p>Browse our full catalogue of original IQOS ILUMA devices, TEREA sticks and disposable vapes with 1-2 hour express delivery across Dubai.</p>
      <div class="cat-hero-chips">
        <span><svg class="icon icon-sm"><use href="#i-truck"/></svg> 1-2h Dubai express</span>
        <span><svg class="icon icon-sm"><use href="#i-shield"/></svg> 100% original · ESMA</span>
      </div>
      <div style="margin-top:18px"><a class="btn btn-primary" href="/#shop"><svg class="icon"><use href="#i-box"/></svg> Browse All Products</a></div>
    </div>
  </section>
</main>
<footer class="pd-foot"><div class="container"><p><strong>WARNING:</strong> Nicotine is addictive. 18+ only · ESMA certified · <?= e($S['copyright'] ?? '') ?></p></div></footer>
<?php require __DIR__ . '/includes/modals.php'; ?>
<?php render_vcd_script(); ?>
<script src="/assets/js/catalog.js?v=2.6"></script>
<script src="/assets/js/shop-shared.js?v=2.6"></script>
</body>
</html>
<?php
    exit;
}

/* ---------- defaults (first option of each variant group, mirrors JS) ---------- */
$v  = $p['variants'] ?? [];
$selPack   = $v['packSizes'][0]['id']  ?? 'single';
$selColor  = $v['colors'][0]['id']     ?? null;
$selFlavor = $v['flavors'][0]['id']    ?? null;
$selStr    = $v['strengths'][0]['id']  ?? null;
$selRes    = $v['resistance'][0]['id'] ?? null;
$selBundle = $v['bundles'][0]['id']    ?? null;

$price = (float) ($p['price'] ?? 0);
$old   = (float) ($p['old'] ?? 0);
$photo = (string) ($p['photo'] ?? '');
$labelParts = [];

if (($v['type'] ?? '') === 'packSize') {
    foreach (($v['packSizes'] ?? []) as $ps) {
        if (($ps['id'] ?? '') === $selPack) {
            $price = (float) $ps['price'];
            $old   = (float) ($ps['old'] ?? 0);
            $labelParts[] = (string) $ps['label'];
        }
    }
}
foreach (($v['colors'] ?? []) as $col) {
    if (($col['id'] ?? '') === $selColor) {
        $labelParts[] = (string) $col['name'];
        if (!empty($col['photo'])) $photo = (string) $col['photo'];
    }
}
foreach (($v['flavors'] ?? []) as $fl) {
    if (($fl['id'] ?? '') === $selFlavor) $labelParts[] = (string) $fl['name'];
}
foreach (($v['strengths'] ?? []) as $st) {
    if (($st['id'] ?? '') === $selStr) $labelParts[] = (string) $st['label'];
}
foreach (($v['resistance'] ?? []) as $rs) {
    if (($rs['id'] ?? '') === $selRes) $labelParts[] = (string) $rs['label'];
}
foreach (($v['bundles'] ?? []) as $bd) {
    if (($bd['id'] ?? '') === $selBundle) {
        if (!empty($bd['priceDiff'])) $price += (float) $bd['priceDiff'];
        $labelParts[] = (string) $bd['label'];
    }
}
$variantLabel = implode(' · ', $labelParts);
$sku = (string) ($p['sku'] ?? strtoupper((string) $p['id']));

/* ---------- SEO meta ---------- */
$seoPage = $VCD_SEO['pages']['product'] ?? [];
$brandName = trim(($S['brand_name'] ?? '') . ' ' . ($S['brand_tagline'] ?? ''));
$seoTitle = !empty($p['seo_title'])
    ? (string) $p['seo_title']
    : str_replace(['{product}', '{price}', '{brand}'], [(string) $p['name'], (string) (int) $price, $brandName], (string) ($seoPage['title'] ?? '{product}'));
$seoDesc = !empty($p['seo_desc'])
    ? (string) $p['seo_desc']
    : str_replace(['{product}', '{price}', '{brand}'], [(string) $p['name'], (string) (int) $price, $brandName], (string) ($seoPage['description'] ?? ''));

$jsonld = [];
if ($VCD_SEO['schema_product'] ?? true) {
    $schema = [
        '@context' => 'https://schema.org/',
        '@type'    => 'Product',
        'name'     => (string) $p['name'],
        'image'    => $photo !== '' ? [site_url($photo)] : [],
        'description' => preg_replace('/\s+/', ' ', (string) ($p['description'] ?? $seoDesc)),
        'sku'      => $sku,
        'brand'    => ['@type' => 'Brand', 'name' => (string) ($p['brand'] ?? $brandName)],
        'offers'   => [
            '@type'         => 'Offer',
            'url'           => site_url('/product.php?id=' . rawurlencode((string) $p['id'])),
            'priceCurrency' => 'AED',
            'price'         => $price,
            'availability'  => 'https://schema.org/' . (($p['stock'] ?? 'in') === 'out' ? 'OutOfStock' : 'InStock'),
            'itemCondition' => 'https://schema.org/NewCondition',
            'seller'        => ['@type' => 'Organization', 'name' => $brandName],
        ],
    ];
    if ($showRating && $ratingCnt !== '' && (int) $ratingCnt > 0) {
        $schema['aggregateRating'] = [
            '@type'       => 'AggregateRating',
            'ratingValue' => $ratingVal,
            'reviewCount' => $ratingCnt,
        ];
    }
    $jsonld[] = $schema;
}
if ($VCD_SEO['schema_breadcrumb'] ?? true) {
    $catLabel = $VCD_LABELS[$p['cat'] ?? ''] ?? 'Products';
    $catKey   = str_starts_with((string) ($p['cat'] ?? ''), 'terea') ? 'terea' : (string) ($p['cat'] ?? 'all');
    $jsonld[] = jsonld_breadcrumb([
        ['name' => 'Home', 'url' => site_url('/')],
        ['name' => $catLabel, 'url' => site_url('/category.php?cat=' . rawurlencode($catKey))],
        ['name' => (string) $p['name'], 'url' => site_url('/product.php?id=' . rawurlencode((string) $p['id']))],
    ]);
}
if (!empty($p['faqs']) && ($VCD_SEO['schema_faq_page'] ?? true)) {
    $jsonld[] = jsonld_faq_page($p['faqs']);
}

render_head([
    'title'       => $seoTitle,
    'description' => $seoDesc,
    'keywords'    => $seoPage['keywords'] ?? '',
    'robots'      => $seoPage['robots'] ?? 'index, follow',
    'canonical'   => site_url('/product.php?id=' . rawurlencode((string) $p['id'])),
    'og_type'     => 'product',
    'og_image'    => $photo,
    'jsonld'      => $jsonld,
]);

/* ---------- variant selector HTML (PHP twin of buildVariantsHtml) ---------- */
function pd_variants_html(array $p, array $v, string $selPack, ?string $selColor, ?string $selFlavor, ?string $selStr, ?string $selRes, ?string $selBundle): string
{
    if (!$v) return '';
    $h = '<div class="pd-variants-box">';

    if (count($v['packSizes'] ?? []) > 1) {
        $cur = '';
        foreach ($v['packSizes'] as $ps) if ($ps['id'] === $selPack) $cur = (string) $ps['label'];
        $h .= '<div class="pd-vg"><div class="pd-vg-label"><strong>Package Size:</strong> <span class="pd-vg-val">' . e($cur) . '</span></div><div class="pd-pack-cards">';
        foreach ($v['packSizes'] as $ps) {
            $act = $selPack === $ps['id'];
            $h .= '<button type="button" class="pd-pack-card' . ($act ? ' is-active' : '') . '" data-var="packSize" data-val="' . e($ps['id']) . '">'
                . (!empty($ps['save']) ? '<span class="pd-pack-badge">' . e($ps['save']) . '</span>' : '')
                . '<div class="pd-pack-title">' . e($ps['label']) . '</div>'
                . '<div class="pd-pack-meta">' . e($ps['note'] ?? '') . '</div>'
                . '<div class="pd-pack-price">' . e($ps['price']) . ' AED' . (!empty($ps['old']) ? ' <small class="pd-pack-old">' . e($ps['old']) . ' AED</small>' : '') . '</div>'
                . '</button>';
        }
        $h .= '</div></div>';
    }

    if (!empty($v['flavors'])) {
        $cur = '';
        foreach ($v['flavors'] as $fl) if ($fl['id'] === $selFlavor) $cur = (string) $fl['name'];
        $h .= '<div class="pd-vg"><div class="pd-vg-label"><strong>Selected Flavor:</strong> <span class="pd-vg-val">' . e($cur) . '</span></div><div class="pd-chips-wrap">';
        foreach ($v['flavors'] as $fl) {
            $act = $selFlavor === $fl['id'];
            $h .= '<button type="button" class="pd-chip-btn' . ($act ? ' is-active' : '') . '" data-var="flavor" data-val="' . e($fl['id']) . '" title="' . e($fl['note'] ?? '') . '"><span class="pd-chip-dot"></span>' . e($fl['name']) . '</button>';
        }
        $h .= '</div></div>';
    }

    if (!empty($v['strengths'])) {
        $cur = '';
        foreach ($v['strengths'] as $st) if ($st['id'] === $selStr) $cur = (string) $st['label'];
        $h .= '<div class="pd-vg"><div class="pd-vg-label"><strong>Nicotine Strength:</strong> <span class="pd-vg-val">' . e($cur) . '</span></div><div class="pd-chips-wrap">';
        foreach ($v['strengths'] as $st) {
            $act = $selStr === $st['id'];
            $h .= '<button type="button" class="pd-chip-btn' . ($act ? ' is-active' : '') . '" data-var="strength" data-val="' . e($st['id']) . '" title="' . e($st['note'] ?? '') . '"><svg class="icon icon-sm"><use href="#i-check"/></svg> ' . e($st['label']) . '</button>';
        }
        $h .= '</div></div>';
    }

    if (!empty($v['colors'])) {
        $cur = '';
        foreach ($v['colors'] as $col) if ($col['id'] === $selColor) $cur = (string) $col['name'];
        $h .= '<div class="pd-vg"><div class="pd-vg-label"><strong>Device Color:</strong> <span class="pd-vg-val">' . e($cur) . '</span></div><div class="pd-colors-wrap">';
        foreach ($v['colors'] as $col) {
            $act = $selColor === $col['id'];
            $h .= '<button type="button" class="pd-color-btn' . ($act ? ' is-active' : '') . '" data-var="color" data-val="' . e($col['id']) . '" title="' . e($col['name']) . '">'
                . '<span class="pd-color-swatch" style="background:' . e($col['hex'] ?? '#888') . '"></span>'
                . '<span class="pd-color-name">' . e($col['name']) . '</span></button>';
        }
        $h .= '</div></div>';
    }

    if (!empty($v['resistance'])) {
        $cur = '';
        foreach ($v['resistance'] as $rs) if ($rs['id'] === $selRes) $cur = (string) $rs['label'];
        $h .= '<div class="pd-vg"><div class="pd-vg-label"><strong>Pod Coil Resistance:</strong> <span class="pd-vg-val">' . e($cur) . '</span></div><div class="pd-chips-wrap">';
        foreach ($v['resistance'] as $rs) {
            $act = $selRes === $rs['id'];
            $h .= '<button type="button" class="pd-chip-btn' . ($act ? ' is-active' : '') . '" data-var="resistance" data-val="' . e($rs['id']) . '">' . e($rs['label']) . '</button>';
        }
        $h .= '</div></div>';
    }

    if (count($v['bundles'] ?? []) > 1) {
        $cur = '';
        foreach ($v['bundles'] as $bd) if ($bd['id'] === $selBundle) $cur = (string) $bd['label'];
        $h .= '<div class="pd-vg"><div class="pd-vg-label"><strong>Bundle &amp; Value Pack:</strong> <span class="pd-vg-val">' . e($cur) . '</span></div><div class="pd-pack-cards">';
        foreach ($v['bundles'] as $bd) {
            $act = $selBundle === $bd['id'];
            $h .= '<button type="button" class="pd-pack-card pd-bundle-card' . ($act ? ' is-active' : '') . '" data-var="bundle" data-val="' . e($bd['id']) . '">'
                . '<div class="pd-pack-title">' . e($bd['label']) . '</div>'
                . '<div class="pd-pack-meta">' . e($bd['note'] ?? '') . '</div>'
                . '</button>';
        }
        $h .= '</div></div>';
    }

    return $h . '</div>';
}
?>
<body class="pd-body">

<?php require __DIR__ . '/includes/sprite.php'; ?>

<div class="backdrop" id="backdrop"></div>

<?php $pdpWaHeaderId = true; require __DIR__ . '/includes/pdp-header.php'; ?>

<main class="pd-wrap container">
  <nav class="pd-crumb" id="pdCrumb" aria-label="Breadcrumb"><a href="/#shop"><svg class="icon icon-sm"><use href="#i-chevron-left"/></svg> Back to shop</a> <span class="crumb-sep">/</span> <a href="category.php?cat=<?= e(str_starts_with((string) ($p['cat'] ?? ''), 'terea') ? 'terea' : (string) ($p['cat'] ?? 'all')) ?>" id="crumbCatLink"><?= e($VCD_LABELS[$p['cat'] ?? ''] ?? 'Products') ?></a> <span class="crumb-sep">/</span> <span id="crumbProdName" class="crumb-curr"><?= e($p['name']) ?></span></nav>

  <!-- Product Main Purchase & Gallery Area — server rendered -->
  <div id="pdRoot"><?php
    $starsHtml = '';
    if ($showRating) {
        $starsHtml = '<div class="stars pd-stars">'
            . str_repeat('<svg class="icon icon-fill"><use href="#i-star"/></svg>', 5)
            . '<span>' . e($ratingVal) . ' · ' . e($ratingCnt) . ' UAE Customer Reviews</span></div>';
    }
    $savePill = ($old > $price && $price > 0)
        ? '<span class="pd-save-badge">Save ' . ((int) $old - (int) $price) . ' AED (' . round((1 - $price / $old) * 100) . '% OFF)</span>'
        : '';
    $freeUnlocked = $price >= $threshold;
  ?><article class="pd-hero">
      <div class="pd-media <?= media_bg($p) . ' ' . e($p['theme'] ?? '') ?>" id="pdMediaBox" role="button" tabindex="0" title="Click to view fullscreen / zoom">
        <?= badge_stack($p) ?>
        <?= !empty($p['flag']) ? '<span class="origin-flag">' . e($p['flag']) . '</span>' : '' ?>
        <?= art_use($p) ?>
        <?= $photo !== '' ? '<img class="pd-photo" id="pdHeroImg" src="' . e($photo) . '" alt="' . e($p['name']) . '" onerror="this.remove()">' : '' ?>
        <?= $photo !== '' ? '<button class="pd-zoom-trigger" id="pdZoomTrigger" type="button"><svg class="icon icon-sm"><use href="#i-search"/></svg> Fullscreen / Zoom</button>' : '' ?>
      </div>
      <div class="pd-info">
        <div class="pd-eyebrow-row">
          <span class="eyebrow"><?= e($VCD_LABELS[$p['cat'] ?? ''] ?? 'Product') ?></span>
          <?= !empty($p['brand']) ? '<span class="pd-brand-tag">' . e($p['brand']) . '</span>' : '' ?>
        </div>
        <h1><?= e($p['name']) ?></h1>
        <p class="pd-flavor"><svg class="icon icon-sm"><use href="#i-leaf"/></svg> <?= e($p['flavor'] ?? '') ?></p>
        <?= $starsHtml ?>
        <div class="pd-price-row">
          <span class="pd-price" id="pdPriceDisplay"><?= (int) $price ?><small> AED</small></span>
          <?= $old > 0 ? '<span class="card-old" id="pdOldDisplay">' . (int) $old . ' AED</span>' : '' ?>
          <?= $savePill ?>
        </div>
        <div class="pd-stock-row">
          <?php if (($p['stock'] ?? 'in') === 'low'): ?>
          <span class="card-stock stock-low"><span class="dot"></span>Low Stock — Order Soon</span>
          <?php elseif (($p['stock'] ?? 'in') === 'out'): ?>
          <span class="card-stock stock-out"><span class="dot"></span>Out of Stock</span>
          <?php else: ?>
          <span class="card-stock"><span class="dot"></span>In Stock — Dubai Dispatch Every 30 Mins</span>
          <?php endif; ?>
          <span class="pd-sku-line">SKU: <code><?= e($sku) ?></code></span>
        </div>
        <?= pd_variants_html($p, $v, $selPack, $selColor, $selFlavor, $selStr, $selRes, $selBundle) ?>
        <ul class="qv-specs" style="margin-top:16px">
          <?php foreach (($p['specs'] ?? []) as $spec): ?><li><svg class="icon"><use href="#i-check"/></svg><?= e($spec) ?></li><?php endforeach; ?>
        </ul>
        <div class="pd-buy">
          <div class="qv-qty">
            <button class="qty-btn" id="pdDec" aria-label="Decrease quantity"><svg class="icon"><use href="#i-minus"/></svg></button>
            <span class="qty-val" id="pdQty">1</span>
            <button class="qty-btn" id="pdInc" aria-label="Increase quantity"><svg class="icon"><use href="#i-plus"/></svg></button>
          </div>
          <button class="add-btn btn-wa-cart" id="pdAdd" style="flex:1;min-height:50px;font-size:15px"><svg class="icon icon-sm"><use href="#i-wa"/></svg> Order on WhatsApp</button>
        </div>
        <div class="pd-actions-dual">
          <a class="btn btn-wa btn-block" id="pdDirectWa" target="_blank" rel="noopener">
            <svg class="icon"><use href="#i-wa"/></svg> Direct WhatsApp Order (Fastest 1-2h)
          </a>
          <button type="button" class="btn btn-ghost btn-block js-open-cart" style="border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;gap:8px">
            <svg class="icon icon-sm"><use href="#i-cart"/></svg> View Cart &amp; Complete Order
          </button>
        </div>
        <div class="pd-trust">
          <span><svg class="icon icon-sm"><use href="#i-truck"/></svg> 1-2h Express: Dubai · Sharjah · Ajman</span>
          <span id="pdDeliveryNotice"><svg class="icon icon-sm"><use href="#i-shield"/></svg> <?= $freeUnlocked ? 'FREE express delivery unlocked!' : e(aed($threshold)) . ' Free delivery all UAE' ?></span>
          <span><svg class="icon icon-sm"><use href="#i-shield"/></svg> ESMA UAE.S 5030 Certified · COD or Card Machine</span>
        </div>
      </div>
    </article></div>

  <!-- Rich SEO Description, Specifications & FAQ Tabs — server rendered -->
  <section class="pd-tabs-section" id="pdTabsSection" aria-label="Product Specifications & Details"><div class="pd-tabs-card">
      <div class="pd-tabs-nav" role="tablist">
        <button class="pd-tab-btn is-active" data-tab="desc" role="tab" aria-selected="true"><svg class="icon icon-sm"><use href="#i-info"/></svg> Overview &amp; Description</button>
        <button class="pd-tab-btn" data-tab="specs" role="tab" aria-selected="false"><svg class="icon icon-sm"><use href="#i-check"/></svg> Technical Specifications</button>
        <button class="pd-tab-btn" data-tab="box" role="tab" aria-selected="false"><svg class="icon icon-sm"><use href="#i-box"/></svg> What's In The Box</button>
        <button class="pd-tab-btn" data-tab="flavor" role="tab" aria-selected="false"><svg class="icon icon-sm"><use href="#i-leaf"/></svg> Flavor &amp; Sensory Notes</button>
        <button class="pd-tab-btn" data-tab="faq" role="tab" aria-selected="false"><svg class="icon icon-sm"><use href="#i-shield"/></svg> Dubai FAQs &amp; Delivery</button>
      </div>
      <div class="pd-tab-panels">
        <div class="pd-tab-panel is-active" id="panel-desc" role="tabpanel">
          <div class="pd-seo-body">
            <h2 class="pd-seo-heading">Product Overview — <?= e($p['name']) ?></h2>
            <div class="pd-text-lead">
              <?php foreach (array_filter(array_map('trim', explode("\n\n", (string) ($p['description'] ?? '')))) as $para): ?>
              <p><?= e($para) ?></p>
              <?php endforeach; ?>
            </div>
            <div class="pd-highlights-grid">
              <div class="pd-hl-card"><div class="pd-hl-icon"><svg class="icon"><use href="#i-shield"/></svg></div><h4>100% Genuine UAE Stock</h4><p>Original sealed packaging with batch-code authenticity verification.</p></div>
              <div class="pd-hl-card"><div class="pd-hl-icon"><svg class="icon"><use href="#i-truck"/></svg></div><h4>1-2 Hour Dubai Express</h4><p>Rapid climate-controlled delivery directly to your home, office, or hotel.</p></div>
              <div class="pd-hl-card"><div class="pd-hl-icon"><svg class="icon"><use href="#i-leaf"/></svg></div><h4>ESMA Certified Standard</h4><p>Fully tested and registered under UAE.S 5030 compliance laws.</p></div>
              <div class="pd-hl-card"><div class="pd-hl-icon"><svg class="icon"><use href="#i-star"/></svg></div><h4>Customer Guarantee</h4><p>Direct 12-month local hardware replacement warranty handled in Dubai.</p></div>
            </div>
          </div>
        </div>
        <div class="pd-tab-panel" id="panel-specs" role="tabpanel" style="display:none">
          <div class="pd-specs-table-wrap">
            <h3 style="margin-bottom:14px;font-size:18px">Complete Technical Specifications</h3>
            <table class="pd-specs-table"><tbody>
              <?php if (!empty($p['specsTable'])): foreach ($p['specsTable'] as $k => $val): ?>
              <tr><th><?= e($k) ?></th><td><?= e($val) ?></td></tr>
              <?php endforeach; else: ?>
              <tr><th>Status</th><td>Authentic UAE Stock</td></tr>
              <?php endif; ?>
            </tbody></table>
          </div>
        </div>
        <div class="pd-tab-panel" id="panel-box" role="tabpanel" style="display:none">
          <div class="pd-box-wrap">
            <h3 style="margin-bottom:14px;font-size:18px">Package Contents</h3>
            <p style="color:var(--body);margin-bottom:16px;font-size:13.5px">Everything included in your official factory-sealed packaging:</p>
            <ul class="pd-box-list">
              <?php foreach (($p['boxContents'] ?? ['1x Official Sealed ' . $p['name'], '1x Authentication Warranty Seal']) as $item): ?>
              <li><svg class="icon"><use href="#i-box"/></svg> <?= e($item) ?></li>
              <?php endforeach; ?>
            </ul>
            <div class="pd-unboxing-tip"><svg class="icon"><use href="#i-shield"/></svg> <strong>Verification Tip:</strong> Scan the QR code or scratch off the hologram code on the box to confirm original factory authenticity.</div>
          </div>
        </div>
        <div class="pd-tab-panel" id="panel-flavor" role="tabpanel" style="display:none">
          <div class="pd-flavor-wrap">
            <h3 style="margin-bottom:14px;font-size:18px">Taste &amp; Sensory Breakdown</h3>
            <div class="flavor-meters-box">
              <?php
              $fm = $p['flavorMeter'] ?? ['sweetness' => 3, 'cooling' => 3, 'throatHit' => 4, 'intensity' => 4];
              $meters = ['Sweetness Level' => (float) ($fm['sweetness'] ?? 3), 'Cooling / Menthol Frost' => (float) ($fm['cooling'] ?? 3), 'Throat Hit Sensation' => (float) ($fm['throatHit'] ?? 4), 'Flavor Richness & Aroma' => (float) ($fm['intensity'] ?? 4)];
              foreach ($meters as $mTitle => $mVal):
              ?>
              <div class="flavor-bar-row">
                <span class="flavor-bar-label"><?= e($mTitle) ?></span>
                <div class="flavor-meter-track"><div class="flavor-meter-fill" style="width:<?= ($mVal / 5 * 100) ?>%"></div></div>
                <span class="flavor-bar-val"><?= $mVal ?>/5</span>
              </div>
              <?php endforeach; ?>
            </div>
            <div class="pd-ingredients-note">
              <h4>Certified UAE Ingredients &amp; Safety</h4>
              <p>Contains Pharmaceutical Grade USP Nicotine, Natural &amp; Artificial Food-Grade Flavorings, and Vegetable Glycerin (VG) &amp; Propylene Glycol (PG). Strict compliance with UAE ESMA standard UAE.S 5030.</p>
            </div>
          </div>
        </div>
        <div class="pd-tab-panel" id="panel-faq" role="tabpanel" style="display:none">
          <div class="pd-faqs-wrap">
            <h3 style="margin-bottom:14px;font-size:18px">Frequently Asked Questions — Dubai &amp; UAE</h3>
            <div class="pd-faq-list">
              <?php
              $pdFaqs = !empty($p['faqs']) ? $p['faqs'] : [
                  ['q' => 'Is this product original and legal in the UAE?', 'a' => 'Yes. All products sold by Vape Club Dubai are 100% genuine, sealed in original packaging, and ESMA certified in accordance with UAE.S 5030 standards.'],
                  ['q' => 'How fast is express delivery in Dubai?', 'a' => 'Orders confirmed before 11:00 PM are dispatched immediately and delivered to your doorstep within 1 to 2 hours across Dubai and Sharjah.'],
                  ['q' => 'What payment options are available?', 'a' => 'We accept Cash on Delivery (COD) as well as Card Machine on Delivery (Visa, Mastercard, and Apple Pay).'],
              ];
              foreach ($pdFaqs as $fi => $f):
              ?>
              <div class="pd-faq-item<?= $fi === 0 ? ' is-open' : '' ?>">
                <button type="button" class="pd-faq-q" aria-expanded="<?= $fi === 0 ? 'true' : 'false' ?>">
                  <span><?= e($f['q']) ?></span>
                  <svg class="icon pd-faq-icon"><use href="#i-chevron-down"/></svg>
                </button>
                <div class="pd-faq-a" style="<?= $fi === 0 ? 'display:block;' : 'display:none;' ?>">
                  <p><?= e($f['a']) ?></p>
                </div>
              </div>
              <?php endforeach; ?>
            </div>
          </div>
        </div>
      </div>
    </div></section>

  <section class="pd-related">
    <div class="section-head reveal in-view">
      <div>
        <span class="eyebrow">Keep exploring</span>
        <h2>You may also like</h2>
      </div>
    </div>
    <div class="product-grid" id="relGrid"><?php
      $sameCat = array_values(array_filter($VCD_PRODUCTS, fn($x) => $x['id'] !== $p['id'] && ($x['cat'] ?? '') === ($p['cat'] ?? '')));
      $others  = array_values(array_filter($VCD_PRODUCTS, fn($x) => $x['id'] !== $p['id'] && ($x['cat'] ?? '') !== ($p['cat'] ?? '')));
      foreach (array_slice(array_merge($sameCat, $others), 0, 4) as $rel): echo rel_card_html($rel); endforeach;
    ?></div>
  </section>
</main>

<footer class="pd-foot">
  <div class="container">
    <p><strong>WARNING:</strong> Nicotine is addictive. 18+ only · ESMA certified · <?= e($S['copyright'] ?? '') ?></p>
  </div>
</footer>

<!-- ========== FULLSCREEN IMAGE LIGHTBOX & ZOOM MODAL ========== -->
<div class="modal pd-lightbox-modal" id="pdLightbox" role="dialog" aria-modal="true" aria-label="Fullscreen image preview">
  <div class="lightbox-panel">
    <div class="lightbox-toolbar">
      <span class="lightbox-title" id="lbTitle">Product Image</span>
      <div class="lightbox-actions">
        <button class="lb-btn" id="lbZoomOut" aria-label="Zoom out" title="Zoom Out"><svg class="icon"><use href="#i-minus"/></svg></button>
        <button class="lb-btn" id="lbReset" aria-label="Reset zoom" title="Reset Zoom">1:1</button>
        <button class="lb-btn" id="lbZoomIn" aria-label="Zoom in" title="Zoom In"><svg class="icon"><use href="#i-plus"/></svg></button>
        <button class="lb-btn lb-close" id="lbClose" aria-label="Close fullscreen" title="Close"><svg class="icon"><use href="#i-close"/></svg></button>
      </div>
    </div>
    <div class="lightbox-stage" id="lbStage">
      <img id="lbImg" src="" alt="">
    </div>
    <div class="lightbox-hint">Tap/Click or Pinch to zoom &bull; Drag to pan &bull; ESC to close</div>
  </div>
</div>

<?php require __DIR__ . '/includes/modals.php'; ?>

<?php render_vcd_script(); ?>
<script src="/assets/js/catalog.js?v=2.6"></script>
<script src="/assets/js/shop-shared.js?v=2.6"></script>
<script src="/assets/js/product-page.js?v=2.6"></script>
</body>
</html>
