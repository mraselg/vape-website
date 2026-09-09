/* ============================================================
   CATEGORY PAGE — category.html?cat=<key>
   ============================================================ */
'use strict';

(function categoryPage() {
  if (localStorage.getItem(LS_AGE) !== 'true') { location.replace('/'); return; }

  const params = new URLSearchParams(location.search);
  const key = params.get('cat') || 'all';
  const cat = CATS[key] || { title: 'All Products', sub: 'Best vape shop in Dubai', desc: 'The full Vape Club Dubai catalogue — original devices, sticks, disposables, pods and juices with express delivery.', photo: '', theme: 'art-emerald', art: 'pack' };
  const list = catProducts(key);
  document.title = (CATS[key] ? CATS[key].title : 'All Products') + ' — Vape Club Dubai';

  /* Keep meta description in sync when landing from static shell */
  const md = document.getElementById('metaDesc');
  if (md && cat.desc) md.setAttribute('content', cat.desc);

  const heroMedia = cat.photo
    ? '<img class="cat-hero-photo" src="' + cat.photo + '" alt="' + esc(cat.title) + '" onerror="this.remove()">'
    : '<div class="cat-hero-art ' + cat.theme + '"><svg class="prod-art ' + cat.theme + '"><use href="#art-' + cat.art + '"/></svg></div>';

  $('#catRoot').innerHTML =
    '<section class="cat-hero ' + cat.theme + '">' +
      '<div class="cat-hero-copy">' +
        '<span class="eyebrow">Category</span>' +
        '<h1>' + esc(cat.title) + '</h1>' +
        '<span class="cat-hero-sub">' + esc(cat.sub) + '</span>' +
        '<p>' + esc(cat.desc) + '</p>' +
        '<div class="cat-hero-chips">' +
          '<span><svg class="icon icon-sm"><use href="#i-truck"/></svg> 1-2h Dubai express</span>' +
          '<span><svg class="icon icon-sm"><use href="#i-shield"/></svg> 100% original · ESMA</span>' +
          '<span><svg class="icon icon-sm"><use href="#i-check"/></svg> ' + list.length + ' product' + (list.length === 1 ? '' : 's') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="cat-hero-media">' + heroMedia + '</div>' +
    '</section>';

  function stockLine(p) {
    if (p.stock === 'low') return '<span class="card-stock stock-low"><span class="dot"></span>Low Stock</span>';
    if (p.stock === 'out') return '<span class="card-stock stock-out"><span class="dot"></span>Out of Stock</span>';
    return '<span class="card-stock"><span class="dot"></span>In Stock</span>';
  }

  function ratingLine() {
    if (!SHOW_RATING) return '';
    return '<div class="card-rating-line"><span class="stars">★★★★★</span><span class="score">' + esc(RATING_VALUE) + '</span></div>';
  }

  $('#catGrid').innerHTML = list.map((p) => {
    const ph = p.photo ? '<img class="rel-photo" src="' + p.photo + '" alt="' + esc(p.name) + '" onerror="this.remove()">' : '';
    const savings = p.old && p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
    const badge = savings > 0 
      ? '<span class="card-sale-pill">-' + savings + '%</span>'
      : (p.badges && p.badges.includes('new') ? '<span class="card-new-pill">NEW</span>' : '');

    return (
      '<article class="card" data-id="' + p.id + '" data-qv="' + p.id + '" role="button" tabindex="0" aria-label="' + esc(p.name) + '">' +
        '<div class="card-media ' + mediaBg(p) + ' ' + p.theme + '">' +
          badge +
          (p.flag ? '<span class="origin-flag">' + p.flag + '</span>' : '') +
          '<svg class="prod-art ' + p.theme + '" aria-hidden="true"><use href="' + ART[p.art] + '"/></svg>' + ph +
        '</div>' +
        '<div class="card-body">' +
          ratingLine() +
          '<h3 class="card-name" title="' + esc(p.name) + '">' + esc(p.name) + '</h3>' +
          stockLine(p) +
          '<div class="card-price-row">' +
            '<span class="card-price">' + p.price + '<small> AED</small></span>' +
            (p.old ? '<span class="card-old">' + p.old + ' AED</span>' : '') +
          '</div>' +
          '<div class="card-actions">' +
            '<button class="add-btn" data-add="' + p.id + '"><svg class="icon icon-sm"><use href="#i-wa"/></svg> Order on WhatsApp</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }).join('') || '<div class="empty-state"><b>Nothing here yet</b>New stock lands weekly — ask us on WhatsApp.</div>';

  $('#catCount').innerHTML = 'Showing <b>' + list.length + '</b> product' + (list.length === 1 ? '' : 's') + ' — ' + esc(cat.title);

  // Sync cart UI state from shop-shared.js
  if (typeof renderCart === 'function') {
    renderCart();
  }
})();
