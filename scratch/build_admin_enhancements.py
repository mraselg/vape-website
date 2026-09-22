# -*- coding: utf-8 -*-
"""
Script to inject openImageCropper, enhance renderImgPicker,
and completely implement Brand combo, Gallery Manager, and Variant Builder
in admin/assets/admin.js.
"""
import shutil
import subprocess
import sys

# 1. Read existing file
with open('admin/assets/admin.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Make a backup
shutil.copyfile('admin/assets/admin.js', 'admin/assets/admin.js.bak')
print("Backup created at admin/assets/admin.js.bak")

# --- Part 1: openImageCropper + enhanced renderImgPicker ---
CROPPER_AND_IMGPICKER = r'''  /* ============================================================
     SMART IMAGE CROPPER & OPTIMIZER POPUP
     ============================================================ */
  function openImageCropper({ file, dir = 'products', defaultRatio = '1:1', onComplete }) {
    if (!file) return;

    // Direct upload for SVGs (scalable vectors)
    if (file.type === 'image/svg+xml' || (file.name && file.name.toLowerCase().endsWith('.svg'))) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('dir', dir);
      api('image_upload', fd, true).then(res => {
        if (res && res.ok && res.path) {
          toast('Vector SVG uploaded: ' + res.path);
          if (!state.images.includes(res.path)) {
            state.images.push(res.path);
            refreshDatalist();
          }
          onComplete(res.path);
        } else {
          toast('Upload failed: ' + (res.error || 'Unknown'), true);
        }
      });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'adm-cropper-modal';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="adm-cropper-dialog" role="dialog" aria-label="Image Cropper">
        <div class="adm-cropper-header">
          <div class="adm-cropper-title">
            <span>✂️</span>
            <span>Image Cropper &amp; Optimizer</span>
            <span class="adm-cropper-badge" id="crpBadge">1:1 Square</span>
          </div>
          <button type="button" class="adm-btn adm-btn-sm" id="crpClose" style="padding:4px 8px;font-size:14px;">✕</button>
        </div>

        <div class="adm-cropper-body">
          <div class="adm-cropper-ratios">
            <span style="font-size:12px;color:var(--adm-muted);font-weight:600;">Presets:</span>
            <button type="button" class="adm-ratio-btn ${defaultRatio === '1:1' ? 'is-active' : ''}" data-ratio="1:1">
              1:1 Square (Products &amp; Gallery 800×800)
            </button>
            <button type="button" class="adm-ratio-btn ${defaultRatio === '4:3' ? 'is-active' : ''}" data-ratio="4:3">
              4:3 Standard
            </button>
            <button type="button" class="adm-ratio-btn ${defaultRatio === '16:9' ? 'is-active' : ''}" data-ratio="16:9">
              16:9 Banner (Hero Slides)
            </button>
            <button type="button" class="adm-ratio-btn ${defaultRatio === 'free' ? 'is-active' : ''}" data-ratio="free">
              Freeform
            </button>
          </div>

          <div class="adm-cropper-viewport" id="crpViewport">
            <canvas class="adm-cropper-canvas" id="crpCanvas"></canvas>
            <div style="position:absolute;bottom:10px;left:14px;background:rgba(0,0,0,0.6);padding:3px 8px;border-radius:6px;font-size:11px;color:#9ca3af;pointer-events:none;">
              🖱️ Drag to pan · Scroll to zoom · Pinch on mobile
            </div>
          </div>

          <div class="adm-cropper-controls">
            <div class="adm-cropper-zoom-row">
              <span style="font-size:12px;color:var(--adm-muted);font-weight:600;">Zoom:</span>
              <button type="button" class="adm-btn adm-btn-sm" id="crpZoomOut" style="padding:2px 8px;">−</button>
              <input type="range" class="adm-cropper-zoom-slider" id="crpZoomSlider" min="0.5" max="3.5" step="0.05" value="1">
              <button type="button" class="adm-btn adm-btn-sm" id="crpZoomIn" style="padding:2px 8px;">+</button>
            </div>
            <div style="display:flex;gap:6px;">
              <button type="button" class="adm-btn adm-btn-sm" id="crpRotate" title="Rotate 90°">↺ Rotate 90°</button>
              <button type="button" class="adm-btn adm-btn-sm" id="crpReset" title="Reset View">⟲ Reset</button>
            </div>
          </div>
        </div>

        <div class="adm-cropper-footer">
          <button type="button" class="adm-btn adm-btn-sm" id="crpSkip">
            ⚡ Skip Cropping (Upload Original)
          </button>
          <div style="display:flex;gap:8px;">
            <button type="button" class="adm-btn" id="crpCancel">Cancel</button>
            <button type="button" class="adm-btn adm-btn-primary" id="crpApply">
              ✂️ Crop &amp; Upload
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const canvas = modal.querySelector('#crpCanvas');
    const ctx = canvas.getContext('2d');
    const viewport = modal.querySelector('#crpViewport');
    const badge = modal.querySelector('#crpBadge');
    const zoomSlider = modal.querySelector('#crpZoomSlider');
    const btnApply = modal.querySelector('#crpApply');
    const btnSkip = modal.querySelector('#crpSkip');
    const btnCancel = modal.querySelector('#crpCancel');
    const btnClose = modal.querySelector('#crpClose');
    const btnRotate = modal.querySelector('#crpRotate');
    const btnReset = modal.querySelector('#crpReset');
    const btnZoomIn = modal.querySelector('#crpZoomIn');
    const btnZoomOut = modal.querySelector('#crpZoomOut');

    let currentRatio = defaultRatio; // '1:1', '4:3', '16:9', 'free'
    let scale = 1.0;
    let baseScale = 1.0;
    let panX = 0;
    let panY = 0;
    let rotation = 0; // 0, 90, 180, 270
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let cropBox = { x: 0, y: 0, w: 0, h: 0 };

    function cleanup() {
      URL.revokeObjectURL(objectUrl);
      modal.remove();
    }

    btnClose.addEventListener('click', cleanup);
    btnCancel.addEventListener('click', cleanup);

    // Compute crop box dimensions based on viewport & currentRatio
    function updateCropBox() {
      const vw = canvas.width;
      const vh = canvas.height;
      const pad = 24;
      const availW = Math.max(100, vw - pad * 2);
      const availH = Math.max(100, vh - pad * 2);

      let w = availW;
      let h = availH;

      if (currentRatio === '1:1') {
        const side = Math.min(availW, availH);
        w = side;
        h = side;
        badge.textContent = '1:1 Square (800×800)';
      } else if (currentRatio === '4:3') {
        w = Math.min(availW, availH * (4 / 3));
        h = w * (3 / 4);
        badge.textContent = '4:3 Standard';
      } else if (currentRatio === '16:9') {
        w = Math.min(availW, availH * (16 / 9));
        h = w * (9 / 16);
        badge.textContent = '16:9 Banner';
      } else {
        w = availW;
        h = availH;
        badge.textContent = 'Freeform';
      }

      cropBox = {
        x: Math.round((vw - w) / 2),
        y: Math.round((vh - h) / 2),
        w: Math.round(w),
        h: Math.round(h)
      };
    }

    function draw() {
      const vw = canvas.width;
      const vh = canvas.height;
      if (!vw || !vh || !img.width) return;

      ctx.save();
      ctx.clearRect(0, 0, vw, vh);

      // Dark background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, vw, vh);

      // Draw transformed image
      ctx.save();
      ctx.translate(panX, panY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Semi-transparent overlay outside cropBox
      ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.fillRect(0, 0, vw, cropBox.y);
      ctx.fillRect(0, cropBox.y + cropBox.h, vw, vh - (cropBox.y + cropBox.h));
      ctx.fillRect(0, cropBox.y, cropBox.x, cropBox.h);
      ctx.fillRect(cropBox.x + cropBox.w, cropBox.y, vw - (cropBox.x + cropBox.w), cropBox.h);

      // Crop box border
      ctx.strokeStyle = '#00e599';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);

      // Rule-of-Thirds Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      // Vertical lines
      ctx.moveTo(cropBox.x + cropBox.w / 3, cropBox.y);
      ctx.lineTo(cropBox.x + cropBox.w / 3, cropBox.y + cropBox.h);
      ctx.moveTo(cropBox.x + (cropBox.w * 2) / 3, cropBox.y);
      ctx.lineTo(cropBox.x + (cropBox.w * 2) / 3, cropBox.y + cropBox.h);
      // Horizontal lines
      ctx.moveTo(cropBox.x, cropBox.y + cropBox.h / 3);
      ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + cropBox.h / 3);
      ctx.moveTo(cropBox.x, cropBox.y + (cropBox.h * 2) / 3);
      ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + (cropBox.h * 2) / 3);
      ctx.stroke();
      ctx.setLineDash([]);

      // Corner Brackets
      ctx.strokeStyle = '#00e599';
      ctx.lineWidth = 3.5;
      const c = 14;
      ctx.beginPath();
      // TL
      ctx.moveTo(cropBox.x, cropBox.y + c); ctx.lineTo(cropBox.x, cropBox.y); ctx.lineTo(cropBox.x + c, cropBox.y);
      // TR
      ctx.moveTo(cropBox.x + cropBox.w - c, cropBox.y); ctx.lineTo(cropBox.x + cropBox.w, cropBox.y); ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + c);
      // BL
      ctx.moveTo(cropBox.x, cropBox.y + cropBox.h - c); ctx.lineTo(cropBox.x, cropBox.y + cropBox.h); ctx.lineTo(cropBox.x + c, cropBox.y + cropBox.h);
      // BR
      ctx.moveTo(cropBox.x + cropBox.w - c, cropBox.y + cropBox.h); ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + cropBox.h); ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + cropBox.h - c);
      ctx.stroke();

      ctx.restore();
    }

    function initImageTransform() {
      const rect = viewport.getBoundingClientRect();
      const vw = Math.round(rect.width || 600);
      const vh = Math.round(rect.height || 380);
      canvas.width = vw;
      canvas.height = vh;
      canvas.style.width = vw + 'px';
      canvas.style.height = vh + 'px';

      updateCropBox();

      const rotated = (rotation % 180 !== 0);
      const effW = rotated ? img.height : img.width;
      const effH = rotated ? img.width : img.height;

      baseScale = Math.max(cropBox.w / effW, cropBox.h / effH);
      scale = baseScale;
      panX = vw / 2;
      panY = vh / 2;

      zoomSlider.min = (baseScale * 0.5).toFixed(3);
      zoomSlider.max = (baseScale * 4.0).toFixed(3);
      zoomSlider.step = (baseScale * 0.05).toFixed(3);
      zoomSlider.value = scale.toFixed(3);

      draw();
    }

    img.onload = () => {
      initImageTransform();
    };
    img.src = objectUrl;

    // Preset Buttons
    modal.querySelectorAll('.adm-ratio-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.adm-ratio-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentRatio = btn.dataset.ratio;
        updateCropBox();
        draw();
      });
    });

    // Zoom Controls
    zoomSlider.addEventListener('input', () => {
      scale = parseFloat(zoomSlider.value);
      draw();
    });

    btnZoomIn.addEventListener('click', () => {
      scale = Math.min(parseFloat(zoomSlider.max), scale * 1.15);
      zoomSlider.value = scale.toFixed(3);
      draw();
    });

    btnZoomOut.addEventListener('click', () => {
      scale = Math.max(parseFloat(zoomSlider.min), scale / 1.15);
      zoomSlider.value = scale.toFixed(3);
      draw();
    });

    // Rotate & Reset
    btnRotate.addEventListener('click', () => {
      rotation = (rotation + 90) % 360;
      draw();
    });

    btnReset.addEventListener('click', () => {
      rotation = 0;
      initImageTransform();
    });

    // Mouse & Touch Dragging Handlers
    function onStart(cx, cy) {
      isDragging = true;
      dragStartX = cx - panX;
      dragStartY = cy - panY;
    }
    function onMove(cx, cy) {
      if (!isDragging) return;
      panX = cx - dragStartX;
      panY = cy - dragStartY;
      draw();
    }
    function onEnd() {
      isDragging = false;
    }

    canvas.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEnd);

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener('touchend', onEnd);

    // Mousewheel Zoom
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      scale = Math.max(parseFloat(zoomSlider.min), Math.min(parseFloat(zoomSlider.max), scale * delta));
      zoomSlider.value = scale.toFixed(3);
      draw();
    }, { passive: false });

    // Skip Cropping
    btnSkip.addEventListener('click', async () => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('dir', dir);
      btnSkip.disabled = true;
      btnSkip.textContent = '⏳ Uploading original…';
      try {
        const res = await api('image_upload', fd, true);
        if (res && res.ok && res.path) {
          toast('Original image uploaded!');
          if (!state.images.includes(res.path)) {
            state.images.push(res.path);
            refreshDatalist();
          }
          cleanup();
          onComplete(res.path);
        } else {
          toast('Upload failed: ' + (res.error || 'Unknown'), true);
          btnSkip.disabled = false;
          btnSkip.textContent = '⚡ Skip Cropping';
        }
      } catch (err) {
        toast('Upload failed.', true);
        btnSkip.disabled = false;
      }
    });

    // Apply & Crop
    btnApply.addEventListener('click', () => {
      btnApply.disabled = true;
      btnApply.textContent = '⏳ Optimizing & Uploading…';

      // Output dimensions
      let outW = 800;
      let outH = 800;
      if (currentRatio === '1:1') {
        outW = 800; outH = 800;
      } else if (currentRatio === '4:3') {
        outW = 1000; outH = 750;
      } else if (currentRatio === '16:9') {
        outW = 1280; outH = 720;
      } else {
        outW = Math.max(300, Math.round(cropBox.w * 2));
        outH = Math.max(300, Math.round(cropBox.h * 2));
      }

      const offscreen = document.createElement('canvas');
      offscreen.width = outW;
      offscreen.height = outH;
      const offCtx = offscreen.getContext('2d');
      offCtx.imageSmoothingEnabled = true;
      offCtx.imageSmoothingQuality = 'high';

      // Mathematical mapping from cropBox to offscreen canvas
      const factor = outW / cropBox.w;
      offCtx.save();
      offCtx.scale(factor, factor);
      offCtx.translate(-cropBox.x, -cropBox.y);
      offCtx.translate(panX, panY);
      offCtx.rotate((rotation * Math.PI) / 180);
      offCtx.scale(scale, scale);
      offCtx.drawImage(img, -img.width / 2, -img.height / 2);
      offCtx.restore();

      offscreen.toBlob(async (blob) => {
        if (!blob) {
          toast('Crop failed to generate image data.', true);
          btnApply.disabled = false;
          btnApply.textContent = '✂️ Crop & Upload';
          return;
        }

        const rawName = (file.name || 'image').replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
        const finalName = `${rawName}_crop_${Date.now()}.webp`;

        const fd = new FormData();
        fd.append('file', blob, finalName);
        fd.append('dir', dir);

        try {
          const res = await api('image_upload', fd, true);
          if (res && res.ok && res.path) {
            toast('Cropped photo uploaded & optimized!');
            if (!state.images.includes(res.path)) {
              state.images.push(res.path);
              refreshDatalist();
            }
            cleanup();
            onComplete(res.path);
          } else {
            toast('Upload failed: ' + (res.error || 'Server rejected file'), true);
            btnApply.disabled = false;
            btnApply.textContent = '✂️ Crop & Upload';
          }
        } catch (e) {
          toast('Network or upload error.', true);
          btnApply.disabled = false;
          btnApply.textContent = '✂️ Crop & Upload';
        }
      }, 'image/webp', 0.90);
    });
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
    upBtn.innerHTML = '📁 Upload &amp; Crop';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png,image/jpeg,image/webp,image/svg+xml';
    fileInput.style.display = 'none';

    upBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
      if (!fileInput.files || !fileInput.files[0]) return;
      const f = fileInput.files[0];
      fileInput.value = '';

      let defRatio = '1:1';
      if (dir === 'hero' || fieldId.includes('hero') || fieldId.includes('banner')) {
        defRatio = '16:9';
      } else if (fieldId.includes('logo')) {
        defRatio = 'free';
      }

      openImageCropper({
        file: f,
        dir: dir,
        defaultRatio: defRatio,
        onComplete: (uploadedPath) => {
          input.value = uploadedPath;
          img.src = '/' + uploadedPath;
          onSelect(uploadedPath);
        }
      });
    });

    wrap.appendChild(img);
    wrap.appendChild(input);
    wrap.appendChild(upBtn);
    wrap.appendChild(fileInput);
    return wrap;
  }
'''

# --- Part 2: Complete renderProductEditor(idx) ---
PRODUCT_EDITOR = r'''  function renderProductEditor(idx) {
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
      gallery: [],
      variants: { type: 'single' },
      seo_title: '',
      seo_desc: '',
      seo_keywords: '',
      slug: ''
    } : JSON.parse(JSON.stringify(prods[idx]));

    p.gallery = Array.isArray(p.gallery) ? p.gallery.filter(Boolean) : [];
    p.variants = (p.variants && typeof p.variants === 'object') ? p.variants : { type: 'single' };

    // Standard brands list + catalog brands
    const standardBrands = [
      'IQOS (Philip Morris International)',
      'TEREA (Japan Domestic Market)',
      'TEREA (Philip Morris Indonesia)',
      'TEREA Kazakhstan Collection',
      'TEREA Swiss Alps Reserve',
      'TEREA Swiss Collection',
      'TEREA Dimensions Series',
      'TEREA Italian Reserve',
      'Heets by IQOS',
      'Fiit by IQOS',
      'Vozol Official UAE',
      'Tugboat Vape Dubai',
      'Fummo Dubai',
      'Pod Salt UK',
      'Nasty Juice Worldwide',
      'Uwell Official',
      'Yuoto Vape',
      'Elf Bar Official',
      'Myle Vapor'
    ];
    const brandSet = new Set(standardBrands);
    (prods || []).forEach(item => { if (item && item.brand) brandSet.add(item.brand); });
    if (p.brand) brandSet.add(p.brand);
    const allBrands = Array.from(brandSet).sort();

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
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <label style="margin:0;">Category *</label>
                <button type="button" class="adm-btn adm-btn-sm" id="btnPeQuickAddCat" style="font-size:11px;padding:2px 8px;color:var(--adm-emerald);">➕ Add Category</button>
              </div>
              <select id="pe_cat">
                ${Object.keys(cats).map(c => `
                  <option value="${esc(c)}" ${p.cat === c ? 'selected' : ''}>${esc(catLabels[c] || c)}</option>
                `).join('')}
              </select>
            </div>
            <div class="adm-field">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <label style="margin:0;">Brand</label>
                <button type="button" class="adm-btn adm-btn-sm" id="btnPeQuickAddBrand" style="font-size:11px;padding:2px 8px;color:var(--adm-emerald);">➕ New Brand</button>
              </div>
              <select id="pe_brand_select" style="margin-bottom:6px;">
                <option value="">-- Choose Brand or Type Below --</option>
                ${allBrands.map(b => `<option value="${esc(b)}" ${p.brand === b ? 'selected' : ''}>${esc(b)}</option>`).join('')}
              </select>
              <input type="text" id="pe_brand" value="${esc(p.brand || '')}" placeholder="Brand name or select from above">
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
          <h3><span>🖼️</span> Primary Product Photo &amp; Gallery</h3>
          <p class="adm-card-sub">Standard 1:1 square crop ensures razor-sharp rendering on all devices</p>

          <div class="adm-touch-upload">
            <img src="${p.photo ? (p.photo.startsWith('/') ? p.photo : '/' + p.photo) : '/assets/images/hero-iluma.png'}"
                 id="pe_thumb_preview" class="adm-touch-upload-thumb" alt="Product Image" onerror="this.src='/assets/images/icons/favicon-32.png'">
            <div class="adm-touch-upload-actions">
              <div class="adm-field" style="margin-bottom:8px;">
                <label>Main Image File Path</label>
                <input type="text" id="pe_photo_input" value="${esc(p.photo || '')}" placeholder="assets/images/products/..." list="admImgDatalist">
              </div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <button type="button" class="adm-btn adm-btn-primary" id="btnTouchUploadPhoto">
                  📷 Upload &amp; Crop Photo (1:1)
                </button>
                <input type="file" id="pe_touch_file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="display:none">
              </div>
              <span class="adm-hint">Opens smart crop window automatically with 1:1 square ratio preset.</span>
            </div>
          </div>

          <div class="adm-field" style="margin-top:16px;">
            <label>Image Alt Tag (SEO &amp; Accessibility)</label>
            <input type="text" id="pe_photo_alt" value="${esc(p.photo_alt || p.name)}" placeholder="Descriptive image text for Google Search">
          </div>

          <!-- MULTI-PICTURE / GALLERY MANAGER -->
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--adm-line);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
              <div>
                <h4 style="margin:0;font-size:15px;color:#fff;display:flex;align-items:center;gap:8px;">
                  <span>📸</span> Multi-Picture Product Gallery <span class="adm-cropper-badge" id="pe_gal_count">0 photos</span>
                </h4>
                <p class="adm-hint" style="margin:2px 0 0 0;">Upload multiple pictures (different angles, box contents, packaging). Shows as interactive thumbnail carousel on the product page.</p>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button type="button" class="adm-btn adm-btn-primary adm-btn-sm" id="btnUploadGalPhoto">
                  ➕ Upload &amp; Crop Picture
                </button>
                <input type="file" id="pe_gal_file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="display:none">
                <button type="button" class="adm-btn adm-btn-sm" id="btnAddGalUrl">
                  🔗 Add by Path / URL
                </button>
              </div>
            </div>
            <div id="pe_gal_grid" class="adm-gal-grid"></div>
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
              <option value="packSize" ${(p.variants && p.variants.type === 'packSize') ? 'selected' : ''}>Multi-Pack Sizes (e.g. 1 Pack, 5 Packs, Carton of 10)</option>
              <option value="device" ${(p.variants && p.variants.type === 'device') ? 'selected' : ''}>Device Colors &amp; Cartridge Bundles</option>
              <option value="vape" ${(p.variants && p.variants.type === 'vape') ? 'selected' : ''}>Disposable Flavors (Flavor List &amp; Taste Notes)</option>
              <option value="juice" ${(p.variants && p.variants.type === 'juice') ? 'selected' : ''}>Nicotine Strengths (3mg, 20mg, 35mg, 50mg)</option>
              <option value="custom" ${(p.variants && p.variants.type === 'custom') ? 'selected' : ''}>Custom Variant Data (JSON)</option>
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
              <span class="adm-serp-site">iqosae.com</span>
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
        formWrap.querySelectorAll('.adm-tab-panel').forEach(panel => {
          panel.style.display = panel.id === 'tab_' + target ? 'block' : 'none';
        });
      });
    });

    // Brand select & quick add
    const brandSelect = formWrap.querySelector('#pe_brand_select');
    const brandInput = formWrap.querySelector('#pe_brand');
    const btnQuickBrand = formWrap.querySelector('#btnPeQuickAddBrand');

    brandSelect.addEventListener('change', () => {
      if (brandSelect.value) {
        brandInput.value = brandSelect.value;
        p.brand = brandSelect.value;
      }
    });
    brandInput.addEventListener('input', () => {
      p.brand = brandInput.value.trim();
      brandSelect.value = brandInput.value.trim() || '';
    });
    if (btnQuickBrand) {
      btnQuickBrand.addEventListener('click', () => {
        const newBrand = prompt('Enter new Brand Name (e.g. Relx):');
        if (!newBrand || !newBrand.trim()) return;
        const clean = newBrand.trim();
        const opt = document.createElement('option');
        opt.value = clean;
        opt.textContent = clean;
        opt.selected = true;
        brandSelect.appendChild(opt);
        brandInput.value = clean;
        p.brand = clean;
        toast(`Brand "${clean}" added.`);
      });
    }

    // Touch Image Upload with Cropper
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

    touchFileInput.addEventListener('change', () => {
      if (!touchFileInput.files || !touchFileInput.files[0]) return;
      const f = touchFileInput.files[0];
      touchFileInput.value = '';

      openImageCropper({
        file: f,
        dir: 'products',
        defaultRatio: '1:1',
        onComplete: (uploadedPath) => {
          p.photo = uploadedPath;
          photoInput.value = uploadedPath;
          thumbImg.src = '/' + uploadedPath;
          toast('Main product photo updated!');
        }
      });
    });

    // Gallery Manager
    function renderGalleryGrid() {
      const grid = formWrap.querySelector('#pe_gal_grid');
      const countBadge = formWrap.querySelector('#pe_gal_count');
      if (!grid) return;
      if (countBadge) countBadge.textContent = `${p.gallery.length} photos`;

      grid.innerHTML = '';
      if (p.gallery.length === 0) {
        grid.innerHTML = `
          <div style="grid-column:1/-1;padding:24px;text-align:center;background:var(--adm-panel3);border-radius:12px;border:1px dashed var(--adm-line);">
            <p style="margin:0 0 10px 0;color:var(--adm-muted);font-size:13px;">No gallery pictures yet. Click "+ Upload &amp; Crop Picture" to add multi-angle views!</p>
            <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" id="btnUploadFirstGal">📷 Upload First Picture</button>
          </div>
        `;
        const btnFirst = grid.querySelector('#btnUploadFirstGal');
        if (btnFirst) {
          btnFirst.addEventListener('click', () => formWrap.querySelector('#pe_gal_file').click());
        }
        return;
      }

      p.gallery.forEach((photoPath, gIdx) => {
        const card = document.createElement('div');
        card.className = 'adm-gal-card';
        card.innerHTML = `
          <img src="${photoPath.startsWith('/') ? photoPath : '/' + photoPath}" class="adm-gal-thumb" alt="Gallery Photo #${gIdx + 1}" onerror="this.src='/assets/images/icons/favicon-32.png'">
          <div style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.7);color:#00e599;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">#${gIdx + 1}</div>
          <div class="adm-gal-actions">
            <button type="button" class="adm-gal-btn" data-act="left" title="Move Left" ${gIdx === 0 ? 'disabled style="opacity:0.3"' : ''}>←</button>
            <button type="button" class="adm-gal-btn" data-act="make-main" title="Make Primary Photo" style="color:#fbbf24;">⭐</button>
            <button type="button" class="adm-gal-btn" data-act="right" title="Move Right" ${gIdx === p.gallery.length - 1 ? 'disabled style="opacity:0.3"' : ''}>→</button>
            <button type="button" class="adm-gal-btn adm-gal-del" data-act="del" title="Delete Photo">✕</button>
          </div>
        `;

        card.querySelector('[data-act="left"]').addEventListener('click', () => {
          if (gIdx > 0) {
            const tmp = p.gallery[gIdx];
            p.gallery[gIdx] = p.gallery[gIdx - 1];
            p.gallery[gIdx - 1] = tmp;
            renderGalleryGrid();
          }
        });
        card.querySelector('[data-act="right"]').addEventListener('click', () => {
          if (gIdx < p.gallery.length - 1) {
            const tmp = p.gallery[gIdx];
            p.gallery[gIdx] = p.gallery[gIdx + 1];
            p.gallery[gIdx + 1] = tmp;
            renderGalleryGrid();
          }
        });
        card.querySelector('[data-act="make-main"]').addEventListener('click', () => {
          const oldMain = p.photo;
          p.photo = photoPath;
          photoInput.value = photoPath;
          thumbImg.src = photoPath.startsWith('/') ? photoPath : '/' + photoPath;
          if (oldMain && oldMain !== photoPath && !p.gallery.includes(oldMain)) {
            p.gallery[gIdx] = oldMain;
          }
          renderGalleryGrid();
          toast('Set as primary product photo!');
        });
        card.querySelector('[data-act="del"]').addEventListener('click', () => {
          p.gallery.splice(gIdx, 1);
          renderGalleryGrid();
          toast('Gallery photo removed.');
        });

        grid.appendChild(card);
      });
    }

    renderGalleryGrid();

    const galFileInput = formWrap.querySelector('#pe_gal_file');
    const btnUploadGal = formWrap.querySelector('#btnUploadGalPhoto');
    btnUploadGal.addEventListener('click', () => galFileInput.click());

    galFileInput.addEventListener('change', () => {
      if (!galFileInput.files || !galFileInput.files[0]) return;
      const f = galFileInput.files[0];
      galFileInput.value = '';

      openImageCropper({
        file: f,
        dir: 'products',
        defaultRatio: '1:1',
        onComplete: (uploadedPath) => {
          p.gallery.push(uploadedPath);
          renderGalleryGrid();
          toast('Added to product gallery!');
        }
      });
    });

    const btnAddGalUrl = formWrap.querySelector('#btnAddGalUrl');
    btnAddGalUrl.addEventListener('click', () => {
      const url = prompt('Enter image path or URL (e.g. assets/images/products/...):');
      if (url && url.trim()) {
        p.gallery.push(url.trim());
        renderGalleryGrid();
        toast('Image added to gallery!');
      }
    });

    // ============================================================
    // TAB 3: DYNAMIC VARIANT BUILDER
    // ============================================================
    const varTypeSelect = formWrap.querySelector('#pe_var_type');
    const varContainer = formWrap.querySelector('#pe_var_container');

    function renderVariantsContainer() {
      const type = varTypeSelect.value;
      varContainer.innerHTML = '';

      if (type === 'single') {
        const basePrice = formWrap.querySelector('#pe_price').value || p.price || 100;
        varContainer.innerHTML = `
          <div style="padding:16px;background:var(--adm-panel3);border-radius:12px;border:1px solid var(--adm-line);">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <span style="font-size:20px;">📦</span>
              <div>
                <b style="color:#fff;font-size:14px;">Single Product Mode Active</b>
                <p class="adm-hint" style="margin:2px 0 0 0;">Customers buy this product at the base price (<b>AED ${esc(basePrice)}</b>) without selecting any variant.</p>
              </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
              <button type="button" class="adm-btn adm-btn-sm" id="btnSwitchToPack">📦 Convert to Multi-Pack Sizes</button>
              <button type="button" class="adm-btn adm-btn-sm" id="btnSwitchToDevice">🎨 Convert to Device Colors</button>
              <button type="button" class="adm-btn adm-btn-sm" id="btnSwitchToVape">🍓 Convert to Disposable Flavors</button>
            </div>
          </div>
        `;
        varContainer.querySelector('#btnSwitchToPack').addEventListener('click', () => {
          varTypeSelect.value = 'packSize';
          renderVariantsContainer();
        });
        varContainer.querySelector('#btnSwitchToDevice').addEventListener('click', () => {
          varTypeSelect.value = 'device';
          renderVariantsContainer();
        });
        varContainer.querySelector('#btnSwitchToVape').addEventListener('click', () => {
          varTypeSelect.value = 'vape';
          renderVariantsContainer();
        });
        return;
      }

      if (type === 'packSize') {
        if (!p.variants.packSizes || !Array.isArray(p.variants.packSizes) || p.variants.packSizes.length === 0) {
          const bp = parseInt(formWrap.querySelector('#pe_price').value || p.price || 100, 10);
          p.variants.packSizes = [
            { id: 'single', label: 'Single Pack (20 Sticks)', price: bp, old: Math.round(bp * 1.2), note: '1 Pack · 20 Sticks sealed' },
            { id: 'carton', label: 'Carton / 10 Packs (200 Sticks)', price: Math.round(bp * 9.5), old: Math.round(bp * 12), note: '10 Packs · Sealed Master Box' }
          ];
        }

        const wrap = document.createElement('div');
        wrap.className = 'adm-var-section';
        wrap.innerHTML = `
          <div class="adm-var-sec-head">
            <div class="adm-var-sec-title"><span>📦</span> Pack Sizes &amp; Volume Pricing</div>
            <div style="display:flex;gap:6px;">
              <button type="button" class="adm-btn adm-btn-sm" id="btnVarPreset1">⚡ Standard 1 Pack &amp; Carton</button>
              <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" id="btnAddPackSize">➕ Add Pack Option</button>
            </div>
          </div>
          <div id="pe_pack_list"></div>
        `;

        function renderPackList() {
          const list = wrap.querySelector('#pe_pack_list');
          list.innerHTML = '';
          p.variants.packSizes.forEach((item, pIdx) => {
            const row = document.createElement('div');
            row.className = 'adm-var-item';
            row.innerHTML = `
              <div style="display:grid;grid-template-columns:2fr 1fr 1fr 2fr;gap:8px;align-items:center;">
                <div>
                  <small style="color:var(--adm-muted);display:block;font-size:11px;">Pack Option Label *</small>
                  <input type="text" class="pk-label" value="${esc(item.label || '')}" placeholder="e.g. Single Pack (20 Sticks)">
                </div>
                <div>
                  <small style="color:var(--adm-muted);display:block;font-size:11px;">Price (AED) *</small>
                  <input type="number" class="pk-price" value="${esc(item.price || '')}">
                </div>
                <div>
                  <small style="color:var(--adm-muted);display:block;font-size:11px;">Old Price (AED)</small>
                  <input type="number" class="pk-old" value="${esc(item.old || '')}" placeholder="Strikethrough">
                </div>
                <div>
                  <small style="color:var(--adm-muted);display:block;font-size:11px;">Badge Note</small>
                  <input type="text" class="pk-note" value="${esc(item.note || '')}" placeholder="e.g. Save 10% on Carton">
                </div>
              </div>
              <div style="display:flex;gap:4px;">
                <button type="button" class="adm-gal-btn" data-act="up" title="Move Up" ${pIdx === 0 ? 'disabled style="opacity:0.3"' : ''}>↑</button>
                <button type="button" class="adm-gal-btn" data-act="down" title="Move Down" ${pIdx === p.variants.packSizes.length - 1 ? 'disabled style="opacity:0.3"' : ''}>↓</button>
                <button type="button" class="adm-gal-btn adm-gal-del" data-act="del" title="Delete">✕</button>
              </div>
            `;

            row.querySelector('.pk-label').addEventListener('input', (e) => { item.label = e.target.value; });
            row.querySelector('.pk-price').addEventListener('input', (e) => { item.price = parseFloat(e.target.value) || 0; });
            row.querySelector('.pk-old').addEventListener('input', (e) => { item.old = e.target.value ? (parseFloat(e.target.value) || '') : ''; });
            row.querySelector('.pk-note').addEventListener('input', (e) => { item.note = e.target.value; });

            row.querySelector('[data-act="up"]').addEventListener('click', () => {
              if (pIdx > 0) {
                const t = p.variants.packSizes[pIdx];
                p.variants.packSizes[pIdx] = p.variants.packSizes[pIdx - 1];
                p.variants.packSizes[pIdx - 1] = t;
                renderPackList();
              }
            });
            row.querySelector('[data-act="down"]').addEventListener('click', () => {
              if (pIdx < p.variants.packSizes.length - 1) {
                const t = p.variants.packSizes[pIdx];
                p.variants.packSizes[pIdx] = p.variants.packSizes[pIdx + 1];
                p.variants.packSizes[pIdx + 1] = t;
                renderPackList();
              }
            });
            row.querySelector('[data-act="del"]').addEventListener('click', () => {
              p.variants.packSizes.splice(pIdx, 1);
              renderPackList();
            });

            list.appendChild(row);
          });
        }

        renderPackList();

        wrap.querySelector('#btnAddPackSize').addEventListener('click', () => {
          p.variants.packSizes.push({
            id: 'pack_' + Date.now().toString().slice(-4),
            label: '5 Packs Bundle',
            price: 550,
            old: 600,
            note: 'Popular Choice'
          });
          renderPackList();
        });

        wrap.querySelector('#btnVarPreset1').addEventListener('click', () => {
          const bp = parseInt(formWrap.querySelector('#pe_price').value || p.price || 100, 10);
          p.variants.packSizes = [
            { id: 'single', label: 'Single Pack (20 Sticks)', price: bp, old: Math.round(bp * 1.2), note: '1 Pack · 20 Sticks sealed' },
            { id: 'bundle5', label: 'Bundle of 5 Packs (100 Sticks)', price: Math.round(bp * 4.8), old: Math.round(bp * 6), note: 'Save 5%' },
            { id: 'carton', label: 'Carton / 10 Packs (200 Sticks)', price: Math.round(bp * 9.5), old: Math.round(bp * 12), note: '10 Packs · Sealed Master Box' }
          ];
          renderPackList();
          toast('Standard pack presets generated!');
        });

        varContainer.appendChild(wrap);
        return;
      }

      if (type === 'device') {
        p.variants.colors = Array.isArray(p.variants.colors) ? p.variants.colors : [];
        p.variants.bundles = Array.isArray(p.variants.bundles) ? p.variants.bundles : [];

        if (p.variants.colors.length === 0) {
          p.variants.colors = [
            { id: 'black', name: 'Obsidian Black', hex: '#1e293b', photo: p.photo || 'assets/images/hero-iluma.png' },
            { id: 'gold', name: 'Sunset Gold', hex: '#d97706', photo: p.photo || 'assets/images/hero-iluma.png' }
          ];
        }

        const secColors = document.createElement('div');
        secColors.className = 'adm-var-section';
        secColors.innerHTML = `
          <div class="adm-var-sec-head">
            <div class="adm-var-sec-title"><span>🎨</span> Device Colors &amp; Photo Swatches</div>
            <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" id="btnAddColor">➕ Add Color</button>
          </div>
          <div id="pe_color_list"></div>
        `;

        function renderColorList() {
          const cl = secColors.querySelector('#pe_color_list');
          cl.innerHTML = '';
          p.variants.colors.forEach((col, cIdx) => {
            const r = document.createElement('div');
            r.className = 'adm-var-item';
            r.innerHTML = `
              <div style="display:grid;grid-template-columns:auto 2fr 1fr 2fr auto;gap:8px;align-items:center;">
                <input type="color" class="col-picker" value="${col.hex || '#000000'}" style="width:36px;height:36px;padding:0;border:none;cursor:pointer;border-radius:6px;">
                <div>
                  <small style="color:var(--adm-muted);display:block;font-size:11px;">Color Name *</small>
                  <input type="text" class="col-name" value="${esc(col.name || '')}" placeholder="e.g. Electric Purple">
                </div>
                <div>
                  <small style="color:var(--adm-muted);display:block;font-size:11px;">Hex Code</small>
                  <input type="text" class="col-hex" value="${esc(col.hex || '#000000')}">
                </div>
                <div>
                  <small style="color:var(--adm-muted);display:block;font-size:11px;">Color Specific Photo</small>
                  <input type="text" class="col-photo" value="${esc(col.photo || '')}" placeholder="assets/images/...">
                </div>
                <div style="display:flex;gap:4px;margin-top:16px;">
                  <button type="button" class="adm-btn adm-btn-sm btn-crop-color" title="Upload &amp; Crop Color Photo">📷 Crop</button>
                  <input type="file" class="col-file" accept="image/*" style="display:none">
                </div>
              </div>
              <button type="button" class="adm-gal-btn adm-gal-del" data-act="del" title="Delete Color">✕</button>
            `;

            const colorPicker = r.querySelector('.col-picker');
            const colorHex = r.querySelector('.col-hex');
            const colorName = r.querySelector('.col-name');
            const colorPhoto = r.querySelector('.col-photo');
            const btnCropCol = r.querySelector('.btn-crop-color');
            const fileInputCol = r.querySelector('.col-file');

            colorPicker.addEventListener('input', (e) => {
              col.hex = e.target.value;
              colorHex.value = e.target.value;
            });
            colorHex.addEventListener('input', (e) => {
              col.hex = e.target.value;
              colorPicker.value = e.target.value;
            });
            colorName.addEventListener('input', (e) => {
              col.name = e.target.value;
              if (!col.id) col.id = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_');
            });
            colorPhoto.addEventListener('input', (e) => { col.photo = e.target.value; });

            btnCropCol.addEventListener('click', () => fileInputCol.click());
            fileInputCol.addEventListener('change', () => {
              if (!fileInputCol.files || !fileInputCol.files[0]) return;
              const f = fileInputCol.files[0];
              fileInputCol.value = '';
              openImageCropper({
                file: f,
                dir: 'products',
                defaultRatio: '1:1',
                onComplete: (uploadedPath) => {
                  col.photo = uploadedPath;
                  colorPhoto.value = uploadedPath;
                  toast(`Color photo for "${col.name || 'device'}" updated!`);
                }
              });
            });

            r.querySelector('[data-act="del"]').addEventListener('click', () => {
              p.variants.colors.splice(cIdx, 1);
              renderColorList();
            });

            cl.appendChild(r);
          });
        }

        renderColorList();

        secColors.querySelector('#btnAddColor').addEventListener('click', () => {
          p.variants.colors.push({
            id: 'color_' + Date.now().toString().slice(-4),
            name: 'New Color',
            hex: '#00e599',
            photo: p.photo || ''
          });
          renderColorList();
        });

        // Bundles Sub-section
        const secBundles = document.createElement('div');
        secBundles.className = 'adm-var-section';
        secBundles.innerHTML = `
          <div class="adm-var-sec-head">
            <div class="adm-var-sec-title"><span>🎁</span> Device Addon Bundles (Optional Starter Kits)</div>
            <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" id="btnAddBundle">➕ Add Bundle</button>
          </div>
          <div id="pe_bundle_list"></div>
        `;

        function renderBundleList() {
          const bl = secBundles.querySelector('#pe_bundle_list');
          bl.innerHTML = '';
          p.variants.bundles.forEach((bd, bIdx) => {
            const r = document.createElement('div');
            r.className = 'adm-var-item';
            r.innerHTML = `
              <div style="display:grid;grid-template-columns:2fr 1fr 2fr;gap:8px;align-items:center;">
                <div>
                  <small style="color:var(--adm-muted);display:block;font-size:11px;">Bundle Label *</small>
                  <input type="text" class="bd-label" value="${esc(bd.label || '')}" placeholder="e.g. + 1 Carton TEREA">
                </div>
                <div>
                  <small style="color:var(--adm-muted);display:block;font-size:11px;">Price Delta (AED)</small>
                  <input type="number" class="bd-delta" value="${esc(bd.priceDiff !== undefined ? bd.priceDiff : 0)}" placeholder="+115">
                </div>
                <div>
                  <small style="color:var(--adm-muted);display:block;font-size:11px;">Bundle Note</small>
                  <input type="text" class="bd-note" value="${esc(bd.note || '')}" placeholder="e.g. Includes 10 packs of your choice">
                </div>
              </div>
              <button type="button" class="adm-gal-btn adm-gal-del" data-act="del" title="Delete Bundle">✕</button>
            `;

            r.querySelector('.bd-label').addEventListener('input', (e) => { bd.label = e.target.value; });
            r.querySelector('.bd-delta').addEventListener('input', (e) => { bd.priceDiff = parseFloat(e.target.value) || 0; });
            r.querySelector('.bd-note').addEventListener('input', (e) => { bd.note = e.target.value; });
            r.querySelector('[data-act="del"]').addEventListener('click', () => {
              p.variants.bundles.splice(bIdx, 1);
              renderBundleList();
            });

            bl.appendChild(r);
          });
        }

        renderBundleList();

        secBundles.querySelector('#btnAddBundle').addEventListener('click', () => {
          p.variants.bundles.push({
            id: 'bd_' + Date.now().toString().slice(-4),
            label: '+ 1 Carton TEREA',
            priceDiff: 115,
            note: 'Best Value Bundle'
          });
          renderBundleList();
        });

        varContainer.appendChild(secColors);
        varContainer.appendChild(secBundles);
        return;
      }

      if (type === 'vape') {
        p.variants.flavors = Array.isArray(p.variants.flavors) ? p.variants.flavors : [];
        if (p.variants.flavors.length === 0) {
          p.variants.flavors = [
            { id: 'watermelon_ice', name: 'Watermelon Ice', note: 'Crisp iced watermelon' },
            { id: 'cool_mint', name: 'Cool Mint', note: 'Ultra-crisp Arctic blast' }
          ];
        }

        const wrap = document.createElement('div');
        wrap.className = 'adm-var-section';
        wrap.innerHTML = `
          <div class="adm-var-sec-head">
            <div class="adm-var-sec-title"><span>🍓</span> Disposable Vape Flavors</div>
            <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" id="btnAddFlavor">➕ Add Flavor</button>
          </div>
          <div id="pe_flavor_list"></div>
        `;

        function renderFlavorList() {
          const fl = wrap.querySelector('#pe_flavor_list');
          fl.innerHTML = '';
          p.variants.flavors.forEach((flv, fIdx) => {
            const r = document.createElement('div');
            r.className = 'adm-var-item';
            r.innerHTML = `
              <div style="display:grid;grid-template-columns:1fr 2fr;gap:8px;align-items:center;">
                <div>
                  <small style="color:var(--adm-muted);display:block;font-size:11px;">Flavor Name *</small>
                  <input type="text" class="flv-name" value="${esc(flv.name || '')}" placeholder="e.g. Watermelon Ice">
                </div>
                <div>
                  <small style="color:var(--adm-muted);display:block;font-size:11px;">Taste Notes / Profile</small>
                  <input type="text" class="flv-note" value="${esc(flv.note || '')}" placeholder="e.g. Sweet chilled watermelon with cooling finish">
                </div>
              </div>
              <button type="button" class="adm-gal-btn adm-gal-del" data-act="del" title="Delete Flavor">✕</button>
            `;

            r.querySelector('.flv-name').addEventListener('input', (e) => {
              flv.name = e.target.value;
              flv.id = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_');
            });
            r.querySelector('.flv-note').addEventListener('input', (e) => { flv.note = e.target.value; });
            r.querySelector('[data-act="del"]').addEventListener('click', () => {
              p.variants.flavors.splice(fIdx, 1);
              renderFlavorList();
            });

            fl.appendChild(r);
          });
        }

        renderFlavorList();

        wrap.querySelector('#btnAddFlavor').addEventListener('click', () => {
          p.variants.flavors.push({
            id: 'flv_' + Date.now().toString().slice(-4),
            name: 'Blue Razz Ice',
            note: 'Icy blueberries and raspberries'
          });
          renderFlavorList();
        });

        varContainer.appendChild(wrap);
        return;
      }

      if (type === 'juice') {
        p.variants.strengths = Array.isArray(p.variants.strengths) ? p.variants.strengths : [];
        if (p.variants.strengths.length === 0) {
          p.variants.strengths = [
            { id: '20mg', label: '20mg Salt Nic (30ml)', note: 'Smooth throat hit' },
            { id: '50mg', label: '50mg Salt Nic (30ml)', note: 'Max nicotine satisfaction' }
          ];
        }

        const wrap = document.createElement('div');
        wrap.className = 'adm-var-section';
        wrap.innerHTML = `
          <div class="adm-var-sec-head">
            <div class="adm-var-sec-title"><span>🧪</span> Nicotine Strengths &amp; Bottle Sizes</div>
            <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" id="btnAddStrength">➕ Add Strength</button>
          </div>
          <div id="pe_strength_list"></div>
        `;

        function renderStrengthList() {
          const sl = wrap.querySelector('#pe_strength_list');
          sl.innerHTML = '';
          p.variants.strengths.forEach((st, sIdx) => {
            const r = document.createElement('div');
            r.className = 'adm-var-item';
            r.innerHTML = `
              <div style="display:grid;grid-template-columns:1fr 2fr;gap:8px;align-items:center;">
                <div>
                  <small style="color:var(--adm-muted);display:block;font-size:11px;">Strength Label *</small>
                  <input type="text" class="st-label" value="${esc(st.label || '')}" placeholder="e.g. 20mg Salt Nic">
                </div>
                <div>
                  <small style="color:var(--adm-muted);display:block;font-size:11px;">Note</small>
                  <input type="text" class="st-note" value="${esc(st.note || '')}" placeholder="e.g. Standard pod strength">
                </div>
              </div>
              <button type="button" class="adm-gal-btn adm-gal-del" data-act="del" title="Delete Strength">✕</button>
            `;

            r.querySelector('.st-label').addEventListener('input', (e) => {
              st.label = e.target.value;
              st.id = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_');
            });
            r.querySelector('.st-note').addEventListener('input', (e) => { st.note = e.target.value; });
            r.querySelector('[data-act="del"]').addEventListener('click', () => {
              p.variants.strengths.splice(sIdx, 1);
              renderStrengthList();
            });

            sl.appendChild(r);
          });
        }

        renderStrengthList();

        wrap.querySelector('#btnAddStrength').addEventListener('click', () => {
          p.variants.strengths.push({
            id: 'st_' + Date.now().toString().slice(-4),
            label: '35mg Salt Nic',
            note: 'Medium high strength'
          });
          renderStrengthList();
        });

        varContainer.appendChild(wrap);
        return;
      }

      // Custom JSON mode
      varContainer.innerHTML = `
        <div class="adm-field">
          <label>Custom Variants JSON Object</label>
          <textarea id="pe_custom_var_json" rows="8" style="font-family:monospace;font-size:12px;">${esc(JSON.stringify(p.variants, null, 2))}</textarea>
        </div>
      `;
    }

    varTypeSelect.addEventListener('change', () => {
      const newType = varTypeSelect.value;
      if (!p.variants || typeof p.variants !== 'object') p.variants = {};
      p.variants.type = newType;
      renderVariantsContainer();
    });

    renderVariantsContainer();

    function serializeVariants() {
      const t = varTypeSelect.value;
      if (t === 'single') {
        return { type: 'single' };
      }
      if (t === 'packSize') {
        return {
          type: 'packSize',
          packSizes: (p.variants.packSizes || []).map((pk, idx) => ({
            id: pk.id || ('pk_' + idx),
            label: pk.label || 'Pack',
            price: parseFloat(pk.price) || 0,
            old: pk.old ? parseFloat(pk.old) : undefined,
            note: pk.note || ''
          }))
        };
      }
      if (t === 'device') {
        return {
          type: 'device',
          colors: (p.variants.colors || []).map((c, idx) => ({
            id: c.id || ('col_' + idx),
            name: c.name || 'Color',
            hex: c.hex || '#000000',
            photo: c.photo || p.photo || ''
          })),
          bundles: (p.variants.bundles || []).map((b, idx) => ({
            id: b.id || ('bd_' + idx),
            label: b.label || 'Bundle',
            priceDiff: parseFloat(b.priceDiff) || 0,
            note: b.note || ''
          }))
        };
      }
      if (t === 'vape') {
        return {
          type: 'vape',
          flavors: (p.variants.flavors || []).map((f, idx) => ({
            id: f.id || ('flv_' + idx),
            name: f.name || 'Flavor',
            note: f.note || ''
          }))
        };
      }
      if (t === 'juice') {
        return {
          type: 'juice',
          strengths: (p.variants.strengths || []).map((s, idx) => ({
            id: s.id || ('st_' + idx),
            label: s.label || 'Strength',
            note: s.note || ''
          }))
        };
      }
      if (t === 'custom') {
        try {
          return JSON.parse(formWrap.querySelector('#pe_custom_var_json').value);
        } catch (ex) {
          toast('Invalid JSON in custom variants — keeping existing.', true);
          return p.variants;
        }
      }
      return { type: 'single' };
    }

    // Editors for Box Contents & Specs Table
    formWrap.querySelector('#pe_box_contents').appendChild(
      renderStringListEditor(p.boxContents || [], (items) => { p.boxContents = items; }, 'Item (e.g. 1x Device)', '+ Add Box Item')
    );
    formWrap.querySelector('#pe_specs_table').appendChild(
      renderKvEditor(p.specsTable || {}, (dict) => { p.specsTable = dict; }, 'Specification', 'Value')
    );

    // Quick Category Add
    const btnQuickCat = formWrap.querySelector('#btnPeQuickAddCat');
    if (btnQuickCat) {
      btnQuickCat.addEventListener('click', () => {
        const catName = prompt('Enter new Category Name (e.g. Nicotine Pouches):');
        if (!catName || !catName.trim()) return;
        const cleanTitle = catName.trim();
        const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/^-|-$/g, '');
        if (!state.data.categories) state.data.categories = {};
        if (!state.data.categories.cats) state.data.categories.cats = {};
        if (!state.data.categories.labels) state.data.categories.labels = {};

        state.data.categories.cats[slug] = {
          title: cleanTitle,
          sub: `Authentic ${cleanTitle} in Dubai`,
          desc: `Buy original ${cleanTitle} online in Dubai & UAE.`,
          theme: 'art-emerald',
          art: 'device',
          photo: 'assets/images/hero-iluma.webp'
        };
        state.data.categories.labels[slug] = cleanTitle;
        markDirty('categories');
        saveAll();

        const sel = formWrap.querySelector('#pe_cat');
        const opt = document.createElement('option');
        opt.value = slug;
        opt.textContent = `${cleanTitle} (${slug})`;
        opt.selected = true;
        sel.appendChild(opt);
        p.cat = slug;
        toast(`Category "${cleanTitle}" created and selected!`);
      });
    }

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

      // Ensure gallery and variants are properly preserved
      p.gallery = Array.isArray(p.gallery) ? p.gallery.filter(Boolean) : [];
      p.variants = serializeVariants();

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
      saveAll();
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
'''

# Find boundaries in text
target1_start = text.find("  function renderImgPicker(fieldId, currentValue, onSelect, dir = 'products') {")
target1_end = text.find("  function renderStringListEditor(list, onChange, placeholder = 'Item…', addLabel = '+ Add Item') {")

if target1_start == -1 or target1_end == -1:
    print("Error locating target 1 in admin.js")
    sys.exit(1)

# Replace renderImgPicker with CROPPER_AND_IMGPICKER
text_step1 = text[:target1_start] + CROPPER_AND_IMGPICKER + "\n\n" + text[target1_end:]

# Find target 2: renderProductEditor
target2_start = text_step1.find("  function renderProductEditor(idx) {")
target2_end = text_step1.find("  /* ============================================================\n     VIEW: HOMEPAGE & FRONTEND-MIRROR VISUAL CUSTOMIZER")

if target2_start == -1 or target2_end == -1:
    print("Error locating target 2 in text_step1")
    sys.exit(1)

text_final = text_step1[:target2_start] + PRODUCT_EDITOR + "\n\n" + text_step1[target2_end:]

with open('admin/assets/admin.js', 'w', encoding='utf-8') as f:
    f.write(text_final)

print("Successfully wrote updated admin/assets/admin.js!")
print(f"Old length: {len(text)} chars, New length: {len(text_final)} chars")
