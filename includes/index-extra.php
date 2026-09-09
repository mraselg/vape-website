<?php
/**
 * Index-only overlays: All-Categories modal + Age gate.
 */
declare(strict_types=1);

$AGE = $VCD_HOME['age_gate'] ?? [];
?>
<!-- ========== ALL CATEGORIES MODAL ========== -->
<div class="modal" id="catModal" role="dialog" aria-modal="true" aria-label="All categories">
  <div class="modal-panel cat-modal-panel">
    <button class="modal-close" data-close-modal aria-label="Close categories"><svg class="icon"><use href="#i-close"/></svg></button>
    <div class="cat-modal-head">
      <span class="eyebrow">Browse</span>
      <h3>All Vape Categories</h3>
    </div>
    <div class="cat-grid cat-modal-grid">
      <a class="cat-tile" href="category.php?cat=pod"><span class="cat-ico"><svg viewBox="0 0 24 24"><rect x="7" y="8" width="10" height="13" rx="3"/><path d="M10 5h4v3h-4z"/></svg></span><span class="cat-sub">Vape kits in Dubai</span><span class="cat-title">VAPE KIT</span></a>
      <a class="cat-tile" href="category.php?cat=pod"><span class="cat-ico"><svg viewBox="0 0 24 24"><rect x="8" y="5" width="8" height="16" rx="3"/><path d="M10 3h4v2"/></svg></span><span class="cat-sub">Best pod kit</span><span class="cat-title">POD KIT</span></a>
      <a class="cat-tile" href="category.php?cat=disposables"><span class="cat-ico"><svg viewBox="0 0 24 24"><rect x="9" y="4" width="6" height="17" rx="2.5"/><circle cx="12" cy="18" r=".9" fill="currentColor"/></svg></span><span class="cat-sub">Dubai best disposables</span><span class="cat-title">DISPOSABLE</span></a>
      <a class="cat-tile" href="category.php?cat=disposables"><span class="cat-ico"><svg viewBox="0 0 24 24"><rect x="4" y="7" width="6" height="14" rx="2"/><rect x="14" y="4" width="6" height="17" rx="2"/></svg></span><span class="cat-sub">Best pod kit in Dubai</span><span class="cat-title">DISPOSABLE KIT</span></a>
      <a class="cat-tile" href="category.php?cat=iluma"><span class="cat-ico"><svg viewBox="0 0 24 24"><rect x="4" y="6" width="9" height="14" rx="2.5"/><path d="M13 9.5h4M13 13h4"/><rect x="17" y="4" width="3" height="16" rx="1.5"/></svg></span><span class="cat-sub">Best heating kit in Dubai</span><span class="cat-title">HEATING DEVICE</span></a>
      <a class="cat-tile" href="category.php?cat=eliquid"><span class="cat-ico"><svg viewBox="0 0 24 24"><path d="M10 3h4v3l2 3v9a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3V9l2-3V3z"/><path d="M12 13.5c.8 1 1.6 1.8 1.6 2.9a1.6 1.6 0 1 1-3.2 0c0-1.1.8-1.9 1.6-2.9z"/></svg></span><span class="cat-sub">Saltnic vape juice in Dubai</span><span class="cat-title">SALTNIC JUICE</span></a>
      <a class="cat-tile" href="category.php?cat=eliquid"><span class="cat-ico"><svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v5l-4 9a3 3 0 0 0 2.7 4h6.6A3 3 0 0 0 18 17l-4-9V3"/><path d="M7.5 15h9"/></svg></span><span class="cat-sub">E juice in Dubai</span><span class="cat-title">E JUICE</span></a>
      <a class="cat-tile" href="category.php?cat=pod"><span class="cat-ico"><svg viewBox="0 0 24 24"><path d="M8 6h8v12a4 4 0 0 1-4 2 4 4 0 0 1-4-2V6z"/><ellipse cx="12" cy="6" rx="4" ry="1.8"/><path d="M8 12h8"/></svg></span><span class="cat-sub">Best tank in Dubai</span><span class="cat-title">TANK</span></a>
      <a class="cat-tile" href="category.php?cat=pod"><span class="cat-ico"><svg viewBox="0 0 24 24"><rect x="7" y="8" width="10" height="11" rx="2.5"/><path d="M10 4h4v4h-4z"/></svg></span><span class="cat-sub">Best pods in Dubai</span><span class="cat-title">PODS</span></a>
      <a class="cat-tile" href="category.php?cat=pod"><span class="cat-ico"><svg viewBox="0 0 24 24"><path d="M6 18c2 0 2-2 4-2s2 2 4 2 2-2 4-2M6 13c2 0 2-2 4-2s2 2 4 2 2-2 4-2M6 8c2 0 2-2 4-2s2 2 4 2 2-2 4-2"/></svg></span><span class="cat-sub">Best coils in Dubai</span><span class="cat-title">COILS</span></a>
      <a class="cat-tile" href="category.php?cat=all"><span class="cat-ico"><svg viewBox="0 0 24 24"><rect x="3" y="8" width="15" height="8" rx="2"/><path d="M21 10.5v3M6.5 11h3v2h-3z"/></svg></span><span class="cat-sub">Best batteries in Dubai</span><span class="cat-title">BATTERIES</span></a>
      <a class="cat-tile" href="category.php?cat=all"><span class="cat-ico"><svg viewBox="0 0 24 24"><path d="M14 4l6 6-8.5 8.5a2.1 2.1 0 0 1-3 0l-1.5-1.5a2.1 2.1 0 0 1 0-3L14 4z"/><path d="M12.5 6.5l5 5M5 12l-2 7 7-2"/></svg></span><span class="cat-sub">Best accessories in Dubai</span><span class="cat-title">ACCESSORIES</span></a>
      <a class="cat-tile" href="category.php?cat=terea"><span class="cat-ico"><svg viewBox="0 0 24 24"><rect x="5" y="6" width="14" height="14" rx="2"/><path d="M5 10h14M9 14h6"/></svg></span><span class="cat-sub">TEREA sticks in Dubai</span><span class="cat-title">TEREA</span></a>
    </div>
  </div>
</div>

<?php if ($AGE['enabled'] ?? true): ?>
<!-- ========== AGE GATE ========== -->
<div class="modal" id="ageModal" role="dialog" aria-modal="true" aria-labelledby="ageTitle">
  <div class="modal-panel age-panel">
    <div class="age-shield"><svg class="icon"><use href="#i-18"/></svg></div>
    <h2 id="ageTitle"><?= e($AGE['title'] ?? '') ?></h2>
    <p><?= e($AGE['text'] ?? '') ?></p>
    <div class="age-under-msg" id="ageUnderMsg"><?= e($AGE['under_msg'] ?? '') ?></div>
    <div class="age-btns">
      <button class="btn btn-primary btn-block" id="ageYes"><svg class="icon"><use href="#i-check"/></svg> <?= e($AGE['yes_label'] ?? '') ?></button>
      <button class="btn btn-ghost btn-block" id="ageNo"><?= e($AGE['no_label'] ?? '') ?></button>
    </div>
    <p class="age-note"><svg class="icon"><use href="#i-shield"/></svg> <?= e($AGE['note'] ?? '') ?></p>
  </div>
</div>
<?php endif; ?>
