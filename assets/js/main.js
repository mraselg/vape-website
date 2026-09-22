/* ============================================================
   VAPE CLUB DUBAI — Client logic
   Vanilla ES6 · zero dependencies · runs from file:// or XAMPP
   ============================================================ */
'use strict';

/* Shared catalog, constants & helpers: assets/js/catalog.js (loaded first) */

/* ---------- Card rendering ---------- */

function stockHtml(p) {
  if (p.stock === 'low') return '<span class="card-stock stock-low"><span class="dot"></span>Low Stock</span>';
  if (p.stock === 'out') return '<span class="card-stock stock-out"><span class="dot"></span>Out of Stock</span>';
  return '<span class="card-stock"><span class="dot"></span>In Stock</span>';
}

function ratingLineHtml(cls, suffix) {
  if (!SHOW_RATING) return '';
  return '<div class="' + cls + '"><span class="stars">★★★★★</span><span class="score">' + esc(RATING_VALUE + (suffix || '')) + '</span></div>';
}


function cardHtml(p) {
  const savings = p.old && p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
  const badge = savings > 0 
    ? '<span class="card-sale-pill">-' + savings + '%</span>'
    : (p.badges && p.badges.includes('new') ? '<span class="card-new-pill">NEW</span>' : '');

  return (
    '<article class="card" data-id="' + p.id + '" data-qv="' + p.id + '" role="button" tabindex="0" aria-label="' + esc(p.name) + '">' +
      '<div class="card-media ' + mediaBg(p) + ' ' + p.theme + '">' +
        badge +
        (p.photo ? '<img class="prod-photo" src="' + p.photo + '" alt="' + esc(p.name) + '" loading="lazy" onerror="this.remove()">' : '') +
        '<svg class="prod-art ' + p.theme + '" aria-hidden="true"><use href="' + ART[p.art] + '"/></svg>' +
      '</div>' +
      '<div class="card-body">' +
        ratingLineHtml('card-rating-line') +
        '<h3 class="card-name" title="' + esc(p.name) + '"><a href="product.php?id=' + p.id + '" style="color:inherit;text-decoration:none;">' + esc(p.name) + '</a></h3>' +
        '<div class="card-price-row">' +
          '<span class="card-price">' + p.price + '<small> AED</small></span>' +
          (p.old ? '<span class="card-old">' + p.old + ' AED</span>' : '') +
        '</div>' +
        '<div class="card-actions">' +
          '<button class="add-btn" data-add="' + p.id + '"><svg class="icon icon-sm"><use href="#i-wa"/></svg> Order Now</button>' +
        '</div>' +
      '</div>' +
    '</article>'
  );
}

function matchesFilter(p, f) {
  if (f === 'all') return true;
  if (f === 'bestsellers') return !!p.best;
  if (f === 'terea') return p.cat.indexOf('terea-') === 0;
  return p.cat === f;
}

let activeFilter = 'all';

function renderShop() {
  const grid = $('#shopGrid');
  const list = PRODUCTS.filter((p) => matchesFilter(p, activeFilter));
  grid.innerHTML = list.length
    ? list.map(cardHtml).join('')
    : '<div class="empty-state"><b>No products here yet</b>Try another category or ping us on WhatsApp.</div>';
  $('#resultNote').innerHTML = 'Showing <b>' + list.length + '</b> item' + (list.length === 1 ? '' : 's') + ' — ' + (CAT_LABELS[activeFilter] || 'All Products');
}

const VIP_RANKS = [
  { rank: '#1', label: 'TOP SELLER', class: 'rank-gold', icon: '👑' },
  { rank: '#2', label: 'MOST POPULAR', class: 'rank-emerald', icon: '🔥' },
  { rank: '#3', label: 'TOP FAVORITE', class: 'rank-cyan', icon: '💎' },
  { rank: '#4', label: 'TOP RATED 4.9★', class: 'rank-violet', icon: '⭐' },
  { rank: '#5', label: 'HOT DEMAND', class: 'rank-amber', icon: '⚡' },
  { rank: '#6', label: 'VALUE CHOICE', class: 'rank-rose', icon: '💨' }
];

function vipBestCardHtml(p, index) {
  const meta = VIP_RANKS[index] || { rank: '#' + (index + 1), label: 'BEST SELLER', class: 'rank-gold', icon: '👑' };
  const pct = p.old && p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
  
  return (
    '<article class="vip-card ' + meta.class + '" data-id="' + p.id + '" data-qv="' + p.id + '" role="button" tabindex="0" aria-label="' + esc(p.name) + '">' +
      '<div class="vip-rank-pill">' +
        '<span>' + meta.icon + ' ' + meta.rank + '</span>' +
      '</div>' +
      (pct > 0 ? '<span class="vip-sale-pill">-' + pct + '%</span>' : '') +
      '<div class="vip-card-media ' + mediaBg(p) + ' ' + p.theme + '">' +
        (p.photo ? '<img class="prod-photo" src="' + p.photo + '" alt="' + esc(p.name) + '" loading="lazy" onerror="this.remove()">' : '') +
        '<svg class="prod-art ' + p.theme + '" aria-hidden="true"><use href="' + ART[p.art] + '"/></svg>' +
      '</div>' +
      '<div class="vip-card-body">' +
        ratingLineHtml('vip-rating-line', ' · Verified') +
        '<h3 class="vip-card-name" title="' + esc(p.name) + '"><a href="product.php?id=' + p.id + '" style="color:inherit;text-decoration:none;">' + esc(p.name) + '</a></h3>' +
        '<div class="vip-price-box">' +
          '<div class="vip-price-main">' +
            '<span class="vip-price">' + p.price + '<small> AED</small></span>' +
            (p.old ? '<span class="vip-old">' + p.old + ' AED</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="vip-card-actions">' +
          '<button class="vip-add-btn" data-add="' + p.id + '"><svg class="icon icon-sm"><use href="#i-wa"/></svg> Order Now</button>' +
        '</div>' +
      '</div>' +
    '</article>'
  );
}

function renderSections() {
  const bg = $('#bestGrid');
  if (bg) {
    const bestList = PRODUCTS.filter((p) => p.best);
    bg.innerHTML = bestList.map((p, idx) => vipBestCardHtml(p, idx)).join('');
  }
  const tg = $('#tereaGrid');
  if (tg) {
    tg.innerHTML = PRODUCTS.filter((p) => p.cat.indexOf('terea-') === 0).map(cardHtml).join('');
  }
  const vg = $('#vapeGrid');
  if (vg) {
    vg.innerHTML = PRODUCTS.filter((p) => p.cat === 'disposables').map(cardHtml).join('');
  }
}

function setFilter(f) {
  activeFilter = CAT_LABELS[f] ? f : 'all';
  $$('#filterPills .pill').forEach((btn) => {
    const on = btn.dataset.filter === activeFilter;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
    if (on) btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  });
  renderShop();
}

/* ---------- Scroll Reveal Observer ---------- */
function initReveal() {
  const els = $$('.reveal');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('in-view');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '50px' });
  els.forEach((el) => io.observe(el));

  // Immediate visibility check for elements already near or within viewport
  setTimeout(() => {
    els.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 100) {
        el.classList.add('in-view');
      }
    });
  }, 50);
}
initReveal();

/* Note: Cart state, Quick View Modal, and Drawer logic are provided by shop-shared.js */

/* ---------- Search modal ---------- */
const searchModal = $('#searchModal');
const searchInput = $('#searchInput');
const searchClear = $('#searchClear');
let searchChip = 'all';

function buildSearchChips() {
  const chipBox = $('#searchChips');
  if (!chipBox) return;
  const defs = (VCD.searchChips && VCD.searchChips.length) ? VCD.searchChips
    : [['all', 'All'], ['iluma', 'ILUMA'], ['terea-id', '🇮🇩 Indonesia'], ['terea-jp', '🇯🇵 Japan'], ['terea-ch', '🇨🇭 Swiss'], ['disposables', '🔥 10k+'], ['pod', 'Pods'], ['eliquid', 'E-Liquids']];
  chipBox.innerHTML = defs.map(([k, label]) =>
    '<button class="chip' + (k === searchChip ? ' is-active' : '') + '" data-chip="' + k + '">' + label + '</button>'
  ).join('');
}

function runSearch() {
  if (!searchInput) return;
  const q = searchInput.value.trim().toLowerCase();
  if (searchClear) searchClear.classList.toggle('is-visible', q.length > 0);
  const list = PRODUCTS.filter((p) => {
    const inChip = searchChip === 'all' || p.cat === searchChip;
    if (!inChip) return false;
    if (!q) return true;
    const hay = (p.name + ' ' + p.flavor + ' ' + (CAT_LABELS[p.cat] || '')).toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  }).slice(0, 14);

  const box = $('#searchResults');
  if (!box) return;
  if (!list.length) {
    box.innerHTML = '<div class="search-none">No match — try \u2018mint\u2019, \u2018TEREA\u2019 or \u201810000\u2019.</div>';
    return;
  }
  box.innerHTML = list.map((p) =>
    '<div class="search-result" data-qv="' + p.id + '">' +
      '<span class="thumb ' + mediaBg(p) + ' ' + p.theme + '"><svg class="prod-art ' + p.theme + '"><use href="' + ART[p.art] + '"/></svg></span>' +
      '<div><b>' + (p.flag ? p.flag + ' ' : '') + esc(p.name) + '</b><small>' + esc(p.flavor) + '</small></div>' +
      '<div class="sr-right">' +
        '<span class="price">' + p.price + ' AED</span>' +
        '<button class="sr-add" data-add="' + p.id + '" aria-label="Add to cart"><svg class="icon icon-sm"><use href="#i-plus"/></svg></button>' +
      '</div>' +
    '</div>'
  ).join('');
}

function openSearch() {
  buildSearchChips();
  runSearch();
  if (searchModal) openLayer(searchModal, 'modal');
  if (searchInput) setTimeout(() => searchInput.focus(), 250);
}
window.openSearch = openSearch;

if (searchInput) searchInput.addEventListener('input', runSearch);
if (searchClear) searchClear.addEventListener('click', () => { if (searchInput) { searchInput.value = ''; runSearch(); searchInput.focus(); } });
const scBox = $('#searchChips');
if (scBox) {
  scBox.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-chip]');
    if (!chip) return;
    searchChip = chip.dataset.chip;
    $$('#searchChips .chip').forEach((c) => c.classList.toggle('is-active', c === chip));
    runSearch();
  });
}

document.addEventListener('keydown', (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
  if (e.key === '/' && !typing) { e.preventDefault(); openSearch(); }
});

/* ---------- Age gate ---------- */
(function ageGate() {
  if (typeof initUniversalAgeGate === 'function') {
    initUniversalAgeGate();
  }
})();

/* ---------- Hero carousel ---------- */
(function carousel() {
  const slides = $$('#heroCarousel .slide');
  const dotsBox = $('#heroDots');
  if (!slides.length || !dotsBox) return;
  let idx = 0, timer = null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.setAttribute('role', 'tab');
    d.setAttribute('aria-label', 'Show slide ' + (i + 1));
    d.addEventListener('click', () => go(i, true));
    dotsBox.appendChild(d);
  });
  const dots = $$('#heroDots button');

  function go(n, user) {
    if (!slides[idx]) return;
    slides[idx].classList.add('is-exit-left');
    slides[idx].classList.remove('is-active');
    idx = (n + slides.length) % slides.length;
    slides.forEach((s, i) => { if (i !== idx) s.classList.remove('is-exit-left'); });
    slides[idx].classList.remove('is-exit-left');
    slides[idx].classList.add('is-active');
    dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    const activeDot = dots[idx];
    if (activeDot) {
      activeDot.style.animation = 'none';
      void activeDot.offsetWidth;
      activeDot.style.animation = '';
    }
    if (user) restart();
  }
  function restart() {
    if (reduce) return;
    clearInterval(timer);
    timer = setInterval(() => { if (!document.hidden) go(idx + 1); }, 6000);
  }

  const prevBtn = $('#heroPrev');
  if (prevBtn) prevBtn.addEventListener('click', () => go(idx - 1, true));
  const nextBtn = $('#heroNext');
  if (nextBtn) nextBtn.addEventListener('click', () => go(idx + 1, true));

  const shell = $('#heroShell');
  if (shell) {
    let startX = null, dragX = 0, dragging = false;
    shell.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a')) return;
      startX = e.clientX; dragX = 0; dragging = true;
      try { shell.setPointerCapture(e.pointerId); } catch (err) {}
      if (slides[idx]) slides[idx].style.transition = 'none';
    });
    shell.addEventListener('pointermove', (e) => {
      if (!dragging || !slides[idx]) return;
      dragX = e.clientX - startX;
      slides[idx].style.transform = 'translateX(' + dragX * 0.85 + 'px)';
    });
    function endDrag(commit) {
      if (!dragging) return;
      dragging = false;
      if (slides[idx]) {
        slides[idx].style.transition = '';
        slides[idx].style.transform = '';
      }
      if (commit && Math.abs(dragX) > 55) go(idx + (dragX < 0 ? 1 : -1), true);
      else restart();
      startX = null; dragX = 0;
    }
    shell.addEventListener('pointerup', () => endDrag(true));
    shell.addEventListener('pointercancel', () => endDrag(false));
    shell.addEventListener('pointerenter', () => clearInterval(timer));
    shell.addEventListener('pointerleave', restart);
  }

  if (dots.length) dots[0].classList.add('is-active');
  restart();
})();

/* ---------- FAQ accordion ---------- */
$$('.faq-item').forEach((item) => {
  const q = $('.faq-q', item);
  const a = $('.faq-a', item);
  if (q && a) {
    q.addEventListener('click', () => {
      const open = item.classList.toggle('is-open');
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
      a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
    });
  }
});

/* ---------- Filter pills ---------- */
const filterPills = $('#filterPills');
if (filterPills) {
  filterPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (pill) setFilter(pill.dataset.filter);
  });
}

/* ---------- Header shadow ---------- */
const siteHeader = $('#siteHeader');
if (siteHeader) {
  window.addEventListener('scroll', () => {
    siteHeader.classList.toggle('is-scrolled', window.scrollY > 8);
  }, { passive: true });
}

/* ---------- Language toggle (visual demo) ---------- */
$$('.lang-toggle button').forEach((b) => {
  b.addEventListener('click', () => {
    $$('.lang-toggle button').forEach((x) => x.classList.toggle('is-active', x === b));
    if (b.dataset.lang === 'ar') toast('Arabic version launching soon!');
  });
});

/* ---------- Dark / Light Mode Switcher ---------- */
/* Handled universally by shop-shared.js for #menuThemeToggle across all pages */
if (typeof window.initThemeSwitcher === 'function') {
  window.initThemeSwitcher();
}

/* Note: Checkout modal and order fulfillment are provided by shop-shared.js */

/* ---------- Boot ---------- */
renderSections();
renderShop();
renderCart();

if (location.hash === '#cart' || new URLSearchParams(location.search).get('cart') === '1') {
  setTimeout(openCart, 150);
}

/* Deep-linked search (?q=…), e.g. from the WebSite SearchAction schema */
(function deepSearch() {
  const q = new URLSearchParams(location.search).get('q');
  if (q) {
    searchInput.value = q;
    setTimeout(openSearch, 250);
  }
})();










