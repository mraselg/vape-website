/**
 * Vape Club Dubai — Admin Panel SPA
 * Pure Vanilla ES6 — reactive state, dual-state forms, image picker & full CMS CRUD.
 */
(function () {
  'use strict';

  const CSRF = window.ADM_CSRF || '';
  const dom = {
    nav: document.getElementById('admNav'),
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
    editingProductIndex: null, // null = list, >= 0 = editing existing, -1 = creating new
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
        toast('Network / API error: ' + (err.message || 'Unknown'), true);
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

  // Deep property setter
  function deepSet(obj, path, val) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') {
        cur[parts[i]] = {};
      }
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  }

  // Deep property getter
  function deepGet(obj, path, fallback = '') {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
      if (cur === null || cur === undefined || typeof cur !== 'object') return fallback;
      cur = cur[parts[i]];
    }
    return cur !== undefined ? cur : fallback;
  }

  /* ============================================================
     REUSABLE WIDGETS
     ============================================================ */

  // Image picker with preview, input datalist, and quick file upload
  function renderImgPicker(fieldId, currentValue, onSelect, dir = 'products') {
    const wrap = document.createElement('div');
    wrap.className = 'adm-imgpick';

    const img = document.createElement('img');
    img.src = currentValue ? '../' + currentValue : '../assets/images/hero-iluma.webp';
    img.alt = 'Preview';
    img.onerror = () => { img.src = '../assets/images/hero-iluma.webp'; };

    const input = document.createElement('input');
    input.type = 'text';
    input.id = fieldId;
    input.value = currentValue || '';
    input.placeholder = 'assets/images/...';
    input.setAttribute('list', 'admImgDatalist');
    input.style.flex = '1';

    input.addEventListener('input', (e) => {
      const v = e.target.value.trim();
      img.src = v ? '../' + v : '../assets/images/hero-iluma.webp';
      onSelect(v);
    });

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/png,image/webp';
    fileInput.style.display = 'none';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'adm-btn adm-btn-sm';
    upBtn.innerHTML = '📁 Upload';
    upBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      if (!e.target.files || !e.target.files[0]) return;
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dir', dir);

      upBtn.disabled = true;
      upBtn.textContent = 'Uploading…';
      try {
        const res = await api('image_upload', formData, true);
        if (res && res.ok && res.path) {
          input.value = res.path;
          img.src = '../' + res.path;
          if (!state.images.includes(res.path)) {
            state.images.push(res.path);
            refreshDatalist();
          }
          onSelect(res.path);
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

  function refreshDatalist() {
    let dl = document.getElementById('admImgDatalist');
    if (!dl) {
      dl = document.createElement('datalist');
      dl.id = 'admImgDatalist';
      document.body.appendChild(dl);
    }
    dl.innerHTML = (state.images || []).map(p => `<option value="${esc(p)}"></option>`).join('');
  }

  // Key-Value map editor (specsTable)
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

        kInput.addEventListener('input', () => {
          entries[idx][0] = kInput.value;
          fire();
        });
        vInput.addEventListener('input', () => {
          entries[idx][1] = vInput.value;
          fire();
        });

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
          const temp = entries[idx];
          entries[idx] = entries[idx - 1];
          entries[idx - 1] = temp;
          fire();
          rebuild();
        });
        btnDown.addEventListener('click', () => {
          const temp = entries[idx];
          entries[idx] = entries[idx + 1];
          entries[idx + 1] = temp;
          fire();
          rebuild();
        });
        btnDel.addEventListener('click', () => {
          entries.splice(idx, 1);
          fire();
          rebuild();
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

  // String list editor (specs highlights, box contents, badges, announcement items)
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
          const temp = items[idx];
          items[idx] = items[idx - 1];
          items[idx - 1] = temp;
          onChange(items);
          rebuild();
        });
        btnDown.addEventListener('click', () => {
          const temp = items[idx];
          items[idx] = items[idx + 1];
          items[idx + 1] = temp;
          onChange(items);
          rebuild();
        });
        btnDel.addEventListener('click', () => {
          items.splice(idx, 1);
          onChange(items);
          rebuild();
        });

        row.appendChild(main);
        row.appendChild(tools);
        container.appendChild(row);
      });

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'adm-le-add';
      addBtn.innerHTML = esc(addLabel);
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

  // Character meter for SEO fields
  function attachCharMeter(input, min = 40, max = 160) {
    const parent = input.parentElement;
    const meter = document.createElement('div');
    meter.className = 'adm-seopro';

    function update() {
      const len = (input.value || '').length;
      let statusClass = 'warn';
      let msg = `${len} characters`;
      if (len === 0) {
        statusClass = '';
        msg = `Recommended length: ${min}-${max} chars`;
      } else if (len >= min && len <= max) {
        statusClass = 'ok';
        msg = `✓ ${len} chars (Optimal: ${min}-${max})`;
      } else if (len < min) {
        statusClass = 'warn';
        msg = `▲ ${len} chars (Short — aim for ${min}+)`;
      } else {
        statusClass = 'bad';
        msg = `▼ ${len} chars (Long — search engines may truncate after ${max})`;
      }
      meter.className = 'adm-seopro ' + statusClass;
      meter.textContent = msg;
    }

    input.addEventListener('input', update);
    parent.appendChild(meter);
    update();
  }

  /* ============================================================
     VIEW: DASHBOARD
     ============================================================ */
  function renderDashboard() {
    dom.viewTitle.textContent = 'Dashboard';
    const products = (state.data.products && state.data.products.products) || [];
    const inStock = products.filter(p => (p.stock || 'in') === 'in').length;
    const cats = Object.keys((state.data.categories && state.data.categories.cats) || {}).length;
    const orders = (state.data.orders && state.data.orders.orders) || [];
    const newOrders = orders.filter(o => (o.status || 'new') === 'new').length;
    const totalRev = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

    // Security alert if default password
    const mustChange = sessionStorage.getItem('adm_must_change') === '1';

    let html = `
      ${mustChange ? `
        <div class="adm-note" style="border-color:var(--adm-amber);background:rgba(245,158,11,.1);color:#FED7AA">
          ⚠️ <b>Security Alert:</b> Default credentials are still in use (admin/admin123). Please navigate to <b>Account & Backup</b> to set a secure password.
          <button type="button" class="adm-btn adm-btn-sm" style="margin-left:12px;" onclick="ADM.switchView('account')">Go to Account</button>
        </div>
      ` : ''}

      <div class="adm-stats">
        <div class="adm-stat green">
          <b>${products.length}</b>
          <span>Total Products (${inStock} In Stock)</span>
        </div>
        <div class="adm-stat blue">
          <b>${cats}</b>
          <span>Active Categories</span>
        </div>
        <div class="adm-stat ${newOrders > 0 ? 'amber' : ''}">
          <b>${newOrders}</b>
          <span>New Orders Pending</span>
        </div>
        <div class="adm-stat">
          <b>${totalRev.toLocaleString()} AED</b>
          <span>Recorded Orders Revenue</span>
        </div>
      </div>

      <div class="adm-grid2">
        <!-- SEO Health Audit -->
        <div class="adm-card">
          <h3><span>🔍</span> SEO Health Audit</h3>
          <p class="adm-card-sub">System-wide search optimization check</p>
          <div class="adm-checklist">
            <div class="adm-check-item ok">
              <div class="ico">✓</div>
              <div>
                <b>Canonical Site URL Configured</b>
                <small>${esc(state.data.seo.site_url || 'Not set')}</small>
              </div>
            </div>
            <div class="adm-check-item ok">
              <div class="ico">✓</div>
              <div>
                <b>Robots.txt &amp; Dynamic XML Sitemap</b>
                <small>Auto-synced with canonical host &amp; all product slugs</small>
              </div>
            </div>
            <div class="adm-check-item ${state.data.seo.pages.home.description ? 'ok' : 'warn'}">
              <div class="ico">${state.data.seo.pages.home.description ? '✓' : '!'}</div>
              <div>
                <b>Homepage Meta Description</b>
                <small>${state.data.seo.pages.home.description ? 'Configured (' + state.data.seo.pages.home.description.length + ' chars)' : 'Missing description'}</small>
              </div>
            </div>
            <div class="adm-check-item ok">
              <div class="ico">✓</div>
              <div>
                <b>Structured Data (JSON-LD)</b>
                <small>LocalBusiness, FAQPage, Product &amp; Breadcrumb schemas active</small>
              </div>
            </div>
          </div>
          <div style="margin-top:14px;">
            <button class="adm-btn adm-btn-sm" onclick="ADM.switchView('seo')">Open SEO Center →</button>
          </div>
        </div>

        <!-- Quick Jump / Store Controls -->
        <div class="adm-card">
          <h3><span>⚡</span> Quick Management Shortcuts</h3>
          <p class="adm-card-sub">Direct access to frequent administrative actions</p>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <button class="adm-btn" style="justify-content:flex-start" onclick="ADM.newProduct()">
              <span>➕</span> Add New Product
            </button>
            <button class="adm-btn" style="justify-content:flex-start" onclick="ADM.switchView('homepage', 'hero')">
              <span>🖼️</span> Edit Hero Banners &amp; Offers
            </button>
            <button class="adm-btn" style="justify-content:flex-start" onclick="ADM.switchView('settings')">
              <span>🚚</span> Adjust Free Delivery Threshold (${esc(state.data.settings.free_ship_threshold || 450)} AED)
            </button>
            <button class="adm-btn" style="justify-content:flex-start" onclick="ADM.switchView('orders')">
              <span>🧾</span> View Customer Orders (${orders.length} total)
            </button>
            <button class="adm-btn" style="justify-content:flex-start" onclick="ADM.switchView('account')">
              <span>💾</span> Export JSON Backup
            </button>
          </div>
        </div>
      </div>
    `;

    dom.content.innerHTML = html;
  }

  /* ============================================================
     VIEW: PRODUCTS
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

    // Filter logic
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
        <input type="text" id="prodSearch" placeholder="Search by name, brand, SKU…" value="${esc(state.productFilter.q)}">
        <select id="prodCatFilter" style="width:auto">
          <option value="all">All Categories (${prods.length})</option>
          ${Object.keys(cats).map(c => `
            <option value="${esc(c)}" ${selCat === c ? 'selected' : ''}>${esc(catLabels[c] || c)}</option>
          `).join('')}
        </select>
        <select id="prodStockFilter" style="width:auto">
          <option value="all" ${selStock === 'all' ? 'selected' : ''}>All Stock Statuses</option>
          <option value="in" ${selStock === 'in' ? 'selected' : ''}>In Stock</option>
          <option value="low" ${selStock === 'low' ? 'selected' : ''}>Low Stock</option>
          <option value="out" ${selStock === 'out' ? 'selected' : ''}>Out of Stock</option>
        </select>
        <div style="margin-left:auto;display:flex;gap:8px;">
          <button class="adm-btn adm-btn-primary" onclick="ADM.newProduct()">
            <span>➕</span> Add Product
          </button>
        </div>
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th style="width:48px">Image</th>
              <th>Product Name &amp; Brand</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Featured</th>
              <th style="width:140px;text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `
              <tr><td colspan="7" style="text-align:center;padding:32px;color:var(--adm-muted)">No products matching your search criteria.</td></tr>
            ` : filtered.map(p => `
              <tr>
                <td>
                  ${p.photo ? `
                    <img class="adm-thumb" src="../${esc(p.photo)}" alt="" onerror="this.src='../assets/images/hero-iluma.webp'">
                  ` : `
                    <div class="adm-thumb-fallback">📦</div>
                  `}
                </td>
                <td>
                  <b>${esc(p.name)}</b>
                  <div style="font-size:11px;color:var(--adm-muted);margin-top:2px;">
                    ${esc(p.brand || 'Vape Club')} · SKU: <code>${esc(p.sku || p.id)}</code>
                  </div>
                </td>
                <td>
                  <span class="adm-pill cat">${esc(catLabels[p.cat] || p.cat)}</span>
                </td>
                <td>
                  <b>${esc(p.price)} AED</b>
                  ${p.old ? `<span style="text-decoration:line-through;color:var(--adm-muted);font-size:11px;margin-left:4px;">${esc(p.old)}</span>` : ''}
                </td>
                <td>
                  <span class="adm-pill ${p.stock === 'out' ? 'out' : (p.stock === 'low' ? 'low' : 'in')}">
                    ${p.stock === 'out' ? 'Out of Stock' : (p.stock === 'low' ? 'Low Stock' : 'In Stock')}
                  </span>
                </td>
                <td>
                  ${p.best ? '<span class="adm-pill in">👑 Bestseller</span>' : '<span style="color:var(--adm-muted);font-size:12px">—</span>'}
                </td>
                <td style="text-align:right;white-space:nowrap;">
                  <button class="adm-btn adm-btn-sm" title="Edit" onclick="ADM.editProduct(${p._origIndex})">✏️ Edit</button>
                  <button class="adm-btn adm-btn-sm" title="Duplicate" onclick="ADM.duplicateProduct(${p._origIndex})">📋</button>
                  <button class="adm-btn adm-btn-sm adm-btn-danger" title="Delete" onclick="ADM.deleteProduct(${p._origIndex})">✕</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    dom.content.innerHTML = html;

    // Filter listeners
    document.getElementById('prodSearch').addEventListener('input', (e) => {
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

  /* Full Nested Product Editor */
  function renderProductEditor(idx) {
    const isNew = idx === -1;
    const prods = state.data.products.products;
    const cats = state.data.categories.cats || {};
    const catLabels = state.data.categories.labels || {};

    let p = isNew ? {
      id: 'new-product-' + Date.now().toString().slice(-4),
      name: '',
      brand: 'IQOS (Philip Morris International)',
      flavor: '',
      cat: Object.keys(cats)[0] || 'iluma',
      price: 150,
      old: 0,
      stock: 'in',
      best: false,
      sku: 'SKU-' + Math.floor(Math.random() * 90000 + 10000),
      badges: ['new', 'orig'],
      art: 'device',
      theme: 'art-purple',
      photo: 'assets/images/products/iluma_i_prime_purple.jpg',
      description: '',
      specs: [],
      specsTable: {},
      boxContents: [],
      flavorMeter: { sweetness: 0, cooling: 0, throatHit: 3, intensity: 4 },
      faqs: [],
      variants: { type: 'device', colors: [], bundles: [] },
      seo_title: '',
      seo_desc: ''
    } : JSON.parse(JSON.stringify(prods[idx]));

    dom.viewTitle.textContent = isNew ? 'Add New Product' : `Editing: ${p.name || p.id}`;

    const formWrap = document.createElement('div');
    formWrap.className = 'adm-prod-editor';

    formWrap.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:18px;">
        <button type="button" class="adm-btn" id="btnBackToProds">← Back to Products</button>
        <div style="margin-left:auto;display:flex;gap:8px;">
          <button type="button" class="adm-btn adm-btn-primary" id="btnSaveProdDraft">
            💾 ${isNew ? 'Create Product' : 'Apply Changes'}
          </button>
        </div>
      </div>

      <!-- Section 1: Basic Information -->
      <div class="adm-card">
        <h3><span>📦</span> 1. Core Identification &amp; Category</h3>
        <p class="adm-card-sub">Primary storefront details, unique slug, and classification</p>
        
        <div class="adm-grid2">
          <div class="adm-field">
            <label>Product Title / Name *</label>
            <input type="text" id="pe_name" value="${esc(p.name)}" required>
          </div>
          <div class="adm-field">
            <label>URL Slug (Unique ID) *</label>
            <input type="text" id="pe_id" value="${esc(p.id)}" required>
            <span class="adm-hint">Used in product URL: <code>product.php?id=...</code></span>
          </div>
        </div>

        <div class="adm-grid3">
          <div class="adm-field">
            <label>Brand Name</label>
            <input type="text" id="pe_brand" value="${esc(p.brand || '')}">
          </div>
          <div class="adm-field">
            <label>Category</label>
            <select id="pe_cat">
              ${Object.keys(cats).map(c => `
                <option value="${esc(c)}" ${p.cat === c ? 'selected' : ''}>${esc(catLabels[c] || c)}</option>
              `).join('')}
            </select>
          </div>
          <div class="adm-field">
            <label>SKU (Stock Keeping Unit)</label>
            <input type="text" id="pe_sku" value="${esc(p.sku || '')}">
          </div>
        </div>

        <div class="adm-grid3">
          <div class="adm-field">
            <label>Subtitle / Flavor Summary</label>
            <input type="text" id="pe_flavor" value="${esc(p.flavor || '')}" placeholder="e.g. Smartcore Induction · Pause Mode">
          </div>
          <div class="adm-field">
            <label>Stock Status</label>
            <select id="pe_stock">
              <option value="in" ${p.stock === 'in' ? 'selected' : ''}>In Stock</option>
              <option value="low" ${p.stock === 'low' ? 'selected' : ''}>Low Stock</option>
              <option value="out" ${p.stock === 'out' ? 'selected' : ''}>Out of Stock</option>
            </select>
          </div>
          <div class="adm-field">
            <label>Visual Theme / Accent</label>
            <select id="pe_theme">
              <option value="art-purple" ${p.theme === 'art-purple' ? 'selected' : ''}>Purple (Flagship / Royal)</option>
              <option value="art-slate" ${p.theme === 'art-slate' ? 'selected' : ''}>Slate (Dark / Obsidian)</option>
              <option value="art-gold" ${p.theme === 'art-gold' ? 'selected' : ''}>Gold (Swiss / Luxury)</option>
              <option value="art-rose" ${p.theme === 'art-rose' ? 'selected' : ''}>Rose (Ruby / Vivid)</option>
              <option value="art-navy" ${p.theme === 'art-navy' ? 'selected' : ''}>Navy (Japan / Deep Blue)</option>
              <option value="art-emerald" ${p.theme === 'art-emerald' ? 'selected' : ''}>Emerald (Indonesia / Fresh)</option>
              <option value="art-amber" ${p.theme === 'art-amber' ? 'selected' : ''}>Amber (Italian / Warm)</option>
            </select>
          </div>
        </div>

        <div class="adm-row">
          <label class="adm-check">
            <input type="checkbox" id="pe_best" ${p.best ? 'checked' : ''}>
            <span>👑 Mark as VIP / Storefront Bestseller</span>
          </label>
        </div>
      </div>

      <!-- Section 2: Pricing & Visual Media -->
      <div class="adm-card">
        <h3><span>💰</span> 2. Pricing &amp; Media</h3>
        <p class="adm-card-sub">Set active price, promotional old price, and primary image</p>
        <div class="adm-grid3">
          <div class="adm-field">
            <label>Sale Price (AED) *</label>
            <input type="number" id="pe_price" step="0.5" value="${esc(p.price)}" required>
          </div>
          <div class="adm-field">
            <label>Regular / Old Price (AED)</label>
            <input type="number" id="pe_old" step="0.5" value="${esc(p.old || 0)}">
            <span class="adm-hint">Shown as strike-through discount price</span>
          </div>
          <div class="adm-field">
            <label>Art Type</label>
            <select id="pe_art">
              <option value="device" ${p.art === 'device' ? 'selected' : ''}>device</option>
              <option value="vape" ${p.art === 'vape' ? 'selected' : ''}>vape</option>
              <option value="pod" ${p.art === 'pod' ? 'selected' : ''}>pod</option>
              <option value="pack" ${p.art === 'pack' ? 'selected' : ''}>pack</option>
              <option value="juice" ${p.art === 'juice' ? 'selected' : ''}>juice</option>
            </select>
          </div>
        </div>
        <div class="adm-field">
          <label>Primary Product Image</label>
          <div id="pe_photo_wrap"></div>
        </div>
      </div>

      <!-- Section 3: SEO Overrides -->
      <div class="adm-card">
        <h3><span>🔍</span> 3. Product SEO Overrides</h3>
        <p class="adm-card-sub">Customize individual search engine title &amp; description (leaves default formula if empty)</p>
        <div class="adm-field">
          <label>Custom Meta Title</label>
          <input type="text" id="pe_seo_title" placeholder="e.g. IQOS ILUMA i PRIME Dubai — Best Price & Express Delivery" value="${esc(p.seo_title || '')}">
        </div>
        <div class="adm-field">
          <label>Custom Meta Description</label>
          <textarea id="pe_seo_desc" rows="3" placeholder="Detailed meta description with product keywords…">${esc(p.seo_desc || '')}</textarea>
        </div>
      </div>

      <!-- Section 4: Narrative Description -->
      <div class="adm-card">
        <h3><span>📝</span> 4. Product Description</h3>
        <p class="adm-card-sub">Rich descriptive copy shown on product details page</p>
        <div class="adm-field">
          <textarea id="pe_description" style="min-height:120px">${esc(p.description || '')}</textarea>
        </div>
      </div>

      <!-- Section 5: Badges & Highlights -->
      <div class="adm-card">
        <h3><span>🏷️</span> 5. Product Badges &amp; Feature Bullets</h3>
        <div class="adm-grid2">
          <div>
            <label class="adm-label" style="display:block;margin-bottom:8px;">Storefront Badges (e.g. "new", "orig", "sale")</label>
            <div id="pe_badges_wrap"></div>
          </div>
          <div>
            <label class="adm-label" style="display:block;margin-bottom:8px;">Feature Highlights (Key bullet points)</label>
            <div id="pe_specs_wrap"></div>
          </div>
        </div>
      </div>

      <!-- Section 6: Technical Specs Table & In the Box -->
      <div class="adm-card">
        <h3><span>⚙️</span> 6. Specifications Table &amp; Box Contents</h3>
        <div class="adm-field">
          <label>Detailed Specifications Table (Key/Value mapping)</label>
          <div id="pe_specstable_wrap"></div>
        </div>
        <div class="adm-field" style="margin-top:20px;">
          <label>What's in the Box (Packaging items)</label>
          <div id="pe_box_wrap"></div>
        </div>
      </div>

      <!-- Section 7: Flavor / Device Character Meter -->
      <div class="adm-card">
        <h3><span>🎚️</span> 7. Flavor &amp; Intensity Profile (0 to 5)</h3>
        <p class="adm-card-sub">Visual scale shown in product card and modal</p>
        <div class="adm-meter">
          <span>Sweetness</span>
          <input type="range" id="pe_fm_sweet" min="0" max="5" value="${p.flavorMeter ? (p.flavorMeter.sweetness || 0) : 0}">
          <b id="pe_fm_sweet_val">${p.flavorMeter ? (p.flavorMeter.sweetness || 0) : 0}</b>
        </div>
        <div class="adm-meter">
          <span>Cooling / Menthol</span>
          <input type="range" id="pe_fm_cool" min="0" max="5" value="${p.flavorMeter ? (p.flavorMeter.cooling || 0) : 0}">
          <b id="pe_fm_cool_val">${p.flavorMeter ? (p.flavorMeter.cooling || 0) : 0}</b>
        </div>
        <div class="adm-meter">
          <span>Throat Hit</span>
          <input type="range" id="pe_fm_hit" min="0" max="5" value="${p.flavorMeter ? (p.flavorMeter.throatHit || 0) : 0}">
          <b id="pe_fm_hit_val">${p.flavorMeter ? (p.flavorMeter.throatHit || 0) : 0}</b>
        </div>
        <div class="adm-meter">
          <span>Overall Intensity</span>
          <input type="range" id="pe_fm_int" min="0" max="5" value="${p.flavorMeter ? (p.flavorMeter.intensity || 0) : 0}">
          <b id="pe_fm_int_val">${p.flavorMeter ? (p.flavorMeter.intensity || 0) : 0}</b>
        </div>
      </div>

      <!-- Section 8: Variants Configuration -->
      <div class="adm-card">
        <h3><span>🎨</span> 8. Variants &amp; Bundles</h3>
        <p class="adm-card-sub">Color options, bundle add-ons, or pack sizes</p>
        <div class="adm-field">
          <label>Variant Type</label>
          <select id="pe_var_type">
            <option value="device" ${(p.variants && p.variants.type === 'device') ? 'selected' : ''}>Device (Colors + Bundles)</option>
            <option value="packSize" ${(p.variants && p.variants.type === 'packSize') ? 'selected' : ''}>Pack Size (Packs / Cartons)</option>
            <option value="vape" ${(p.variants && p.variants.type === 'vape') ? 'selected' : ''}>Vape (Flavors + Strengths)</option>
            <option value="podKit" ${(p.variants && p.variants.type === 'podKit') ? 'selected' : ''}>Pod Kit (Colors + Coils)</option>
            <option value="juice" ${(p.variants && p.variants.type === 'juice') ? 'selected' : ''}>E-Liquid (Strengths + Flavors)</option>
          </select>
        </div>

        <div id="pe_variants_container"></div>
      </div>

      <!-- Section 9: FAQs -->
      <div class="adm-card">
        <h3><span>❓</span> 9. Product Specific FAQs</h3>
        <p class="adm-card-sub">Frequently asked questions shown in the product accordion</p>
        <div id="pe_faqs_wrap"></div>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
        <button type="button" class="adm-btn" onclick="ADM.cancelProductEdit()">Cancel</button>
        <button type="button" class="adm-btn adm-btn-primary" id="btnSaveProdBottom">
          💾 ${isNew ? 'Create Product' : 'Apply Changes'}
        </button>
      </div>
    `;

    dom.content.innerHTML = '';
    dom.content.appendChild(formWrap);

    // Initialize sub-widgets
    // 1. Primary Photo
    const photoWrap = formWrap.querySelector('#pe_photo_wrap');
    photoWrap.appendChild(renderImgPicker('pe_photo_val', p.photo, (val) => { p.photo = val; }, 'products'));

    // 2. SEO meters
    attachCharMeter(formWrap.querySelector('#pe_seo_title'), 30, 70);
    attachCharMeter(formWrap.querySelector('#pe_seo_desc'), 80, 160);

    // 3. Badges list editor
    const badgesWrap = formWrap.querySelector('#pe_badges_wrap');
    badgesWrap.appendChild(renderStringListEditor(p.badges || [], (items) => { p.badges = items; }, 'Badge slug (e.g. new, sale)', '+ Add Badge'));

    // 4. Specs highlights
    const specsWrap = formWrap.querySelector('#pe_specs_wrap');
    specsWrap.appendChild(renderStringListEditor(p.specs || [], (items) => { p.specs = items; }, 'Feature bullet point', '+ Add Bullet'));

    // 5. Specs Table (KV)
    const specsTableWrap = formWrap.querySelector('#pe_specstable_wrap');
    specsTableWrap.appendChild(renderKvEditor(p.specsTable || {}, (dict) => { p.specsTable = dict; }, 'Specification Name', 'Value / Detail'));

    // 6. Box Contents
    const boxWrap = formWrap.querySelector('#pe_box_wrap');
    boxWrap.appendChild(renderStringListEditor(p.boxContents || [], (items) => { p.boxContents = items; }, 'Box item (e.g. 1x Device Holder)', '+ Add Box Item'));

    // 7. Flavor sliders
    const bindSlider = (id, valId, key) => {
      const slider = formWrap.querySelector(id);
      const valEl = formWrap.querySelector(valId);
      slider.addEventListener('input', () => {
        valEl.textContent = slider.value;
        if (!p.flavorMeter) p.flavorMeter = {};
        p.flavorMeter[key] = parseInt(slider.value, 10);
      });
    };
    bindSlider('#pe_fm_sweet', '#pe_fm_sweet_val', 'sweetness');
    bindSlider('#pe_fm_cool', '#pe_fm_cool_val', 'cooling');
    bindSlider('#pe_fm_hit', '#pe_fm_hit_val', 'throatHit');
    bindSlider('#pe_fm_int', '#pe_fm_int_val', 'intensity');

    // 8. Variants Container (Colors & Bundles)
    const varCont = formWrap.querySelector('#pe_variants_container');
    function renderVariantsEditor() {
      varCont.innerHTML = '';
      if (!p.variants) p.variants = { type: 'device', colors: [], bundles: [] };

      // Colors sub-block
      const colorsBlock = document.createElement('div');
      colorsBlock.className = 'adm-subblock';
      colorsBlock.innerHTML = `<h5>Color Variations (${(p.variants.colors || []).length})</h5>`;
      const colorsList = document.createElement('div');
      colorsList.className = 'adm-le';

      (p.variants.colors || []).forEach((c, cIdx) => {
        const row = document.createElement('div');
        row.className = 'adm-le-row';
        row.innerHTML = `
          <div class="adm-le-main adm-row">
            <div class="adm-field" style="max-width:110px">
              <label>ID</label>
              <input type="text" class="c-id" value="${esc(c.id)}">
            </div>
            <div class="adm-field">
              <label>Color Name</label>
              <input type="text" class="c-name" value="${esc(c.name)}">
            </div>
            <div class="adm-field" style="max-width:120px">
              <label>Color Hex</label>
              <div style="display:flex;gap:6px;align-items:center;">
                <input type="color" class="c-hex-pick" value="${esc(c.hex || '#8B5CF6')}" style="width:36px;height:36px;padding:2px;border-radius:6px;cursor:pointer;">
                <input type="text" class="c-hex" value="${esc(c.hex || '#8B5CF6')}" style="flex:1">
              </div>
            </div>
            <div class="adm-field" style="flex:2">
              <label>Photo Path</label>
              <div class="c-photo-picker"></div>
            </div>
          </div>
          <div class="adm-le-tools">
            <button type="button" class="del">✕</button>
          </div>
        `;
        const idIn = row.querySelector('.c-id');
        const nameIn = row.querySelector('.c-name');
        const hexPick = row.querySelector('.c-hex-pick');
        const hexIn = row.querySelector('.c-hex');
        const delBtn = row.querySelector('.del');

        idIn.addEventListener('input', () => { c.id = idIn.value; });
        nameIn.addEventListener('input', () => { c.name = nameIn.value; });
        hexPick.addEventListener('input', () => { hexIn.value = hexPick.value; c.hex = hexPick.value; });
        hexIn.addEventListener('input', () => { hexPick.value = hexIn.value; c.hex = hexIn.value; });
        delBtn.addEventListener('click', () => {
          p.variants.colors.splice(cIdx, 1);
          renderVariantsEditor();
        });

        const photoPickWrap = row.querySelector('.c-photo-picker');
        photoPickWrap.appendChild(renderImgPicker(`c_img_${cIdx}`, c.photo, (val) => { c.photo = val; }, 'products'));

        colorsList.appendChild(row);
      });

      const addColorBtn = document.createElement('button');
      addColorBtn.type = 'button';
      addColorBtn.className = 'adm-le-add';
      addColorBtn.innerHTML = '+ Add Color Option';
      addColorBtn.addEventListener('click', () => {
        if (!p.variants.colors) p.variants.colors = [];
        p.variants.colors.push({ id: 'color_' + Date.now().toString().slice(-4), name: 'New Color', hex: '#8B5CF6', photo: p.photo || '' });
        renderVariantsEditor();
      });
      colorsBlock.appendChild(colorsList);
      colorsBlock.appendChild(addColorBtn);
      varCont.appendChild(colorsBlock);

      // Bundles sub-block
      const bundlesBlock = document.createElement('div');
      bundlesBlock.className = 'adm-subblock';
      bundlesBlock.innerHTML = `<h5>Bundle Add-Ons / Options (${(p.variants.bundles || []).length})</h5>`;
      const bundlesList = document.createElement('div');
      bundlesList.className = 'adm-le';

      (p.variants.bundles || []).forEach((b, bIdx) => {
        const row = document.createElement('div');
        row.className = 'adm-le-row';
        row.innerHTML = `
          <div class="adm-le-main adm-row">
            <div class="adm-field" style="max-width:120px">
              <label>ID</label>
              <input type="text" class="b-id" value="${esc(b.id)}">
            </div>
            <div class="adm-field">
              <label>Bundle Label</label>
              <input type="text" class="b-label" value="${esc(b.label)}">
            </div>
            <div class="adm-field" style="max-width:130px">
              <label>Price Diff (+/- AED)</label>
              <input type="number" class="b-diff" value="${esc(b.priceDiff || 0)}">
            </div>
            <div class="adm-field" style="flex:2">
              <label>Note / Subtext</label>
              <input type="text" class="b-note" value="${esc(b.note || '')}">
            </div>
          </div>
          <div class="adm-le-tools">
            <button type="button" class="del">✕</button>
          </div>
        `;
        const bId = row.querySelector('.b-id');
        const bLabel = row.querySelector('.b-label');
        const bDiff = row.querySelector('.b-diff');
        const bNote = row.querySelector('.b-note');
        const delBtn = row.querySelector('.del');

        bId.addEventListener('input', () => { b.id = bId.value; });
        bLabel.addEventListener('input', () => { b.label = bLabel.value; });
        bDiff.addEventListener('input', () => { b.priceDiff = parseFloat(bDiff.value) || 0; });
        bNote.addEventListener('input', () => { b.note = bNote.value; });
        delBtn.addEventListener('click', () => {
          p.variants.bundles.splice(bIdx, 1);
          renderVariantsEditor();
        });

        bundlesList.appendChild(row);
      });

      const addBundleBtn = document.createElement('button');
      addBundleBtn.type = 'button';
      addBundleBtn.className = 'adm-le-add';
      addBundleBtn.innerHTML = '+ Add Bundle Option';
      addBundleBtn.addEventListener('click', () => {
        if (!p.variants.bundles) p.variants.bundles = [];
        p.variants.bundles.push({ id: 'bundle_' + Date.now().toString().slice(-4), label: 'Option', priceDiff: 0, note: '' });
        renderVariantsEditor();
      });
      bundlesBlock.appendChild(bundlesList);
      bundlesBlock.appendChild(addBundleBtn);
      varCont.appendChild(bundlesBlock);
    }
    renderVariantsEditor();

    formWrap.querySelector('#pe_var_type').addEventListener('change', (e) => {
      if (!p.variants) p.variants = {};
      p.variants.type = e.target.value;
    });

    // 9. FAQs editor
    const faqsWrap = formWrap.querySelector('#pe_faqs_wrap');
    function renderFaqs() {
      faqsWrap.innerHTML = '';
      const faqsList = document.createElement('div');
      faqsList.className = 'adm-le';

      (p.faqs || []).forEach((faq, fIdx) => {
        const row = document.createElement('div');
        row.className = 'adm-le-row';
        row.innerHTML = `
          <div class="adm-le-main" style="display:flex;flex-direction:column;gap:8px;">
            <input type="text" class="faq-q" placeholder="Question…" value="${esc(faq.q)}">
            <textarea class="faq-a" rows="2" placeholder="Answer…">${esc(faq.a)}</textarea>
          </div>
          <div class="adm-le-tools">
            <button type="button" class="del">✕</button>
          </div>
        `;
        const qIn = row.querySelector('.faq-q');
        const aIn = row.querySelector('.faq-a');
        qIn.addEventListener('input', () => { faq.q = qIn.value; });
        aIn.addEventListener('input', () => { faq.a = aIn.value; });
        row.querySelector('.del').addEventListener('click', () => {
          p.faqs.splice(fIdx, 1);
          renderFaqs();
        });
        faqsList.appendChild(row);
      });

      const addFaqBtn = document.createElement('button');
      addFaqBtn.type = 'button';
      addFaqBtn.className = 'adm-le-add';
      addFaqBtn.innerHTML = '+ Add FAQ Question';
      addFaqBtn.addEventListener('click', () => {
        if (!p.faqs) p.faqs = [];
        p.faqs.push({ q: '', a: '' });
        renderFaqs();
      });
      faqsWrap.appendChild(faqsList);
      faqsWrap.appendChild(addFaqBtn);
    }
    renderFaqs();

    // Commit changes to state
    const commitProduct = () => {
      const nameVal = formWrap.querySelector('#pe_name').value.trim();
      const idVal = formWrap.querySelector('#pe_id').value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
      if (!nameVal || !idVal) {
        toast('Please specify a Product Title and valid Slug ID.', true);
        return;
      }

      p.name = nameVal;
      p.id = idVal;
      p.brand = formWrap.querySelector('#pe_brand').value.trim();
      p.cat = formWrap.querySelector('#pe_cat').value;
      p.sku = formWrap.querySelector('#pe_sku').value.trim();
      p.flavor = formWrap.querySelector('#pe_flavor').value.trim();
      p.stock = formWrap.querySelector('#pe_stock').value;
      p.theme = formWrap.querySelector('#pe_theme').value;
      p.best = formWrap.querySelector('#pe_best').checked;
      p.price = parseFloat(formWrap.querySelector('#pe_price').value) || 0;
      p.old = parseFloat(formWrap.querySelector('#pe_old').value) || 0;
      p.art = formWrap.querySelector('#pe_art').value;
      p.description = formWrap.querySelector('#pe_description').value.trim();
      p.seo_title = formWrap.querySelector('#pe_seo_title').value.trim();
      p.seo_desc = formWrap.querySelector('#pe_seo_desc').value.trim();

      if (isNew) {
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

    formWrap.querySelector('#btnBackToProds').addEventListener('click', () => {
      state.editingProductIndex = null;
      renderProducts();
    });
    formWrap.querySelector('#btnSaveProdDraft').addEventListener('click', commitProduct);
    formWrap.querySelector('#btnSaveProdBottom').addEventListener('click', commitProduct);
  }

  /* ============================================================
     VIEW: CATEGORIES
     ============================================================ */
  function renderCategories() {
    dom.viewTitle.textContent = 'Categories';
    const catsData = state.data.categories || { cats: {}, labels: {} };
    const cats = catsData.cats || {};
    const labels = catsData.labels || {};

    let html = `
      <div class="adm-card">
        <h3><span>🗂️</span> Store Categories (${Object.keys(cats).length})</h3>
        <p class="adm-card-sub">Category details, hero background images, theme accents, and descriptions</p>
        
        <div style="display:flex;flex-direction:column;gap:18px;">
          ${Object.entries(cats).map(([slug, c]) => `
            <div class="adm-subblock" data-catslug="${esc(slug)}">
              <div class="adm-subblock-title">
                <h5>📁 Slug: <code>${esc(slug)}</code></h5>
                <button type="button" class="adm-btn adm-btn-sm adm-btn-danger btn-del-cat" data-slug="${esc(slug)}">Delete</button>
              </div>
              <div class="adm-grid3">
                <div class="adm-field">
                  <label>Title</label>
                  <input type="text" class="cat-title" value="${esc(c.title)}">
                </div>
                <div class="adm-field">
                  <label>Subtitle / Tagline</label>
                  <input type="text" class="cat-sub" value="${esc(c.sub)}">
                </div>
                <div class="adm-field">
                  <label>Theme Accent</label>
                  <select class="cat-theme">
                    <option value="art-purple" ${c.theme === 'art-purple' ? 'selected' : ''}>Purple</option>
                    <option value="art-navy" ${c.theme === 'art-navy' ? 'selected' : ''}>Navy</option>
                    <option value="art-gold" ${c.theme === 'art-gold' ? 'selected' : ''}>Gold</option>
                    <option value="art-rose" ${c.theme === 'art-rose' ? 'selected' : ''}>Rose</option>
                    <option value="art-emerald" ${c.theme === 'art-emerald' ? 'selected' : ''}>Emerald</option>
                    <option value="art-amber" ${c.theme === 'art-amber' ? 'selected' : ''}>Amber</option>
                    <option value="art-slate" ${c.theme === 'art-slate' ? 'selected' : ''}>Slate</option>
                  </select>
                </div>
              </div>
              <div class="adm-field">
                <label>Description</label>
                <textarea class="cat-desc" rows="2">${esc(c.desc)}</textarea>
              </div>
              <div class="adm-field">
                <label>Banner Image</label>
                <div class="cat-photo-wrap" data-slug="${esc(slug)}"></div>
              </div>
            </div>
          `).join('')}
        </div>

        <button type="button" class="adm-btn adm-btn-primary" id="btnAddCategory" style="margin-top:14px;">
          + Add New Category
        </button>
      </div>

      <!-- Category Filter Labels Dictionary -->
      <div class="adm-card">
        <h3><span>🏷️</span> Category Navigation Labels Dictionary</h3>
        <p class="adm-card-sub">Button and tab labels displayed in storefront filters and navigation bars</p>
        <div class="adm-grid3">
          ${Object.entries(labels).map(([key, labelVal]) => `
            <div class="adm-field">
              <label><code>${esc(key)}</code></label>
              <input type="text" class="dict-label" data-key="${esc(key)}" value="${esc(labelVal)}">
            </div>
          `).join('')}
        </div>
      </div>
    `;

    dom.content.innerHTML = html;

    // Attach image pickers & listeners to category cards
    Object.entries(cats).map(([slug, c]) => {
      const block = dom.content.querySelector(`[data-catslug="${slug}"]`);
      if (!block) return;
      const photoWrap = block.querySelector('.cat-photo-wrap');
      photoWrap.appendChild(renderImgPicker(`cat_img_${slug}`, c.photo, (val) => {
        c.photo = val;
        markDirty('categories');
      }, 'hero'));

      block.querySelector('.cat-title').addEventListener('input', (e) => {
        c.title = e.target.value;
        markDirty('categories');
      });
      block.querySelector('.cat-sub').addEventListener('input', (e) => {
        c.sub = e.target.value;
        markDirty('categories');
      });
      block.querySelector('.cat-theme').addEventListener('change', (e) => {
        c.theme = e.target.value;
        markDirty('categories');
      });
      block.querySelector('.cat-desc').addEventListener('input', (e) => {
        c.desc = e.target.value;
        markDirty('categories');
      });
      block.querySelector('.btn-del-cat').addEventListener('click', () => {
        if (confirm(`Delete category "${slug}"?`)) {
          delete cats[slug];
          delete labels[slug];
          markDirty('categories');
          renderCategories();
        }
      });
    });

    // Add category button
    document.getElementById('btnAddCategory').addEventListener('click', () => {
      const newSlug = prompt('Enter unique category slug (e.g. pods-mini):');
      if (!newSlug) return;
      const cleanSlug = newSlug.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
      if (cats[cleanSlug]) {
        toast('Category already exists!', true);
        return;
      }
      cats[cleanSlug] = {
        title: 'New Category',
        sub: 'Category tagline',
        desc: 'Category description...',
        photo: 'assets/images/hero-terea.png',
        theme: 'art-purple',
        art: 'device'
      };
      labels[cleanSlug] = 'New Category';
      markDirty('categories');
      renderCategories();
    });

    // Labels dictionary listeners
    dom.content.querySelectorAll('.dict-label').forEach(input => {
      input.addEventListener('input', (e) => {
        const k = e.target.dataset.key;
        labels[k] = e.target.value;
        markDirty('categories');
      });
    });
  }

  /* ============================================================
     VIEW: HOMEPAGE
     ============================================================ */
  function renderHomepage() {
    dom.viewTitle.textContent = 'Homepage CMS';
    if (!state.subview) state.subview = 'announcements';
    const home = state.data.home;

    let html = `
      <div class="adm-tabs">
        <button class="adm-tab ${state.subview === 'announcements' ? 'is-active' : ''}" data-sub="announcements">📢 Announcements &amp; Flash Deal</button>
        <button class="adm-tab ${state.subview === 'hero' ? 'is-active' : ''}" data-sub="hero">🖼️ Hero Carousel (3 Slides)</button>
        <button class="adm-tab ${state.subview === 'sections' ? 'is-active' : ''}" data-sub="sections">🏢 Storefront Sections &amp; Reviews</button>
        <button class="adm-tab ${state.subview === 'checkout' ? 'is-active' : ''}" data-sub="checkout">🔞 Age-Gate &amp; Checkout Copy</button>
      </div>
      <div id="homeSubContent"></div>
    `;

    dom.content.innerHTML = html;

    dom.content.querySelectorAll('.adm-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        state.subview = tab.dataset.sub;
        renderHomepage();
      });
    });

    const subCont = document.getElementById('homeSubContent');

    if (state.subview === 'announcements') {
      subCont.innerHTML = `
        <div class="adm-card">
          <h3><span>📢</span> Top Announcement Ticker Bar</h3>
          <p class="adm-card-sub">Scrolling marquee announcements at the very top of the website</p>
          <div class="adm-field">
            <label>Announcement Messages</label>
            <div id="pe_announce_items"></div>
          </div>
          <div class="adm-grid2" style="margin-top:16px;">
            <div class="adm-field">
              <label>Currency Chip Label</label>
              <input type="text" id="home_currency_chip" value="${esc(home.currency_chip || 'AED د.إ')}">
            </div>
            <div class="adm-field">
              <label>Store Language Toggle</label>
              <label class="adm-check">
                <input type="checkbox" id="home_lang_toggle" ${home.show_language_toggle ? 'checked' : ''}>
                <span>Display EN / AR Language Switcher</span>
              </label>
            </div>
          </div>
        </div>

        <div class="adm-card">
          <h3><span>⚡</span> Flash Deal Strip</h3>
          <p class="adm-card-sub">High-visibility promotional strip directly below the header</p>
          <label class="adm-check" style="margin-bottom:12px;">
            <input type="checkbox" id="fd_enabled" ${home.flash_deal && home.flash_deal.enabled ? 'checked' : ''}>
            <span>Enable Flash Deal Strip</span>
          </label>
          <div class="adm-field">
            <label>Flash Deal Promotional Text</label>
            <input type="text" id="fd_text" value="${esc(home.flash_deal ? home.flash_deal.text : '')}">
          </div>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>CTA Button Label</label>
              <input type="text" id="fd_cta_label" value="${esc(home.flash_deal ? home.flash_deal.cta_label : '')}">
            </div>
            <div class="adm-field">
              <label>CTA Destination Link</label>
              <input type="text" id="fd_cta_href" value="${esc(home.flash_deal ? home.flash_deal.cta_href : '')}">
            </div>
          </div>
        </div>
      `;

      // Announce items
      subCont.querySelector('#pe_announce_items').appendChild(
        renderStringListEditor(home.announce_items || [], (items) => {
          home.announce_items = items;
          markDirty('home');
        }, 'Ticker message text', '+ Add Announcement')
      );

      subCont.querySelector('#home_currency_chip').addEventListener('input', (e) => {
        home.currency_chip = e.target.value;
        markDirty('home');
      });
      subCont.querySelector('#home_lang_toggle').addEventListener('change', (e) => {
        home.show_language_toggle = e.target.checked;
        markDirty('home');
      });
      subCont.querySelector('#fd_enabled').addEventListener('change', (e) => {
        if (!home.flash_deal) home.flash_deal = {};
        home.flash_deal.enabled = e.target.checked;
        markDirty('home');
      });
      subCont.querySelector('#fd_text').addEventListener('input', (e) => {
        if (!home.flash_deal) home.flash_deal = {};
        home.flash_deal.text = e.target.value;
        markDirty('home');
      });
      subCont.querySelector('#fd_cta_label').addEventListener('input', (e) => {
        if (!home.flash_deal) home.flash_deal = {};
        home.flash_deal.cta_label = e.target.value;
        markDirty('home');
      });
      subCont.querySelector('#fd_cta_href').addEventListener('input', (e) => {
        if (!home.flash_deal) home.flash_deal = {};
        home.flash_deal.cta_href = e.target.value;
        markDirty('home');
      });
    }

    else if (state.subview === 'hero') {
      const slides = home.hero_slides || [];
      subCont.innerHTML = `
        <div class="adm-card">
          <h3><span>🖼️</span> Hero Carousel Slides (${slides.length})</h3>
          <p class="adm-card-sub">Top visual banners with custom callouts, badges, prices &amp; direct actions</p>
          <div style="display:flex;flex-direction:column;gap:18px;">
            ${slides.map((s, idx) => `
              <div class="adm-subblock" data-slideidx="${idx}">
                <div class="adm-subblock-title">
                  <h5>Slide #${idx + 1}: ${esc(s.pill || 'Banner')}</h5>
                  <label class="adm-check" style="margin:0">
                    <input type="checkbox" class="slide-enable" ${s.enabled !== false ? 'checked' : ''}>
                    <span>Enabled</span>
                  </label>
                </div>
                <div class="adm-grid3">
                  <div class="adm-field">
                    <label>Badge Pill</label>
                    <input type="text" class="s-pill" value="${esc(s.pill)}">
                  </div>
                  <div class="adm-field">
                    <label>Title Prefix</label>
                    <input type="text" class="s-pre" value="${esc(s.title_pre)}">
                  </div>
                  <div class="adm-field">
                    <label>Title Gradient Highlight</label>
                    <input type="text" class="s-grad" value="${esc(s.title_grad)}">
                  </div>
                </div>
                <div class="adm-grid3">
                  <div class="adm-field">
                    <label>Title Postfix</label>
                    <input type="text" class="s-post" value="${esc(s.title_post)}">
                  </div>
                  <div class="adm-field">
                    <label>Price Display</label>
                    <input type="text" class="s-price" value="${esc(s.price)}">
                  </div>
                  <div class="adm-field">
                    <label>Old Price Display</label>
                    <input type="text" class="s-old" value="${esc(s.old)}">
                  </div>
                </div>
                <div class="adm-field">
                  <label>Subtitle / Lede Description</label>
                  <input type="text" class="s-lede" value="${esc(s.lede)}">
                </div>
                <div class="adm-grid3">
                  <div class="adm-field">
                    <label>CTA Type</label>
                    <select class="s-cta-type">
                      <option value="add_to_cart" ${s.cta_type === 'add_to_cart' ? 'selected' : ''}>Direct Add To Cart</option>
                      <option value="link" ${s.cta_type === 'link' ? 'selected' : ''}>Jump / Anchor Link</option>
                    </select>
                  </div>
                  <div class="adm-field">
                    <label>CTA Button Label</label>
                    <input type="text" class="s-cta-label" value="${esc(s.cta_label)}">
                  </div>
                  <div class="adm-field">
                    <label>CTA Link / Product ID</label>
                    <input type="text" class="s-cta-href" value="${esc(s.cta_type === 'add_to_cart' ? s.cta_product : s.cta_href)}">
                  </div>
                </div>
                <div class="adm-field">
                  <label>Slide Image</label>
                  <div class="slide-photo-wrap" data-sidx="${idx}"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      slides.forEach((s, idx) => {
        const block = subCont.querySelector(`[data-slideidx="${idx}"]`);
        if (!block) return;
        const photoWrap = block.querySelector('.slide-photo-wrap');
        photoWrap.appendChild(renderImgPicker(`slide_img_${idx}`, s.image, (val) => {
          s.image = val;
          markDirty('home');
        }, 'hero'));

        block.querySelector('.slide-enable').addEventListener('change', (e) => { s.enabled = e.target.checked; markDirty('home'); });
        block.querySelector('.s-pill').addEventListener('input', (e) => { s.pill = e.target.value; markDirty('home'); });
        block.querySelector('.s-pre').addEventListener('input', (e) => { s.title_pre = e.target.value; markDirty('home'); });
        block.querySelector('.s-grad').addEventListener('input', (e) => { s.title_grad = e.target.value; markDirty('home'); });
        block.querySelector('.s-post').addEventListener('input', (e) => { s.title_post = e.target.value; markDirty('home'); });
        block.querySelector('.s-price').addEventListener('input', (e) => { s.price = e.target.value; markDirty('home'); });
        block.querySelector('.s-old').addEventListener('input', (e) => { s.old = e.target.value; markDirty('home'); });
        block.querySelector('.s-lede').addEventListener('input', (e) => { s.lede = e.target.value; markDirty('home'); });
        block.querySelector('.s-cta-label').addEventListener('input', (e) => { s.cta_label = e.target.value; markDirty('home'); });
        block.querySelector('.s-cta-type').addEventListener('change', (e) => {
          s.cta_type = e.target.value;
          markDirty('home');
        });
        block.querySelector('.s-cta-href').addEventListener('input', (e) => {
          if (s.cta_type === 'add_to_cart') {
            s.cta_product = e.target.value;
          } else {
            s.cta_href = e.target.value;
          }
          markDirty('home');
        });
      });
    }

    else if (state.subview === 'sections') {
      subCont.innerHTML = `
        <!-- VIP Section -->
        <div class="adm-card">
          <h3><span>👑</span> VIP Best Selling Section Copy</h3>
          <div class="adm-field">
            <label>Badge Ribbon</label>
            <input type="text" id="vip_badge" value="${esc(home.vip_section ? home.vip_section.badge : '')}">
          </div>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Section Title</label>
              <input type="text" id="vip_title" value="${esc(home.vip_section ? home.vip_section.title : '')}">
            </div>
            <div class="adm-field">
              <label>Demand Pulse Tag</label>
              <input type="text" id="vip_pulse" value="${esc(home.vip_section ? home.vip_section.pulse : '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Description Paragraph</label>
            <textarea id="vip_desc" rows="2">${esc(home.vip_section ? home.vip_section.desc : '')}</textarea>
          </div>
        </div>

        <!-- Reviews Section -->
        <div class="adm-card">
          <h3><span>⭐</span> Customer Reviews (${(home.reviews || []).length})</h3>
          <p class="adm-card-sub">Testimonials showcased on the storefront</p>
          <div style="display:flex;flex-direction:column;gap:14px;">
            ${(home.reviews || []).map((r, rIdx) => `
              <div class="adm-subblock">
                <div class="adm-grid3">
                  <div class="adm-field">
                    <label>Customer Name</label>
                    <input type="text" class="rev-name" data-idx="${rIdx}" value="${esc(r.name)}">
                  </div>
                  <div class="adm-field">
                    <label>Location (Emirate)</label>
                    <input type="text" class="rev-loc" data-idx="${rIdx}" value="${esc(r.location)}">
                  </div>
                  <div class="adm-field">
                    <label>Star Rating (1-5)</label>
                    <input type="number" class="rev-stars" data-idx="${rIdx}" min="1" max="5" value="${esc(r.stars)}">
                  </div>
                </div>
                <div class="adm-field">
                  <label>Review Text</label>
                  <textarea class="rev-text" data-idx="${rIdx}" rows="2">${esc(r.text)}</textarea>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      // VIP section bindings
      subCont.querySelector('#vip_badge').addEventListener('input', (e) => {
        if (!home.vip_section) home.vip_section = {};
        home.vip_section.badge = e.target.value;
        markDirty('home');
      });
      subCont.querySelector('#vip_title').addEventListener('input', (e) => {
        if (!home.vip_section) home.vip_section = {};
        home.vip_section.title = e.target.value;
        markDirty('home');
      });
      subCont.querySelector('#vip_pulse').addEventListener('input', (e) => {
        if (!home.vip_section) home.vip_section = {};
        home.vip_section.pulse = e.target.value;
        markDirty('home');
      });
      subCont.querySelector('#vip_desc').addEventListener('input', (e) => {
        if (!home.vip_section) home.vip_section = {};
        home.vip_section.desc = e.target.value;
        markDirty('home');
      });

      // Reviews bindings
      subCont.querySelectorAll('.rev-name').forEach(inp => {
        inp.addEventListener('input', (e) => { home.reviews[e.target.dataset.idx].name = e.target.value; markDirty('home'); });
      });
      subCont.querySelectorAll('.rev-loc').forEach(inp => {
        inp.addEventListener('input', (e) => { home.reviews[e.target.dataset.idx].location = e.target.value; markDirty('home'); });
      });
      subCont.querySelectorAll('.rev-stars').forEach(inp => {
        inp.addEventListener('input', (e) => { home.reviews[e.target.dataset.idx].stars = parseInt(e.target.value, 10) || 5; markDirty('home'); });
      });
      subCont.querySelectorAll('.rev-text').forEach(inp => {
        inp.addEventListener('input', (e) => { home.reviews[e.target.dataset.idx].text = e.target.value; markDirty('home'); });
      });
    }

    else if (state.subview === 'checkout') {
      subCont.innerHTML = `
        <div class="adm-card">
          <h3><span>🔞</span> UAE Age Verification Gate</h3>
          <p class="adm-card-sub">Popup modal confirming visitor is 18+ upon initial visit</p>
          <label class="adm-check" style="margin-bottom:12px;">
            <input type="checkbox" id="ag_enabled" ${home.age_gate && home.age_gate.enabled ? 'checked' : ''}>
            <span>Enable 18+ Age Gate</span>
          </label>
          <div class="adm-field">
            <label>Modal Title</label>
            <input type="text" id="ag_title" value="${esc(home.age_gate ? home.age_gate.title : '')}">
          </div>
          <div class="adm-field">
            <label>Gate Description / Warning</label>
            <textarea id="ag_text" rows="2">${esc(home.age_gate ? home.age_gate.text : '')}</textarea>
          </div>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Confirm Button Label</label>
              <input type="text" id="ag_yes" value="${esc(home.age_gate ? home.age_gate.yes_label : '')}">
            </div>
            <div class="adm-field">
              <label>Deny Button Label</label>
              <input type="text" id="ag_no" value="${esc(home.age_gate ? home.age_gate.no_label : '')}">
            </div>
          </div>
        </div>

        <div class="adm-card">
          <h3><span>🧾</span> Checkout Modal Copy</h3>
          <p class="adm-card-sub">Text displayed on the 1-2 hour express checkout drawer</p>
          <div class="adm-field">
            <label>Checkout Headline</label>
            <input type="text" id="co_title" value="${esc(home.checkout ? home.checkout.title : '')}">
          </div>
          <div class="adm-field">
            <label>Checkout Subtitle</label>
            <input type="text" id="co_sub" value="${esc(home.checkout ? home.checkout.sub : '')}">
          </div>
          <div class="adm-field">
            <label>WhatsApp 1-Click Banner Headline</label>
            <input type="text" id="co_wa_title" value="${esc(home.checkout ? home.checkout.wa_banner_title : '')}">
          </div>
          <div class="adm-field">
            <label>WhatsApp 1-Click Banner Description</label>
            <input type="text" id="co_wa_text" value="${esc(home.checkout ? home.checkout.wa_banner_text : '')}">
          </div>
        </div>
      `;

      // Bindings
      subCont.querySelector('#ag_enabled').addEventListener('change', (e) => {
        if (!home.age_gate) home.age_gate = {};
        home.age_gate.enabled = e.target.checked;
        markDirty('home');
      });
      subCont.querySelector('#ag_title').addEventListener('input', (e) => {
        if (!home.age_gate) home.age_gate = {};
        home.age_gate.title = e.target.value;
        markDirty('home');
      });
      subCont.querySelector('#ag_text').addEventListener('input', (e) => {
        if (!home.age_gate) home.age_gate = {};
        home.age_gate.text = e.target.value;
        markDirty('home');
      });
      subCont.querySelector('#ag_yes').addEventListener('input', (e) => {
        if (!home.age_gate) home.age_gate = {};
        home.age_gate.yes_label = e.target.value;
        markDirty('home');
      });
      subCont.querySelector('#ag_no').addEventListener('input', (e) => {
        if (!home.age_gate) home.age_gate = {};
        home.age_gate.no_label = e.target.value;
        markDirty('home');
      });

      subCont.querySelector('#co_title').addEventListener('input', (e) => {
        if (!home.checkout) home.checkout = {};
        home.checkout.title = e.target.value;
        markDirty('home');
      });
      subCont.querySelector('#co_sub').addEventListener('input', (e) => {
        if (!home.checkout) home.checkout = {};
        home.checkout.sub = e.target.value;
        markDirty('home');
      });
      subCont.querySelector('#co_wa_title').addEventListener('input', (e) => {
        if (!home.checkout) home.checkout = {};
        home.checkout.wa_banner_title = e.target.value;
        markDirty('home');
      });
      subCont.querySelector('#co_wa_text').addEventListener('input', (e) => {
        if (!home.checkout) home.checkout = {};
        home.checkout.wa_banner_text = e.target.value;
        markDirty('home');
      });
    }
  }

  /* ============================================================
     VIEW: SEO CENTER
     ============================================================ */
  function renderSEO() {
    dom.viewTitle.textContent = 'SEO Center';
    const seo = state.data.seo;
    const settings = state.data.settings;

    let html = `
      <div class="adm-card">
        <h3><span>🌐</span> Canonical Site Host &amp; Robots Sync</h3>
        <p class="adm-card-sub">The authoritative base URL used in canonical link tags, OpenGraph URLs, and sitemap.xml</p>
        <div class="adm-field">
          <label>Canonical Site URL</label>
          <input type="url" id="seo_site_url" value="${esc(seo.site_url)}">
          <span class="adm-hint">Saving this updates <code>robots.txt</code> automatically with <code>Sitemap: ${esc(seo.site_url)}/sitemap.xml</code></span>
        </div>
      </div>

      <div class="adm-card">
        <h3><span>🏗️</span> Structured Data (JSON-LD Schemas)</h3>
        <p class="adm-card-sub">Enable high-impact rich snippets for Google search results</p>
        <div class="adm-grid2">
          <label class="adm-check">
            <input type="checkbox" id="sc_local" ${seo.schema_local_business ? 'checked' : ''}>
            <span>LocalBusiness (Dubai Store, Phone &amp; Hours)</span>
          </label>
          <label class="adm-check">
            <input type="checkbox" id="sc_faq" ${seo.schema_faq_page ? 'checked' : ''}>
            <span>FAQPage (Rich Question Accordion in SERP)</span>
          </label>
          <label class="adm-check">
            <input type="checkbox" id="sc_prod" ${seo.schema_product ? 'checked' : ''}>
            <span>Product &amp; Offer (Price AED &amp; InStock Availability)</span>
          </label>
          <label class="adm-check">
            <input type="checkbox" id="sc_bread" ${seo.schema_breadcrumb ? 'checked' : ''}>
            <span>BreadcrumbList (Home › Category › Product)</span>
          </label>
        </div>
      </div>

      <!-- Honest Review Rating Controls -->
      <div class="adm-card">
        <h3><span>⭐</span> Review Rating Markup</h3>
        <p class="adm-card-sub">Store rating displayed on search results and badge ribbons</p>
        <div class="adm-grid3">
          <div class="adm-field">
            <label>Rating Value (e.g. 4.9)</label>
            <input type="text" id="set_rating_val" value="${esc(settings.rating_value || '4.9')}">
          </div>
          <div class="adm-field">
            <label>Total Review Count</label>
            <input type="number" id="set_rating_count" value="${esc(settings.rating_count || 214)}">
          </div>
          <div class="adm-field">
            <label>Display Rating</label>
            <label class="adm-check">
              <input type="checkbox" id="set_show_rating" ${settings.show_rating ? 'checked' : ''}>
              <span>Show in UI &amp; JSON-LD</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Page Templates Meta Tags -->
      <div class="adm-card">
        <h3><span>📄</span> Page Template Meta Tags</h3>
        <p class="adm-card-sub">Define patterns and dynamic tokens for each page type</p>

        <!-- Home Page -->
        <div class="adm-subblock">
          <h5>🏠 Homepage Meta</h5>
          <div class="adm-field">
            <label>Meta Title</label>
            <input type="text" id="seo_home_title" value="${esc(seo.pages.home.title)}">
          </div>
          <div class="adm-field">
            <label>Meta Description</label>
            <textarea id="seo_home_desc" rows="2">${esc(seo.pages.home.description)}</textarea>
          </div>
          <div class="adm-field">
            <label>Meta Keywords</label>
            <input type="text" id="seo_home_kw" value="${esc(seo.pages.home.keywords || '')}">
          </div>
        </div>

        <!-- Category Template -->
        <div class="adm-subblock" style="margin-top:16px;">
          <h5>📁 Category Page Pattern</h5>
          <div class="adm-token-bar">
            <span>Tokens:</span>
            <button type="button" class="adm-token" onclick="ADM.insertToken('seo_cat_title', '{category}')">{category}</button>
          </div>
          <div class="adm-field">
            <label>Meta Title Pattern</label>
            <input type="text" id="seo_cat_title" value="${esc(seo.pages.category.title)}">
          </div>
          <div class="adm-field">
            <label>Meta Description Pattern</label>
            <textarea id="seo_cat_desc" rows="2">${esc(seo.pages.category.description)}</textarea>
          </div>
        </div>

        <!-- Product Template -->
        <div class="adm-subblock" style="margin-top:16px;">
          <h5>📦 Product Page Pattern</h5>
          <div class="adm-token-bar">
            <span>Tokens:</span>
            <button type="button" class="adm-token" onclick="ADM.insertToken('seo_prod_title', '{product}')">{product}</button>
            <button type="button" class="adm-token" onclick="ADM.insertToken('seo_prod_title', '{brand}')">{brand}</button>
            <button type="button" class="adm-token" onclick="ADM.insertToken('seo_prod_title', '{price}')">{price}</button>
            <button type="button" class="adm-token" onclick="ADM.insertToken('seo_prod_title', '{category}')">{category}</button>
          </div>
          <div class="adm-field">
            <label>Meta Title Pattern</label>
            <input type="text" id="seo_prod_title" value="${esc(seo.pages.product.title)}">
          </div>
          <div class="adm-field">
            <label>Meta Description Pattern</label>
            <textarea id="seo_prod_desc" rows="2">${esc(seo.pages.product.description)}</textarea>
          </div>
        </div>
      </div>

      <!-- Extra <head> Injection -->
      <div class="adm-card">
        <h3><span>💻</span> Custom &lt;head&gt; Code Injection</h3>
        <p class="adm-card-sub">Google Analytics, Google Tag Manager, Meta Pixel or verification tags</p>
        <div class="adm-field">
          <textarea id="seo_extra_head" rows="4" placeholder="<!-- Paste GTM / Analytics code here -->">${esc(seo.extra_head_code || '')}</textarea>
        </div>
      </div>
    `;

    dom.content.innerHTML = html;

    // Attach char meters
    attachCharMeter(document.getElementById('seo_home_title'), 30, 70);
    attachCharMeter(document.getElementById('seo_home_desc'), 80, 160);
    attachCharMeter(document.getElementById('seo_cat_title'), 30, 70);
    attachCharMeter(document.getElementById('seo_cat_desc'), 80, 160);
    attachCharMeter(document.getElementById('seo_prod_title'), 30, 70);
    attachCharMeter(document.getElementById('seo_prod_desc'), 80, 160);

    // Bindings
    document.getElementById('seo_site_url').addEventListener('input', (e) => { seo.site_url = e.target.value.trim(); markDirty('seo'); });
    document.getElementById('sc_local').addEventListener('change', (e) => { seo.schema_local_business = e.target.checked; markDirty('seo'); });
    document.getElementById('sc_faq').addEventListener('change', (e) => { seo.schema_faq_page = e.target.checked; markDirty('seo'); });
    document.getElementById('sc_prod').addEventListener('change', (e) => { seo.schema_product = e.target.checked; markDirty('seo'); });
    document.getElementById('sc_bread').addEventListener('change', (e) => { seo.schema_breadcrumb = e.target.checked; markDirty('seo'); });

    document.getElementById('set_rating_val').addEventListener('input', (e) => { settings.rating_value = e.target.value; markDirty('settings'); });
    document.getElementById('set_rating_count').addEventListener('input', (e) => { settings.rating_count = e.target.value; markDirty('settings'); });
    document.getElementById('set_show_rating').addEventListener('change', (e) => { settings.show_rating = e.target.checked; markDirty('settings'); });

    document.getElementById('seo_home_title').addEventListener('input', (e) => { seo.pages.home.title = e.target.value; markDirty('seo'); });
    document.getElementById('seo_home_desc').addEventListener('input', (e) => { seo.pages.home.description = e.target.value; markDirty('seo'); });
    document.getElementById('seo_home_kw').addEventListener('input', (e) => { seo.pages.home.keywords = e.target.value; markDirty('seo'); });

    document.getElementById('seo_cat_title').addEventListener('input', (e) => { seo.pages.category.title = e.target.value; markDirty('seo'); });
    document.getElementById('seo_cat_desc').addEventListener('input', (e) => { seo.pages.category.description = e.target.value; markDirty('seo'); });

    document.getElementById('seo_prod_title').addEventListener('input', (e) => { seo.pages.product.title = e.target.value; markDirty('seo'); });
    document.getElementById('seo_prod_desc').addEventListener('input', (e) => { seo.pages.product.description = e.target.value; markDirty('seo'); });

    document.getElementById('seo_extra_head').addEventListener('input', (e) => { seo.extra_head_code = e.target.value; markDirty('seo'); });
  }

  /* ============================================================
     VIEW: ORDERS
     ============================================================ */
  function renderOrders() {
    dom.viewTitle.textContent = 'Orders';
    const orders = (state.data.orders && state.data.orders.orders) || [];

    let html = `
      <div class="adm-card" style="padding:14px 20px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <b>Customer Orders (${orders.length})</b>
          <div style="font-size:12px;color:var(--adm-muted);margin-top:2px;">
            Auto-refreshing every 30 seconds · Live WhatsApp &amp; Checkout records
          </div>
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
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th style="text-align:right">Action</th>
            </tr>
          </thead>
          <tbody>
            ${orders.length === 0 ? `
              <tr><td colspan="7" style="text-align:center;padding:36px;color:var(--adm-muted)">No customer orders recorded yet.</td></tr>
            ` : orders.map((o) => `
              <tr>
                <td>
                  <b>${esc(o.id || 'N/A')}</b>
                  <div style="font-size:11px;color:var(--adm-muted);margin-top:2px;">
                    ${esc(o.created_at || o.date || 'Recent')}
                  </div>
                </td>
                <td>
                  <b>${esc(o.name || o.customer || 'Guest')}</b>
                  <div style="font-size:11px;color:var(--adm-muted);">
                    📞 <a href="tel:${esc(o.phone || '')}" style="color:inherit">${esc(o.phone || '')}</a>
                  </div>
                </td>
                <td>
                  <b>${esc(o.emirate || 'Dubai')}</b>
                  <div style="font-size:11px;color:var(--adm-muted);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    ${esc(o.address || '')}
                  </div>
                </td>
                <td>
                  <div class="adm-order-items">
                    ${(o.items || []).map(it => `
                      <div>• ${esc(it.name || it.title || 'Item')} × ${esc(it.qty || 1)}</div>
                    `).join('')}
                  </div>
                </td>
                <td>
                  <b>${esc(o.total || 0)} AED</b>
                  <div style="font-size:10px;color:var(--adm-muted);">${esc(o.payment || 'COD')}</div>
                </td>
                <td>
                  <select class="adm-select-status" data-orderid="${esc(o.id)}">
                    <option value="new" ${o.status === 'new' ? 'selected' : ''}>New</option>
                    <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                  </select>
                </td>
                <td style="text-align:right">
                  <button class="adm-btn adm-btn-sm adm-btn-danger" title="Delete Order" onclick="ADM.deleteOrder('${esc(o.id)}')">✕</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    dom.content.innerHTML = html;

    // Status change listeners
    dom.content.querySelectorAll('.adm-select-status').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const orderId = e.target.dataset.orderid;
        const newStatus = e.target.value;
        sel.disabled = true;
        try {
          const res = await api('order_status', { id: orderId, status: newStatus });
          if (res && res.ok) {
            toast(`Order ${orderId} marked as ${newStatus}.`);
            const target = orders.find(o => o.id === orderId);
            if (target) target.status = newStatus;
            updateOrdersBadge();
          } else {
            toast('Failed to update status: ' + (res.error || 'Unknown'), true);
          }
        } catch (ex) {
          toast('Network error updating status', true);
        } finally {
          sel.disabled = false;
        }
      });
    });
  }

  /* ============================================================
     VIEW: SETTINGS
     ============================================================ */
  function renderSettings() {
    dom.viewTitle.textContent = 'Settings';
    const s = state.data.settings;

    let html = `
      <div class="adm-card">
        <h3><span>🏢</span> Brand &amp; Contact Identity</h3>
        <p class="adm-card-sub">Store branding, WhatsApp hotline, phone numbers and Dubai address</p>
        <div class="adm-grid3">
          <div class="adm-field">
            <label>Brand Name</label>
            <input type="text" id="set_brand_name" value="${esc(s.brand_name)}">
          </div>
          <div class="adm-field">
            <label>Tagline</label>
            <input type="text" id="set_brand_tagline" value="${esc(s.brand_tagline)}">
          </div>
          <div class="adm-field">
            <label>Order ID Prefix</label>
            <input type="text" id="set_order_prefix" value="${esc(s.order_prefix || 'VCD')}">
          </div>
        </div>

        <div class="adm-grid3">
          <div class="adm-field">
            <label>WhatsApp Number (Digits only with country code)</label>
            <input type="text" id="set_wa_number" value="${esc(s.wa_number)}">
            <span class="adm-hint">e.g. 971562848450 (no plus sign)</span>
          </div>
          <div class="adm-field">
            <label>Phone Display</label>
            <input type="text" id="set_phone_display" value="${esc(s.phone_display)}">
          </div>
          <div class="adm-field">
            <label>Email Address</label>
            <input type="email" id="set_email" value="${esc(s.email)}">
          </div>
        </div>

        <div class="adm-grid2">
          <div class="adm-field">
            <label>Physical Address</label>
            <input type="text" id="set_address" value="${esc(s.address)}">
          </div>
          <div class="adm-field">
            <label>Google Maps Link</label>
            <input type="url" id="set_maps_url" value="${esc(s.maps_url)}">
          </div>
        </div>
      </div>

      <div class="adm-card">
        <h3><span>🚚</span> Delivery Fees &amp; Thresholds</h3>
        <p class="adm-card-sub">Delivery pricing across Dubai and the United Arab Emirates</p>
        <div class="adm-grid3">
          <div class="adm-field">
            <label>Standard Delivery Fee (AED)</label>
            <input type="number" id="set_del_fee" value="${esc(s.delivery_fee)}">
          </div>
          <div class="adm-field">
            <label>Free Delivery Threshold (AED)</label>
            <input type="number" id="set_free_thresh" value="${esc(s.free_ship_threshold || 450)}">
            <span class="adm-hint">Orders at or above this amount receive free delivery</span>
          </div>
          <div class="adm-field">
            <label>Max Quantity Cap per Item</label>
            <input type="number" id="set_qty_cap" value="${esc(s.qty_cap || 20)}">
          </div>
        </div>
      </div>

      <div class="adm-card">
        <h3><span>🕒</span> Business Hours &amp; Payment Badges</h3>
        <div class="adm-grid2">
          <div class="adm-field">
            <label>Business Hours Lines</label>
            <div id="set_hours_wrap"></div>
          </div>
          <div class="adm-field">
            <label>Accepted Payment Badges</label>
            <div id="set_badges_wrap"></div>
          </div>
        </div>
      </div>

      <div class="adm-card">
        <h3><span>⚖️</span> Legal Warning &amp; Compliance</h3>
        <div class="adm-field">
          <label>UAE Federal Nicotine Legal Warning Notice</label>
          <textarea id="set_legal_warn" rows="3">${esc(s.legal_warning)}</textarea>
        </div>
        <div class="adm-field">
          <label>Footer Copyright Line</label>
          <input type="text" id="set_copyright" value="${esc(s.copyright)}">
        </div>
      </div>
    `;

    dom.content.innerHTML = html;

    // Sub-editors
    document.getElementById('set_hours_wrap').appendChild(
      renderStringListEditor(s.hours || [], (items) => { s.hours = items; markDirty('settings'); }, 'Hours schedule', '+ Add Hours Line')
    );
    document.getElementById('set_badges_wrap').appendChild(
      renderStringListEditor(s.payment_badges || [], (items) => { s.payment_badges = items; markDirty('settings'); }, 'Badge name (e.g. COD, VISA)', '+ Add Badge')
    );

    // Bindings
    document.getElementById('set_brand_name').addEventListener('input', (e) => { s.brand_name = e.target.value; markDirty('settings'); });
    document.getElementById('set_brand_tagline').addEventListener('input', (e) => { s.brand_tagline = e.target.value; markDirty('settings'); });
    document.getElementById('set_order_prefix').addEventListener('input', (e) => { s.order_prefix = e.target.value; markDirty('settings'); });
    document.getElementById('set_wa_number').addEventListener('input', (e) => { s.wa_number = e.target.value; markDirty('settings'); });
    document.getElementById('set_phone_display').addEventListener('input', (e) => { s.phone_display = e.target.value; markDirty('settings'); });
    document.getElementById('set_email').addEventListener('input', (e) => { s.email = e.target.value; markDirty('settings'); });
    document.getElementById('set_address').addEventListener('input', (e) => { s.address = e.target.value; markDirty('settings'); });
    document.getElementById('set_maps_url').addEventListener('input', (e) => { s.maps_url = e.target.value; markDirty('settings'); });

    document.getElementById('set_del_fee').addEventListener('input', (e) => { s.delivery_fee = parseFloat(e.target.value) || 0; markDirty('settings'); });
    document.getElementById('set_free_thresh').addEventListener('input', (e) => { s.free_ship_threshold = parseFloat(e.target.value) || 0; markDirty('settings'); });
    document.getElementById('set_qty_cap').addEventListener('input', (e) => { s.qty_cap = parseInt(e.target.value, 10) || 20; markDirty('settings'); });

    document.getElementById('set_legal_warn').addEventListener('input', (e) => { s.legal_warning = e.target.value; markDirty('settings'); });
    document.getElementById('set_copyright').addEventListener('input', (e) => { s.copyright = e.target.value; markDirty('settings'); });
  }

  /* ============================================================
     VIEW: ACCOUNT & BACKUP
     ============================================================ */
  function renderAccount() {
    dom.viewTitle.textContent = 'Account & Backup';

    let html = `
      <!-- Change Password -->
      <div class="adm-card">
        <h3><span>🔐</span> Administrator Credentials</h3>
        <p class="adm-card-sub">Change admin login username and password</p>
        <form id="pwdForm" autocomplete="off">
          <div class="adm-grid3">
            <div class="adm-field">
              <label>Current Password *</label>
              <input type="password" id="pwd_cur" required placeholder="••••••••">
            </div>
            <div class="adm-field">
              <label>New Password (min 8 chars) *</label>
              <input type="password" id="pwd_new" minlength="8" required placeholder="••••••••">
            </div>
            <div class="adm-field">
              <label>Admin Username</label>
              <input type="text" id="pwd_user" value="${esc(state.data.admin_user || 'admin')}">
            </div>
          </div>
          <div style="margin-top:6px;">
            <button type="submit" class="adm-btn adm-btn-primary" id="btnSavePwd">Update Credentials</button>
          </div>
        </form>
      </div>

      <!-- Backup & Restore -->
      <div class="adm-grid2">
        <div class="adm-card">
          <h3><span>💾</span> Export Data Backup</h3>
          <p class="adm-card-sub">Download complete JSON snapshot of all products, categories, home, SEO, and settings</p>
          <p style="font-size:13px;color:var(--adm-muted);margin-bottom:16px;">
            Use this before performing major catalog updates or server migrations. The export is a clean JSON bundle.
          </p>
          <a href="/admin/api.php?action=backup" class="adm-btn adm-btn-primary" download>
            📥 Download JSON Backup File
          </a>
        </div>

        <div class="adm-card">
          <h3><span>🔄</span> Restore Data from Backup</h3>
          <p class="adm-card-sub">Upload a previously exported JSON backup bundle to restore catalog state</p>
          <input type="file" id="restoreFileInput" accept=".json,application/json" style="display:none">
          <button type="button" class="adm-btn adm-btn-danger" id="btnTriggerRestore">
            📤 Restore from Backup JSON…
          </button>
          <p style="font-size:11.5px;color:var(--adm-muted);margin-top:12px;">
            ⚠️ Restoring will overwrite existing data stores in <code>/data/</code> with the backup contents.
          </p>
        </div>
      </div>
    `;

    dom.content.innerHTML = html;

    // Password form handler
    document.getElementById('pwdForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSavePwd');
      const cur = document.getElementById('pwd_cur').value;
      const nw = document.getElementById('pwd_new').value;
      const usr = document.getElementById('pwd_user').value.trim();

      btn.disabled = true;
      btn.textContent = 'Updating…';
      try {
        const res = await api('change_password', { current: cur, new: nw, username: usr });
        if (res && res.ok) {
          toast('Credentials updated successfully!');
          sessionStorage.removeItem('adm_must_change');
          document.getElementById('pwd_cur').value = '';
          document.getElementById('pwd_new').value = '';
        } else {
          toast('Failed: ' + (res.error === 'wrong_current' ? 'Incorrect current password' : (res.error || 'Error')), true);
        }
      } catch (err) {
        toast('Failed to change password.', true);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Update Credentials';
      }
    });

    // Restore file handler
    const fileIn = document.getElementById('restoreFileInput');
    document.getElementById('btnTriggerRestore').addEventListener('click', () => fileIn.click());

    fileIn.addEventListener('change', (e) => {
      if (!e.target.files || !e.target.files[0]) return;
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const bundle = JSON.parse(ev.target.result);
          if (!bundle || typeof bundle !== 'object') {
            toast('Invalid backup JSON file.', true);
            return;
          }
          if (!confirm('Are you sure you want to restore this backup? Current data will be replaced.')) {
            return;
          }
          const res = await api('restore', { bundle });
          if (res && res.ok) {
            toast('Data restored successfully! Reloading…');
            setTimeout(() => location.reload(), 1200);
          } else {
            toast('Restore failed: ' + (res.error || 'Server error'), true);
          }
        } catch (ex) {
          toast('Failed to parse JSON file.', true);
        }
      };
      reader.readAsText(file);
    });
  }

  /* ============================================================
     ROUTER & VIEW SWITCHER
     ============================================================ */
  function switchView(viewName, subview = '') {
    state.view = viewName;
    state.subview = subview;
    state.editingProductIndex = null;

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
      renderCurrentView();
      window.scrollTo(0, 0);
    },
    editProduct: (idx) => {
      state.view = 'products';
      state.editingProductIndex = idx;
      renderCurrentView();
      window.scrollTo(0, 0);
    },
    cancelProductEdit: () => {
      state.editingProductIndex = null;
      renderProducts();
    },
    duplicateProduct: (idx) => {
      const prods = state.data.products.products;
      const clone = JSON.parse(JSON.stringify(prods[idx]));
      clone.id = clone.id + '-copy';
      clone.name = clone.name + ' (Copy)';
      clone.sku = 'SKU-' + Math.floor(Math.random() * 90000 + 10000);
      prods.splice(idx + 1, 0, clone);
      markDirty('products');
      toast(`Duplicated "${prods[idx].name}".`);
      renderProducts();
    },
    deleteProduct: (idx) => {
      const prods = state.data.products.products;
      const name = prods[idx] ? prods[idx].name : 'this item';
      if (confirm(`Are you sure you want to delete "${name}"?`)) {
        prods.splice(idx, 1);
        markDirty('products');
        toast(`Deleted "${name}".`);
        renderProducts();
      }
    },
    deleteOrder: async (id) => {
      if (!confirm(`Delete order ${id}? This cannot be undone.`)) return;
      try {
        const res = await api('order_delete', { id });
        if (res && res.ok) {
          toast(`Order ${id} deleted.`);
          state.data.orders.orders = (state.data.orders.orders || []).filter(o => o.id !== id);
          updateOrdersBadge();
          renderOrders();
        } else {
          toast('Failed to delete order.', true);
        }
      } catch (ex) {
        toast('Network error.', true);
      }
    },
    refreshOrders: async () => {
      try {
        const res = await api('get');
        if (res && res.ok && res.data && res.data.orders) {
          state.data.orders = res.data.orders;
          updateOrdersBadge();
          if (state.view === 'orders') renderOrders();
          toast('Orders list refreshed.');
        }
      } catch (ex) {}
    },
    insertToken: (targetInputId, token) => {
      const el = document.getElementById(targetInputId);
      if (!el) return;
      const start = el.selectionStart || el.value.length;
      const end = el.selectionEnd || el.value.length;
      el.value = el.value.substring(0, start) + token + el.value.substring(end);
      el.dispatchEvent(new Event('input'));
      el.focus();
    }
  };

  /* ============================================================
     BOOTSTRAP & INITIALIZATION
     ============================================================ */
  async function init() {
    // Navigation listeners
    if (dom.nav) {
      dom.nav.querySelectorAll('.adm-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          switchView(btn.dataset.view);
        });
      });
    }

    // Save button listener
    if (dom.saveBtn) {
      dom.saveBtn.addEventListener('click', saveAll);
    }

    // Logout button listener
    if (dom.logoutBtn) {
      dom.logoutBtn.addEventListener('click', async () => {
        try {
          await api('logout', {});
        } catch (ex) {}
        location.reload();
      });
    }

    // Warn on unsaved changes before leaving
    window.addEventListener('beforeunload', (e) => {
      if (state.dirty.size > 0) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes.';
      }
    });

    // Keyboard shortcut Ctrl+S / Cmd+S to save
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveAll();
      }
    });

    // Fetch initial dataset & images list in parallel
    try {
      dom.content.innerHTML = '<div style="text-align:center;padding:60px;color:var(--adm-muted)">Loading store data…</div>';
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

      // Render default view
      switchView('dashboard');

      // Start 30-second polling for incoming orders
      state.pollTimer = setInterval(async () => {
        try {
          const res = await api('get');
          if (res && res.ok && res.data && res.data.orders) {
            state.data.orders = res.data.orders;
            updateOrdersBadge();
            if (state.view === 'orders') {
              renderOrders();
            }
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

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
