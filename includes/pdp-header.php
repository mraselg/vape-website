<?php
/**
 * Minimal header used on category.php / product.php.
 * Set $pdpWaHeaderId = true on product page so JS can retarget #pdWaHeader.
 */
declare(strict_types=1);

$S = $VCD_SETTINGS;
?>
<header class="site-header">
  <div class="container header-main">
    <a class="icon-btn" href="/<?= $backAnchor ?? '' ?>" aria-label="Back"><svg class="icon"><use href="#i-chevron-left"/></svg></a>
    <a class="brand" href="/">
<?php if (!empty($S['logo_type']) && $S['logo_type'] === 'image' && !empty($S['logo_image'])): ?>
      <img src="<?= e($S['logo_image']) ?>" alt="<?= e($S['brand_name'] ?? 'Vape Club Dubai') ?>" class="brand-img-logo">
<?php else: ?>
      <span class="brand-mark"><svg><use href="#i-logo"/></svg></span>
      <span class="brand-text"><strong><?= e($S['brand_name'] ?? 'VAPE CLUB') ?></strong><small><?= e($S['brand_tagline'] ?? '') ?></small></span>
<?php endif; ?>
    </a>
    <div class="header-actions">
      <button class="icon-btn hide-mobile js-theme-toggle" type="button" aria-label="Toggle Dark and Light theme" title="Toggle theme">
        <svg class="icon icon-moon"><use href="#i-moon"/></svg>
        <svg class="icon icon-sun" style="display:none;"><use href="#i-sun"/></svg>
      </button>
      <a class="icon-btn js-open-wa-chat" <?= !empty($pdpWaHeaderId) ? 'id="pdWaHeader" ' : '' ?>href="<?= e(wa_link($S['wa_msg_assistance'] ?? 'Hello!')) ?>" aria-label="WhatsApp us"><svg class="icon"><use href="#i-wa"/></svg></a>
      <button class="icon-btn js-open-cart" <?= !empty($pdpWaHeaderId) ? 'id="pdCartBtn" ' : '' ?>aria-label="Open cart"><svg class="icon"><use href="#i-cart"/></svg><span class="count-badge<?= !empty($pdpWaHeaderId) ? ' is-visible cart-count-text' : '' ?>" id="pdCartCount">0</span></button>
    </div>
  </div>
</header>
