<?php
/**
 * HOME — Vape Club Dubai. Fully data-driven + server-rendered for SEO.
 */
declare(strict_types=1);

require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/render.php';
require_once __DIR__ . '/lib/head.php';

$S  = $VCD_SETTINGS;
$HM = $VCD_HOME;
$seoPage = $VCD_SEO['pages']['home'] ?? [];

/* JSON-LD stack for the home page */
$jsonld = [];
if ($VCD_SEO['schema_local_business'] ?? true) {
    $jsonld[] = jsonld_local_business();
}
if ($VCD_SEO['schema_website_search'] ?? true) {
    $jsonld[] = jsonld_website();
}
if (($VCD_SEO['schema_faq_page'] ?? true) && !empty($HM['faqs'])) {
    $jsonld[] = jsonld_faq_page($HM['faqs']);
}
if ($VCD_SEO['schema_product'] ?? true) {
    $jsonld[] = jsonld_item_list($VCD_PRODUCTS, 'Vape Club Dubai — Product Catalogue');
}

render_head([
    'title'       => $seoPage['title'] ?? 'Vape Club Dubai',
    'description' => $seoPage['description'] ?? '',
    'keywords'    => $seoPage['keywords'] ?? '',
    'robots'      => $seoPage['robots'] ?? 'index, follow',
    'canonical'   => site_url('/'),
    'og_type'     => 'website',
    'og_image'    => $seoPage['og_image'] ?? '',
    'jsonld'      => $jsonld,
]);

$bestList  = array_values(array_filter($VCD_PRODUCTS, fn($p) => !empty($p['best'])));
$tereaList = cat_products('terea');
$vapeList  = cat_products('disposables');
$flash     = $HM['flash_deal'] ?? [];
$slides    = array_values(array_filter($HM['hero_slides'] ?? [], fn($s) => $s['enabled'] ?? true));
$popCats   = $HM['pop_categories'] ?? [];
$vip       = $HM['vip_section'] ?? [];
?>
<body>

<a class="skip-link" href="#shop">Skip to products</a>

<?php require __DIR__ . '/includes/sprite.php'; ?>
<?php require __DIR__ . '/includes/header.php'; ?>

<main id="top">
  <!-- ========== HERO ========== -->
  <section class="hero container" aria-label="Featured offers">
<?php 
if (!empty($flash['enabled'])): 
    $rawText = trim((string) ($flash['text'] ?? ''));
    $badge   = trim((string) ($flash['badge'] ?? ''));
    $desc    = $rawText;

    if ($badge === '') {
        // Safe UTF-8 split on em-dash, en-dash, hyphen, or colon
        if (preg_match('/^([^\—\–\-\:\·]+)\s*[\—\–\-\:]\s*(.+)$/u', $rawText, $m)) {
            $badge = trim($m[1]);
            $desc  = trim($m[2]);
        } else {
            $badge = 'FLASH DEAL';
            $desc  = $rawText;
        }
    } else {
        // Strip duplicate badge prefix from description if present
        if (preg_match('/^' . preg_quote($badge, '/') . '\s*[\—\–\-\:]\s*(.+)$/u', $rawText, $m)) {
            $desc = trim($m[1]);
        }
    }
?>
    <div class="flash-strip" role="note">
      <svg class="icon"><use href="#i-zap"/></svg>
      <span class="flash-text"><strong><?= e($badge) ?></strong> &mdash; <?= e($desc) ?></span>
      <a href="<?= e($flash['cta_href'] ?? '#shop') ?>"><?= e($flash['cta_label'] ?? 'Shop now') ?></a>
    </div>
<?php endif; ?>
    <div class="hero-shell" id="heroShell">
      <div id="heroCarousel">
<?php foreach ($slides as $i => $sl):
    $n = $i + 1;
    $tag = ($sl['heading'] ?? 'h2') === 'h1' ? 'h1' : 'h2';
    $titlePre  = (string) ($sl['title_pre'] ?? '');
    $titleGrad = (string) ($sl['title_grad'] ?? '');
    $titlePost = (string) ($sl['title_post'] ?? '');
    $chips = $sl['chips'] ?? [];
?>
        <article class="slide slide-<?= $n ?><?= $i === 0 ? ' is-active' : '' ?>" aria-label="<?= e($sl['aria_label'] ?? '') ?>">
          <div class="hero-bg-shapes" aria-hidden="true">
            <div class="hero-shape hero-shape-orb-1"></div>
            <div class="hero-shape hero-shape-orb-2"></div>
            <div class="hero-shape hero-shape-ring-1"></div>
            <div class="hero-shape hero-shape-ring-2"></div>
            <div class="hero-shape hero-shape-grid"></div>
          </div>
          <div class="slide-copy">
            <span class="slide-pill"><?= e($sl['pill'] ?? '') ?></span>
            <<?= $tag ?>>
              <?= e($titlePre) ?><?php if ($titleGrad !== ''): ?><span class="grad"><?= e($titleGrad) ?></span><?php endif; ?><?= e($titlePost) ?>
            </<?= $tag ?>>
            <p class="lede"><?= e($sl['lede'] ?? '') ?></p>
            <div class="slide-price-row">
              <span class="slide-price"><?= e($sl['price'] ?? '') ?><small>AED</small></span>
              <span class="slide-price-old"><?= e($sl['old'] ?? '') ?></span>
              <span class="slide-save"><?= e($sl['save'] ?? '') ?></span>
            </div>
            <div class="slide-cta">
<?php if (($sl['cta_type'] ?? 'link') === 'add_to_cart'): ?>
              <button class="btn btn-primary btn-sm" data-add-to-cart="<?= e($sl['cta_product'] ?? '') ?>">
                <svg class="icon icon-sm"><use href="#i-cart"/></svg> <?= e($sl['cta_label'] ?? 'Add to Cart') ?>
              </button>
<?php else: ?>
              <a class="btn btn-primary btn-sm" href="<?= e($sl['cta_href'] ?? '#shop') ?>">
                <svg class="icon icon-sm"><use href="#i-box"/></svg> <?= e($sl['cta_label'] ?? 'Shop now') ?>
              </a>
<?php endif; ?>
            </div>
          </div>
          <div class="slide-visual" aria-hidden="true">
            <div class="hero-art <?= e($sl['art_class'] ?? 'art-purple') ?>">
              <div class="halo"></div>
              <img class="hero-photo" src="<?= e($sl['image'] ?? '') ?>" alt="<?= e($sl['image_alt'] ?? '') ?>">
              <?php foreach ($chips as $ci => $chip): ?>
              <span class="orbit-chip chip-<?= $ci === 0 ? 'a' : 'b' ?>"><?php if (str_starts_with($chip, '● ')): ?><span class="pulse"></span> <?= e(substr($chip, 2)) ?><?php else: ?><?= e($chip) ?><?php endif; ?></span>
              <?php endforeach; ?>
            </div>
          </div>
        </article>
<?php endforeach; ?>
      </div>

      <div class="hero-dots" id="heroDots" role="tablist" aria-label="Featured slides"></div>
      <button class="hero-arrow prev" id="heroPrev" aria-label="Previous slide"><svg class="icon"><use href="#i-chevron-left"/></svg></button>
      <button class="hero-arrow next" id="heroNext" aria-label="Next slide"><svg class="icon"><use href="#i-chevron-right"/></svg></button>

    </div>
  </section>

  <!-- ========== POPULAR VAPE CATEGORIES ========== -->
  <section class="section container shop-cats" id="categories">
    <div class="cat-section-header reveal">
      <div class="pop-cat-title-block">
        <span class="pop-word"><?= e($popCats['pop_word'] ?? 'Popular') ?></span>
        <h2 class="cat-word"><?= e($popCats['title'] ?? 'Categories') ?></h2>
      </div>
      <button class="all-cats-btn js-open-cats" type="button" aria-label="View all categories">
        <svg class="icon icon-sm"><use href="#i-menu"/></svg><span>All Categories</span>
      </button>
    </div>
    <div class="cat-grid cat-grid-pop reveal">
<?php foreach (($popCats['tiles'] ?? []) as $tile): ?>
      <a class="cat-tile cat-photo" href="category.php?cat=<?= e($tile['cat'] ?? 'all') ?>">
        <img class="cat-bg" src="<?= e($tile['bg'] ?? '') ?>" alt="" aria-hidden="true" onerror="this.remove()">
        <span class="cat-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="6" width="9" height="14" rx="2.5"/><path d="M13 9.5h4M13 13h4"/><rect x="17" y="4" width="3" height="16" rx="1.5"/></svg></span>
        <span class="cat-txt"><span class="cat-sub"><?= e($tile['sub'] ?? '') ?></span><span class="cat-title"><?= e($tile['title'] ?? '') ?></span></span>
      </a>
<?php endforeach; ?>
      <button class="cat-tile cat-more js-open-cats" type="button" aria-label="View all categories">
        <span class="more-n"><?= e($popCats['more_count'] ?? '+9') ?></span>
        <span class="more-t"><b><?= e($popCats['more_title'] ?? 'MORE CATEGORIES') ?></b><small><?= e($popCats['more_sub'] ?? 'Tap to view all') ?></small></span>
        <span class="cat-ico" style="margin-left:auto"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span>
      </button>
    </div>
  </section>

  <!-- ========== BEST SELLING PRODUCTS (VIP SHOWCASE AT TOP) ========== -->
  <section class="section container bestsellers-vip" id="bestsellers">
    <div class="vip-showcase-shell reveal">
      <div class="vip-ambient-orb vip-orb-1" aria-hidden="true"></div>
      <div class="vip-ambient-orb vip-orb-2" aria-hidden="true"></div>
      <div class="vip-showcase-head">
        <div class="vip-badge-row">
          <span class="vip-crown-badge">
            <span class="crown-icon">👑</span> <?= e($vip['badge'] ?? '') ?>
          </span>
          <span class="vip-live-pulse"><span class="pulse-dot"></span> <?= e($vip['pulse'] ?? '') ?></span>
        </div>
        <div class="vip-title-wrap">
          <h2 class="vip-title"><?= e($vip['title'] ?? 'Best Selling Products') ?> <span class="vip-title-glow">★</span></h2>
          <p class="vip-desc"><?= e($vip['desc'] ?? '') ?></p>
        </div>
        <div class="vip-features-strip">
<?php foreach (($vip['features'] ?? []) as $feat): ?>
          <span class="v-feat"><svg class="icon"><use href="#<?= e($feat['icon'] ?? 'i-check') ?>"/></svg> <?= e($feat['text'] ?? '') ?></span>
<?php endforeach; ?>
        </div>
      </div>
      <div class="vip-product-grid" id="bestGrid"><?php foreach ($bestList as $bi => $bp): echo vip_card_html($bp, $bi); endforeach; ?></div>
    </div>
  </section>

  <!-- ========== SHOP / NEW ARRIVALS & UAE FAVORITES ========== -->
  <section class="section container" id="shop">
    <div class="section-head reveal">
      <div>
        <span class="eyebrow"><?= e($HM['shop_section']['eyebrow'] ?? '') ?></span>
        <h2><?= e($HM['shop_section']['title'] ?? '') ?></h2>
        <p><?= e($HM['shop_section']['desc'] ?? '') ?></p>
      </div>
    </div>

    <div class="pills-row" id="filterPills" role="tablist" aria-label="Filter products">
      <button class="pill is-active" data-filter="all">✦ All Products</button>
      <button class="pill" data-filter="iluma">⚡ IQOS ILUMA</button>
      <button class="pill" data-filter="terea-id"><span class="flag">🇮🇩</span> TEREA Indonesia</button>
      <button class="pill" data-filter="terea-jp"><span class="flag">🇯🇵</span> TEREA Japan</button>
      <button class="pill" data-filter="terea-ch"><span class="flag">🇨🇭</span> TEREA Swiss</button>
      <button class="pill" data-filter="disposables">🔥 Disposables 10k+</button>
      <button class="pill" data-filter="bestsellers">🏆 Best Sellers</button>
    </div>

    <p class="result-note" id="resultNote" aria-live="polite">Showing <b><?= count($VCD_PRODUCTS) ?></b> items — All Products</p>
    <div class="product-grid" id="shopGrid"><?php foreach ($VCD_PRODUCTS as $p): echo card_html($p); endforeach; ?></div>
  </section>

  <!-- ========== TEREA ORIGINS ========== -->
  <section class="section container" id="terea">
    <div class="origin-band reveal">
      <div class="section-head" style="margin-bottom:0">
        <div>
          <span class="eyebrow"><?= e($HM['terea_section']['eyebrow'] ?? '') ?></span>
          <h2><?= e($HM['terea_section']['title'] ?? '') ?></h2>
          <p><?= e($HM['terea_section']['desc'] ?? '') ?></p>
        </div>
      </div>
      <div class="origin-legend">
<?php foreach (($HM['terea_section']['legend'] ?? []) as $chip): ?>
        <span class="legend-chip"><?= e($chip) ?></span>
<?php endforeach; ?>
      </div>
    </div>
    <div class="product-grid" id="tereaGrid"><?php foreach ($tereaList as $p): echo card_html($p); endforeach; ?></div>
  </section>

  <!-- ========== DISPOSABLES ========== -->
  <section class="section container" id="disposables">
    <div class="section-head reveal">
      <div>
        <span class="eyebrow"><?= e($HM['disposables_section']['eyebrow'] ?? '') ?></span>
        <h2><?= e($HM['disposables_section']['title'] ?? '') ?></h2>
        <p><?= e($HM['disposables_section']['desc'] ?? '') ?></p>
      </div>
    </div>
    <div class="product-grid" id="vapeGrid"><?php foreach ($vapeList as $p): echo card_html($p); endforeach; ?></div>
  </section>

  <!-- ========== REVIEWS ========== -->
  <section class="section container" id="reviews">
    <div class="section-head reveal">
      <div>
        <span class="eyebrow"><?= e($HM['reviews_section']['eyebrow'] ?? '') ?></span>
        <h2><?= e($HM['reviews_section']['title'] ?? '') ?></h2>
      </div>
    </div>
    <div class="review-grid reveal">
<?php foreach (($HM['reviews'] ?? []) as $rv): ?>
      <article class="review">
        <div class="stars" aria-label="<?= (int) ($rv['stars'] ?? 5) ?> out of 5 stars">
          <?php for ($i = 0; $i < (int) ($rv['stars'] ?? 5); $i++): ?><svg class="icon icon-fill"><use href="#i-star"/></svg><?php endfor; ?>
        </div>
        <p><?= e($rv['text'] ?? '') ?></p>
        <div class="review-meta">
          <span class="avatar <?= e($rv['avatar_class'] ?? '') ?>"><?= e($rv['avatar'] ?? '') ?></span>
          <div>
            <b><?= e($rv['name'] ?? '') ?></b>
            <small><?= e($rv['location'] ?? '') ?> · <span class="verified"><svg class="icon"><use href="#i-check"/></svg>Verified buyer</span></small>
          </div>
        </div>
      </article>
<?php endforeach; ?>
    </div>
  </section>

  <!-- ========== FAQ ========== -->
  <section class="section container" id="faq">
    <div class="section-head reveal">
      <div>
        <span class="eyebrow"><?= e($HM['faq_section']['eyebrow'] ?? '') ?></span>
        <h2><?= e($HM['faq_section']['title'] ?? '') ?></h2>
      </div>
    </div>
    <div class="faq-list reveal">
<?php foreach (($HM['faqs'] ?? []) as $fi => $faq): ?>
      <div class="faq-item<?= $fi === 0 ? ' is-open' : '' ?>">
        <button class="faq-q" aria-expanded="<?= $fi === 0 ? 'true' : 'false' ?>">
          <?= e($faq['q'] ?? '') ?>
          <svg class="icon"><use href="#i-chevron-down"/></svg>
        </button>
        <div class="faq-a"<?= $fi === 0 ? ' style="max-height:200px"' : '' ?>>
          <p><?= $faq['a'] ?? '' /* trusted admin HTML */ ?></p>
        </div>
      </div>
<?php endforeach; ?>
    </div>
  </section>

  <!-- ========== CUSTOMER SUPPORT CTA ========== -->
  <section class="section container" aria-label="Customer Support">
    <div class="wa-cta reveal">
      <svg class="big-wa" aria-hidden="true"><use href="#i-wa"/></svg>
      <span class="eyebrow" style="justify-content:center"><?= e($HM['cta_section']['eyebrow'] ?? '') ?></span>
      <h2><?= e($HM['cta_section']['title_pre'] ?? '') ?><span style="color:var(--emerald)"><?= e($HM['cta_section']['title_highlight'] ?? '') ?></span></h2>
      <p><?= e($HM['cta_section']['text'] ?? '') ?></p>
      <a class="btn btn-wa" href="<?= e(wa_link($S['wa_msg_question'] ?? 'Hello!')) ?>" target="_blank" rel="noopener">
        <svg class="icon"><use href="#i-wa"/></svg> <?= e($HM['cta_section']['button_label'] ?? 'Chat with an Expert') ?>
      </a>
    </div>
  </section>
</main>

<?php require __DIR__ . '/includes/footer.php'; ?>
<?php require __DIR__ . '/includes/modals.php'; ?>

<!-- ========== CATEGORY DRAWER (index only) ========== -->
<?php require __DIR__ . '/includes/index-extra.php'; ?>

<?php
render_vcd_script();
?>
<script src="/assets/js/catalog.js?v=2.6"></script>
<script src="/assets/js/shop-shared.js?v=2.6"></script>
<script src="/assets/js/main.js?v=2.6"></script>
</body>
</html>
