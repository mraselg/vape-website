/**
 * Vape Club Dubai — Luxury Admin Panel SPA
 * Pure Vanilla ES6 — reactive state, Frontend-Mirror Visual Customizer,
 * Mobile-First Touch Product Editor, Branding/Logo Studio, and Maximum SEO Engine.
 */
(function () {
  'use strict';

  const CSRF = window.ADM_CSRF || '';
  const dom = {
    nav: document.getElementById('admNav'),
    side: document.getElementById('admSide'),
    sideClose: document.getElementById('admSideClose'),
    backdrop: document.getElementById('admBackdrop'),
    menuBtn: document.getElementById('admMenuBtn'),
    viewTitle: document.getElementById('admViewTitle'),
    saveState: document.getElementById('saveState'),
    saveBtn: document.getElementById('saveBtn'),
    content: document.getElementById('admContent'),
    toasts: document.getElementById('admToasts'),
    ordersBadge: document.getElementById('ordersBadge'),
    logoutBtn: document.getElementById('logoutBtn')
  };

  const state = {
    data: null,
    dirty: new Set(),
    view: 'dashboard',
    subview: '',
    customizerMode: 'visual', // 'visual' | 'classic'
    activeHeroSlide: 0,
    editingProductIndex: null, // null = list, >= 0 = editing existing, -1 = creating new
    peActiveTab: 'basic',      // 'basic' | 'media' | 'variants' | 'details' | 'seo'
    productFilter: { q: '', cat: 'all', stock: 'all' },
    images: [],
    pollTimer: null
  };

  /* ============================================================
     HELPERS & UTILITIES
     ============================================================ */
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toast(msg, isErr = false) {
    if (!dom.toasts) return;
    const el = document.createElement('div');
    el.className = 'adm-toast' + (isErr ? ' err' : '');
    el.textContent = msg;
    dom.toasts.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.transition = 'opacity .3s ease, transform .3s ease';
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  async function api(action, payload = null, isForm = false) {
    const isMutating = !['get', 'images', 'backup'].includes(action);
    const opts = {
      method: isMutating ? 'POST' : 'GET',
      headers: {}
    };
    if (isMutating && CSRF) {
      opts.headers['X-CSRF'] = CSRF;
    }

    let url = '/admin/api.php?action=' + encodeURIComponent(action);
    if (isForm) {
      opts.body = payload;
    } else if (payload && isMutating) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(payload);
    }

    try {
      const res = await fetch(url, opts);
      if (res.status === 401) {
        toast('Session expired — please log in again.', true);
        setTimeout(() => location.reload(), 1200);
        throw new Error('Unauthorized');
      }
      const data = await res.json();
      return data;
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        toast('API Error: ' + (err.message || 'Unknown'), true);
      }
      throw err;
    }
  }

  function markDirty(section) {
    state.dirty.add(section);
    updateSaveState();
  }

  function clearDirty(section) {
    if (section) {
      state.dirty.delete(section);
    } else {
      state.dirty.clear();
    }
    updateSaveState();
  }

  function updateSaveState() {
    if (!dom.saveState || !dom.saveBtn) return;
    if (state.dirty.size > 0) {
      dom.saveState.className = 'adm-save-state dirty';
      dom.saveState.textContent = '● Unsaved changes (' + Array.from(state.dirty).join(', ') + ')';
      dom.saveBtn.style.display = 'inline-flex';
    } else {
      dom.saveState.className = 'adm-save-state';
      dom.saveState.textContent = 'All changes saved';
      dom.saveBtn.style.display = 'none';
    }
  }

  async function saveAll() {
    if (state.dirty.size === 0) {
      toast('No changes to save.');
      return;
    }
    dom.saveBtn.disabled = true;
    dom.saveBtn.textContent = 'Saving…';

    const sections = Array.from(state.dirty);
    let allOk = true;

    for (const s of sections) {
      let payload = state.data[s];
      if (s === 'products') {
        payload = { products: state.data.products.products || state.data.products };
      }
      try {
        const res = await api('save', { section: s, data: payload });
        if (res && res.ok) {
          clearDirty(s);
        } else {
          allOk = false;
          toast('Failed to save ' + s + ': ' + (res.error || 'Server error'), true);
        }
      } catch (ex) {
        allOk = false;
      }
    }

    dom.saveBtn.disabled = false;
    dom.saveBtn.innerHTML = '💾 Save Changes';
    if (allOk) {
      toast('Changes saved successfully!');
    }
  }

  function updateOrdersBadge() {
    if (!dom.ordersBadge || !state.data || !state.data.orders) return;
    const orders = state.data.orders.orders || [];
    const newCount = orders.filter(o => (o.status || 'new') === 'new').length;
    if (newCount > 0) {
      dom.ordersBadge.textContent = newCount;
      dom.ordersBadge.style.display = 'inline-block';
    } else {
      dom.ordersBadge.style.display = 'none';
    }
  }

  /* ============================================================
     MOBILE DRAWER HANDLERS
     ============================================================ */
  function openMobileMenu() {
    if (dom.side) dom.side.classList.add('is-open');
    if (dom.backdrop) dom.backdrop.classList.add('is-open');
  }
  function closeMobileMenu() {
    if (dom.side) dom.side.classList.remove('is-open');
    if (dom.backdrop) dom.backdrop.classList.remove('is-open');
  }

  /* ============================================================
     REUSABLE WIDGETS
     ============================================================ */
  function refreshDatalist() {
    let dl = document.getElementById('admImgDatalist');
    if (!dl) {
      dl = document.createElement('datalist');
      dl.id = 'admImgDatalist';
      document.body.appendChild(dl);
    }
    dl.innerHTML = (state.images || []).map(p => `<option value="${esc(p)}"></option>`).join('');
  }

  function renderImgPicker(fieldId, currentValue, onSelect, dir = 'products') {
    const wrap = document.createElement('div');
    wrap.className = 'adm-imgpick';

    const img = document.createElement('img');
    img.src = currentValue ? (currentValue.startsWith('/') ? currentValue : '/' + currentValue) : '/assets/images/icons/favicon-32.png';
    img.alt = 'Preview';
    img.onerror = () => { img.src = '/assets/images/icons/favicon-32.png'; };

    const input = document.createElement('input');
    input.type = 'text';
    input.id = fieldId;
    input.value = currentValue || '';
    input.placeholder = 'assets/images/...';
    input.setAttribute('list', 'admImgDatalist');
    input.style.flex = '1';
    input.style.minWidth = '160px';

    input.addEventListener('input', () => {
      const v = input.value.trim();
      img.src = v ? (v.startsWith('/') ? v : '/' + v) : '/assets/images/icons/favicon-32.png';
      onSelect(v);
    });

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'adm-btn adm-btn-sm';
    upBtn.innerHTML = '📁 Upload';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png,image/jpeg,image/webp,image/svg+xml';
    fileInput.style.display = 'none';

    upBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
      if (!fileInput.files || !fileInput.files[0]) return;
      const f = fileInput.files[0];
      const formData = new FormData();
      formData.append('file', f);
      formData.append('dir', dir);

      upBtn.disabled = true;
      upBtn.innerHTML = '⏳ Uploading…';

      try {
        const res = await api('image_upload', formData, true);
        if (res && res.ok && res.path) {
          input.value = res.path;
          img.src = '/' + res.path;
          onSelect(res.path);
          if (!state.images.includes(res.path)) {
            state.images.push(res.path);
            refreshDatalist();
          }
          toast('Image uploaded: ' + res.path);
        } else {
          toast('Upload failed: ' + (res.error || 'Unknown error'), true);
        }
      } catch (err) {
        toast('Upload failed.', true);
      } finally {
        upBtn.disabled = false;
        upBtn.innerHTML = '📁 Upload';
      }
    });

    wrap.appendChild(img);
    wrap.appendChild(input);
    wrap.appendChild(upBtn);
    wrap.appendChild(fileInput);
    return wrap;
  }

  function renderStringListEditor(list, onChange, placeholder = 'Item…', addLabel = '+ Add Item') {
    const container = document.createElement('div');
    container.className = 'adm-le';
    const items = [...(list || [])];

    function rebuild() {
      container.innerHTML = '';
      items.forEach((val, idx) => {
        const row = document.createElement('div');
        row.className = 'adm-le-row';

        const main = document.createElement('div');
        main.className = 'adm-le-main';
        main.innerHTML = `<input type="text" style="width:100%" placeholder="${esc(placeholder)}" value="${esc(val)}">`;
        const input = main.querySelector('input');

        input.addEventListener('input', () => {
          items[idx] = input.value;
          onChange(items);
        });

        const tools = document.createElement('div');
        tools.className = 'adm-le-tools';
        tools.innerHTML = `
          <button type="button" title="Move Up" ${idx === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" title="Move Down" ${idx === items.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="del" title="Delete">✕</button>
        `;

        const [btnUp, btnDown, btnDel] = tools.querySelectorAll('button');
        btnUp.addEventListener('click', () => {
          const t = items[idx]; items[idx] = items[idx - 1]; items[idx - 1] = t;
          onChange(items); rebuild();
        });
        btnDown.addEventListener('click', () => {
          const t = items[idx]; items[idx] = items[idx + 1]; items[idx + 1] = t;
          onChange(items); rebuild();
        });
        btnDel.addEventListener('click', () => {
          items.splice(idx, 1);
          onChange(items); rebuild();
        });

        row.appendChild(main);
        row.appendChild(tools);
        container.appendChild(row);
      });

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'adm-le-add';
      addBtn.innerHTML = addLabel;
      addBtn.addEventListener('click', () => {
        items.push('');
        onChange(items);
        rebuild();
      });
      container.appendChild(addBtn);
    }

    rebuild();
    return container;
  }

  function renderKvEditor(dict, onChange, keyPlaceholder = 'Feature', valPlaceholder = 'Specification') {
    const container = document.createElement('div');
    container.className = 'adm-le';
    const entries = Object.entries(dict || {});

    function rebuild() {
      container.innerHTML = '';
      entries.forEach(([k, v], idx) => {
        const row = document.createElement('div');
        row.className = 'adm-le-row';

        const main = document.createElement('div');
        main.className = 'adm-le-main adm-row';

        const kField = document.createElement('div');
        kField.className = 'adm-field';
        kField.innerHTML = `<input type="text" placeholder="${esc(keyPlaceholder)}" value="${esc(k)}">`;
        const kInput = kField.querySelector('input');

        const vField = document.createElement('div');
        vField.className = 'adm-field';
        vField.innerHTML = `<input type="text" placeholder="${esc(valPlaceholder)}" value="${esc(v)}">`;
        const vInput = vField.querySelector('input');

        kInput.addEventListener('input', () => { entries[idx][0] = kInput.value; fire(); });
        vInput.addEventListener('input', () => { entries[idx][1] = vInput.value; fire(); });

        main.appendChild(kField);
        main.appendChild(vField);

        const tools = document.createElement('div');
        tools.className = 'adm-le-tools';
        tools.innerHTML = `
          <button type="button" title="Move Up" ${idx === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" title="Move Down" ${idx === entries.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="del" title="Delete">✕</button>
        `;

        const [btnUp, btnDown, btnDel] = tools.querySelectorAll('button');
        btnUp.addEventListener('click', () => {
          const t = entries[idx]; entries[idx] = entries[idx - 1]; entries[idx - 1] = t;
          fire(); rebuild();
        });
        btnDown.addEventListener('click', () => {
          const t = entries[idx]; entries[idx] = entries[idx + 1]; entries[idx + 1] = t;
          fire(); rebuild();
        });
        btnDel.addEventListener('click', () => {
          entries.splice(idx, 1);
          fire(); rebuild();
        });

        row.appendChild(main);
        row.appendChild(tools);
        container.appendChild(row);
      });

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'adm-le-add';
      addBtn.innerHTML = '+ Add Specification Row';
      addBtn.addEventListener('click', () => {
        entries.push(['', '']);
        fire();
        rebuild();
      });
      container.appendChild(addBtn);
    }

    function fire() {
      const out = {};
      entries.forEach(([k, v]) => {
        if (k.trim()) out[k.trim()] = v.trim();
      });
      onChange(out);
    }

    rebuild();
    return container;
  }

  function attachCharMeter(input, minTarget, maxTarget) {
    if (!input) return;
    let meter = input.parentNode.querySelector('.adm-char-meter');
    if (!meter) {
      meter = document.createElement('div');
      meter.className = 'adm-char-meter';
      meter.innerHTML = `
        <span class="adm-char-count">0 chars</span>
        <div class="adm-char-bar-track"><div class="adm-char-bar-fill"></div></div>
        <span class="adm-char-rec">${minTarget}-${maxTarget} ideal</span>
      `;
      input.parentNode.appendChild(meter);
    }
    const countEl = meter.querySelector('.adm-char-count');
    const fillEl = meter.querySelector('.adm-char-bar-fill');

    function update() {
      const len = (input.value || '').length;
      countEl.textContent = len + ' chars';
      const pct = Math.min(100, Math.round((len / maxTarget) * 100));
      fillEl.style.width = pct + '%';
      fillEl.className = 'adm-char-bar-fill ' + (len >= minTarget && len <= maxTarget ? 'good' : len > maxTarget ? 'bad' : 'warn');
    }
    input.addEventListener('input', update);
    update();
  }

  /* ============================================================
     VIEW: DASHBOARD
     ============================================================ */
  function renderDashboard() {
    dom.viewTitle.textContent = 'Dashboard';
    const prods = (state.data.products && state.data.products.products) || [];
    const cats = (state.data.categories && state.data.categories.cats) || {};
    const orders = (state.data.orders && state.data.orders.orders) || [];

    const inStock = prods.filter(p => (p.stock || 'in') === 'in').length;
    const lowStock = prods.filter(p => p.stock === 'low').length;
    const outStock = prods.filter(p => p.stock === 'out').length;
    const newOrders = orders.filter(o => (o.status || 'new') === 'new').length;

    let html = `
      <div class="adm-stats">
        <div class="adm-stat green">
          <b>${prods.length}</b>
          <span>Total Products (${inStock} in stock)</span>
        </div>
        <div class="adm-stat amber">
          <b>${newOrders}</b>
          <span>New Orders (${orders.length} total)</span>
        </div>
        <div class="adm-stat blue">
          <b>${Object.keys(cats).length}</b>
          <span>Categories Active</span>
        </div>
        <div class="adm-stat ${lowStock + outStock > 0 ? 'amber' : 'green'}">
          <b>${lowStock + outStock}</b>
          <span>Low / Out of Stock</span>
        </div>
      </div>

      <div class="adm-grid2">
        <div class="adm-card is-highlight">
          <h3><span>🏠</span> Storefront Visual Customizer</h3>
          <p class="adm-card-sub">Visually mirror the frontend website and edit any section, title, or banner in real time</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
            <button class="adm-btn adm-btn-primary" onclick="ADM.switchView('homepage')">
              <span>👁️</span> Open Visual Customizer →
            </button>
            <button class="adm-btn" onclick="ADM.switchView('settings')">
              <span>🎨</span> Logo &amp; Branding Studio
            </button>
          </div>
        </div>

        <div class="adm-card">
          <h3><span>📱</span> Mobile-First Product Management</h3>
          <p class="adm-card-sub">Effortlessly add, edit, upload photos and configure SEO from mobile or desktop</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
            <button class="adm-btn adm-btn-primary" onclick="ADM.newProduct()">
              <span>➕</span> Add New Product
            </button>
            <button class="adm-btn" onclick="ADM.switchView('products')">
              <span>📦</span> View All Products (${prods.length})
            </button>
          </div>
        </div>
      </div>

      <div class="adm-grid2" style="margin-top:16px;">
        <div class="adm-card">
          <h3><span>🔍</span> SEO &amp; Rich Schema Status</h3>
          <p class="adm-card-sub">Google search snippet previews, structured schemas, and zero SEO gaps</p>
          <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;margin:12px 0;">
            <div style="color:var(--adm-emerald)">✓ Product Schema (JSON-LD) with AggregateRating</div>
            <div style="color:var(--adm-emerald)">✓ LocalBusiness / Store Schema with Dubai coordinates</div>
            <div style="color:var(--adm-emerald)">✓ Dynamic Breadcrumbs &amp; FAQPage Schemas</div>
          </div>
          <button class="adm-btn adm-btn-sm" onclick="ADM.switchView('seo')">Open SEO Center →</button>
        </div>

        <div class="adm-card">
          <h3><span>🧾</span> Recent Customer Orders</h3>
          <p class="adm-card-sub">Latest checkout and WhatsApp orders</p>
          <div style="font-size:13px;margin-bottom:12px;">
            ${orders.length === 0 ? '<span style="color:var(--adm-muted)">No orders recorded yet.</span>' : `
              <b>${orders.length} total orders</b> — ${newOrders} pending confirmation.
            `}
          </div>
          <button class="adm-btn adm-btn-sm" onclick="ADM.switchView('orders')">Manage Orders →</button>
        </div>
      </div>
    `;

    dom.content.innerHTML = html;
  }

  /* ============================================================
     VIEW: PRODUCTS & MOBILE-FIRST PRODUCT EDITOR
     ============================================================ */
  function renderProducts() {
    dom.viewTitle.textContent = 'Products';

    if (state.editingProductIndex !== null) {
      renderProductEditor(state.editingProductIndex);
      return;
    }

    const prods = (state.data.products && state.data.products.products) || [];
    const catLabels = (state.data.categories && state.data.categories.labels) || {};
    const cats = (state.data.categories && state.data.categories.cats) || {};

    const q = state.productFilter.q.toLowerCase().trim();
    const selCat = state.productFilter.cat;
    const selStock = state.productFilter.stock;

    const filtered = prods.filter((p, idx) => {
      p._origIndex = idx;
      if (selCat !== 'all' && p.cat !== selCat) return false;
      if (selStock !== 'all' && (p.stock || 'in') !== selStock) return false;
      if (q) {
        const text = `${p.name || ''} ${p.brand || ''} ${p.sku || ''} ${p.cat || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });

    let html = `
      <div class="adm-toolbar">
        <button class="adm-btn adm-btn-primary" onclick="ADM.newProduct()">
          <span>➕</span> Add New Product
        </button>
        <input type="text" id="prodSearchInput" placeholder="Search products by name, brand, SKU…" value="${esc(state.productFilter.q)}">
        <select id="prodCatFilter" style="background:var(--adm-panel);border:1px solid var(--adm-line);color:var(--adm-text);border-radius:10px;padding:10px 14px;font-size:13px;">
          <option value="all">All Categories (${prods.length})</option>
          ${Object.keys(cats).map(c => `
            <option value="${esc(c)}" ${selCat === c ? 'selected' : ''}>${esc(catLabels[c] || c)}</option>
          `).join('')}
        </select>
        <select id="prodStockFilter" style="background:var(--adm-panel);border:1px solid var(--adm-line);color:var(--adm-text);border-radius:10px;padding:10px 14px;font-size:13px;">
          <option value="all">All Stock Status</option>
          <option value="in" ${selStock === 'in' ? 'selected' : ''}>In Stock</option>
          <option value="low" ${selStock === 'low' ? 'selected' : ''}>Low Stock</option>
          <option value="out" ${selStock === 'out' ? 'selected' : ''}>Out of Stock</option>
        </select>
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th style="width:50px">Image</th>
              <th>Product Details</th>
              <th>Category</th>
              <th>Price (AED)</th>
              <th>Stock</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `
              <tr><td colspan="6" style="text-align:center;padding:36px;color:var(--adm-muted)">No products match your search or filter.</td></tr>
            ` : filtered.map(p => {
              const origIdx = p._origIndex;
              const photoUrl = p.photo ? (p.photo.startsWith('/') ? p.photo : '/' + p.photo) : '';
              return `
                <tr>
                  <td>
                    ${photoUrl ? `<img src="${esc(photoUrl)}" class="adm-thumb" alt="${esc(p.name)}" onerror="this.src='/assets/images/icons/favicon-32.png'">` : '<div class="adm-thumb-fallback">📦</div>'}
                  </td>
                  <td>
                    <b style="font-size:14px;">${esc(p.name)}</b>
                    <div style="font-size:11.5px;color:var(--adm-muted);margin-top:2px;">
                      <span>ID: <code>${esc(p.id)}</code></span>
                      ${p.brand ? ` · <span>Brand: ${esc(p.brand)}</span>` : ''}
                      ${p.sku ? ` · <span>SKU: ${esc(p.sku)}</span>` : ''}
                    </div>
                  </td>
                  <td>
                    <span class="adm-pill cat">${esc(catLabels[p.cat] || p.cat)}</span>
                  </td>
                  <td>
                    <b style="color:var(--adm-emerald);font-size:14px;">${esc(p.price)} AED</b>
                    ${p.old ? `<small style="color:var(--adm-muted);text-decoration:line-through;margin-left:6px;">${esc(p.old)} AED</small>` : ''}
                  </td>
                  <td>
                    <span class="adm-pill ${p.stock || 'in'}">
                      ${(p.stock || 'in') === 'in' ? 'In Stock' : (p.stock === 'low' ? 'Low Stock' : 'Out of Stock')}
                    </span>
                  </td>
                  <td style="text-align:right;white-space:nowrap;">
                    <button class="adm-btn adm-btn-sm" onclick="ADM.editProduct(${origIdx})">✏️ Edit</button>
                    <button class="adm-btn adm-btn-sm adm-btn-danger" onclick="ADM.deleteProduct(${origIdx})">✕</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    dom.content.innerHTML = html;

    // Filter bindings
    document.getElementById('prodSearchInput').addEventListener('input', (e) => {
      state.productFilter.q = e.target.value;
      renderProducts();
    });
    document.getElementById('prodCatFilter').addEventListener('change', (e) => {
      state.productFilter.cat = e.target.value;
      renderProducts();
    });
    document.getElementById('prodStockFilter').addEventListener('change', (e) => {
      state.productFilter.stock = e.target.value;
      renderProducts();
    });
  }

  /* ---------- MOBILE-FIRST TOUCH PRODUCT EDITOR ---------- */
  function renderProductEditor(idx) {
    const isNew = idx === -1;
    const prods = state.data.products.products;
    const catLabels = (state.data.categories && state.data.categories.labels) || {};
    const cats = (state.data.categories && state.data.categories.cats) || {};

    const p = isNew ? {
      id: 'prod-' + Date.now().toString().slice(-6),
      name: '',
      brand: 'IQOS',
      cat: Object.keys(cats)[0] || 'iluma',
      price: '100',
      old: '',
      stock: 'in',
      sku: 'SKU-' + Math.floor(Math.random() * 90000 + 10000),
      flavor: '',
      photo: 'assets/images/hero-iluma.png',
      photo_alt: '',
      theme: 'art-purple',
      badges: ['⚡ IN STOCK'],
      best: false,
      desc: '',
      specs: [],
      specsTable: {},
      boxContents: [],
      variants: { type: 'single' },
      seo_title: '',
      seo_desc: '',
      seo_keywords: '',
      slug: ''
    } : JSON.parse(JSON.stringify(prods[idx]));

    dom.viewTitle.textContent = isNew ? 'Add New Product' : `Edit: ${p.name || p.id}`;

    const formWrap = document.createElement('div');
    formWrap.className = 'adm-product-editor';

    const activeTab = state.peActiveTab || 'basic';

    formWrap.innerHTML = `
      <div class="adm-pe-header">
        <button type="button" class="adm-btn" id="btnBackToProds">← Back to List</button>
        <span style="font-size:13px;color:var(--adm-muted);">${isNew ? 'New Product draft' : 'Product ID: <code>' + esc(p.id) + '</code>'}</span>
      </div>

      <!-- Touch Tabs for Mobile & Desktop -->
      <div class="adm-touch-tabs">
        <button type="button" class="adm-touch-tab ${activeTab === 'basic' ? 'is-active' : ''}" data-tab="basic">📦 Basic Info</button>
        <button type="button" class="adm-touch-tab ${activeTab === 'media' ? 'is-active' : ''}" data-tab="media">🖼️ Photo &amp; Media</button>
        <button type="button" class="adm-touch-tab ${activeTab === 'variants' ? 'is-active' : ''}" data-tab="variants">🎨 Variants &amp; Packs</button>
        <button type="button" class="adm-touch-tab ${activeTab === 'details' ? 'is-active' : ''}" data-tab="details">📝 Details &amp; Specs</button>
        <button type="button" class="adm-touch-tab ${activeTab === 'seo' ? 'is-active' : ''}" data-tab="seo">🔍 SEO &amp; Schema</button>
      </div>

      <!-- TAB 1: BASIC INFO -->
      <div class="adm-tab-panel" id="tab_basic" style="${activeTab === 'basic' ? '' : 'display:none'}">
        <div class="adm-card">
          <h3><span>📦</span> Identification &amp; Pricing</h3>
          <p class="adm-card-sub">Product title, unique identifier, brand and selling prices</p>

          <div class="adm-field">
            <label>Product Title / Name *</label>
            <input type="text" id="pe_name" value="${esc(p.name)}" placeholder="e.g. IQOS ILUMA i PRIME Remix Edition" required style="font-size:16px;font-weight:700;">
          </div>

          <div class="adm-grid2">
            <div class="adm-field">
              <label>Category *</label>
              <select id="pe_cat">
                ${Object.keys(cats).map(c => `
                  <option value="${esc(c)}" ${p.cat === c ? 'selected' : ''}>${esc(catLabels[c] || c)}</option>
                `).join('')}
              </select>
            </div>
            <div class="adm-field">
              <label>Brand</label>
              <input type="text" id="pe_brand" value="${esc(p.brand || '')}" placeholder="IQOS, TEREA, Vozol, etc.">
            </div>
          </div>

          <div class="adm-grid3">
            <div class="adm-field">
              <label>Selling Price (AED) *</label>
              <input type="number" id="pe_price" value="${esc(p.price)}" required>
            </div>
            <div class="adm-field">
              <label>Regular / Old Price (AED)</label>
              <input type="number" id="pe_old" value="${esc(p.old || '')}" placeholder="Optional strike-through">
            </div>
            <div class="adm-field">
              <label>SKU / Barcode</label>
              <input type="text" id="pe_sku" value="${esc(p.sku || '')}">
            </div>
          </div>

          <div class="adm-grid2">
            <div class="adm-field">
              <label>Stock Status</label>
              <select id="pe_stock">
                <option value="in" ${p.stock === 'in' ? 'selected' : ''}>🟢 In Stock (Active)</option>
                <option value="low" ${p.stock === 'low' ? 'selected' : ''}>🟡 Low Stock</option>
                <option value="out" ${p.stock === 'out' ? 'selected' : ''}>🔴 Out of Stock</option>
              </select>
            </div>
            <div class="adm-field">
              <label>Storefront Promotion</label>
              <label class="adm-check">
                <input type="checkbox" id="pe_best" ${p.best ? 'checked' : ''}>
                <span>👑 Feature in VIP Bestsellers Showcase</span>
              </label>
            </div>
          </div>

          <div class="adm-field">
            <label>Flavor Notes / Subtitle</label>
            <input type="text" id="pe_flavor" value="${esc(p.flavor || '')}" placeholder="e.g. Rich tobacco blend with subtle cooling notes">
          </div>
        </div>
      </div>

      <!-- TAB 2: PHOTO & MEDIA -->
      <div class="adm-tab-panel" id="tab_media" style="${activeTab === 'media' ? '' : 'display:none'}">
        <div class="adm-card">
          <h3><span>🖼️</span> Product Photo &amp; Gallery</h3>
          <p class="adm-card-sub">Touch-friendly image upload and gallery management</p>

          <div class="adm-touch-upload">
            <img src="${p.photo ? (p.photo.startsWith('/') ? p.photo : '/' + p.photo) : '/assets/images/hero-iluma.png'}"
                 id="pe_thumb_preview" class="adm-touch-upload-thumb" alt="Product Image" onerror="this.src='/assets/images/icons/favicon-32.png'">
            <div class="adm-touch-upload-actions">
              <div class="adm-field" style="margin-bottom:8px;">
                <label>Image File Path</label>
                <input type="text" id="pe_photo_input" value="${esc(p.photo || '')}" placeholder="assets/images/products/..." list="admImgDatalist">
              </div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <button type="button" class="adm-btn adm-btn-primary" id="btnTouchUploadPhoto">
                  📷 Upload New Photo
                </button>
                <input type="file" id="pe_touch_file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="display:none">
              </div>
              <span class="adm-hint">Uploads directly to <code>assets/images/products/</code>. Max 6MB.</span>
            </div>
          </div>

          <div class="adm-field" style="margin-top:16px;">
            <label>Image Alt Tag (SEO &amp; Accessibility)</label>
            <input type="text" id="pe_photo_alt" value="${esc(p.photo_alt || p.name)}" placeholder="Descriptive image text for Google Search">
          </div>
        </div>
      </div>

      <!-- TAB 3: VARIANTS & PACKS -->
      <div class="adm-tab-panel" id="tab_variants" style="${activeTab === 'variants' ? '' : 'display:none'}">
        <div class="adm-card">
          <h3><span>🎨</span> Product Variants &amp; Packages</h3>
          <p class="adm-card-sub">Configure multi-pack options (Single Pack, Bundle of 5, Carton of 10) or device colors</p>
          <div class="adm-field">
            <label>Variant Selector Type</label>
            <select id="pe_var_type">
              <option value="single" ${(!p.variants || p.variants.type === 'single') ? 'selected' : ''}>Standard Single Product (No dropdowns)</option>
              <option value="packSize" ${(p.variants && p.variants.type === 'packSize') ? 'selected' : ''}>Multi-Pack Size (e.g. 1 Pack, 5 Packs, 1 Carton)</option>
              <option value="device" ${(p.variants && p.variants.type === 'device') ? 'selected' : ''}>Device Colors &amp; Bundles</option>
            </select>
          </div>
          <div id="pe_var_container" style="margin-top:14px;"></div>
        </div>
      </div>

      <!-- TAB 4: DETAILS & SPECS -->
      <div class="adm-tab-panel" id="tab_details" style="${activeTab === 'details' ? '' : 'display:none'}">
        <div class="adm-card">
          <h3><span>📝</span> Descriptions &amp; Technical Specifications</h3>
          <p class="adm-card-sub">Comprehensive specifications for product detail page and Google rich results</p>

          <div class="adm-field">
            <label>Full Product Description</label>
            <textarea id="pe_desc" rows="5" placeholder="Detailed overview of device features, compatibility, technology…">${esc(p.desc || p.description || '')}</textarea>
          </div>

          <div class="adm-field">
            <label>What's Inside The Box</label>
            <div id="pe_box_contents"></div>
          </div>

          <div class="adm-field" style="margin-top:18px;">
            <label>Technical Specifications Table</label>
            <div id="pe_specs_table"></div>
          </div>
        </div>
      </div>

      <!-- TAB 5: MAXIMUM SEO & SCHEMA -->
      <div class="adm-tab-panel" id="tab_seo" style="${activeTab === 'seo' ? '' : 'display:none'}">
        <div class="adm-card is-highlight">
          <h3><span>🔍</span> Maximum SEO &amp; Google Rich Snippet Engine</h3>
          <p class="adm-card-sub">Zero SEO gaps: Meta Title, Meta Description, Focus Keyword, and real Google SERP preview</p>

          <div class="adm-field">
            <label>Custom SEO Meta Title (Google SERP Title)</label>
            <input type="text" id="pe_seo_title" value="${esc(p.seo_title || '')}" placeholder="${esc(p.name)} — Buy Online in Dubai | Vape Club">
          </div>

          <div class="adm-field">
            <label>Custom Meta Description (Google Search Snippet)</label>
            <textarea id="pe_seo_desc" rows="3" placeholder="Buy ${esc(p.name)} in Dubai, UAE for ${esc(p.price)} AED. 1-2 hour express delivery, 100% genuine ESMA certified stock.">${esc(p.seo_desc || '')}</textarea>
          </div>

          <div class="adm-grid2">
            <div class="adm-field">
              <label>Focus Keyword</label>
              <input type="text" id="pe_seo_kw" value="${esc(p.seo_keywords || '')}" placeholder="e.g. iqos iluma dubai, terea japan dubai">
            </div>
            <div class="adm-field">
              <label>Canonical URL Slug Override</label>
              <input type="text" id="pe_slug" value="${esc(p.slug || p.id)}" placeholder="e.g. ${esc(p.id)}">
            </div>
          </div>

          <!-- Real Google SERP Snippet Preview Mockup -->
          <div class="adm-serp-preview">
            <div class="adm-serp-toggle">
              <span style="font-size:12px;font-weight:700;color:#9aa0a6;">GOOGLE SERP SNIPPET PREVIEW</span>
              <div class="adm-serp-mode-btns">
                <button type="button" class="adm-serp-mode-btn is-active" id="btnSerpMobile">Mobile</button>
                <button type="button" class="adm-serp-mode-btn" id="btnSerpDesktop">Desktop</button>
              </div>
            </div>
            <div class="adm-serp-url-row">
              <span class="adm-serp-fav">⚡</span>
              <span class="adm-serp-site">iqosai.com</span>
              <span class="adm-serp-slug">› product › <span id="serpSlugText">${esc(p.slug || p.id)}</span></span>
            </div>
            <div class="adm-serp-title" id="serpTitleText">
              ${esc(p.seo_title || (p.name ? `${p.name} — Buy Online in Dubai | Vape Club` : 'Vape Product Title'))}
            </div>
            <div class="adm-serp-desc" id="serpDescText">
              ${esc(p.seo_desc || `Buy ${p.name || 'this product'} in Dubai, UAE for ${p.price || 100} AED. 1-2 hour express delivery, 100% genuine ESMA certified stock. Cash or card on delivery.`)}
            </div>
            <div class="adm-serp-rating">
              ★★★★★ <span>4.9 (214 reviews) · AED ${esc(p.price || 100)} · In Stock</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sticky Mobile Bottom Action Bar -->
      <div class="adm-sticky-foot">
        <button type="button" class="adm-btn" id="btnCancelEdit">✕ Cancel</button>
        <button type="button" class="adm-btn adm-btn-primary adm-btn-lg" id="btnSaveProd">
          💾 ${isNew ? 'Create Product' : 'Save Product Changes'}
        </button>
      </div>
    `;

    dom.content.innerHTML = '';
    dom.content.appendChild(formWrap);

    // Tab switching logic
    formWrap.querySelectorAll('.adm-touch-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        state.peActiveTab = target;
        formWrap.querySelectorAll('.adm-touch-tab').forEach(t => t.classList.toggle('is-active', t === tab));
        formWrap.querySelectorAll('.adm-tab-panel').forEach(p => {
          p.style.display = p.id === 'tab_' + target ? 'block' : 'none';
        });
      });
    });

    // Touch Image Upload
    const thumbImg = formWrap.querySelector('#pe_thumb_preview');
    const photoInput = formWrap.querySelector('#pe_photo_input');
    const touchFileInput = formWrap.querySelector('#pe_touch_file');
    const btnTouchUpload = formWrap.querySelector('#btnTouchUploadPhoto');

    photoInput.addEventListener('input', () => {
      const v = photoInput.value.trim();
      p.photo = v;
      thumbImg.src = v ? (v.startsWith('/') ? v : '/' + v) : '/assets/images/hero-iluma.png';
    });

    btnTouchUpload.addEventListener('click', () => touchFileInput.click());

    touchFileInput.addEventListener('change', async () => {
      if (!touchFileInput.files || !touchFileInput.files[0]) return;
      const f = touchFileInput.files[0];
      const fd = new FormData();
      fd.append('file', f);
      fd.append('dir', 'products');

      btnTouchUpload.disabled = true;
      btnTouchUpload.textContent = '⏳ Uploading…';

      try {
        const res = await api('image_upload', fd, true);
        if (res && res.ok && res.path) {
          p.photo = res.path;
          photoInput.value = res.path;
          thumbImg.src = '/' + res.path;
          if (!state.images.includes(res.path)) {
            state.images.push(res.path);
            refreshDatalist();
          }
          toast('Photo uploaded successfully!');
        } else {
          toast('Upload failed: ' + (res.error || 'Unknown'), true);
        }
      } catch (e) {
        toast('Upload failed.', true);
      } finally {
        btnTouchUpload.disabled = false;
        btnTouchUpload.textContent = '📷 Upload New Photo';
      }
    });

    // Editors for Box Contents & Specs Table
    formWrap.querySelector('#pe_box_contents').appendChild(
      renderStringListEditor(p.boxContents || [], (items) => { p.boxContents = items; }, 'Item (e.g. 1x Device)', '+ Add Box Item')
    );
    formWrap.querySelector('#pe_specs_table').appendChild(
      renderKvEditor(p.specsTable || {}, (dict) => { p.specsTable = dict; }, 'Specification', 'Value')
    );

    // SERP Live Updates
    const serpTitle = formWrap.querySelector('#serpTitleText');
    const serpDesc = formWrap.querySelector('#serpDescText');
    const serpSlug = formWrap.querySelector('#serpSlugText');
    const seoTitleInput = formWrap.querySelector('#pe_seo_title');
    const seoDescInput = formWrap.querySelector('#pe_seo_desc');
    const nameInput = formWrap.querySelector('#pe_name');
    const slugInput = formWrap.querySelector('#pe_slug');

    function updateSerp() {
      const t = seoTitleInput.value.trim() || (nameInput.value.trim() ? `${nameInput.value.trim()} — Buy Online in Dubai | Vape Club` : 'Vape Product Title');
      const d = seoDescInput.value.trim() || `Buy ${nameInput.value.trim() || 'this product'} in Dubai, UAE. 1-2 hour express delivery, 100% genuine ESMA certified stock.`;
      const s = slugInput.value.trim() || p.id;
      serpTitle.textContent = t;
      serpDesc.textContent = d;
      serpSlug.textContent = s;
    }
    seoTitleInput.addEventListener('input', updateSerp);
    seoDescInput.addEventListener('input', updateSerp);
    nameInput.addEventListener('input', updateSerp);
    slugInput.addEventListener('input', updateSerp);

    attachCharMeter(seoTitleInput, 45, 65);
    attachCharMeter(seoDescInput, 140, 160);

    // Save & Cancel Actions
    const saveHandler = () => {
      p.name = formWrap.querySelector('#pe_name').value.trim();
      p.cat = formWrap.querySelector('#pe_cat').value;
      p.brand = formWrap.querySelector('#pe_brand').value.trim();
      p.price = formWrap.querySelector('#pe_price').value.trim();
      p.old = formWrap.querySelector('#pe_old').value.trim();
      p.sku = formWrap.querySelector('#pe_sku').value.trim();
      p.stock = formWrap.querySelector('#pe_stock').value;
      p.best = formWrap.querySelector('#pe_best').checked;
      p.flavor = formWrap.querySelector('#pe_flavor').value.trim();
      p.photo = photoInput.value.trim();
      p.photo_alt = formWrap.querySelector('#pe_photo_alt').value.trim();
      p.desc = formWrap.querySelector('#pe_desc').value.trim();
      p.seo_title = seoTitleInput.value.trim();
      p.seo_desc = seoDescInput.value.trim();
      p.seo_keywords = formWrap.querySelector('#pe_seo_kw').value.trim();
      p.slug = slugInput.value.trim();

      if (!p.name) {
        toast('Please enter a product title.', true);
        return;
      }

      if (isNew) {
        p.id = (p.slug || p.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('prod-' + Date.now());
        prods.unshift(p);
        toast(`Product "${p.name}" created.`);
      } else {
        prods[idx] = p;
        toast(`Product "${p.name}" updated.`);
      }

      markDirty('products');
      state.editingProductIndex = null;
      renderProducts();
    };

    formWrap.querySelector('#btnSaveProd').addEventListener('click', saveHandler);
    formWrap.querySelector('#btnBackToProds').addEventListener('click', () => {
      state.editingProductIndex = null;
      renderProducts();
    });
    formWrap.querySelector('#btnCancelEdit').addEventListener('click', () => {
      state.editingProductIndex = null;
      renderProducts();
    });
  }

  /* ============================================================
     VIEW: HOMEPAGE & FRONTEND-MIRROR VISUAL CUSTOMIZER
     ============================================================ */
  function renderHomepage() {
    dom.viewTitle.textContent = 'Homepage Customizer';
    const home = state.data.home;
    const settings = state.data.settings;

    const isVisual = state.customizerMode === 'visual';

    let html = `
      <div class="adm-customizer-bar">
        <div class="adm-customizer-bar-title">
          <span>🏠</span>
          <b>Homepage Live Customizer</b>
        </div>
        <div class="adm-customizer-modes">
          <button type="button" class="adm-mode-btn ${isVisual ? 'is-active' : ''}" id="btnModeVisual">
            👁️ Visual Storefront
          </button>
          <button type="button" class="adm-mode-btn ${!isVisual ? 'is-active' : ''}" id="btnModeClassic">
            ⚙️ Classic Form
          </button>
        </div>
      </div>
    `;

    if (isVisual) {
      // Current active hero slide
      const slides = home.hero_slides || [];
      const curSlide = slides[state.activeHeroSlide] || slides[0] || {};
      const slideImg = curSlide.image ? (curSlide.image.startsWith('/') ? curSlide.image : '/' + curSlide.image) : '/assets/images/hero-iluma.png';

      // Logo rendering in mirror header
      const logoHtml = settings.logo_type === 'image' && settings.logo_image
        ? `<img src="${settings.logo_image.startsWith('/') ? settings.logo_image : '/' + settings.logo_image}" class="adm-mirror-brand-img" alt="${esc(settings.brand_name)}">`
        : `<div class="adm-mirror-brand-mark">⚡</div><div><b>${esc(settings.brand_name || 'VAPE CLUB')}</b><small style="display:block;font-size:10px;color:var(--adm-emerald)">${esc(settings.brand_tagline || 'DUBAI')}</small></div>`;

      html += `
        <div class="adm-storefront-mirror" id="storefrontMirror">

          <!-- 1. ANNOUNCEMENT BAR -->
          <div class="adm-mirror-sec" data-sec="announce" title="Click to edit announcements">
            <span class="adm-sec-edit-badge">✏️ Edit Announcements</span>
            <div class="adm-mirror-announce">
              <div class="adm-mirror-announce-track">
                <span>⚡</span>
                <b>${(home.announce_items || []).slice(0, 3).map(i => esc(i)).join(' ✦ ')}</b>
              </div>
              <span style="background:rgba(255,255,255,0.1);padding:2px 8px;border-radius:4px;font-size:11px;">${esc(home.currency_chip || 'AED د.إ')}</span>
            </div>
          </div>

          <!-- 2. SITE HEADER -->
          <div class="adm-mirror-sec" data-sec="header" title="Click to edit header &amp; logo">
            <span class="adm-sec-edit-badge">✏️ Edit Header &amp; Logo</span>
            <div class="adm-mirror-header">
              <div class="adm-mirror-brand">
                ${logoHtml}
              </div>
              <div class="adm-mirror-search">
                🔍 Search products, ILUMA, TEREA…
              </div>
              <div style="display:flex;gap:10px;align-items:center;font-size:12px;color:var(--adm-emerald)">
                <span>💬 WhatsApp</span>
                <span style="background:var(--adm-panel3);padding:4px 8px;border-radius:6px;color:#fff">🛒 0</span>
              </div>
            </div>
          </div>

          <!-- 3. FLASH DEAL STRIP -->
          ${home.flash_deal && home.flash_deal.enabled ? `
            <div class="adm-mirror-sec" data-sec="flash" title="Click to edit flash deal">
              <span class="adm-sec-edit-badge">✏️ Edit Flash Deal</span>
              <div class="adm-mirror-flash">
                <span class="adm-mirror-flash-chip">FLASH DEAL</span>
                <span>${esc(home.flash_deal.text)}</span>
                <span style="color:var(--adm-amber);text-decoration:underline;">${esc(home.flash_deal.cta_label || 'Shop now')} →</span>
              </div>
            </div>
          ` : `
            <div class="adm-mirror-sec" data-sec="flash" style="padding:12px;text-align:center;color:var(--adm-muted);background:rgba(255,255,255,0.02)">
              <span class="adm-sec-edit-badge">✏️ Enable Flash Deal</span>
              <span>⚡ Flash Deal Strip is currently disabled. Click to enable and edit.</span>
            </div>
          `}

          <!-- 4. HERO CAROUSEL -->
          <div class="adm-mirror-sec" data-sec="hero" title="Click to edit hero banners">
            <span class="adm-sec-edit-badge">✏️ Edit Hero Slides</span>
            <div class="adm-mirror-hero">
              <div>
                <span class="adm-mirror-hero-pill">${esc(curSlide.pill || '⚡ Flagship')}</span>
                <div class="adm-mirror-hero-title">
                  ${esc(curSlide.title_pre || '')}<em>${esc(curSlide.title_grad || '')}</em>${esc(curSlide.title_post || '')}
                </div>
                <div class="adm-mirror-hero-lede">${esc(curSlide.lede || '')}</div>
                <div class="adm-mirror-hero-price">
                  <span style="color:var(--adm-emerald)">${esc(curSlide.price || '440')} AED</span>
                  ${curSlide.old ? `<small>${esc(curSlide.old)}</small>` : ''}
                  <span style="background:var(--adm-emerald);color:#03140C;padding:3px 8px;border-radius:6px;font-size:12px;font-weight:800;">${esc(curSlide.save || 'SAVE 15%')}</span>
                </div>
              </div>
              <div style="text-align:center">
                <img src="${esc(slideImg)}" class="adm-mirror-hero-img" alt="Hero Banner" onerror="this.src='/assets/images/hero-iluma.png'">
              </div>
            </div>
            <!-- Slide Selector Dots -->
            <div style="display:flex;justify-content:center;gap:8px;padding:10px 0;background:rgba(0,0,0,0.3)">
              ${slides.map((s, idx) => `
                <button type="button" class="adm-slide-dot" data-idx="${idx}" style="width:10px;height:10px;border-radius:50%;border:none;background:${idx === state.activeHeroSlide ? 'var(--adm-emerald)' : 'rgba(255,255,255,0.3)'};cursor:pointer;"></button>
              `).join('')}
            </div>
          </div>

          <!-- 5. POPULAR CATEGORIES -->
          <div class="adm-mirror-sec" data-sec="cats" title="Click to edit categories showcase">
            <span class="adm-sec-edit-badge">✏️ Edit Categories</span>
            <div class="adm-mirror-cats">
              <div style="font-size:18px;font-weight:800;">
                <span style="color:var(--adm-emerald)">${esc((home.pop_categories && home.pop_categories.pop_word) || 'Popular')}</span> ${esc((home.pop_categories && home.pop_categories.title) || 'Categories')}
              </div>
              <div class="adm-mirror-cats-grid">
                ${((home.pop_categories && home.pop_categories.tiles) || []).map(t => `
                  <div class="adm-mirror-cat-card">
                    <img src="${t.bg ? (t.bg.startsWith('/') ? t.bg : '/' + t.bg) : '/assets/images/hero-iluma.webp'}" alt="${esc(t.title)}" onerror="this.src='/assets/images/hero-iluma.webp'">
                    <b>${esc(t.title)}</b>
                    <small>${esc(t.sub)}</small>
                  </div>
                `).join('')}
                <div class="adm-mirror-cat-card" style="justify-content:center;background:rgba(0,229,153,0.06);border-color:rgba(0,229,153,0.3)">
                  <b style="font-size:20px;color:var(--adm-emerald)">${esc((home.pop_categories && home.pop_categories.more_count) || '+9')}</b>
                  <b>${esc((home.pop_categories && home.pop_categories.more_title) || 'MORE CATEGORIES')}</b>
                </div>
              </div>
            </div>
          </div>

          <!-- 6. VIP BESTSELLERS SHOWCASE -->
          <div class="adm-mirror-sec" data-sec="vip" title="Click to edit VIP bestsellers">
            <span class="adm-sec-edit-badge">✏️ Edit VIP Showcase</span>
            <div class="adm-mirror-vip">
              <div class="adm-mirror-vip-head">
                <span class="adm-mirror-vip-badge">${esc((home.vip_section && home.vip_section.badge) || '👑 BEST SELLING PRODUCTS')}</span>
                <div style="font-size:22px;font-weight:800;color:#fff;">${esc((home.vip_section && home.vip_section.title) || 'Best Selling Products')}</div>
                <p style="font-size:12.5px;color:var(--adm-muted);margin:6px 0 0;">${esc((home.vip_section && home.vip_section.desc) || '')}</p>
              </div>
              <div class="adm-mirror-vip-cards">
                ${(state.data.products.products || []).slice(0, 4).map(p => `
                  <div class="adm-mirror-prod-card">
                    <img src="${p.photo ? (p.photo.startsWith('/') ? p.photo : '/' + p.photo) : '/assets/images/hero-iluma.png'}" alt="${esc(p.name)}" onerror="this.src='/assets/images/hero-iluma.png'">
                    <div class="title">${esc(p.name)}</div>
                    <div class="price">${esc(p.price)} AED</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- 7. TRUST BENEFITS -->
          <div class="adm-mirror-sec" data-sec="benefits" title="Click to edit benefits">
            <span class="adm-sec-edit-badge">✏️ Edit Trust Benefits</span>
            <div class="adm-mirror-benefits">
              ${(home.benefits || []).map(b => `
                <div class="adm-mirror-benefit-card">
                  <span class="adm-mirror-benefit-icon">${esc(b.icon === 'i-truck' ? '🚚' : (b.icon === 'i-shield' ? '🛡️' : '💳'))}</span>
                  <div>
                    <b>${esc(b.title)}</b>
                    <small>${esc(b.text)}</small>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 8. FAQS -->
          <div class="adm-mirror-sec" data-sec="faqs" title="Click to edit FAQs">
            <span class="adm-sec-edit-badge">✏️ Edit FAQs</span>
            <div style="padding:24px 20px;">
              <div style="font-size:18px;font-weight:800;margin-bottom:14px;">Frequently Asked Questions</div>
              ${(home.faqs || []).slice(0, 3).map(f => `
                <div class="adm-mirror-faq-item">
                  <span>${esc(f.q)}</span>
                  <span>+</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 9. CTA BANNER -->
          <div class="adm-mirror-sec" data-sec="cta" title="Click to edit CTA banner">
            <span class="adm-sec-edit-badge">✏️ Edit CTA Banner</span>
            <div class="adm-mirror-cta">
              <div style="font-size:20px;font-weight:800;color:#fff;">${esc((home.cta_banner && home.cta_banner.title) || 'Need Instant Recommendations?')}</div>
              <p style="font-size:13px;color:var(--adm-muted);margin:8px 0 16px;">${esc((home.cta_banner && home.cta_banner.sub) || 'Chat with our Dubai vape sommelier')}</p>
              <button class="adm-btn adm-btn-primary" style="pointer-events:none;">💬 Order on WhatsApp</button>
            </div>
          </div>

          <!-- 10. FOOTER -->
          <div class="adm-mirror-sec" data-sec="footer" title="Click to edit footer &amp; legal">
            <span class="adm-sec-edit-badge">✏️ Edit Footer</span>
            <div class="adm-mirror-footer">
              <div>
                <b>${esc(settings.brand_name || 'VAPE CLUB')}</b>
                <p style="margin-top:6px;line-height:1.4;">${esc(settings.brand_footer_note || '')}</p>
              </div>
              <div>
                <b>Contact</b>
                <div style="margin-top:6px;">📞 ${esc(settings.phone_display || '')}</div>
                <div>💬 ${esc(settings.wa_number || '')}</div>
              </div>
              <div>
                <b>Hours</b>
                <div style="margin-top:6px;">${(settings.hours || []).join('<br>')}</div>
              </div>
              <div>
                <b>UAE Legal</b>
                <div style="margin-top:6px;font-size:11px;">18+ Warning: Nicotine is addictive. ESMA certified.</div>
              </div>
            </div>
          </div>

        </div>
      `;
    } else {
      // Classic Form View
      html += `
        <div class="adm-card">
          <h3><span>📢</span> Top Announcement Ticker Bar</h3>
          <div class="adm-field">
            <label>Announcement Messages</label>
            <div id="classic_announce_items"></div>
          </div>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Currency Chip Label</label>
              <input type="text" id="classic_currency_chip" value="${esc(home.currency_chip || 'AED د.إ')}">
            </div>
          </div>
        </div>

        <div class="adm-card">
          <h3><span>⚡</span> Flash Deal Strip</h3>
          <label class="adm-check">
            <input type="checkbox" id="classic_fd_enabled" ${home.flash_deal && home.flash_deal.enabled ? 'checked' : ''}>
            <span>Enable Flash Deal Strip</span>
          </label>
          <div class="adm-field">
            <label>Flash Deal Promotional Text</label>
            <input type="text" id="classic_fd_text" value="${esc(home.flash_deal ? home.flash_deal.text : '')}">
          </div>
        </div>
      `;
    }

    // Modal container for section editing
    html += `
      <div class="adm-modal-overlay" id="admSecModal">
        <div class="adm-modal-box">
          <div class="adm-modal-head">
            <h3 id="admSecModalTitle">✏️ Edit Section</h3>
            <button type="button" class="adm-modal-close" id="admSecModalClose">✕</button>
          </div>
          <div class="adm-modal-body" id="admSecModalBody"></div>
          <div class="adm-modal-foot">
            <button type="button" class="adm-btn adm-btn-primary" id="admSecModalDone">✓ Done Editing</button>
          </div>
        </div>
      </div>
    `;

    dom.content.innerHTML = html;

    // Mode toggles
    document.getElementById('btnModeVisual').addEventListener('click', () => {
      state.customizerMode = 'visual';
      renderHomepage();
    });
    document.getElementById('btnModeClassic').addEventListener('click', () => {
      state.customizerMode = 'classic';
      renderHomepage();
    });

    if (isVisual) {
      // Slide selector dots
      dom.content.querySelectorAll('.adm-slide-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          state.activeHeroSlide = parseInt(dot.dataset.idx, 10);
          renderHomepage();
        });
      });

      // Section click triggers
      dom.content.querySelectorAll('.adm-mirror-sec').forEach(sec => {
        sec.addEventListener('click', () => {
          openSectionModal(sec.dataset.sec);
        });
      });
    } else {
      // Classic bindings
      dom.content.querySelector('#classic_announce_items').appendChild(
        renderStringListEditor(home.announce_items || [], (items) => {
          home.announce_items = items;
          markDirty('home');
        }, 'Ticker message', '+ Add Announcement')
      );
      dom.content.querySelector('#classic_currency_chip').addEventListener('input', (e) => {
        home.currency_chip = e.target.value;
        markDirty('home');
      });
      dom.content.querySelector('#classic_fd_enabled').addEventListener('change', (e) => {
        if (!home.flash_deal) home.flash_deal = {};
        home.flash_deal.enabled = e.target.checked;
        markDirty('home');
      });
      dom.content.querySelector('#classic_fd_text').addEventListener('input', (e) => {
        if (!home.flash_deal) home.flash_deal = {};
        home.flash_deal.text = e.target.value;
        markDirty('home');
      });
    }

    // Modal Close Handlers
    const modal = document.getElementById('admSecModal');
    const closeModal = () => {
      modal.classList.remove('is-open');
      renderHomepage();
    };
    document.getElementById('admSecModalClose').addEventListener('click', closeModal);
    document.getElementById('admSecModalDone').addEventListener('click', closeModal);
  }

  /* ---------- SECTION EDIT MODAL ---------- */
  function openSectionModal(secKey) {
    const modal = document.getElementById('admSecModal');
    const titleEl = document.getElementById('admSecModalTitle');
    const bodyEl = document.getElementById('admSecModalBody');
    if (!modal || !titleEl || !bodyEl) return;

    const home = state.data.home;
    const settings = state.data.settings;

    bodyEl.innerHTML = '';

    switch (secKey) {
      case 'announce': {
        titleEl.innerHTML = '📢 Edit Top Announcement Ticker';
        bodyEl.innerHTML = `
          <div class="adm-field">
            <label>Marquee Messages</label>
            <div id="m_announce_items"></div>
          </div>
          <div class="adm-grid2" style="margin-top:16px;">
            <div class="adm-field">
              <label>Currency Chip Label</label>
              <input type="text" id="m_curr_chip" value="${esc(home.currency_chip || 'AED د.إ')}">
            </div>
            <div class="adm-field">
              <label>Show Language Switcher (EN/AR)</label>
              <label class="adm-check">
                <input type="checkbox" id="m_lang_toggle" ${home.show_language_toggle ? 'checked' : ''}>
                <span>Display Language Toggle</span>
              </label>
            </div>
          </div>
        `;
        bodyEl.querySelector('#m_announce_items').appendChild(
          renderStringListEditor(home.announce_items || [], (items) => {
            home.announce_items = items;
            markDirty('home');
          }, 'Message text', '+ Add Message')
        );
        bodyEl.querySelector('#m_curr_chip').addEventListener('input', (e) => {
          home.currency_chip = e.target.value;
          markDirty('home');
        });
        bodyEl.querySelector('#m_lang_toggle').addEventListener('change', (e) => {
          home.show_language_toggle = e.target.checked;
          markDirty('home');
        });
        break;
      }

      case 'header': {
        titleEl.innerHTML = '🏷️ Edit Header &amp; Site Logo';
        bodyEl.innerHTML = `
          <div class="adm-field">
            <label>Brand Logo Mode</label>
            <select id="m_logo_type">
              <option value="icon" ${settings.logo_type === 'icon' ? 'selected' : ''}>Luxury SVG Icon Emblem + Text</option>
              <option value="image" ${settings.logo_type === 'image' ? 'selected' : ''}>Custom Image Logo (PNG / SVG / WebP)</option>
            </select>
          </div>
          <div class="adm-field" id="m_logo_img_row" style="${settings.logo_type === 'image' ? '' : 'display:none'}">
            <label>Upload or Select Logo Image</label>
            <div id="m_logo_picker"></div>
          </div>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Brand Name</label>
              <input type="text" id="m_brand_name" value="${esc(settings.brand_name || 'VAPE CLUB')}">
            </div>
            <div class="adm-field">
              <label>Brand Tagline</label>
              <input type="text" id="m_brand_tagline" value="${esc(settings.brand_tagline || 'Dubai · IQOS UAE')}">
            </div>
          </div>
        `;
        const logoTypeSel = bodyEl.querySelector('#m_logo_type');
        const logoImgRow = bodyEl.querySelector('#m_logo_img_row');
        logoTypeSel.addEventListener('change', (e) => {
          settings.logo_type = e.target.value;
          logoImgRow.style.display = e.target.value === 'image' ? 'block' : 'none';
          markDirty('settings');
        });
        bodyEl.querySelector('#m_logo_picker').appendChild(
          renderImgPicker('m_logo_input', settings.logo_image || '', (path) => {
            settings.logo_image = path;
            markDirty('settings');
          }, 'branding')
        );
        bodyEl.querySelector('#m_brand_name').addEventListener('input', (e) => {
          settings.brand_name = e.target.value;
          markDirty('settings');
        });
        bodyEl.querySelector('#m_brand_tagline').addEventListener('input', (e) => {
          settings.brand_tagline = e.target.value;
          markDirty('settings');
        });
        break;
      }

      case 'flash': {
        titleEl.innerHTML = '⚡ Edit Flash Deal Strip';
        if (!home.flash_deal) home.flash_deal = {};
        bodyEl.innerHTML = `
          <label class="adm-check" style="margin-bottom:14px;">
            <input type="checkbox" id="m_fd_enabled" ${home.flash_deal.enabled ? 'checked' : ''}>
            <span>Enable Glowing Flash Deal Strip</span>
          </label>
          <div class="adm-field">
            <label>Promotional Announcement Text</label>
            <input type="text" id="m_fd_text" value="${esc(home.flash_deal.text || '')}">
          </div>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>CTA Button Text</label>
              <input type="text" id="m_fd_cta_label" value="${esc(home.flash_deal.cta_label || 'Shop now')}">
            </div>
            <div class="adm-field">
              <label>CTA Destination Link</label>
              <input type="text" id="m_fd_cta_href" value="${esc(home.flash_deal.cta_href || '#shop')}">
            </div>
          </div>
        `;
        bodyEl.querySelector('#m_fd_enabled').addEventListener('change', (e) => {
          home.flash_deal.enabled = e.target.checked;
          markDirty('home');
        });
        bodyEl.querySelector('#m_fd_text').addEventListener('input', (e) => {
          home.flash_deal.text = e.target.value;
          markDirty('home');
        });
        bodyEl.querySelector('#m_fd_cta_label').addEventListener('input', (e) => {
          home.flash_deal.cta_label = e.target.value;
          markDirty('home');
        });
        bodyEl.querySelector('#m_fd_cta_href').addEventListener('input', (e) => {
          home.flash_deal.cta_href = e.target.value;
          markDirty('home');
        });
        break;
      }

      case 'hero': {
        titleEl.innerHTML = '🖼️ Edit Hero Banners';
        const slides = home.hero_slides || [];
        const s = slides[state.activeHeroSlide] || slides[0] || {};
        bodyEl.innerHTML = `
          <div style="display:flex;gap:6px;margin-bottom:16px;">
            ${slides.map((sl, i) => `
              <button type="button" class="adm-btn adm-btn-sm ${i === state.activeHeroSlide ? 'adm-btn-primary' : ''}" id="btnPickSlide_${i}">
                Slide ${i + 1}: ${esc(sl.title_grad || 'Offer')}
              </button>
            `).join('')}
          </div>
          <div class="adm-field">
            <label>Pill / Badge</label>
            <input type="text" id="m_hero_pill" value="${esc(s.pill || '')}">
          </div>
          <div class="adm-grid3">
            <div class="adm-field">
              <label>Title Prefix</label>
              <input type="text" id="m_hero_pre" value="${esc(s.title_pre || '')}">
            </div>
            <div class="adm-field">
              <label>Gradient Highlight Title</label>
              <input type="text" id="m_hero_grad" value="${esc(s.title_grad || '')}">
            </div>
            <div class="adm-field">
              <label>Title Suffix</label>
              <input type="text" id="m_hero_post" value="${esc(s.title_post || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Subtitle / Lede</label>
            <input type="text" id="m_hero_lede" value="${esc(s.lede || '')}">
          </div>
          <div class="adm-grid3">
            <div class="adm-field">
              <label>Offer Price (AED)</label>
              <input type="text" id="m_hero_price" value="${esc(s.price || '')}">
            </div>
            <div class="adm-field">
              <label>Old Price (AED)</label>
              <input type="text" id="m_hero_old" value="${esc(s.old || '')}">
            </div>
            <div class="adm-field">
              <label>Save Chip Text</label>
              <input type="text" id="m_hero_save" value="${esc(s.save || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Slide Image</label>
            <div id="m_hero_img_picker"></div>
          </div>
        `;
        slides.forEach((sl, i) => {
          bodyEl.querySelector(`#btnPickSlide_${i}`).addEventListener('click', () => {
            state.activeHeroSlide = i;
            openSectionModal('hero');
          });
        });
        bodyEl.querySelector('#m_hero_pill').addEventListener('input', (e) => { s.pill = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_hero_pre').addEventListener('input', (e) => { s.title_pre = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_hero_grad').addEventListener('input', (e) => { s.title_grad = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_hero_post').addEventListener('input', (e) => { s.title_post = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_hero_lede').addEventListener('input', (e) => { s.lede = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_hero_price').addEventListener('input', (e) => { s.price = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_hero_old').addEventListener('input', (e) => { s.old = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_hero_save').addEventListener('input', (e) => { s.save = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_hero_img_picker').appendChild(
          renderImgPicker('m_hero_img_input', s.image || '', (path) => {
            s.image = path;
            markDirty('home');
          }, 'hero')
        );
        break;
      }

      case 'benefits': {
        titleEl.innerHTML = '🛡️ Edit Trust Benefits';
        bodyEl.innerHTML = `
          <div style="font-size:13px;color:var(--adm-muted);margin-bottom:12px;">3-point satisfaction guarantee cards shown across the store:</div>
          <div id="m_benefits_list"></div>
        `;
        const listEl = bodyEl.querySelector('#m_benefits_list');
        (home.benefits || []).forEach((b, idx) => {
          const card = document.createElement('div');
          card.className = 'adm-card';
          card.style.padding = '14px';
          card.innerHTML = `
            <div class="adm-grid2">
              <div class="adm-field">
                <label>Benefit ${idx + 1} Headline</label>
                <input type="text" class="ben-title" value="${esc(b.title || '')}">
              </div>
              <div class="adm-field">
                <label>Benefit Subtext</label>
                <input type="text" class="ben-text" value="${esc(b.text || '')}">
              </div>
            </div>
          `;
          card.querySelector('.ben-title').addEventListener('input', (e) => {
            b.title = e.target.value;
            markDirty('home');
          });
          card.querySelector('.ben-text').addEventListener('input', (e) => {
            b.text = e.target.value;
            markDirty('home');
          });
          listEl.appendChild(card);
        });
        break;
      }

      default: {
        titleEl.innerHTML = '✏️ Edit Section';
        bodyEl.innerHTML = `<p>Section settings can be modified here.</p>`;
        break;
      }
    }

    modal.classList.add('is-open');
  }

  /* ============================================================
     VIEW: SETTINGS & LOGO STUDIO
     ============================================================ */
  function renderSettings() {
    dom.viewTitle.textContent = 'Branding & Settings';
    const s = state.data.settings;

    let html = `
      <!-- BRANDING & LOGO STUDIO -->
      <div class="adm-card is-highlight">
        <h3><span>🎨</span> Storefront Logo &amp; Branding Studio</h3>
        <p class="adm-card-sub">Upload custom vector or high-resolution store logo, or choose luxury SVG typography</p>

        <div class="adm-grid2">
          <div class="adm-field">
            <label>Site Logo Mode</label>
            <select id="set_logo_type">
              <option value="icon" ${s.logo_type === 'icon' ? 'selected' : ''}>Luxury SVG Icon Mark + Text</option>
              <option value="image" ${s.logo_type === 'image' ? 'selected' : ''}>Custom Image Logo (PNG / SVG / WebP)</option>
            </select>
            <span class="adm-hint">When Image mode is active, your logo displays in the header, mobile drawer, and footer.</span>
          </div>
          <div class="adm-field" id="set_logo_img_row" style="${s.logo_type === 'image' ? '' : 'display:none'}">
            <label>Upload Brand Logo</label>
            <div id="set_logo_picker"></div>
          </div>
        </div>

        <!-- Dual-Mode Live Preview Box (Dark & Light) -->
        <div class="adm-logo-studio" style="margin-top:16px;">
          <div class="adm-logo-preview-box adm-logo-preview-dark">
            <small>Dark Mode Storefront Preview</small>
            <div id="logoPreviewDark" style="display:flex;align-items:center;gap:10px;">
              ${s.logo_type === 'image' && s.logo_image ? `
                <img src="${s.logo_image.startsWith('/') ? s.logo_image : '/' + s.logo_image}" style="max-height:42px;max-width:180px;object-fit:contain;" alt="Logo Preview">
              ` : `
                <span style="width:38px;height:38px;background:rgba(0,229,153,0.2);border:1px solid var(--adm-emerald);border-radius:10px;display:grid;place-items:center;font-size:20px;">⚡</span>
                <span style="font-size:16px;font-weight:800;">${esc(s.brand_name || 'VAPE CLUB')} <small style="display:block;font-size:10px;color:var(--adm-emerald)">${esc(s.brand_tagline || 'DUBAI')}</small></span>
              `}
            </div>
          </div>
          <div class="adm-logo-preview-box adm-logo-preview-light">
            <small>Light Mode Contrast Preview</small>
            <div id="logoPreviewLight" style="display:flex;align-items:center;gap:10px;">
              ${s.logo_type === 'image' && s.logo_image ? `
                <img src="${s.logo_image.startsWith('/') ? s.logo_image : '/' + s.logo_image}" style="max-height:42px;max-width:180px;object-fit:contain;" alt="Logo Preview">
              ` : `
                <span style="width:38px;height:38px;background:rgba(0,0,0,0.06);border:1px solid #000;border-radius:10px;display:grid;place-items:center;font-size:20px;">⚡</span>
                <span style="font-size:16px;font-weight:800;color:#000">${esc(s.brand_name || 'VAPE CLUB')} <small style="display:block;font-size:10px;color:#00A86B">${esc(s.brand_tagline || 'DUBAI')}</small></span>
              `}
            </div>
          </div>
        </div>

        <div class="adm-grid3" style="margin-top:18px;">
          <div class="adm-field">
            <label>Brand Name</label>
            <input type="text" id="set_brand_name" value="${esc(s.brand_name)}">
          </div>
          <div class="adm-field">
            <label>Tagline</label>
            <input type="text" id="set_brand_tagline" value="${esc(s.brand_tagline)}">
          </div>
          <div class="adm-field">
            <label>Order Prefix</label>
            <input type="text" id="set_order_prefix" value="${esc(s.order_prefix || 'VCD')}">
          </div>
        </div>
      </div>

      <!-- CONTACT & WHATSAPP SETTINGS -->
      <div class="adm-card">
        <h3><span>📞</span> Customer Contact &amp; Express Delivery</h3>
        <p class="adm-card-sub">WhatsApp hotline, phone numbers, delivery fee rules and Dubai warehouse address</p>

        <div class="adm-grid3">
          <div class="adm-field">
            <label>WhatsApp Hotline (Digits with country code)</label>
            <input type="text" id="set_wa_number" value="${esc(s.wa_number)}">
            <span class="adm-hint">e.g. 971562848450</span>
          </div>
          <div class="adm-field">
            <label>Customer Support Phone (Display)</label>
            <input type="text" id="set_phone_display" value="${esc(s.phone_display)}">
          </div>
          <div class="adm-field">
            <label>Support Email</label>
            <input type="email" id="set_email" value="${esc(s.email)}">
          </div>
        </div>

        <div class="adm-grid3">
          <div class="adm-field">
            <label>Free Delivery Threshold (AED)</label>
            <input type="number" id="set_free_ship" value="${esc(s.free_ship_threshold || 450)}">
            <span class="adm-hint">Orders above this qualify for free shipping</span>
          </div>
          <div class="adm-field">
            <label>Standard Delivery Fee (AED)</label>
            <input type="number" id="set_del_fee" value="${esc(s.delivery_fee || 20)}">
          </div>
          <div class="adm-field">
            <label>Delivery Promise Timeline</label>
            <input type="text" id="set_del_time" value="${esc(s.delivery_time || '1-2 Hour Express Delivery in Dubai & Sharjah')}">
          </div>
        </div>

        <div class="adm-grid2">
          <div class="adm-field">
            <label>Store Physical Address</label>
            <input type="text" id="set_address" value="${esc(s.address)}">
          </div>
          <div class="adm-field">
            <label>Google Maps Link</label>
            <input type="url" id="set_maps_url" value="${esc(s.maps_url)}">
          </div>
        </div>
      </div>

      <!-- SOCIAL MEDIA & LEGAL -->
      <div class="adm-card">
        <h3><span>⚖️</span> UAE Legal Compliance &amp; Social Links</h3>
        <p class="adm-card-sub">Mandatory 18+ nicotine health warning and official social channels</p>

        <div class="adm-grid2">
          <div class="adm-field">
            <label>Instagram URL</label>
            <input type="url" id="set_instagram" value="${esc(s.instagram_url || '')}">
          </div>
          <div class="adm-field">
            <label>Telegram URL</label>
            <input type="url" id="set_telegram" value="${esc(s.telegram_url || '')}">
          </div>
        </div>

        <div class="adm-field">
          <label>UAE 18+ Nicotine Health Warning Notice</label>
          <textarea id="set_legal_warning" rows="3">${esc(s.legal_warning || '')}</textarea>
        </div>
      </div>
    `;

    dom.content.innerHTML = html;

    // Logo Studio Bindings
    const logoTypeSel = document.getElementById('set_logo_type');
    const logoImgRow = document.getElementById('set_logo_img_row');

    logoTypeSel.addEventListener('change', (e) => {
      s.logo_type = e.target.value;
      logoImgRow.style.display = e.target.value === 'image' ? 'block' : 'none';
      markDirty('settings');
      renderSettings();
    });

    document.getElementById('set_logo_picker').appendChild(
      renderImgPicker('set_logo_input', s.logo_image || '', (path) => {
        s.logo_image = path;
        markDirty('settings');
        renderSettings();
      }, 'branding')
    );

    document.getElementById('set_brand_name').addEventListener('input', (e) => { s.brand_name = e.target.value; markDirty('settings'); });
    document.getElementById('set_brand_tagline').addEventListener('input', (e) => { s.brand_tagline = e.target.value; markDirty('settings'); });
    document.getElementById('set_order_prefix').addEventListener('input', (e) => { s.order_prefix = e.target.value; markDirty('settings'); });
    document.getElementById('set_wa_number').addEventListener('input', (e) => { s.wa_number = e.target.value.trim(); markDirty('settings'); });
    document.getElementById('set_phone_display').addEventListener('input', (e) => { s.phone_display = e.target.value; markDirty('settings'); });
    document.getElementById('set_email').addEventListener('input', (e) => { s.email = e.target.value.trim(); markDirty('settings'); });
    document.getElementById('set_free_ship').addEventListener('input', (e) => { s.free_ship_threshold = parseFloat(e.target.value) || 450; markDirty('settings'); });
    document.getElementById('set_del_fee').addEventListener('input', (e) => { s.delivery_fee = parseFloat(e.target.value) || 20; markDirty('settings'); });
    document.getElementById('set_del_time').addEventListener('input', (e) => { s.delivery_time = e.target.value; markDirty('settings'); });
    document.getElementById('set_address').addEventListener('input', (e) => { s.address = e.target.value; markDirty('settings'); });
    document.getElementById('set_maps_url').addEventListener('input', (e) => { s.maps_url = e.target.value; markDirty('settings'); });
    document.getElementById('set_instagram').addEventListener('input', (e) => { s.instagram_url = e.target.value; markDirty('settings'); });
    document.getElementById('set_telegram').addEventListener('input', (e) => { s.telegram_url = e.target.value; markDirty('settings'); });
    document.getElementById('set_legal_warning').addEventListener('input', (e) => { s.legal_warning = e.target.value; markDirty('settings'); });
  }

  /* ============================================================
     VIEW: SEO & SCHEMA ENGINE
     ============================================================ */
  function renderSEO() {
    dom.viewTitle.textContent = 'SEO & Schema Engine';
    const seo = state.data.seo;
    const settings = state.data.settings;

    let html = `
      <div class="adm-card is-highlight">
        <h3><span>🔍</span> Maximum Google SEO &amp; Rich Snippets</h3>
        <p class="adm-card-sub">Zero SEO gaps: Meta titles, meta descriptions, sitemaps, robots.txt, and structured data schemas</p>

        <div class="adm-field">
          <label>Canonical Production URL</label>
          <input type="url" id="seo_site_url" value="${esc(seo.site_url || 'https://iqosai.com')}">
        </div>

        <div class="adm-card" style="background:var(--adm-panel2);margin-top:14px;">
          <h4>Structured Data Schemas (JSON-LD)</h4>
          <div class="adm-grid2" style="margin-top:10px;">
            <label class="adm-check">
              <input type="checkbox" id="sc_prod" ${seo.schema_product ? 'checked' : ''}>
              <span>Product Schema (AggregateRating + Offers)</span>
            </label>
            <label class="adm-check">
              <input type="checkbox" id="sc_local" ${seo.schema_local_business ? 'checked' : ''}>
              <span>LocalBusiness / Store Schema (Dubai Map)</span>
            </label>
            <label class="adm-check">
              <input type="checkbox" id="sc_faq" ${seo.schema_faq_page ? 'checked' : ''}>
              <span>FAQPage Schema (Google Accordion)</span>
            </label>
            <label class="adm-check">
              <input type="checkbox" id="sc_bread" ${seo.schema_breadcrumb ? 'checked' : ''}>
              <span>BreadcrumbList Schema</span>
            </label>
          </div>
        </div>

        <!-- Google SERP Snippet Preview for Homepage -->
        <div class="adm-serp-preview">
          <div class="adm-serp-toggle">
            <span style="font-size:12px;font-weight:700;color:#9aa0a6;">HOMEPAGE GOOGLE SEARCH PREVIEW</span>
            <span style="font-size:11px;color:#8ab4f8;">Google Search AE</span>
          </div>
          <div class="adm-serp-url-row">
            <span class="adm-serp-fav">⚡</span>
            <span class="adm-serp-site">iqosai.com</span>
          </div>
          <div class="adm-serp-title" id="homeSerpTitle">${esc(seo.pages.home.title)}</div>
          <div class="adm-serp-desc" id="homeSerpDesc">${esc(seo.pages.home.description)}</div>
          <div class="adm-serp-rating">★★★★★ <span>4.9 (214 reviews) · Dubai Express</span></div>
        </div>

        <div class="adm-field" style="margin-top:18px;">
          <label>Homepage SEO Title</label>
          <input type="text" id="seo_home_title" value="${esc(seo.pages.home.title)}">
        </div>
        <div class="adm-field">
          <label>Homepage Meta Description</label>
          <textarea id="seo_home_desc" rows="3">${esc(seo.pages.home.description)}</textarea>
        </div>
        <div class="adm-field">
          <label>Homepage Focus Keywords</label>
          <input type="text" id="seo_home_kw" value="${esc(seo.pages.home.keywords)}">
        </div>
      </div>
    `;

    dom.content.innerHTML = html;

    const homeTitleInput = document.getElementById('seo_home_title');
    const homeDescInput = document.getElementById('seo_home_desc');
    const serpTitle = document.getElementById('homeSerpTitle');
    const serpDesc = document.getElementById('homeSerpDesc');

    attachCharMeter(homeTitleInput, 45, 65);
    attachCharMeter(homeDescInput, 140, 160);

    homeTitleInput.addEventListener('input', (e) => {
      seo.pages.home.title = e.target.value;
      serpTitle.textContent = e.target.value || 'Vape Club Dubai';
      markDirty('seo');
    });
    homeDescInput.addEventListener('input', (e) => {
      seo.pages.home.description = e.target.value;
      serpDesc.textContent = e.target.value || '';
      markDirty('seo');
    });

    document.getElementById('seo_site_url').addEventListener('input', (e) => { seo.site_url = e.target.value.trim(); markDirty('seo'); });
    document.getElementById('seo_home_kw').addEventListener('input', (e) => { seo.pages.home.keywords = e.target.value; markDirty('seo'); });
    document.getElementById('sc_prod').addEventListener('change', (e) => { seo.schema_product = e.target.checked; markDirty('seo'); });
    document.getElementById('sc_local').addEventListener('change', (e) => { seo.schema_local_business = e.target.checked; markDirty('seo'); });
    document.getElementById('sc_faq').addEventListener('change', (e) => { seo.schema_faq_page = e.target.checked; markDirty('seo'); });
    document.getElementById('sc_bread').addEventListener('change', (e) => { seo.schema_breadcrumb = e.target.checked; markDirty('seo'); });
  }

  /* ============================================================
     VIEW: ORDERS & CATEGORIES & ACCOUNT
     ============================================================ */
  function renderOrders() {
    dom.viewTitle.textContent = 'Orders';
    const orders = (state.data.orders && state.data.orders.orders) || [];

    let html = `
      <div class="adm-card" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div>
          <b>Customer Orders (${orders.length})</b>
          <div style="font-size:12px;color:var(--adm-muted);">Live checkout and WhatsApp orders</div>
        </div>
        <button class="adm-btn adm-btn-sm" onclick="ADM.refreshOrders()">🔄 Refresh</button>
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Destination</th>
              <th>Total</th>
              <th>Status</th>
              <th style="text-align:right">Action</th>
            </tr>
          </thead>
          <tbody>
            ${orders.length === 0 ? `
              <tr><td colspan="6" style="text-align:center;padding:36px;color:var(--adm-muted)">No orders recorded yet.</td></tr>
            ` : orders.map(o => `
              <tr>
                <td><b>${esc(o.id || 'N/A')}</b><div style="font-size:11px;color:var(--adm-muted)">${esc(o.created_at || o.date || 'Recent')}</div></td>
                <td><b>${esc(o.name || o.customer || 'Guest')}</b><div style="font-size:11px;color:var(--adm-muted)"><a href="tel:${esc(o.phone || '')}">${esc(o.phone || '')}</a></div></td>
                <td><b>${esc(o.emirate || 'Dubai')}</b></td>
                <td><b style="color:var(--adm-emerald)">${esc(o.total || 0)} AED</b></td>
                <td>
                  <select class="adm-select-status" data-orderid="${esc(o.id)}">
                    <option value="new" ${o.status === 'new' ? 'selected' : ''}>New</option>
                    <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                  </select>
                </td>
                <td style="text-align:right">
                  <button class="adm-btn adm-btn-sm adm-btn-danger" onclick="ADM.deleteOrder('${esc(o.id)}')">✕</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    dom.content.innerHTML = html;

    dom.content.querySelectorAll('.adm-select-status').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.dataset.orderid;
        const status = e.target.value;
        sel.disabled = true;
        try {
          const res = await api('order_status', { id, status });
          if (res && res.ok) {
            toast(`Order ${id} marked as ${status}.`);
            const target = orders.find(o => o.id === id);
            if (target) target.status = status;
            updateOrdersBadge();
          }
        } catch (ex) {
          toast('Failed to update status', true);
        } finally {
          sel.disabled = false;
        }
      });
    });
  }

  function renderCategories() {
    dom.viewTitle.textContent = 'Categories';
    const cats = state.data.categories.cats || {};
    const labels = state.data.categories.labels || {};

    let html = `
      <div class="adm-card">
        <h3><span>🗂️</span> Store Categories</h3>
        <p class="adm-card-sub">Manage active categories and navigation labels</p>
        <div class="adm-grid2">
          ${Object.keys(cats).map(slug => `
            <div class="adm-card" style="background:var(--adm-panel2);padding:14px;">
              <b>${esc(labels[slug] || slug)}</b>
              <div style="font-size:12px;color:var(--adm-muted);margin:4px 0 10px;">Slug: <code>${esc(slug)}</code></div>
              <div class="adm-field">
                <label>Display Label</label>
                <input type="text" class="cat-label-input" data-slug="${esc(slug)}" value="${esc(labels[slug] || slug)}">
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    dom.content.innerHTML = html;

    dom.content.querySelectorAll('.cat-label-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const slug = e.target.dataset.slug;
        labels[slug] = e.target.value;
        markDirty('categories');
      });
    });
  }

  function renderAccount() {
    dom.viewTitle.textContent = 'Account & Backup';
    let html = `
      <div class="adm-card">
        <h3><span>💾</span> Full Store Data Backup</h3>
        <p class="adm-card-sub">Export all catalog, homepage customizer, and SEO settings as JSON</p>
        <button class="adm-btn adm-btn-primary" onclick="window.location.href='/admin/api.php?action=backup'">
          📥 Download JSON Backup
        </button>
      </div>

      <div class="adm-card">
        <h3><span>🔐</span> Change Admin Credentials</h3>
        <p class="adm-card-sub">Update administrator password for security</p>
        <div class="adm-grid2">
          <div class="adm-field">
            <label>Current Password</label>
            <input type="password" id="pw_cur" placeholder="••••••••">
          </div>
          <div class="adm-field">
            <label>New Password (min 8 characters)</label>
            <input type="password" id="pw_new" placeholder="••••••••">
          </div>
        </div>
        <button class="adm-btn adm-btn-gold" id="btnChangePw">Update Password</button>
      </div>
    `;

    dom.content.innerHTML = html;

    document.getElementById('btnChangePw').addEventListener('click', async () => {
      const cur = document.getElementById('pw_cur').value;
      const nw = document.getElementById('pw_new').value;
      if (!cur || nw.length < 8) {
        toast('Password must be at least 8 characters.', true);
        return;
      }
      try {
        const res = await api('change_password', { current: cur, new: nw });
        if (res && res.ok) {
          toast('Password updated successfully!');
          document.getElementById('pw_cur').value = '';
          document.getElementById('pw_new').value = '';
        } else {
          toast('Password update failed: ' + (res.error || 'Incorrect current password'), true);
        }
      } catch (ex) {
        toast('Error updating password.', true);
      }
    });
  }

  /* ============================================================
     ROUTER & VIEW SWITCHER
     ============================================================ */
  function switchView(viewName, subview = '') {
    state.view = viewName;
    state.subview = subview;
    state.editingProductIndex = null;
    closeMobileMenu();

    if (dom.nav) {
      dom.nav.querySelectorAll('.adm-nav-btn').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.view === viewName);
      });
    }

    renderCurrentView();
    window.scrollTo(0, 0);
  }

  function renderCurrentView() {
    switch (state.view) {
      case 'dashboard': renderDashboard(); break;
      case 'products': renderProducts(); break;
      case 'categories': renderCategories(); break;
      case 'homepage': renderHomepage(); break;
      case 'seo': renderSEO(); break;
      case 'orders': renderOrders(); break;
      case 'settings': renderSettings(); break;
      case 'account': renderAccount(); break;
      default: renderDashboard(); break;
    }
  }

  /* ============================================================
     GLOBAL ACTIONS (Exposed on window.ADM)
     ============================================================ */
  window.ADM = {
    state,
    switchView,
    newProduct: () => {
      state.view = 'products';
      state.editingProductIndex = -1;
      state.peActiveTab = 'basic';
      closeMobileMenu();
      renderCurrentView();
      window.scrollTo(0, 0);
    },
    editProduct: (idx) => {
      state.view = 'products';
      state.editingProductIndex = idx;
      state.peActiveTab = 'basic';
      closeMobileMenu();
      renderCurrentView();
      window.scrollTo(0, 0);
    },
    deleteProduct: (idx) => {
      const prods = state.data.products.products;
      const name = prods[idx] ? prods[idx].name : 'this item';
      if (confirm(`Delete product "${name}"?`)) {
        prods.splice(idx, 1);
        markDirty('products');
        toast(`Deleted "${name}".`);
        renderProducts();
      }
    },
    deleteOrder: async (id) => {
      if (confirm(`Delete order ${id}?`)) {
        try {
          const res = await api('order_delete', { id });
          if (res && res.ok) {
            toast(`Order ${id} deleted.`);
            state.data.orders.orders = (state.data.orders.orders || []).filter(o => o.id !== id);
            updateOrdersBadge();
            renderOrders();
          }
        } catch (e) {
          toast('Failed to delete order', true);
        }
      }
    },
    refreshOrders: async () => {
      try {
        const res = await api('get');
        if (res && res.ok && res.data && res.data.orders) {
          state.data.orders = res.data.orders;
          updateOrdersBadge();
          renderOrders();
          toast('Orders refreshed.');
        }
      } catch (e) {
        toast('Failed to refresh orders', true);
      }
    },
    openSectionModal
  };

  /* ============================================================
     INITIALIZATION
     ============================================================ */
  async function init() {
    // Navigation listeners
    if (dom.nav) {
      dom.nav.querySelectorAll('.adm-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
      });
    }

    if (dom.saveBtn) dom.saveBtn.addEventListener('click', saveAll);
    if (dom.menuBtn) dom.menuBtn.addEventListener('click', openMobileMenu);
    if (dom.sideClose) dom.sideClose.addEventListener('click', closeMobileMenu);
    if (dom.backdrop) dom.backdrop.addEventListener('click', closeMobileMenu);

    if (dom.logoutBtn) {
      dom.logoutBtn.addEventListener('click', async () => {
        if (state.dirty.size > 0 && !confirm('You have unsaved changes. Really logout?')) return;
        await api('logout');
        location.reload();
      });
    }

    try {
      const [resData, resImgs] = await Promise.all([
        api('get'),
        api('images')
      ]);

      if (!resData || !resData.ok || !resData.data) {
        throw new Error('Failed to load store data');
      }

      state.data = resData.data;
      state.images = (resImgs && resImgs.images) || [];
      refreshDatalist();
      updateOrdersBadge();

      switchView('dashboard');

      // 30-sec order poller
      state.pollTimer = setInterval(async () => {
        try {
          const res = await api('get');
          if (res && res.ok && res.data && res.data.orders) {
            state.data.orders = res.data.orders;
            updateOrdersBadge();
            if (state.view === 'orders') renderOrders();
          }
        } catch (e) {}
      }, 30000);

    } catch (err) {
      dom.content.innerHTML = `
        <div class="adm-card" style="border-color:var(--adm-red);text-align:center;padding:40px;">
          <h3 style="color:var(--adm-red);justify-content:center;">⚠️ Failed to load store data</h3>
          <p style="color:var(--adm-muted);margin:10px 0 20px;">${esc(err.message || 'Server error')}</p>
          <button class="adm-btn adm-btn-primary" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
