/* ============================================================
   PRODUCT PAGE — renders product, variants, SEO tabs & schema
   ============================================================ */
'use strict';

(function productPage() {
  /* Age gate guard — home owns the gate */
  if (localStorage.getItem(LS_AGE) !== 'true') {
    location.replace('/');
    return;
  }

  const params = new URLSearchParams(location.search);
  const rawId = params.get('id') || params.get('slug');
  /* Unknown/invalid id: stop here instead of silently showing another product.
     (product.php already answers with HTTP 404 + noindex for crawlers.) */
  if (!rawId || !byId(rawId)) {
    const root = $('#pdRoot');
    if (root) {
      root.innerHTML =
        '<section class="cat-hero art-slate" style="margin-top:22px">' +
          '<div class="cat-hero-copy">' +
            '<span class="eyebrow">404 — Not Found</span>' +
            '<h1>Product Not Available</h1>' +
            '<p>This item may have sold out or the link is incorrect. Browse our full catalogue instead.</p>' +
            '<div style="margin-top:18px"><a class="btn btn-primary" href="/#shop"><svg class="icon"><use href="#i-box"/></svg> Browse All Products</a></div>' +
          '</div>' +
        '</section>';
      document.title = 'Product Not Found — Vape Club Dubai';
      const md = $('#metaDesc');
      if (md) md.setAttribute('content', 'The requested product is no longer available.');
    }
    return;
  }
  const p = byId(rawId);

  /* State for variants */
  const selected = {
    color: p.variants?.colors?.[0]?.id || null,
    packSize: p.variants?.packSizes?.[0]?.id || 'single',
    flavor: p.variants?.flavors?.[0]?.id || null,
    strength: p.variants?.strengths?.[0]?.id || null,
    resistance: p.variants?.resistance?.[0]?.id || null,
    bundle: p.variants?.bundles?.[0]?.id || null
  };

  let qty = 1;
  let cart = loadCartRaw();
  const save = () => localStorage.setItem(LS_CART, JSON.stringify(cart));

  /* Compute current variant configuration (price, key, label, photo) */
  function getVariantState() {
    let price = p.price;
    let old = p.old || 0;
    let photo = p.photo;
    const tokens = [];
    const labels = [];

    // TEREA pack size
    if (p.variants?.type === 'packSize') {
      const ps = p.variants.packSizes?.find((x) => x.id === selected.packSize);
      if (ps) {
        price = ps.price;
        old = ps.old || 0;
        tokens.push(ps.id);
        labels.push(ps.label);
      }
    }

    // Colors
    if (selected.color && p.variants?.colors) {
      const col = p.variants.colors.find((c) => c.id === selected.color);
      if (col) {
        tokens.push('col_' + col.id);
        labels.push(col.name);
        if (col.photo) photo = col.photo;
      }
    }

    // Flavors
    if (selected.flavor && p.variants?.flavors) {
      const flv = p.variants.flavors.find((f) => f.id === selected.flavor);
      if (flv) {
        tokens.push('flv_' + flv.id);
        labels.push(flv.name);
      }
    }

    // Nicotine strength
    if (selected.strength && p.variants?.strengths) {
      const st = p.variants.strengths.find((s) => s.id === selected.strength);
      if (st) {
        tokens.push('nic_' + st.id);
        labels.push(st.label);
      }
    }

    // Pod resistance
    if (selected.resistance && p.variants?.resistance) {
      const res = p.variants.resistance.find((r) => r.id === selected.resistance);
      if (res) {
        tokens.push('res_' + res.id);
        labels.push(res.label);
      }
    }

    // Bundles
    if (selected.bundle && p.variants?.bundles) {
      const bdl = p.variants.bundles.find((b) => b.id === selected.bundle);
      if (bdl) {
        if (bdl.priceDiff) price += bdl.priceDiff;
        tokens.push('bdl_' + bdl.id);
        labels.push(bdl.label);
      }
    }

    const variantKey = tokens.length ? tokens.join('__') : '';
    const cartKey = variantKey ? p.id + '__' + variantKey : p.id;
    const label = labels.join(' · ');

    return {
      cartKey,
      price,
      old,
      photo,
      label,
      sku: p.sku || p.id.toUpperCase()
    };
  }

  /* SEO Meta & Title setup */
  function updateSeo(vState) {
    const pageTitle = p.name + (vState.label ? ' (' + vState.label + ')' : '') + ' — Vape Club Dubai';
    document.title = pageTitle;

    const descText = 'Buy ' + p.name + ' in Dubai, UAE for ' + vState.price + ' AED. 1-2 hour express delivery, 100% genuine ESMA certified stock. Cash or card on delivery.';
    const metaDesc = $('#metaDesc');
    if (metaDesc) metaDesc.setAttribute('content', descText);

    /* Fix canonical per-product (was stuck on bare product.html for every item) */
    const canon = $('#canonicalUrl');
    if (canon) canon.setAttribute('href', SITE_URL + '/product.php?id=' + encodeURIComponent(p.id));
    const ogUrl = $('#ogUrl');
    if (ogUrl) ogUrl.setAttribute('content', SITE_URL + '/product.php?id=' + encodeURIComponent(p.id));

    const ogTitle = $('#ogTitle');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    const ogDesc = $('#ogDesc');
    if (ogDesc) ogDesc.setAttribute('content', descText);
    const ogImg = $('#ogImage');
    if (ogImg && vState.photo) ogImg.setAttribute('content', SITE_URL + '/' + vState.photo);

    const twTitle = $('#twTitle');
    if (twTitle) twTitle.setAttribute('content', pageTitle);
    const twDesc = $('#twDesc');
    if (twDesc) twDesc.setAttribute('content', descText);
    const twImg = $('#twImage');
    if (twImg && vState.photo) twImg.setAttribute('content', SITE_URL + '/' + vState.photo);

    // Schema.org JSON-LD Structured Data
    const schemaEl = $('#productSchema');
    if (schemaEl) {
      const schemaData = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: p.name,
        image: vState.photo ? [SITE_URL + '/' + vState.photo] : [],
        description: p.description?.replace(/\n+/g, ' ') || descText,
        sku: vState.sku,
        brand: {
          '@type': 'Brand',
          name: p.brand || 'Vape Club Dubai'
        },
        offers: {
          '@type': 'Offer',
          url: SITE_URL + '/product.php?id=' + encodeURIComponent(p.id),
          priceCurrency: 'AED',
          price: vState.price,
          availability: 'https://schema.org/' + (p.stock === 'out' ? 'OutOfStock' : 'InStock'),
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'Organization',
            name: 'Vape Club Dubai'
          }
        }
      };
      /* Only emit ratings the shop actually tracks (configurable in admin) —
         fabricated aggregateRatings risk a Google manual action. */
      if (SHOW_RATING && parseInt(RATING_COUNT, 10) > 0) {
        schemaData.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: RATING_VALUE,
          reviewCount: RATING_COUNT
        };
      }
      schemaEl.textContent = JSON.stringify(schemaData, null, 2);
    }
  }

  /* Breadcrumb links */
  const crumbCatLink = $('#crumbCatLink');
  if (crumbCatLink) {
    crumbCatLink.textContent = CAT_LABELS[p.cat] || 'Products';
    crumbCatLink.href = 'category.php?cat=' + (p.cat.startsWith('terea') ? 'terea' : p.cat);
  }
  const crumbProdName = $('#crumbProdName');
  if (crumbProdName) crumbProdName.textContent = p.name;

  /* Cart count & toast helpers */
  const countEl = $('#pdCartCount');
  function syncCount() {
    const n = Object.values(cart).reduce((a, b) => a + b, 0);
    countEl.textContent = n;
    countEl.classList.toggle('is-visible', n > 0);
  }
  syncCount();

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<svg class="icon"><use href="#i-check"/></svg>' + esc(msg);
    $('#toastStack').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 2400);
  }

  /* Build Variant Selector Markup */
  function buildVariantsHtml(vState) {
    const v = p.variants;
    if (!v) return '';
    let html = '<div class="pd-variants-box">';

    // 1. Pack Size Cards (TEREA or Cartons)
    if (v.packSizes && v.packSizes.length > 1) {
      html += '<div class="pd-vg"><div class="pd-vg-label"><strong>Package Size:</strong> <span class="pd-vg-val">' + esc(v.packSizes.find((x) => x.id === selected.packSize)?.label || '') + '</span></div><div class="pd-pack-cards">';
      v.packSizes.forEach((ps) => {
        const isAct = selected.packSize === ps.id;
        html += '<button type="button" class="pd-pack-card' + (isAct ? ' is-active' : '') + '" data-var="packSize" data-val="' + ps.id + '">' +
          (ps.save ? '<span class="pd-pack-badge">' + ps.save + '</span>' : '') +
          '<div class="pd-pack-title">' + esc(ps.label) + '</div>' +
          '<div class="pd-pack-meta">' + esc(ps.note) + '</div>' +
          '<div class="pd-pack-price">' + ps.price + ' AED' + (ps.old ? ' <small class="pd-pack-old">' + ps.old + ' AED</small>' : '') + '</div>' +
        '</button>';
      });
      html += '</div></div>';
    }

    // 2. Flavor Chips (Disposables)
    if (v.flavors && v.flavors.length > 0) {
      html += '<div class="pd-vg"><div class="pd-vg-label"><strong>Selected Flavor:</strong> <span class="pd-vg-val">' + esc(v.flavors.find((x) => x.id === selected.flavor)?.name || '') + '</span></div><div class="pd-chips-wrap">';
      v.flavors.forEach((flv) => {
        const isAct = selected.flavor === flv.id;
        html += '<button type="button" class="pd-chip-btn' + (isAct ? ' is-active' : '') + '" data-var="flavor" data-val="' + flv.id + '" title="' + esc(flv.note) + '">' +
          '<span class="pd-chip-dot"></span>' + esc(flv.name) +
        '</button>';
      });
      html += '</div></div>';
    }

    // 3. Nicotine Strength Toggle Pills
    if (v.strengths && v.strengths.length > 0) {
      html += '<div class="pd-vg"><div class="pd-vg-label"><strong>Nicotine Strength:</strong> <span class="pd-vg-val">' + esc(v.strengths.find((x) => x.id === selected.strength)?.label || '') + '</span></div><div class="pd-chips-wrap">';
      v.strengths.forEach((st) => {
        const isAct = selected.strength === st.id;
        html += '<button type="button" class="pd-chip-btn' + (isAct ? ' is-active' : '') + '" data-var="strength" data-val="' + st.id + '" title="' + esc(st.note) + '">' +
          '<svg class="icon icon-sm"><use href="#i-check"/></svg> ' + esc(st.label) +
        '</button>';
      });
      html += '</div></div>';
    }

    // 4. Device Colors Swatches
    if (v.colors && v.colors.length > 0) {
      html += '<div class="pd-vg"><div class="pd-vg-label"><strong>Device Color:</strong> <span class="pd-vg-val">' + esc(v.colors.find((x) => x.id === selected.color)?.name || '') + '</span></div><div class="pd-colors-wrap">';
      v.colors.forEach((col) => {
        const isAct = selected.color === col.id;
        html += '<button type="button" class="pd-color-btn' + (isAct ? ' is-active' : '') + '" data-var="color" data-val="' + col.id + '" title="' + esc(col.name) + '">' +
          '<span class="pd-color-swatch" style="background:' + col.hex + '"></span>' +
          '<span class="pd-color-name">' + esc(col.name) + '</span>' +
        '</button>';
      });
      html += '</div></div>';
    }

    // 5. Pod Resistance (Pod Kits)
    if (v.resistance && v.resistance.length > 0) {
      html += '<div class="pd-vg"><div class="pd-vg-label"><strong>Pod Coil Resistance:</strong> <span class="pd-vg-val">' + esc(v.resistance.find((x) => x.id === selected.resistance)?.label || '') + '</span></div><div class="pd-chips-wrap">';
      v.resistance.forEach((res) => {
        const isAct = selected.resistance === res.id;
        html += '<button type="button" class="pd-chip-btn' + (isAct ? ' is-active' : '') + '" data-var="resistance" data-val="' + res.id + '">' +
          esc(res.label) +
        '</button>';
      });
      html += '</div></div>';
    }

    // 6. Bundles & Value Packs
    if (v.bundles && v.bundles.length > 1) {
      html += '<div class="pd-vg"><div class="pd-vg-label"><strong>Bundle &amp; Value Pack:</strong> <span class="pd-vg-val">' + esc(v.bundles.find((x) => x.id === selected.bundle)?.label || '') + '</span></div><div class="pd-pack-cards">';
      v.bundles.forEach((b) => {
        const isAct = selected.bundle === b.id;
        html += '<button type="button" class="pd-pack-card pd-bundle-card' + (isAct ? ' is-active' : '') + '" data-var="bundle" data-val="' + b.id + '">' +
          '<div class="pd-pack-title">' + esc(b.label) + '</div>' +
          '<div class="pd-pack-meta">' + esc(b.note) + '</div>' +
        '</button>';
      });
      html += '</div></div>';
    }

    html += '</div>';
    return html;
  }

  /* Render Main Product Hero */
  function renderHero() {
    const vState = getVariantState();
    updateSeo(vState);

    function artInner(extraClass) {
      const svg = '<svg class="prod-art ' + p.theme + '" aria-hidden="true"><use href="' + ART[p.art] + '"/></svg>';
      const ph = vState.photo
        ? '<img class="' + extraClass + '" id="pdHeroImg" src="' + vState.photo + '" alt="' + esc(p.name) + '" onerror="this.remove()">'
        : '';
      return svg + ph;
    }

    const specBullets = (p.specs || []).map((s) => '<li><svg class="icon"><use href="#i-check"/></svg>' + esc(s) + '</li>').join('');
    const stars = SHOW_RATING
      ? '<div class="stars pd-stars">' +
        '<svg class="icon icon-fill"><use href="#i-star"/></svg>'.repeat(5) +
        '<span>' + esc(RATING_VALUE) + ' · ' + esc(RATING_COUNT) + ' UAE Customer Reviews</span></div>'
      : '';

    const savingsPill = vState.old && vState.old > vState.price
      ? '<span class="pd-save-badge">Save ' + (vState.old - vState.price) + ' AED (' + Math.round((1 - vState.price / vState.old) * 100) + '% OFF)</span>'
      : '';
    const galPhotos = [];
    if (vState.photo) galPhotos.push(vState.photo);
    if (Array.isArray(p.gallery)) {
      p.gallery.forEach((g) => { if (g && !galPhotos.includes(g)) galPhotos.push(g); });
    }
    if (p.variants?.colors) {
      p.variants.colors.forEach((c) => { if (c.photo && !galPhotos.includes(c.photo)) galPhotos.push(c.photo); });
    }
    const galHtml = galPhotos.length > 1
      ? '<div class="pd-gallery-strip" id="pdGalleryStrip" role="region" aria-label="Product image gallery">' +
          galPhotos.map((src, i) =>
            '<button type="button" class="pd-gal-thumb' + (src === vState.photo ? ' is-active' : '') + '" data-src="' + esc(src) + '" aria-label="View photo ' + (i+1) + '">' +
              '<img src="' + esc(src) + '" alt="' + esc(p.name) + ' view ' + (i+1) + '" loading="lazy" onerror="this.parentElement.remove()">' +
            '</button>'
          ).join('') +
        '</div>'
      : '';

    $('#pdRoot').innerHTML =
      '<article class="pd-hero">' +
        '<div class="pd-media-wrap">' +
          '<div class="pd-media ' + mediaBg(p) + ' ' + p.theme + '" id="pdMediaBox" role="button" tabindex="0" title="Click to view fullscreen / zoom">' +
            badgeHtml(p) +
            (p.flag ? '<span class="origin-flag">' + p.flag + '</span>' : '') +
            artInner('pd-photo') +
            (vState.photo ? '<button class="pd-zoom-trigger" id="pdZoomTrigger" type="button"><svg class="icon icon-sm"><use href="#i-search"/></svg> Fullscreen / Zoom</button>' : '') +
          '</div>' +
          galHtml +
        '</div>' +
        '<div class="pd-info">' +
          '<div class="pd-eyebrow-row">' +
            '<span class="eyebrow">' + esc(CAT_LABELS[p.cat] || 'Product') + '</span>' +
            (p.brand ? '<span class="pd-brand-tag">' + esc(p.brand) + '</span>' : '') +
          '</div>' +
          '<h1>' + esc(p.name) + '</h1>' +
          '<p class="pd-flavor"><svg class="icon icon-sm"><use href="#i-leaf"/></svg> ' + esc(p.flavor) + '</p>' +
          stars +
          '<div class="pd-price-row">' +
            '<span class="pd-price" id="pdPriceDisplay">' + vState.price + '<small> AED</small></span>' +
            (vState.old ? '<span class="card-old" id="pdOldDisplay">' + vState.old + ' AED</span>' : '') +
            savingsPill +
          '</div>' +
          '<div class="pd-stock-row">' +
            (p.stock === 'low'
              ? '<span class="card-stock stock-low"><span class="dot"></span>Low Stock — Order Soon</span>'
              : p.stock === 'out'
                ? '<span class="card-stock stock-out"><span class="dot"></span>Out of Stock</span>'
                : '<span class="card-stock"><span class="dot"></span>In Stock — Dubai Dispatch Every 30 Mins</span>') +
            '<span class="pd-sku-line">SKU: <code>' + esc(vState.sku) + '</code></span>' +
          '</div>' +

          /* Product Variants Selector Area */
          buildVariantsHtml(vState) +

          '<ul class="qv-specs" style="margin-top:16px">' + specBullets + '</ul>' +

          /* Clean Single-Action Buy Box */
          '<div class="pd-single-action-box">' +
            '<div class="pd-buy-row">' +
              '<div class="qv-qty">' +
                '<button class="qty-btn" id="pdDec" aria-label="Decrease quantity"><svg class="icon"><use href="#i-minus"/></svg></button>' +
                '<span class="qty-val" id="pdQty">' + qty + '</span>' +
                '<button class="qty-btn" id="pdInc" aria-label="Increase quantity"><svg class="icon"><use href="#i-plus"/></svg></button>' +
              '</div>' +
              '<a class="btn btn-wa btn-lg pd-primary-order-btn" id="pdDirectWa" target="_blank" rel="noopener">' +
                '<svg class="icon" style="width:20px;height:20px"><use href="#i-wa"/></svg> ' +
                '<span>Order Now (<span id="pdBtnTotal">' + (vState.price * qty) + ' AED</span>)</span>' +
              '</a>' +
            '</div>' +
            '<div class="pd-sub-action-row">' +
              '<button type="button" class="pd-sub-btn" id="pdAdd">' +
                '<svg class="icon icon-sm"><use href="#i-cart"/></svg> + Add to Bag' +
              '</button>' +
              '<button type="button" class="pd-sub-btn js-open-cart">' +
                '<svg class="icon icon-sm"><use href="#i-bag"/></svg> View Bag' +
              '</button>' +
            '</div>' +
          '</div>' +

          '<div class="pd-trust">' +
            '<span><svg class="icon icon-sm"><use href="#i-truck"/></svg> 1-2h Express: Dubai · Sharjah · Ajman</span>' +
            '<span id="pdDeliveryNotice"><svg class="icon icon-sm"><use href="#i-shield"/></svg> ' + (vState.price * qty >= FREE_SHIP_THRESHOLD ? 'FREE express delivery unlocked!' : FREE_SHIP_THRESHOLD + ' AED Free delivery all UAE') + '</span>' +
            '<span><svg class="icon icon-sm"><use href="#i-shield"/></svg> ESMA UAE.S 5030 Certified · COD or Card Machine</span>' +
          '</div>' +
        '</div>' +
      '</article>';

    // Update Direct WhatsApp button link
    updateWaLink(vState);

    // Bind Quantity Steppers
    const qtyEl = $('#pdQty');
    const refreshQty = () => {
      qtyEl.textContent = qty;
      const notice = $('#pdDeliveryNotice');
      if (notice) {
        notice.innerHTML = (vState.price * qty >= FREE_SHIP_THRESHOLD)
          ? '<svg class="icon icon-sm"><use href="#i-shield"/></svg> <strong style="color:var(--emerald)">FREE express delivery unlocked!</strong>'
          : '<svg class="icon icon-sm"><use href="#i-shield"/></svg> ' + FREE_SHIP_THRESHOLD + ' AED Free delivery all UAE';
      }
      updateWaLink(vState);
    };
    $('#pdInc')?.addEventListener('click', () => { qty = Math.min(QTY_CAP, qty + 1); refreshQty(); });
    $('#pdDec')?.addEventListener('click', () => { qty = Math.max(1, qty - 1); refreshQty(); });

    // Bind Direct WhatsApp button to also sync cart
    $('#pdDirectWa')?.addEventListener('click', () => {
      cart[vState.cartKey] = (cart[vState.cartKey] || 0) + qty;
      save();
      syncCount();
    });

    // Bind Add to Cart
    $('#pdAdd')?.addEventListener('click', function () {
      if (window.addToCart) {
        window.addToCart(vState.cartKey, qty, this);
      } else {
        cart[vState.cartKey] = (cart[vState.cartKey] || 0) + qty;
        save();
        syncCount();
        this.classList.add('added');
        setTimeout(() => this.classList.remove('added'), 900);
        const displayName = vState.label ? p.name.split('—')[0].trim() + ' (' + vState.label + ')' : p.name.split('—')[0].trim();
        toast(displayName + ' ×' + qty + ' added to WhatsApp cart');
      }
    });

    // Bind Variant Choice Buttons
    $$('[data-var]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const vType = btn.dataset.var;
        const vVal = btn.dataset.val;
        selected[vType] = vVal;
        renderHero();
      });
    });

    // Gallery Thumbnails Click Binding
    const galStrip = $('#pdGalleryStrip');
    if (galStrip) {
      galStrip.addEventListener('click', (e) => {
        const btn = e.target.closest('.pd-gal-thumb');
        if (!btn) return;
        const src = btn.dataset.src;
        if (!src) return;
        const hero = $('#pdHeroImg');
        if (hero) hero.src = src;
        const lb = $('#lbImg');
        if (lb) lb.src = src;
        galStrip.querySelectorAll('.pd-gal-thumb').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    }

    // Lightbox triggers
    bindLightbox(vState);
  }

  function updateWaLink(vState) {
    const waBtn = $('#pdDirectWa');
    if (!waBtn) return;
    const itemTitle = vState.label ? p.name + ' [' + vState.label + ']' : p.name;
    const totalAed = vState.price * qty;
    const msg =
      '*ORDER REQUEST - VAPE CLUB DUBAI*\n' +
      '---------------------------\n' +
      '• ' + itemTitle + ' (' + qty + 'x) - ' + totalAed + ' AED\n' +
      '---------------------------\n' +
      '*Total: ' + totalAed + ' AED*\n' +
      'Delivery: Dubai Express (1-2 Hours)\n' +
      'Please confirm my order!';
    waBtn.href = waLink(msg);

    const btnTotalSpan = $('#pdBtnTotal');
    if (btnTotalSpan) btnTotalSpan.textContent = totalAed + ' AED';

    $('#pdWaHeader').href = waLink('Hello Vape Club Dubai! I am on the product page for ' + itemTitle);
  }

  /* Render Comprehensive SEO & Specifications Tabs */
  function renderTabs() {
    const tabsBox = $('#pdTabsSection');
    if (!tabsBox) return;

    // Build specs table rows
    const specsRows = p.specsTable
      ? Object.entries(p.specsTable).map(([k, v]) =>
          '<tr><th>' + esc(k) + '</th><td>' + esc(v) + '</td></tr>'
        ).join('')
      : '<tr><th>Status</th><td>Authentic UAE Stock</td></tr>';

    // Build package contents list
    const boxList = (p.boxContents || [
      '1x Official Sealed ' + p.name,
      '1x Authentication Warranty Seal'
    ]).map((item) => '<li><svg class="icon"><use href="#i-box"/></svg> ' + esc(item) + '</li>').join('');

    // Build flavor sensory bars
    const fm = p.flavorMeter || { sweetness: 3, cooling: 3, throatHit: 4, intensity: 4 };
    const meterRow = (title, val, max = 5) =>
      '<div class="flavor-bar-row">' +
        '<span class="flavor-bar-label">' + esc(title) + '</span>' +
        '<div class="flavor-meter-track"><div class="flavor-meter-fill" style="width:' + (val / max * 100) + '%"></div></div>' +
        '<span class="flavor-bar-val">' + val + '/' + max + '</span>' +
      '</div>';

    // Build FAQs accordion
    const faqs = (p.faqs && p.faqs.length) ? p.faqs : [
      { q: 'Is this product original and legal in the UAE?', a: 'Yes. All products sold by Vape Club Dubai are 100% genuine, sealed in original packaging, and ESMA certified in accordance with UAE.S 5030 standards.' },
      { q: 'How fast is express delivery in Dubai?', a: 'Orders confirmed before 11:00 PM are dispatched immediately and delivered to your doorstep within 1 to 2 hours across Dubai and Sharjah.' },
      { q: 'What payment options are available?', a: 'We accept Cash on Delivery (COD) as well as Card Machine on Delivery (Visa, Mastercard, and Apple Pay).' }
    ];

    const faqAccordion = faqs.map((f, idx) =>
      '<div class="pd-faq-item' + (idx === 0 ? ' is-open' : '') + '">' +
        '<button type="button" class="pd-faq-q" aria-expanded="' + (idx === 0 ? 'true' : 'false') + '">' +
          '<span>' + esc(f.q) + '</span>' +
          '<svg class="icon pd-faq-icon"><use href="#i-chevron-down"/></svg>' +
        '</button>' +
        '<div class="pd-faq-a" style="' + (idx === 0 ? 'display:block;' : 'display:none;') + '">' +
          '<p>' + esc(f.a) + '</p>' +
        '</div>' +
      '</div>'
    ).join('');

    tabsBox.innerHTML =
      '<div class="pd-tabs-card">' +
        '<div class="pd-tabs-nav" role="tablist" aria-label="Product Information Tabs">' +
          '<button class="pd-tab-btn is-active" data-tab="desc" role="tab" aria-selected="true"><svg class="icon icon-sm"><use href="#i-info"/></svg> <span>Overview &amp; Description</span></button>' +
          '<button class="pd-tab-btn" data-tab="specs" role="tab" aria-selected="false"><svg class="icon icon-sm"><use href="#i-check"/></svg> <span>Technical Specifications</span></button>' +
          '<button class="pd-tab-btn" data-tab="box" role="tab" aria-selected="false"><svg class="icon icon-sm"><use href="#i-box"/></svg> <span>What’s In The Box</span></button>' +
          '<button class="pd-tab-btn" data-tab="flavor" role="tab" aria-selected="false"><svg class="icon icon-sm"><use href="#i-leaf"/></svg> <span>Flavor &amp; Sensory Notes</span></button>' +
          '<button class="pd-tab-btn" data-tab="faq" role="tab" aria-selected="false"><svg class="icon icon-sm"><use href="#i-shield"/></svg> <span>Dubai FAQs &amp; Delivery</span></button>' +
        '</div>' +

        '<div class="pd-tab-panels">' +
          /* Tab 1: Detailed SEO Description */
          '<div class="pd-tab-panel is-active" id="panel-desc" role="tabpanel">' +
            '<div class="pd-seo-body">' +
              '<h2 class="pd-seo-heading">Product Overview — ' + esc(p.name) + '</h2>' +
              '<div class="pd-text-lead">' +
                p.description.split('\n\n').map((para) => '<p>' + esc(para) + '</p>').join('') +
              '</div>' +
              '<div class="pd-highlights-grid">' +
                '<div class="pd-hl-card">' +
                  '<div class="pd-hl-icon"><svg class="icon"><use href="#i-shield"/></svg></div>' +
                  '<h4>100% Genuine UAE Stock</h4>' +
                  '<p>Original sealed packaging with batch-code authenticity verification.</p>' +
                '</div>' +
                '<div class="pd-hl-card">' +
                  '<div class="pd-hl-icon"><svg class="icon"><use href="#i-truck"/></svg></div>' +
                  '<h4>1-2 Hour Dubai Express</h4>' +
                  '<p>Rapid climate-controlled delivery directly to your home, office, or hotel.</p>' +
                '</div>' +
                '<div class="pd-hl-card">' +
                  '<div class="pd-hl-icon"><svg class="icon"><use href="#i-leaf"/></svg></div>' +
                  '<h4>ESMA Certified Standard</h4>' +
                  '<p>Fully tested and registered under UAE.S 5030 compliance laws.</p>' +
                '</div>' +
                '<div class="pd-hl-card">' +
                  '<div class="pd-hl-icon"><svg class="icon"><use href="#i-star"/></svg></div>' +
                  '<h4>Customer Guarantee</h4>' +
                  '<p>Direct 12-month local hardware replacement warranty handled in Dubai.</p>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* Tab 2: Specifications Table */
          '<div class="pd-tab-panel" id="panel-specs" role="tabpanel">' +
            '<div class="pd-specs-table-wrap">' +
              '<h3 style="margin-bottom:14px;font-size:18px">Complete Technical Specifications</h3>' +
              '<table class="pd-specs-table">' +
                '<tbody>' + specsRows + '</tbody>' +
              '</table>' +
            '</div>' +
          '</div>' +

          /* Tab 3: What is in the box */
          '<div class="pd-tab-panel" id="panel-box" role="tabpanel">' +
            '<div class="pd-box-wrap">' +
              '<h3 style="margin-bottom:14px;font-size:18px">Package Contents</h3>' +
              '<p style="color:var(--body);margin-bottom:16px;font-size:13.5px">Everything included in your official factory-sealed packaging:</p>' +
              '<ul class="pd-box-list">' + boxList + '</ul>' +
              '<div class="pd-unboxing-tip">' +
                '<svg class="icon"><use href="#i-shield"/></svg> <strong>Verification Tip:</strong> Scan the QR code or scratch off the hologram code on the box to confirm original factory authenticity.' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* Tab 4: Flavor Profile */
          '<div class="pd-tab-panel" id="panel-flavor" role="tabpanel">' +
            '<div class="pd-flavor-wrap">' +
              '<h3 style="margin-bottom:14px;font-size:18px">Taste &amp; Sensory Breakdown</h3>' +
              '<div class="flavor-meters-box">' +
                meterRow('Sweetness Level', fm.sweetness) +
                meterRow('Cooling / Menthol Frost', fm.cooling) +
                meterRow('Throat Hit Sensation', fm.throatHit) +
                meterRow('Flavor Richness & Aroma', fm.intensity) +
              '</div>' +
              '<div class="pd-ingredients-note">' +
                '<h4>Certified UAE Ingredients &amp; Safety</h4>' +
                '<p>Contains Pharmaceutical Grade USP Nicotine, Natural &amp; Artificial Food-Grade Flavorings, and Vegetable Glycerin (VG) &amp; Propylene Glycol (PG). Strict compliance with UAE ESMA standard UAE.S 5030.</p>' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* Tab 5: FAQs */
          '<div class="pd-tab-panel" id="panel-faq" role="tabpanel">' +
            '<div class="pd-faqs-wrap">' +
              '<h3 style="margin-bottom:14px;font-size:18px">Frequently Asked Questions — Dubai &amp; UAE</h3>' +
              '<div class="pd-faq-list">' + faqAccordion + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Tab button switching
    $$('.pd-tab-btn', tabsBox).forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        $$('.pd-tab-btn', tabsBox).forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        $$('.pd-tab-panel', tabsBox).forEach((panel) => {
          const isTarget = panel.id === 'panel-' + targetTab;
          panel.classList.toggle('is-active', isTarget);
        });
      });
    });

    // Accordion toggle
    $$('.pd-faq-q', tabsBox).forEach((qBtn) => {
      qBtn.addEventListener('click', () => {
        const item = qBtn.closest('.pd-faq-item');
        const ans = item.querySelector('.pd-faq-a');
        const isOpen = item.classList.toggle('is-open');
        qBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        ans.style.display = isOpen ? 'block' : 'none';
      });
    });
  }

  /* Lightbox & Zoom Controller */
  const lbModal = $('#pdLightbox');
  const lbImg = $('#lbImg');
  const lbTitle = $('#lbTitle');
  const lbStage = $('#lbStage');
  let zoomLevel = 1;

  function updateZoom() {
    if (lbImg) {
      lbImg.style.transform = 'scale(' + zoomLevel + ')';
    }
  }

  function openLightbox(vState) {
    if (!lbModal || !vState.photo) return;
    lbImg.src = vState.photo;
    lbImg.alt = p.name;
    if (lbTitle) lbTitle.textContent = p.name + (vState.label ? ' (' + vState.label + ')' : '');
    zoomLevel = 1;
    updateZoom();
    lbModal.classList.add('is-open');
    document.body.classList.add('no-scroll');
  }

  function closeLightbox() {
    if (!lbModal) return;
    lbModal.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    zoomLevel = 1;
    updateZoom();
  }

  function bindLightbox(vState) {
    const mediaBox = $('#pdMediaBox');
    if (mediaBox && vState.photo) {
      mediaBox.style.cursor = 'zoom-in';
      mediaBox.onclick = () => openLightbox(vState);
    }
    const btnZoom = $('#pdZoomTrigger');
    if (btnZoom) {
      btnZoom.onclick = (e) => {
        e.stopPropagation();
        openLightbox(vState);
      };
    }
  }

  $('#lbClose')?.addEventListener('click', closeLightbox);
  $('#lbZoomIn')?.addEventListener('click', () => { zoomLevel = Math.min(3.5, Math.round((zoomLevel + 0.5) * 10) / 10); updateZoom(); });
  $('#lbZoomOut')?.addEventListener('click', () => { zoomLevel = Math.max(1, Math.round((zoomLevel - 0.5) * 10) / 10); updateZoom(); });
  $('#lbReset')?.addEventListener('click', () => { zoomLevel = 1; updateZoom(); });
  
  if (lbStage) {
    lbStage.addEventListener('click', (e) => {
      if (e.target === lbImg) {
        zoomLevel = zoomLevel > 1 ? 1 : 2;
        updateZoom();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lbModal?.classList.contains('is-open')) {
      closeLightbox();
    }
  });

  /* Related Products Grid — same category first, then fill, max 4 */
  const rel = PRODUCTS.filter((x) => x.id !== p.id && x.cat === p.cat)
    .concat(PRODUCTS.filter((x) => x.id !== p.id && x.cat !== p.cat))
    .slice(0, 4);
  const relGridEl = $('#relGrid');
  if (relGridEl) {
    relGridEl.innerHTML = rel.map((r) => {
      const rsvg = '<svg class="prod-art ' + r.theme + '" aria-hidden="true"><use href="' + ART[r.art] + '"/></svg>';
      const rph = r.photo ? '<img class="rel-photo" src="' + r.photo + '" alt="' + esc(r.name) + '" onerror="this.remove()">' : '';
      return (
        '<article class="card rel-card" data-id="' + r.id + '" data-qv="' + r.id + '" role="button" tabindex="0" title="Click to view details">' +
          '<div class="card-media ' + mediaBg(r) + ' ' + r.theme + '">' +
            badgeHtml(r) +
            (r.flag ? '<span class="origin-flag">' + r.flag + '</span>' : '') +
            rsvg + rph +
          '</div>' +
          '<div class="card-body">' +
            '<p class="card-cat">' + esc(CAT_LABELS[r.cat] || r.cat) + '</p>' +
            '<h3 class="card-name">' + esc(r.name) + '</h3>' +
            '<div class="card-foot">' +
              '<div class="card-price-row">' +
                '<span class="card-price">' + r.price + '<small> AED</small></span>' +
                (r.old ? '<span class="card-old">' + r.old + ' AED</span>' : '') +
              '</div>' +
              '<button class="add-btn" data-add="' + r.id + '" aria-label="Order Now">' +
                '<svg class="icon"><use href="#i-wa"/></svg> Order Now' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  // Initial renders
  renderHero();
  renderTabs();
})();
