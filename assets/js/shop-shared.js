/* ============================================================
   VAPE CLUB DUBAI — SHARED SHOP CORE
   Cart Drawer, Universal Quick View Modal, Checkout & State
   ============================================================ */
'use strict';

/* ---------- Cart State & Persistence ---------- */
function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_CART) || '{}');
    return typeof raw === 'object' && raw !== null ? raw : {};
  } catch (e) { return {}; }
}
let cart = loadCart();

const saveCart = () => localStorage.setItem(LS_CART, JSON.stringify(cart));
const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
const cartSubtotal = () => Object.entries(cart).reduce((sum, [id, q]) => {
  const it = getItemVariant(id);
  return it ? sum + it.price * q : sum;
}, 0);

function singleWaText(p, qty = 1) {
  const lines = [];
  lines.push('*ORDER ENQUIRY — VAPE CLUB DUBAI*');
  lines.push('Product: ' + p.name);
  if (p.flavor) lines.push('Flavor: ' + p.flavor);
  lines.push('Quantity: ' + qty);
  lines.push('Price: ' + (p.price * qty) + ' AED');
  lines.push('Location: Dubai');
  lines.push('Is this available for 1-2h express delivery?');
  return lines.join('\n');
}

function cartWaText() {
  const entries = Object.entries(cart).filter(([id]) => getItemVariant(id));
  const sub = cartSubtotal();
  const free = sub >= FREE_SHIP_THRESHOLD || sub === 0;
  const total = free ? sub : sub + DELIVERY_FEE;

  const lines = [];
  lines.push('*NEW ORDER — VAPE CLUB DUBAI*');
  lines.push('---------------------------');
  entries.forEach(([id, q]) => {
    const it = getItemVariant(id);
    lines.push('• ' + it.fullName + ' × ' + q + ' — ' + (it.price * q) + ' AED');
  });
  lines.push('---------------------------');
  lines.push('Subtotal: ' + sub + ' AED');
  lines.push('Delivery: ' + (free ? 'FREE (Express 1-2h)' : DELIVERY_FEE + ' AED'));
  lines.push('*Total: ' + total + ' AED*');
  lines.push('Delivery Location: Dubai');
  lines.push('Please confirm my order!');
  return lines.join('\n');
}

function syncBadges() {
  const n = cartCount();
  $$('.cart-count, .cart-count-text, #pdCartCount').forEach((el) => {
    el.textContent = n;
    if (el.id === 'pdCartCount') {
      el.classList.toggle('is-visible', n > 0);
    }
  });
}

function toast(msg) {
  let stack = $('#toastStack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.id = 'toastStack';
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = '<svg class="icon"><use href="#i-check"/></svg>' + esc(msg);
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 320);
  }, 2400);
}

/* ---------- Layer & Modal Controller ---------- */
const openLayers = [];

function lockScroll() {
  document.body.classList.toggle('no-scroll', openLayers.length > 0);
}

function getBackdrop() {
  let b = $('#backdrop');
  if (!b) {
    b = document.createElement('div');
    b.className = 'backdrop';
    b.id = 'backdrop';
    document.body.appendChild(b);
  }
  return b;
}

function openLayer(el, kind) {
  if (!el) return;
  const b = getBackdrop();
  el.dataset.kind = kind;
  if (!openLayers.includes(el)) openLayers.push(el);
  if (kind === 'drawer') {
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    b.classList.add('is-visible');
  } else {
    el.classList.add('is-open');
  }
  lockScroll();
}

function closeLayer(el) {
  if (!el) return;
  const b = getBackdrop();
  const i = openLayers.indexOf(el);
  if (i > -1) openLayers.splice(i, 1);
  el.classList.remove('is-open');
  if (el.dataset.kind === 'drawer') el.setAttribute('aria-hidden', 'true');
  if (!openLayers.some((l) => l.dataset.kind === 'drawer')) b.classList.remove('is-visible');
  lockScroll();
}

const openCart = () => {
  const d = $('#cartDrawer');
  if (d) { renderCart(); openLayer(d, 'drawer'); }
};
const closeCart = () => {
  const d = $('#cartDrawer');
  if (d) closeLayer(d);
};
const openMenu = () => {
  const d = $('#menuDrawer');
  if (d) openLayer(d, 'drawer');
};
const closeMenu = () => {
  const d = $('#menuDrawer');
  if (d) closeLayer(d);
};
const closeModal = (m) => closeLayer(m);

function universalOpenSearch() {
  if (typeof window.openSearch === 'function') {
    window.openSearch();
    return;
  }
  const modal = $('#searchModal');
  if (modal) {
    openLayer(modal, 'modal');
    const input = $('#searchInput');
    if (input) setTimeout(() => input.focus(), 250);
  }
}

/* ---------- Cart Drawer Rendering & Animation ---------- */
function renderCart(justId, celebrate) {
  const box = $('#cartItems');
  if (!box) return;
  const entries = Object.entries(cart).filter(([id]) => getItemVariant(id));

  if (!entries.length) {
    box.innerHTML =
      '<div class="cart-empty">' +
        '<svg class="icon"><use href="#i-wa"/></svg>' +
        '<b>Your WhatsApp cart is empty</b>' +
        'Add any product — dispatches across Dubai in 1-2 hours.' +
      '</div>';
  } else {
    box.innerHTML = entries.map(([id, q]) => {
      const it = getItemVariant(id);
      const p = byId(it.baseId);
      const thumb = it.photo
        ? '<img src="' + it.photo + '" alt="' + esc(it.name) + '" onerror="this.remove()">'
        : '<svg class="prod-art ' + it.theme + '"><use href="' + ART[it.art] + '"/></svg>';
      return (
        '<div class="cart-item" data-id="' + it.key + '">' +
          '<div class="cart-thumb ' + mediaBg(p) + ' ' + it.theme + '">' + thumb + '</div>' +
          '<div class="cart-item-info">' +
            '<a class="cart-item-title" href="product.php?id=' + it.baseId + '">' + esc(it.name) + '</a>' +
            (it.variantLabel ? '<div class="cart-item-variant"><span class="cart-v-badge">' + esc(it.variantLabel) + '</span></div>' : '') +
            '<div class="cart-item-price">' + it.price + ' AED <small>each</small></div>' +
            '<div class="cart-item-ctrl">' +
              '<div class="cart-qty">' +
                '<button class="qty-btn" data-dec="' + it.key + '" aria-label="Decrease"><svg class="icon"><use href="#i-minus"/></svg></button>' +
                '<span class="qty-val">' + q + '</span>' +
                '<button class="qty-btn" data-inc="' + it.key + '" aria-label="Increase"><svg class="icon"><use href="#i-plus"/></svg></button>' +
              '</div>' +
              '<span class="cart-line-total">' + (it.price * q) + ' AED</span>' +
            '</div>' +
          '</div>' +
          '<button class="cart-item-rem" data-remove="' + it.key + '" aria-label="Remove item"><svg class="icon"><use href="#i-trash"/></svg></button>' +
        '</div>'
      );
    }).join('');
  }

  const sub = cartSubtotal();
  const free = sub >= FREE_SHIP_THRESHOLD || sub === 0;
  const total = free ? sub : sub + DELIVERY_FEE;

  const subEl = $('#cartSubtotal');
  if (subEl) subEl.textContent = fmt(sub);
  const delEl = $('#cartDelivery');
  if (delEl) delEl.innerHTML = free ? '<span class="free">FREE</span>' : DELIVERY_FEE + ' AED';
  const totEl = $('#cartTotal');
  if (totEl) totEl.textContent = fmt(total);

  const pct = Math.min(100, Math.round((sub / FREE_SHIP_THRESHOLD) * 100));
  const progEl = $('#progressFill');
  if (progEl) progEl.style.width = pct + '%';
  const msgEl = $('#shipMsg');
  if (msgEl) {
    msgEl.innerHTML = sub >= FREE_SHIP_THRESHOLD
      ? '<span class="done">FREE delivery unlocked all UAE — nice!</span>'
      : 'Add <b>' + (FREE_SHIP_THRESHOLD - sub) + ' AED</b> more for <b>FREE delivery all UAE</b>';
  }

  const btnCheckout = $('#btnOpenCheckout');
  if (btnCheckout) {
    btnCheckout.disabled = !entries.length;
    btnCheckout.style.opacity = entries.length ? '1' : '.45';
    btnCheckout.style.pointerEvents = entries.length ? 'auto' : 'none';
  }

  syncBadges();

  if (justId) {
    const row = box.querySelector('.cart-item[data-id="' + justId + '"]');
    if (row) {
      row.classList.add('just-added');
      try { row.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (err) {}
    }
  }
  if (celebrate) {
    const sp = document.querySelector('.ship-progress');
    if (sp) { sp.classList.add('unlocked'); setTimeout(() => sp.classList.remove('unlocked'), 2600); }
  }
}

function addToCart(id, qty = 1, btn) {
  const it = getItemVariant(id) || byId(id);
  if (!it) return;
  const prevSub = cartSubtotal();
  /* 1) cart opens first with its smooth slide-in animation */
  openCart();
  setTimeout(() => {
    /* 2) item lands with glow highlight */
    cart[id] = (cart[id] || 0) + qty;
    const crossed = prevSub < FREE_SHIP_THRESHOLD && cartSubtotal() >= FREE_SHIP_THRESHOLD;
    saveCart();
    renderCart(id, crossed);
    toast((it.fullName || it.name).split('—')[0].trim() + ' added to WhatsApp cart');
    if (crossed) toast('🎉 FREE express delivery unlocked!');
    if (btn && (btn.classList.contains('add-btn') || btn.classList.contains('vip-add-btn'))) {
      btn.classList.add('added');
      setTimeout(() => btn.classList.remove('added'), 900);
    }
  }, 260);
}

/* ---------- Universal Quick View Modal (Fixed Top/Bottom + In-Modal Zoom) ---------- */
function stockHtml(p) {
  if (p.stock === 'low') return '<span class="card-stock stock-low"><span class="dot"></span>Low Stock</span>';
  if (p.stock === 'out') return '<span class="card-stock stock-out"><span class="dot"></span>Out of Stock</span>';
  return '<span class="card-stock"><span class="dot"></span>In Stock</span>';
}

/* ---------- Server-side order log (admin Orders tab) ----------
   Fire-and-forget: never blocks WhatsApp handoff or the success view. */
function logOrderToServer(payload) {
  try {
    fetch('/api/order.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  } catch (e) {}
}

function newOrderId() {
  return ORDER_PREFIX + '-' + Math.floor(10000 + Math.random() * 90000);
}

function openQuickView(id) {
  const p = byId(id);
  if (!p) return;
  let qty = 1;
  const views = [];
  if (p.photo) views.push({ img: p.photo });
  views.push({ art: ART[p.art], theme: p.theme });

  const modal = $('#qvModal');
  if (!modal) return;
  const panel = modal.querySelector('.qv-panel');
  if (panel) {
    panel.classList.remove('is-photo-zoom');
  }

  const specsHtml = (p.specs || []).slice(0, 3).map((s) => '<li><svg class="icon icon-sm"><use href="#i-check"/></svg>' + esc(s) + '</li>').join('');

  $('#qvContent').innerHTML =
    '<div class="qv-head">' +
      '<div class="qv-head-left">' +
        '<span class="qv-cat">' + esc(CAT_LABELS[p.cat] || 'Product') + '</span>' +
        (p.flag ? '<span class="flag">' + p.flag + '</span>' : '') +
      '</div>' +
      '<button class="modal-close" data-close-modal aria-label="Close quick view"><svg class="icon"><use href="#i-close"/></svg></button>' +
    '</div>' +
    '<div class="qv-scroll-body" id="qvScrollBody">' +
      '<div class="qv-stage ' + mediaBg(p) + ' ' + p.theme + '" id="qvStage" title="Tap to expand photo & zoom">' +
        badgeHtml(p) +
        '<button type="button" class="qv-exit-zoom-btn" id="qvExitZoom"><svg class="icon icon-sm"><use href="#i-arrow-right" style="transform:rotate(180deg)"/></svg> Back to details</button>' +
        '<div class="qv-zoom-ctrls"><button type="button" id="qvZoom1x" title="Normal Zoom">1x</button><button type="button" id="qvZoom2x" title="Deep Zoom">2x</button></div>' +
        '<span class="qv-zoom-badge" id="qvZoomBadge"><svg class="icon icon-sm"><use href="#i-search"/></svg> <span>Tap to zoom</span></span>' +
      '</div>' +
      '<div class="qv-thumbs" id="qvThumbs"></div>' +
      '<div class="qv-details-wrap">' +
        '<div class="qv-body2">' +
          '<h3 class="qv-title"><a href="product.php?id=' + p.id + '" title="View full details for ' + esc(p.name) + '">' + esc(p.name) + '</a></h3>' +
          '<p class="qv-flavor"><svg class="icon icon-sm"><use href="#i-leaf"/></svg> ' + esc(p.flavor) + '</p>' +
          '<div class="qv-row2">' +
            '<span style="display:flex;align-items:baseline;gap:8px"><span class="qv-price">' + p.price + '<small> AED</small></span>' + (p.old ? '<span class="qv-old">' + p.old + ' AED</span>' : '') + '</span>' +
            stockHtml(p) +
          '</div>' +
          '<ul class="qv-specs-compact">' + specsHtml + '</ul>' +
          '<a class="btn-goto-product btn-goto-highlight" href="product.php?id=' + p.id + '">' +
            '<div class="btn-goto-main-wrap">' +
              '<span class="btn-goto-chip"><span class="pulse-emerald"></span> Full Product Page</span>' +
              '<strong class="btn-goto-headline">View Full Details &amp; Select Variants</strong>' +
              '<span class="btn-goto-subtext">Choose flavors, nicotine, carton discounts &amp; 360° specs</span>' +
            '</div>' +
            '<div class="btn-goto-arrow-circle">' +
              '<svg class="icon"><use href="#i-arrow-right"/></svg>' +
            '</div>' +
          '</a>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="qv-foot">' +
      '<div class="qv-qty">' +
        '<button class="qty-btn" id="qvDec" aria-label="Decrease quantity"><svg class="icon"><use href="#i-minus"/></svg></button>' +
        '<span class="qty-val" id="qvQty">1</span>' +
        '<button class="qty-btn" id="qvInc" aria-label="Increase quantity"><svg class="icon"><use href="#i-plus"/></svg></button>' +
      '</div>' +
      '<button class="add-btn-wa" id="qvAdd"><svg class="icon"><use href="#i-wa"/></svg> Order Now · <span id="qvTotalAed">' + p.price + ' AED</span></button>' +
    '</div>';

  openLayer(modal, 'modal');

  const stage = $('#qvStage');
  const exitZoomBtn = $('#qvExitZoom');

  function setView(i) {
    const v = views[i];
    const existingImg = stage.querySelector('img');
    const existingArt = stage.querySelector('svg.prod-art');
    if (existingImg) existingImg.remove();
    if (existingArt) existingArt.remove();

    if (v.img) {
      const img = document.createElement('img');
      img.src = v.img;
      img.alt = p.name;
      img.onerror = () => img.remove();
      stage.appendChild(img);
      const art = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      art.setAttribute('class', 'prod-art ' + p.theme);
      art.innerHTML = '<use href="' + ART[p.art] + '"/>';
      stage.appendChild(art);
    } else {
      const art = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      art.setAttribute('class', 'prod-art ' + v.theme);
      art.innerHTML = '<use href="' + v.art + '"/>';
      stage.appendChild(art);
    }
    $$('#qvThumbs .qv-thumb').forEach((t, ti) => t.classList.toggle('is-active', ti === i));
  }

  function enterZoom() {
    if (!panel) return;
    panel.classList.add('is-photo-zoom');
    stage.classList.remove('is-zoomed-2x');
  }

  function exitZoom() {
    if (!panel) return;
    panel.classList.remove('is-photo-zoom');
    stage.classList.remove('is-zoomed-2x');
    const img = stage.querySelector('img');
    if (img) img.style.transformOrigin = 'center center';
  }

  stage.addEventListener('click', (e) => {
    if (e.target.closest('#qvExitZoom')) {
      e.stopPropagation();
      exitZoom();
      return;
    }
    if (e.target.closest('#qvZoom1x')) {
      e.stopPropagation();
      stage.classList.remove('is-zoomed-2x');
      return;
    }
    if (e.target.closest('#qvZoom2x')) {
      e.stopPropagation();
      stage.classList.add('is-zoomed-2x');
      return;
    }
    if (!panel.classList.contains('is-photo-zoom')) {
      enterZoom();
    } else {
      stage.classList.toggle('is-zoomed-2x');
    }
  });

  if (exitZoomBtn) {
    exitZoomBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exitZoom();
    });
  }

  stage.addEventListener('mousemove', (e) => {
    if (!panel || !panel.classList.contains('is-photo-zoom')) return;
    const rect = stage.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const img = stage.querySelector('img');
    if (img) img.style.transformOrigin = x + '% ' + y + '%';
  });

  stage.addEventListener('mouseleave', () => {
    const img = stage.querySelector('img');
    if (img) img.style.transformOrigin = 'center center';
  });

  $('#qvThumbs').innerHTML = views.length > 1
    ? views.map((v, i) => '<button class="qv-thumb' + (v.img ? '' : ' ' + p.theme) + '" data-t="' + i + '" aria-label="View ' + (i + 1) + '">' + (v.img ? '<img src="' + v.img + '" alt="">' : '<svg class="prod-art"><use href="' + v.art + '"/></svg>') + '</button>').join('')
    : '';
  $$('#qvThumbs .qv-thumb').forEach((t) => t.addEventListener('click', (e) => {
    e.stopPropagation();
    setView(parseInt(t.dataset.t, 10));
  }));
  setView(0);

  const qtyEl = $('#qvQty');
  const totAedEl = $('#qvTotalAed');
  const refresh = () => {
    if (qtyEl) qtyEl.textContent = qty;
    if (totAedEl) totAedEl.textContent = (p.price * qty) + ' AED';
  };
  $('#qvInc')?.addEventListener('click', (e) => { e.stopPropagation(); qty = Math.min(QTY_CAP, qty + 1); refresh(); });
  $('#qvDec')?.addEventListener('click', (e) => { e.stopPropagation(); qty = Math.max(1, qty - 1); refresh(); });
  $('#qvAdd')?.addEventListener('click', (e) => {
    e.stopPropagation();
    addToCart(p.id, qty);
    closeModal(modal);
  });
  refresh();
}

/* ---------- Checkout System & Success Confirmation ---------- */
function openCheckout() {
  const checkoutModal = $('#checkoutModal');
  if (!checkoutModal) return;
  const entries = Object.entries(cart).filter(([id]) => getItemVariant(id));
  if (!entries.length) {
    toast('Your cart is empty — add items first');
    return;
  }
  closeCart();

  $('#checkoutFormView').style.display = 'block';
  $('#checkoutSuccessView').style.display = 'none';

  const sub = cartSubtotal();
  const free = sub >= FREE_SHIP_THRESHOLD || sub === 0;
  const delivery = free ? 0 : DELIVERY_FEE;
  const total = sub + delivery;

  const countEl = $('#coItemCount');
  if (countEl) countEl.textContent = Object.values(cart).reduce((a, b) => a + b, 0);

  const listEl = $('#coItemsList');
  if (listEl) {
    listEl.innerHTML = entries.map(([id, q]) => {
      const it = getItemVariant(id);
      const thumb = it.photo
        ? '<img src="' + it.photo + '" alt="" onerror="this.remove()">'
        : '<svg class="prod-art ' + it.theme + '"><use href="' + ART[it.art] + '"/></svg>';
      return (
        '<div class="cs-item">' +
          '<div class="cs-item-info">' +
            '<div class="cs-item-thumb">' + thumb + '</div>' +
            '<div style="min-width:0">' +
              '<span class="cs-item-title">' + esc(it.name) + ' <small>× ' + q + '</small></span>' +
              (it.variantLabel ? '<div style="font-size:11px;color:var(--emerald);font-weight:600">' + esc(it.variantLabel) + '</div>' : '') +
            '</div>' +
          '</div>' +
          '<b>' + (it.price * q) + ' AED</b>' +
        '</div>'
      );
    }).join('');
  }

  const subEl = $('#coSubtotal');
  if (subEl) subEl.textContent = fmt(sub);
  const delEl = $('#coDelivery');
  if (delEl) delEl.innerHTML = free ? '<span style="color:var(--emerald);font-weight:700">FREE (Promo)</span>' : DELIVERY_FEE + ' AED';
  const totEl = $('#coTotal');
  if (totEl) totEl.textContent = fmt(total);
  const btnTotEl = $('#btnOrderTotal');
  if (btnTotEl) btnTotEl.textContent = fmt(total);
  const waTotalEl = $('#btnWaOrderTotal');
  if (waTotalEl) waTotalEl.textContent = fmt(total);

  const waDirectBtn = $('#btnWaInstantCheckout');
  if (waDirectBtn) waDirectBtn.href = waLink(cartWaText());
  $$('.co-wa-total-chip').forEach((el) => { el.textContent = fmt(total); });

  const tabOnline = $('#tabMethodOnline');
  const tabWa = $('#tabMethodWa');
  const formEl = $('#checkoutForm');
  const waView = $('#checkoutWaView');

  function updateWaOrderLink() {
    const custName = $('#waCustName')?.value.trim() || '';
    const custEmirate = $('#waEmirate')?.value || 'Dubai';
    const lines = [];
    lines.push('*EXPRESS WHATSAPP ORDER - VAPE CLUB DUBAI*');
    lines.push('---------------------------');
    if (custName) lines.push('Customer: ' + custName);
    lines.push('Delivery Location: ' + custEmirate + ' (Express 1-2h)');
    lines.push('---------------------------');
    lines.push('Selected Items:');
    entries.forEach(([id, q]) => {
      const it = getItemVariant(id);
      lines.push('• ' + it.fullName + ' (' + q + 'x) - ' + (it.price * q) + ' AED');
    });
    lines.push('---------------------------');
    lines.push('Subtotal: ' + sub + ' AED');
    lines.push('Delivery: ' + (free ? 'FREE' : delivery + ' AED'));
    lines.push('*Total to Pay: ' + total + ' AED*');
    lines.push('Payment: Cash or Card on Delivery');
    lines.push('---------------------------');
    lines.push('Please confirm my express order!');
    const btn = $('#btnSubmitWaOrder');
    if (btn) btn.href = waLink(lines.join('\n'));
    if (waDirectBtn) waDirectBtn.href = waLink(lines.join('\n'));
  }

  function setCheckoutMethod(m) {
    const isOnline = m === 'online';
    tabOnline?.classList.toggle('is-active', isOnline);
    tabOnline?.setAttribute('aria-selected', isOnline);
    tabWa?.classList.toggle('is-active', !isOnline);
    tabWa?.setAttribute('aria-selected', !isOnline);
    if (formEl) formEl.style.display = isOnline ? 'grid' : 'none';
    if (waView) waView.style.display = isOnline ? 'none' : 'block';
    if (!isOnline) updateWaOrderLink();
  }

  if (tabOnline) tabOnline.onclick = () => setCheckoutMethod('online');
  if (tabWa) tabWa.onclick = () => setCheckoutMethod('whatsapp');
  setCheckoutMethod('whatsapp');

  function showOrderSuccess(orderId, customerName, location, itemsSummary, totalAed, waChatUrl) {
    const sId = $('#successOrderId');
    if (sId) sId.textContent = '#' + orderId;
    const sDet = $('#successDetails');
    if (sDet) {
      sDet.innerHTML =
        '<div><b>Customer:</b> ' + esc(customerName) + '</div>' +
        '<div><b>Delivery Location:</b> ' + esc(location) + '</div>' +
        '<div><b>Total to Pay:</b> <strong style="color:var(--emerald)">' + fmt(totalAed) + '</strong></div>' +
        '<div><b>Estimated Delivery:</b> 1–2 Hours Express (Dubai & Sharjah)</div>' +
        '<div><b>Items:</b> ' + itemsSummary + '</div>';
    }

    const trk = $('#successWaTrack');
    if (trk && waChatUrl) {
      trk.href = waChatUrl;
    }
    const fView = $('#checkoutFormView');
    if (fView) fView.style.display = 'none';
    const sView = $('#checkoutSuccessView');
    if (sView) sView.style.display = 'block';

    cart = {};
    saveCart();
    renderCart();
  }

  $('#waCustName')?.addEventListener('input', updateWaOrderLink);
  $('#waEmirate')?.addEventListener('change', updateWaOrderLink);

  const waOrderItems = () => entries.map(([id, q]) => {
    const it = getItemVariant(id);
    return { id, name: it.fullName, price: it.price, qty: q };
  });

  const btnSubmitWa = $('#btnSubmitWaOrder');
  if (btnSubmitWa) {
    btnSubmitWa.onclick = (e) => {
      e.preventDefault();
      const custName = $('#waCustName')?.value.trim() || 'Valued Customer';
      const custEmirate = $('#waEmirate')?.value || 'Dubai';
      const orderId = newOrderId();
      const itemNames = entries.map(([id, q]) => (getItemVariant(id)?.fullName || id) + ' (' + q + 'x)').join(', ');
      const link = btnSubmitWa.href || waLink(cartWaText());

      logOrderToServer({ id: orderId, source: 'whatsapp', name: custName, emirate: custEmirate, subtotal: sub, delivery, total, items: waOrderItems() });

      if (link && link !== '#') {
        window.open(link, '_blank', 'noopener');
      }
      showOrderSuccess(orderId, custName, custEmirate + ' (Express 1-2h)', esc(itemNames), total, link);
      toast('🎉 Order confirmed! WhatsApp chat opened.');
    };
  }

  if (waDirectBtn) {
    waDirectBtn.onclick = (e) => {
      e.preventDefault();
      const orderId = newOrderId();
      const itemNames = entries.map(([id, q]) => (getItemVariant(id)?.fullName || id) + ' (' + q + 'x)').join(', ');
      const link = waDirectBtn.href || waLink(cartWaText());

      logOrderToServer({ id: orderId, source: 'express', name: 'Express WhatsApp Customer', emirate: 'Dubai', subtotal: sub, delivery, total, items: waOrderItems() });

      if (link && link !== '#') {
        window.open(link, '_blank', 'noopener');
      }
      showOrderSuccess(orderId, 'Express WhatsApp Customer', 'Dubai Express (1-2h)', esc(itemNames), total, link);
      toast('🎉 Order confirmed! WhatsApp chat opened.');
    };
  }

  if (formEl) {
    formEl.onsubmit = (e) => {
      e.preventDefault();
      const currEntries = Object.entries(cart).filter(([id]) => getItemVariant(id));
      if (!currEntries.length) {
        toast('Your cart is empty');
        closeCheckout();
        return;
      }

      const name = $('#coName').value.trim();
      const phone = $('#coPhone').value.trim();
      const emirate = $('#coEmirate').value;
      const area = $('#coArea').value.trim();
      const address = $('#coAddress').value.trim();
      const notes = $('#coNotes').value.trim();
      const pm = formEl.querySelector('input[name="paymentMethod"]:checked')?.value || 'Cash on Delivery';
      const ageConfirmed = $('#coAgeCheck').checked;

      if (!name || !phone || !area || !address) {
        toast('Please fill all required delivery details');
        return;
      }
      if (!ageConfirmed) {
        toast('Please confirm you are 18+');
        return;
      }

      const orderId = newOrderId();
      const orderData = {
        id: orderId,
        date: new Date().toISOString(),
        name,
        phone,
        emirate,
        area,
        address,
        notes,
        paymentMethod: pm,
        subtotal: sub,
        delivery,
        total,
        items: currEntries.map(([id, q]) => {
          const it = getItemVariant(id);
          return { id, name: it.fullName, price: it.price, qty: q };
        })
      };

      /* Log server-side (admin panel order history) + local fallback */
      logOrderToServer(Object.assign({ source: 'form' }, orderData));
      try {
        const orders = JSON.parse(localStorage.getItem('vcd_orders') || '[]');
        orders.unshift(orderData);
        localStorage.setItem('vcd_orders', JSON.stringify(orders.slice(0, 20)));
      } catch (err) {}

      const waTrackText =
        '*NEW ORDER CONFIRMED - #' + orderId + '*\n' +
        '---------------------------\n' +
        'Customer: ' + name + '\n' +
        'Phone: ' + phone + '\n' +
        'Delivery Address: ' + address + ', ' + area + ' (' + emirate + ')\n' +
        '---------------------------\n' +
        'Ordered Items:\n' + orderData.items.map((it) => '• ' + it.name + ' (' + it.qty + 'x) - ' + (it.price * it.qty) + ' AED').join('\n') + '\n' +
        '---------------------------\n' +
        '*Total to Pay: ' + total + ' AED*\n' +
        'Payment Mode: ' + pm + '\n' +
        (notes ? 'Notes: ' + notes + '\n' : '') +
        '---------------------------\n' +
        'Please send dispatch confirmation & live rider tracking!';

      const itemNames = currEntries.map(([id, q]) => (getItemVariant(id)?.fullName || id) + ' (' + q + 'x)').join(', ');
      showOrderSuccess(orderId, name + ' (' + phone + ')', address + ', ' + area + ', ' + emirate + ' [' + pm + ']', esc(itemNames), total, waLink(waTrackText));
      toast('🎉 Order placed successfully!');
    };
  }

  openLayer(checkoutModal, 'modal');
}

function closeCheckout() {
  const m = $('#checkoutModal');
  if (m) closeModal(m);
}

/* ---------- Global Click & Interaction Delegation ---------- */
document.addEventListener('click', (e) => {
  // 1. Direct Add To Cart button
  const add = e.target.closest('[data-add],[data-add-to-cart]');
  if (add) {
    e.stopPropagation();
    addToCart(add.dataset.add || add.dataset.addToCart, 1, add);
    return;
  }

  // 2. Direct WhatsApp enquiry
  const wa = e.target.closest('[data-wa]');
  if (wa) {
    const p = byId(wa.dataset.wa);
    if (p) wa.href = waLink(singleWaText(p, 1));
    return;
  }

  // 3. Cart item qty increment/decrement/remove
  const inc = e.target.closest('[data-inc]');
  if (inc) {
    const id = inc.dataset.inc;
    if (cart[id]) { cart[id]++; saveCart(); renderCart(); }
    return;
  }
  const dec = e.target.closest('[data-dec]');
  if (dec) {
    const id = dec.dataset.dec;
    if (cart[id]) { cart[id]--; if (cart[id] <= 0) delete cart[id]; saveCart(); renderCart(); }
    return;
  }
  const rem = e.target.closest('[data-remove]');
  if (rem) {
    delete cart[rem.dataset.remove];
    saveCart();
    renderCart();
    toast('Item removed');
    return;
  }

  // 4. Product Card click -> Universal Quick View Popup
  const qv = e.target.closest('[data-qv]');
  if (qv) {
    openQuickView(qv.dataset.qv);
    return;
  }

  // 5. Drawer & Modal triggers
  if (e.target.closest('#menuBtn, .js-open-menu')) {
    e.preventDefault();
    openMenu();
    return;
  }
  if (e.target.closest('#menuClose, .js-close-menu')) {
    e.preventDefault();
    closeMenu();
    return;
  }
  if (e.target.closest('.js-open-search')) {
    e.preventDefault();
    universalOpenSearch();
    return;
  }
  if (e.target.closest('.js-open-cart') || e.target.closest('#pdCartCount, .bnav-cart-trigger')) {
    e.preventDefault();
    openCart();
    return;
  }
  if (e.target.closest('#btnOpenCheckout')) {
    openCheckout();
    return;
  }
  if (e.target.closest('#coEditCart')) {
    closeCheckout();
    openCart();
    return;
  }
  if (e.target.closest('[data-close-modal]')) {
    closeModal(e.target.closest('.modal'));
    return;
  }
  if (e.target.closest('#cartClose')) {
    closeCart();
    return;
  }
  if (e.target.closest('#clearCart')) {
    cart = {};
    saveCart();
    renderCart();
    toast('Cart cleared');
    return;
  }

  // Auto-close menu when tapping internal links (except theme toggle)
  const mLink = e.target.closest('#menuDrawer a');
  if (mLink) {
    closeMenu();
  }
});

// Close backdrop on click
document.addEventListener('click', (e) => {
  const b = $('#backdrop');
  if (b && e.target === b) {
    const cartDrawer = $('#cartDrawer');
    if (cartDrawer && openLayers.includes(cartDrawer)) closeCart();
    const menuDrawer = $('#menuDrawer');
    if (menuDrawer && openLayers.includes(menuDrawer)) closeLayer(menuDrawer);
  }
});

// Close modal when clicking dark overlay
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal')) {
    if (e.target.id === 'ageModal' && localStorage.getItem(LS_AGE) !== 'true') return;
    closeModal(e.target);
  }
});

// Escape key listener
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openLayers.length) {
    const top = openLayers[openLayers.length - 1];
    if (top.id === 'ageModal' && localStorage.getItem(LS_AGE) !== 'true') return;
    closeLayer(top);
  }
});

// Payment method radio cards
document.addEventListener('change', (e) => {
  if (e.target.name === 'paymentMethod') {
    const cash = $('#pmCashLabel');
    const card = $('#pmCardLabel');
    if (cash) cash.classList.toggle('is-active', e.target.value === 'Cash on Delivery');
    if (card) card.classList.toggle('is-active', e.target.value === 'Card on Delivery');
  }
});

/* Keyboard access for product cards (Enter/Space opens Quick View) */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest && e.target.closest('[data-qv]');
  if (!card) return;
  if (/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(e.target.tagName)) return;
  e.preventDefault();
  openQuickView(card.dataset.qv);
});

/* ============================================================
   UNIVERSAL THEME SWITCHER (Side Drawer & Persistence)
   ============================================================ */
function initThemeSwitcher() {
  const rootEl = document.documentElement;
  const menuToggle = $('#menuThemeToggle');
  const menuText = $('#menuThemeText');

  let savedTheme = localStorage.getItem('vcd_theme');
  let currentTheme = (savedTheme === 'light') ? 'light' : 'dark';

  function applyTheme(theme) {
    currentTheme = theme;
    rootEl.dataset.theme = theme;
    rootEl.dataset.accent = 'emerald';
    localStorage.setItem('vcd_theme', theme);
    localStorage.setItem('vcd_accent', 'emerald');

    const isDark = theme === 'dark';
    if (menuToggle) {
      menuToggle.classList.toggle('is-active', isDark);
      menuToggle.setAttribute('aria-checked', isDark ? 'true' : 'false');
    }
    if (menuText) {
      menuText.textContent = isDark ? 'Dark Mode' : 'Light Mode';
    }

    // Sync header desktop theme button icon
    document.querySelectorAll('.js-theme-toggle, #headerThemeToggle').forEach(btn => {
      const moon = btn.querySelector('.icon-moon');
      const sun = btn.querySelector('.icon-sun');
      if (moon && sun) {
        sun.style.display = isDark ? 'inline-block' : 'none';
        moon.style.display = isDark ? 'none' : 'inline-block';
      }
      btn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
      btn.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    });
  }

  function toggle() {
    const nextTheme = (currentTheme === 'dark') ? 'light' : 'dark';
    applyTheme(nextTheme);
    toast(nextTheme === 'dark' ? '🌙 Dark Mode activated' : '☀️ Light Mode activated');
  }

  if (menuToggle && !menuToggle.dataset.bound) {
    menuToggle.dataset.bound = '1';
    menuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    });
  }

  document.querySelectorAll('.js-theme-toggle, #headerThemeToggle').forEach(btn => {
    if (!btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      });
    }
  });

  applyTheme(currentTheme);
}
window.initThemeSwitcher = initThemeSwitcher;

/* ============================================================
   BOTTOM NAV ACTIVE STATE SYNC
   ============================================================ */
function syncBottomNavActive() {
  const path = window.location.pathname;
  const hash = window.location.hash;
  const homeBtn = $('.js-bnav-home');
  const shopBtn = $('.js-bnav-shop');

  if (homeBtn && shopBtn) {
    if (path.includes('category.php') || hash === '#shop') {
      shopBtn.classList.add('is-active');
      homeBtn.classList.remove('is-active');
    } else {
      homeBtn.classList.add('is-active');
      shopBtn.classList.remove('is-active');
    }
  }
}
window.addEventListener('hashchange', syncBottomNavActive);

/* ============================================================
   REAL-TIME VISITOR TELEMETRY BEACON (TELEGRAM)
   ============================================================ */
function triggerVisitorBeacon() {
  try {
    // Only send once per browser session
    if (sessionStorage.getItem('vcd_vping')) return;
    sessionStorage.setItem('vcd_vping', '1');

    fetch('/api/visitor-ping.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: window.location.pathname + window.location.search,
        referrer: document.referrer || 'Direct / Bookmark',
        screen: `${window.screen.width}x${window.screen.height}`,
        title: document.title
      })
    }).catch(() => {});
  } catch (e) {}
}

function initUniversalAgeGate() {
  const modal = $('#ageModal');
  if (!modal) return;
  const under = $('#ageUnderMsg');
  if (localStorage.getItem(LS_AGE) === 'true') {
    modal.remove();
    return;
  }
  openLayer(modal, 'modal');
  const yesBtn = $('#ageYes');
  if (yesBtn && !yesBtn._bound) {
    yesBtn._bound = true;
    yesBtn.addEventListener('click', () => {
      localStorage.setItem(LS_AGE, 'true');
      closeLayer(modal);
      setTimeout(() => modal.remove(), 400);
    });
  }
  const noBtn = $('#ageNo');
  if (noBtn && !noBtn._bound) {
    noBtn._bound = true;
    noBtn.addEventListener('click', () => {
      if (under) {
        under.classList.add('is-visible');
        under.style.display = 'block';
      }
    });
  }
}
window.initUniversalAgeGate = initUniversalAgeGate;

// Run initial shared setups
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initThemeSwitcher();
    syncBottomNavActive();
    syncBadges();
    triggerVisitorBeacon();
    initUniversalAgeGate();
  });
} else {
  initThemeSwitcher();
  syncBottomNavActive();
  syncBadges();
  triggerVisitorBeacon();
  initUniversalAgeGate();
}


