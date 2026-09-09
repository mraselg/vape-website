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
    <a class="icon-btn" href="index.php<?= $backAnchor ?? '' ?>" aria-label="Back"><svg class="icon"><use href="#i-chevron-left"/></svg></a>
    <a class="brand" href="index.php">
      <span class="brand-mark"><svg><use href="#i-logo"/></svg></span>
      <span class="brand-text"><strong><?= e($S['brand_name'] ?? 'VAPE CLUB') ?></strong><small><?= e($S['brand_tagline'] ?? '') ?></small></span>
    </a>
    <div class="header-actions">
      <a class="icon-btn" <?= !empty($pdpWaHeaderId) ? 'id="pdWaHeader" ' : '' ?>href="<?= e(wa_link($S['wa_msg_assistance'] ?? 'Hello!')) ?>" target="_blank" rel="noopener" aria-label="WhatsApp us"><svg class="icon"><use href="#i-wa"/></svg></a>
      <button class="icon-btn js-open-cart" <?= !empty($pdpWaHeaderId) ? 'id="pdCartBtn" ' : '' ?>aria-label="Open cart"><svg class="icon"><use href="#i-cart"/></svg><span class="count-badge<?= !empty($pdpWaHeaderId) ? ' is-visible cart-count-text' : '' ?>" id="pdCartCount">0</span></button>
    </div>
  </div>
</header>
