<?php
/**
 * Shared footer + legal bar. Data-driven from settings/home JSON.
 */
declare(strict_types=1);

$S  = $VCD_SETTINGS;
$HM = $VCD_HOME;
?>
<!-- ========== FOOTER ========== -->
<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-col">
      <a class="brand" href="#top">
<?php if (!empty($S['logo_type']) && $S['logo_type'] === 'image' && !empty($S['logo_image'])): ?>
        <img src="<?= e($S['logo_image']) ?>" alt="<?= e($S['brand_name'] ?? 'Vape Club Dubai') ?>" class="brand-img-logo">
<?php else: ?>
        <span class="brand-mark"><svg><use href="#i-logo"/></svg></span>
        <span class="brand-text"><strong><?= e($S['brand_name'] ?? 'VAPE CLUB') ?></strong><small><?= e($S['brand_tagline'] ?? '') ?></small></span>
<?php endif; ?>
      </a>
      <p class="footer-brand-note"><?= e($S['brand_footer_note'] ?? '') ?></p>
      <div class="pay-badges" aria-label="Payment methods">
<?php foreach (($S['payment_badges'] ?? []) as $badge): ?>
        <span class="pay-badge"><?= e($badge) ?></span>
<?php endforeach; ?>
      </div>
    </div>
    <div class="footer-col">
      <h4>Shop &amp; Guides</h4>
      <ul>
<?php foreach (($HM['footer_shop_links'] ?? []) as $link): ?>
        <li><a href="<?= e($link['href'] ?? '#') ?>"><svg class="icon"><use href="#i-arrow-right"/></svg> <?= e($link['label'] ?? '') ?></a></li>
<?php endforeach; ?>
        <li><a href="/guide-terea.php"><svg class="icon"><use href="#i-arrow-right"/></svg> TEREA Flavor Guide</a></li>
        <li><a href="/guide-iluma.php"><svg class="icon"><use href="#i-arrow-right"/></svg> IQOS ILUMA Comparison</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Contact</h4>
      <ul>
        <li><a href="tel:<?= e($S['phone_tel'] ?? '') ?>"><svg class="icon"><use href="#i-phone"/></svg> <?= e($S['phone_display'] ?? '') ?></a></li>
        <li><a href="<?= e(wa_link($S['wa_msg_assistance'] ?? 'Hello!')) ?>" target="_blank" rel="noopener"><svg class="icon"><use href="#i-wa"/></svg> WhatsApp Hotline</a></li>
        <li><a href="mailto:<?= e($S['email'] ?? '') ?>"><svg class="icon"><use href="#i-mail"/></svg> <?= e($S['email'] ?? '') ?></a></li>
        <li><a href="<?= e($S['maps_url'] ?? '#') ?>" target="_blank" rel="noopener"><svg class="icon"><use href="#i-pin"/></svg> <?= e($S['address'] ?? '') ?></a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Showroom Hours</h4>
      <ul>
<?php foreach (($S['hours'] ?? []) as $i => $hour): ?>
        <li><a href="#"><svg class="icon"><use href="#<?= $i === 0 ? 'i-clock' : 'i-truck' ?>"/></svg> <?= e($hour) ?></a></li>
<?php endforeach; ?>
      </ul>
      <div class="socials">
        <a class="icon-btn" href="<?= e($S['instagram_url'] ?? '#') ?>" target="_blank" rel="noopener" aria-label="Instagram"><svg class="icon"><use href="#i-globe"/></svg></a>
        <a class="icon-btn" href="<?= e($S['telegram_url'] ?? '#') ?>" target="_blank" rel="noopener" aria-label="Telegram"><svg class="icon"><use href="#i-chat"/></svg></a>
        <a class="icon-btn" href="<?= e(wa_link($S['wa_msg_assistance'] ?? 'Hello!')) ?>" target="_blank" rel="noopener" aria-label="WhatsApp"><svg class="icon"><use href="#i-wa"/></svg></a>
      </div>
    </div>
  </div>

  <div class="legal-bar">
    <div class="container">
      <p><strong>WARNING:</strong> <?= e($S['legal_warning'] ?? '') ?></p>
      <div class="legal-links">
        <span><?= e($S['copyright'] ?? '') ?></span>
<?php foreach (($S['legal_links'] ?? []) as $link): ?>
        <a href="#"><?= e($link) ?></a>
<?php endforeach; ?>
      </div>
    </div>
  </div>
</footer>
