<?php
/**
 * Shared site header: announcement bar, header, nav, mobile drawer, backdrop.
 * Expects lib/bootstrap.php to be loaded. All text is data-driven.
 */
declare(strict_types=1);

$S  = $VCD_SETTINGS;
$HM = $VCD_HOME;
$announceItems = $HM['announce_items'] ?? [];
$announceHtml  = '<svg class="icon icon-sm" aria-hidden="true"><use href="#i-zap"/></svg> '
    . implode(' <b class="dot">✦</b> ', array_map(fn($i) => e($i), $announceItems))
    . ' <b class="dot">✦</b>';
?>
<!-- ========== ANNOUNCEMENT BAR ========== -->
<div class="announce" role="region" aria-label="Store announcements">
  <div class="announce-track" id="announceTrack">
    <span><?= $announceHtml ?></span>
    <span aria-hidden="true"><?= $announceHtml ?></span>
  </div>
  <div class="announce-lang">
<?php if ($HM['show_language_toggle'] ?? true): ?>
    <div class="lang-toggle" role="group" aria-label="Language">
      <button class="is-active" data-lang="en">EN</button>
      <button data-lang="ar" id="langAr">العربية</button>
    </div>
<?php endif; ?>
    <span class="currency-chip"><?= e($HM['currency_chip'] ?? 'AED د.إ') ?></span>
  </div>
</div>

<!-- ========== HEADER ========== -->
<header class="site-header" id="siteHeader">
  <div class="container header-main">
    <button class="icon-btn hamburger" id="menuBtn" aria-label="Open menu" aria-controls="menuDrawer" aria-expanded="false">
      <svg class="icon"><use href="#i-menu"/></svg>
    </button>

    <a class="brand" href="/" aria-label="<?= e(trim(($S['brand_name'] ?? '') . ' ' . ($S['brand_tagline'] ?? ''))) ?> home">
<?php if (!empty($S['logo_type']) && $S['logo_type'] === 'image' && !empty($S['logo_image'])): ?>
      <img src="<?= e($S['logo_image']) ?>" alt="<?= e($S['brand_name'] ?? 'Vape Club Dubai') ?>" class="brand-img-logo">
<?php else: ?>
      <span class="brand-mark"><svg><use href="#i-logo"/></svg></span>
      <span class="brand-text">
        <strong><?= e($S['brand_name'] ?? 'VAPE CLUB') ?></strong>
        <small><?= e($S['brand_tagline'] ?? '') ?></small>
      </span>
<?php endif; ?>
    </a>

    <button class="header-search js-open-search" aria-label="Search products">
      <svg class="icon icon-sm"><use href="#i-search"/></svg>
      <span><?= e($HM['search']['placeholder'] ?? 'Search products…') ?></span>
      <kbd>/</kbd>
    </button>

    <div class="header-actions">
      <a class="icon-btn hide-mobile" href="tel:<?= e($S['phone_tel'] ?? '') ?>" aria-label="Call <?= e($S['phone_display'] ?? '') ?>">
        <svg class="icon"><use href="#i-phone"/></svg>
      </a>
      <a class="icon-btn hide-mobile" href="<?= e(wa_link($S['wa_msg_assistance'] ?? 'Hello!')) ?>" target="_blank" rel="noopener" aria-label="WhatsApp us">
        <svg class="icon"><use href="#i-wa"/></svg>
      </a>
      <button class="icon-btn js-open-search hide-mobile" aria-label="Search">
        <svg class="icon"><use href="#i-search"/></svg>
      </button>
      <button class="icon-btn js-open-cart cart-btn" aria-label="Open cart" aria-controls="cartDrawer">
        <svg class="icon"><use href="#i-cart"/></svg>
        <span class="count-badge is-visible cart-count-text" id="cartCount">0</span>
      </button>
    </div>
  </div>

  <nav class="header-nav container" aria-label="Categories">
    <ul>
      <li><a href="category.php?cat=iluma">IQOS ILUMA Devices</a></li>
      <li><a href="category.php?cat=terea">TEREA by Country</a></li>
      <li><a href="category.php?cat=disposables">Disposable Vapes</a></li>
      <li><a href="category.php?cat=pod">Pod Systems</a></li>
      <li><a href="category.php?cat=eliquid">E-Liquids</a></li>
      <li><a href="/#bestsellers" class="hot">Best Selling Products</a></li>
    </ul>
  </nav>
</header>

<!-- ========== LUXURY MOBILE MENU DRAWER ========== -->
<aside class="menu-drawer" id="menuDrawer" aria-label="Navigation Menu" aria-hidden="true" data-kind="drawer">
  <div class="menu-drawer-head">
    <a class="brand" href="/" aria-label="Home">
<?php if (!empty($S['logo_type']) && $S['logo_type'] === 'image' && !empty($S['logo_image'])): ?>
      <img src="<?= e($S['logo_image']) ?>" alt="<?= e($S['brand_name'] ?? 'Vape Club Dubai') ?>" class="brand-img-logo">
<?php else: ?>
      <span class="brand-mark"><svg><use href="#i-logo"/></svg></span>
      <span class="brand-text">
        <strong><?= e($S['brand_name'] ?? 'VAPE CLUB') ?></strong>
        <small><?= e(strtoupper($S['brand_tagline'] ?? 'VIP VAPE DUBAI')) ?></small>
      </span>
<?php endif; ?>
    </a>
    <button class="icon-btn js-close-menu" id="menuClose" aria-label="Close menu"><svg class="icon"><use href="#i-close"/></svg></button>
  </div>

  <!-- Search Trigger in Drawer -->
  <button class="drawer-search-btn js-open-search" type="button" aria-label="Search products">
    <svg class="icon icon-sm"><use href="#i-search"/></svg>
    <span>Search ILUMA, TEREA, vapes…</span>
    <kbd>Search</kbd>
  </button>

  <!-- Categories Navigation -->
  <div class="drawer-nav-group">
    <span class="drawer-nav-label">Shop by Category</span>
    <nav class="drawer-nav-links">
      <a href="/#shop" class="drawer-nav-item">
        <span class="dni-icon">🛍️</span>
        <span class="dni-text">All Products</span>
        <svg class="icon icon-xs"><use href="#i-chevron-right"/></svg>
      </a>
      <a href="/#bestsellers" class="drawer-nav-item is-highlight">
        <span class="dni-icon">👑</span>
        <span class="dni-text">Best Selling Products</span>
        <span class="dni-badge badge-hot">HOT</span>
      </a>
      <a href="category.php?cat=iluma" class="drawer-nav-item">
        <span class="dni-icon">⚡</span>
        <span class="dni-text">IQOS ILUMA Devices</span>
        <span class="dni-badge">PRIME</span>
      </a>
      <a href="category.php?cat=terea-id" class="drawer-nav-item">
        <span class="dni-icon"><span class="flag">🇮🇩</span></span>
        <span class="dni-text">TEREA Indonesia</span>
        <svg class="icon icon-xs"><use href="#i-chevron-right"/></svg>
      </a>
      <a href="category.php?cat=terea-jp" class="drawer-nav-item">
        <span class="dni-icon"><span class="flag">🇯🇵</span></span>
        <span class="dni-text">TEREA Japan</span>
        <svg class="icon icon-xs"><use href="#i-chevron-right"/></svg>
      </a>
      <a href="category.php?cat=terea-ch" class="drawer-nav-item">
        <span class="dni-icon"><span class="flag">🇨🇭</span></span>
        <span class="dni-text">TEREA Swiss</span>
        <svg class="icon icon-xs"><use href="#i-chevron-right"/></svg>
      </a>
      <a href="category.php?cat=disposables" class="drawer-nav-item">
        <span class="dni-icon">🔥</span>
        <span class="dni-text">Disposable Vapes (10K+ Puffs)</span>
        <svg class="icon icon-xs"><use href="#i-chevron-right"/></svg>
      </a>
      <a href="category.php?cat=pod" class="drawer-nav-item">
        <span class="dni-icon">💠</span>
        <span class="dni-text">Pod Systems</span>
        <svg class="icon icon-xs"><use href="#i-chevron-right"/></svg>
      </a>
      <a href="category.php?cat=eliquid" class="drawer-nav-item">
        <span class="dni-icon">💧</span>
        <span class="dni-text">E-Liquids &amp; Salts</span>
        <svg class="icon icon-xs"><use href="#i-chevron-right"/></svg>
      </a>
    </nav>
  </div>

  <!-- Trust Card -->
  <div class="drawer-trust-card">
    <div class="dt-item">
      <svg class="icon" style="color:var(--emerald)"><use href="#i-truck"/></svg>
      <div><strong>1-2h Express Delivery</strong><small>Dubai, Abu Dhabi &amp; All UAE</small></div>
    </div>
    <div class="dt-item">
      <svg class="icon" style="color:var(--cyan)"><use href="#i-shield"/></svg>
      <div><strong>100% Genuine &amp; ESMA</strong><small>Cash or Card on Delivery</small></div>
    </div>
  </div>

  <!-- Theme Toggle Card (Moved cleanly into side menu) -->
  <div class="menu-theme-row">
    <div class="m-theme-label">
      <span class="m-theme-icon"><svg class="icon icon-sm"><use href="#i-moon"/></svg></span>
      <div>
        <strong id="menuThemeText">Dark Mode</strong>
        <small class="m-theme-hint">Switch Theme</small>
      </div>
    </div>
    <button class="theme-toggle-switch is-active" id="menuThemeToggle" type="button" aria-label="Toggle Light and Dark mode">
      <span class="theme-switch-thumb"></span>
    </button>
  </div>

  <!-- Actions -->
  <div class="menu-contact">
    <a class="btn btn-wa btn-block" href="<?= e(wa_link($S['wa_msg_order'] ?? 'Hello! I want to order.')) ?>" target="_blank" rel="noopener">
      <svg class="icon"><use href="#i-wa"/></svg> WhatsApp Order (Instant)
    </a>
    <a class="btn btn-ghost btn-block" href="tel:<?= e($S['phone_tel'] ?? '') ?>">
      <svg class="icon"><use href="#i-phone"/></svg> Call <?= e($S['phone_display'] ?? '+971 50 123 4567') ?>
    </a>
  </div>
  <p class="menu-note">🔞 18+ only · ESMA compliant · Free UAE delivery on 450+ AED</p>
</aside>

<div class="backdrop" id="backdrop"></div>
