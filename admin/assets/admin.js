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

  /* ============================================================
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
                🔍 ${esc((home.search && home.search.placeholder) || 'Search products, ILUMA, TEREA…')}
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
                <span class="adm-mirror-flash-chip">${esc(home.flash_deal.badge || 'FLASH DEAL')}</span>
                <span>${esc((home.flash_deal.text || '').replace(new RegExp('^' + (home.flash_deal.badge || 'FLASH DEAL') + '\\s*[—–\\-:]\\s*', 'i'), ''))}</span>
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

          <!-- 7. SHOP / THE COLLECTION -->
          <div class="adm-mirror-sec" data-sec="shop" title="Click to edit collection header">
            <span class="adm-sec-edit-badge">✏️ Edit Collection Header</span>
            <div style="padding:24px 20px;background:rgba(255,255,255,0.01);border-top:1px solid var(--adm-line);">
              <span class="adm-mirror-hero-pill" style="font-size:11px;">${esc((home.shop_section && home.shop_section.eyebrow) || 'The Collection')}</span>
              <div style="font-size:20px;font-weight:800;color:#fff;">${esc((home.shop_section && home.shop_section.title) || 'New Arrivals & UAE Favorites')}</div>
              <p style="font-size:12.5px;color:var(--adm-muted);margin:6px 0 0;">${esc((home.shop_section && home.shop_section.desc) || '')}</p>
            </div>
          </div>

          <!-- 8. TEREA BY ORIGIN -->
          <div class="adm-mirror-sec" data-sec="terea" title="Click to edit TEREA by Origin">
            <span class="adm-sec-edit-badge">✏️ Edit TEREA by Origin</span>
            <div style="padding:24px 20px;background:radial-gradient(circle at 10% 50%, rgba(245,158,11,0.08), transparent 50%);border-top:1px solid var(--adm-line);">
              <span class="adm-mirror-hero-pill" style="font-size:11px;color:var(--adm-amber);border-color:rgba(245,158,11,0.3);background:rgba(245,158,11,0.1);">${esc((home.terea_section && home.terea_section.eyebrow) || 'TEREA by Origin')}</span>
              <div style="font-size:20px;font-weight:800;color:#fff;">${esc((home.terea_section && home.terea_section.title) || 'Choose Your Country Blend')}</div>
              <p style="font-size:12.5px;color:var(--adm-muted);margin:6px 0 10px;">${esc((home.terea_section && home.terea_section.desc) || '')}</p>
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                ${((home.terea_section && home.terea_section.legend) || []).map(l => `<span style="background:rgba(255,255,255,0.06);padding:3px 10px;border-radius:6px;font-size:11.5px;">${esc(l)}</span>`).join('')}
              </div>
            </div>
          </div>

          <!-- 9. DISPOSABLES SHOWCASE -->
          <div class="adm-mirror-sec" data-sec="disposables" title="Click to edit Disposables section">
            <span class="adm-sec-edit-badge">✏️ Edit Disposables Showcase</span>
            <div style="padding:24px 20px;background:rgba(239,68,68,0.04);border-top:1px solid var(--adm-line);">
              <span class="adm-mirror-hero-pill" style="font-size:11px;color:var(--adm-red);border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.1);">${esc((home.disposables_section && home.disposables_section.eyebrow) || 'High Puff')}</span>
              <div style="font-size:20px;font-weight:800;color:#fff;">${esc((home.disposables_section && home.disposables_section.title) || 'Disposable Vapes Showcase')}</div>
              <p style="font-size:12.5px;color:var(--adm-muted);margin:6px 0 0;">${esc((home.disposables_section && home.disposables_section.desc) || '')}</p>
            </div>
          </div>

          <!-- 10. REVIEWS & TESTIMONIALS -->
          <div class="adm-mirror-sec" data-sec="reviews" title="Click to edit customer reviews">
            <span class="adm-sec-edit-badge">✏️ Edit Customer Reviews</span>
            <div style="padding:24px 20px;border-top:1px solid var(--adm-line);">
              <span class="adm-mirror-hero-pill" style="font-size:11px;">${esc((home.reviews_section && home.reviews_section.eyebrow) || 'Verified Buyers')}</span>
              <div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:12px;">${esc((home.reviews_section && home.reviews_section.title) || 'Loved Across the Emirates')}</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
                ${(home.reviews || []).slice(0, 3).map(r => `
                  <div style="background:var(--adm-panel2);border:1px solid var(--adm-line);border-radius:12px;padding:14px;">
                    <div style="color:var(--adm-amber);font-size:12px;margin-bottom:4px;">${'★'.repeat(r.stars || 5)}</div>
                    <p style="font-size:12px;color:var(--adm-text);margin:0 0 8px;line-height:1.4;">${esc(r.text)}</p>
                    <div style="font-size:11px;font-weight:700;">${esc(r.name)} <span style="color:var(--adm-muted);font-weight:400;">· ${esc(r.location)}</span></div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- 11. TRUST BENEFITS -->
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

          <!-- 12. FAQS -->
          <div class="adm-mirror-sec" data-sec="faqs" title="Click to edit FAQs">
            <span class="adm-sec-edit-badge">✏️ Edit FAQs</span>
            <div style="padding:24px 20px;border-top:1px solid var(--adm-line);">
              <span class="adm-mirror-hero-pill" style="font-size:11px;">${esc((home.faq_section && home.faq_section.eyebrow) || 'Good to Know')}</span>
              <div style="font-size:18px;font-weight:800;margin-bottom:14px;">${esc((home.faq_section && home.faq_section.title) || 'Delivery &amp; Ordering FAQ')}</div>
              ${(home.faqs || []).slice(0, 3).map(f => `
                <div class="adm-mirror-faq-item">
                  <span>${esc(f.q)}</span>
                  <span>+</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 13. CTA BANNER -->
          <div class="adm-mirror-sec" data-sec="cta" title="Click to edit CTA banner">
            <span class="adm-sec-edit-badge">✏️ Edit CTA Banner</span>
            <div class="adm-mirror-cta">
              <span class="adm-mirror-hero-pill" style="font-size:11px;margin-bottom:8px;">${esc((home.cta_section && home.cta_section.eyebrow) || '24/7 Dubai Assistance')}</span>
              <div style="font-size:20px;font-weight:800;color:#fff;">${esc((home.cta_section && home.cta_section.title_pre) || '')}<span style="color:var(--adm-emerald)">${esc((home.cta_section && home.cta_section.title_highlight) || '')}</span></div>
              <p style="font-size:13px;color:var(--adm-muted);margin:8px 0 16px;">${esc((home.cta_section && home.cta_section.text) || '')}</p>
              <button class="adm-btn adm-btn-primary" style="pointer-events:none;">💬 ${esc((home.cta_section && home.cta_section.button_label) || 'Chat with an Expert')}</button>
            </div>
          </div>

          <!-- 14. 18+ AGE GATE -->
          <div class="adm-mirror-sec" data-sec="age_gate" title="Click to edit 18+ Age Verification">
            <span class="adm-sec-edit-badge">✏️ Edit 18+ Age Verification</span>
            <div style="padding:16px 20px;background:rgba(239,68,68,0.06);border-top:1px solid rgba(239,68,68,0.2);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:20px;">🔞</span>
                <div>
                  <b>18+ Age Verification Popup: ${home.age_gate && home.age_gate.enabled ? '<span style="color:var(--adm-emerald)">Active</span>' : '<span style="color:var(--adm-muted)">Disabled</span>'}</b>
                  <small style="display:block;color:var(--adm-muted);">${esc((home.age_gate && home.age_gate.title) || 'Are you 18 or older?')}</small>
                </div>
              </div>
              <span class="adm-btn adm-btn-sm" style="pointer-events:none;">Configure Age Gate</span>
            </div>
          </div>

          <!-- 15. CHECKOUT & WHATSAPP BANNER -->
          <div class="adm-mirror-sec" data-sec="checkout" title="Click to edit Checkout Experience">
            <span class="adm-sec-edit-badge">✏️ Edit Checkout &amp; WhatsApp Banner</span>
            <div style="padding:16px 20px;background:rgba(0,229,153,0.05);border-top:1px solid rgba(0,229,153,0.2);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:20px;">⚡</span>
                <div>
                  <b>Checkout Banner: ${esc((home.checkout && home.checkout.wa_banner_title) || 'Order Directly via WhatsApp')}</b>
                  <small style="display:block;color:var(--adm-muted);">${esc((home.checkout && home.checkout.title) || 'Complete Your Order')} · Emirates delivery</small>
                </div>
              </div>
              <span class="adm-btn adm-btn-sm" style="pointer-events:none;">Configure Checkout</span>
            </div>
          </div>

          <!-- 16. SEARCH PLACEHOLDERS -->
          <div class="adm-mirror-sec" data-sec="search" title="Click to edit Search Placeholders">
            <span class="adm-sec-edit-badge">✏️ Edit Search Placeholders</span>
            <div style="padding:14px 20px;background:rgba(255,255,255,0.02);border-top:1px solid var(--adm-line);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
              <div>
                <b>🔍 Search Bar Placeholder:</b> <code>${esc((home.search && home.search.placeholder) || 'Search IQOS, TEREA, flavors…')}</code>
              </div>
              <span class="adm-btn adm-btn-sm" style="pointer-events:none;">Configure Search</span>
            </div>
          </div>

          <!-- 17. BUYING GUIDES & CONTENT PAGES -->
          <div class="adm-mirror-sec" data-sec="guides" title="Click to edit Buying Guides &amp; Educational Pages">
            <span class="adm-sec-edit-badge">✏️ Edit Buying Guides &amp; Pages</span>
            <div style="padding:16px 20px;background:rgba(0,229,153,0.03);border-top:1px solid var(--adm-line);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
              <div>
                <b>📚 UAE Buying Guides &amp; Content Pages:</b>
                <span style="color:var(--adm-muted);margin-left:8px;">TEREA Flavor Guide, IQOS ILUMA Device Comparison, UAE Customs &amp; Advice</span>
              </div>
              <span class="adm-btn adm-btn-sm" style="pointer-events:none;">Configure Guides</span>
            </div>
          </div>

          <!-- 18. EMIRATES DELIVERY SCHEDULES -->
          <div class="adm-mirror-sec" data-sec="emirates" title="Click to edit UAE Emirates Delivery Schedules">
            <span class="adm-sec-edit-badge">✏️ Edit Emirates Delivery</span>
            <div style="padding:16px 20px;background:rgba(245,158,11,0.03);border-top:1px solid var(--adm-line);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
              <div>
                <b>🚚 7 UAE Emirates Delivery Schedules:</b>
                <span style="color:var(--adm-muted);margin-left:8px;">Dubai (1-2h), Sharjah &amp; Ajman (Same Day), Abu Dhabi &amp; Northern Emirates</span>
              </div>
              <span class="adm-btn adm-btn-sm" style="pointer-events:none;">Configure Emirates</span>
            </div>
          </div>

          <!-- 19. PAYMENT & TRUST BADGES -->
          <div class="adm-mirror-sec" data-sec="payment_badges" title="Click to edit Payment Badges">
            <span class="adm-sec-edit-badge">✏️ Edit Payment Badges</span>
            <div style="padding:16px 20px;background:rgba(59,130,246,0.03);border-top:1px solid var(--adm-line);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
              <div>
                <b>💳 Accepted Payment Badges:</b>
                <span style="color:var(--adm-muted);margin-left:8px;">${((settings.payment_badges || ['Cash on Delivery', 'Card on Delivery', 'Apple Pay']).slice(0, 4)).join(' · ')}</span>
              </div>
              <span class="adm-btn adm-btn-sm" style="pointer-events:none;">Configure Badges</span>
            </div>
          </div>

          <!-- 20. FOOTER SHOP LINKS -->
          <div class="adm-mirror-sec" data-sec="footer_links" title="Click to edit Footer Links">
            <span class="adm-sec-edit-badge">✏️ Edit Footer Links</span>
            <div style="padding:16px 20px;background:rgba(255,255,255,0.02);border-top:1px solid var(--adm-line);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
              <div>
                <b>🔗 Footer Navigation &amp; Shop Links:</b>
                <span style="color:var(--adm-muted);margin-left:8px;">${((home.footer_shop_links || []).map(l => l.label)).slice(0, 4).join(' · ')}</span>
              </div>
              <span class="adm-btn adm-btn-sm" style="pointer-events:none;">Configure Links</span>
            </div>
          </div>

          <!-- 21. FOOTER -->
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
                <div style="margin-top:6px;font-size:11px;">${esc(settings.legal_warning || '18+ Warning: Nicotine is addictive. ESMA certified.')}</div>
              </div>
            </div>
          </div>

        </div>
      `;
    } else {
      // Complete Classic Form View (All 17 Sections)
      html += `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <p style="color:var(--adm-muted);margin:0;">Edit any storefront section directly using standard form fields.</p>
          <button type="button" class="adm-btn adm-btn-primary" id="btnClassicSaveTop">💾 Save All Changes</button>
        </div>

        <!-- 1. ANNOUNCEMENT -->
        <div class="adm-card">
          <h3><span>📢</span> 1. Top Announcement Ticker Bar</h3>
          <div class="adm-field">
            <label>Announcement Messages</label>
            <div id="classic_announce_items"></div>
          </div>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Currency Chip Label</label>
              <input type="text" id="classic_curr_chip" value="${esc(home.currency_chip || 'AED د.إ')}">
            </div>
            <div class="adm-field">
              <label>Language Toggle</label>
              <label class="adm-check" style="margin-top:10px;">
                <input type="checkbox" id="classic_lang_toggle" ${home.show_language_toggle ? 'checked' : ''}>
                <span>Display EN / AR Switcher</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 2. FLASH DEAL -->
        <div class="adm-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="margin:0;"><span>⚡</span> 2. Flash Deal Strip</h3>
            <button type="button" class="adm-btn adm-btn-sm" id="btnClassicFdModal">⚡ Open Live Modal Editor →</button>
          </div>
          <label class="adm-check" style="margin-bottom:12px;">
            <input type="checkbox" id="classic_fd_enabled" ${home.flash_deal && home.flash_deal.enabled ? 'checked' : ''}>
            <span>Enable Glowing Flash Deal Strip</span>
          </label>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Deal Badge / Tag</label>
              <input type="text" id="classic_fd_badge" value="${esc(home.flash_deal ? (home.flash_deal.badge || 'FLASH DEAL') : 'FLASH DEAL')}">
            </div>
            <div class="adm-field">
              <label>Deal Offer / Announcement Description</label>
              <input type="text" id="classic_fd_text" value="${esc(home.flash_deal ? home.flash_deal.text : '')}">
            </div>
          </div>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>CTA Button Label</label>
              <input type="text" id="classic_fd_cta_label" value="${esc(home.flash_deal ? home.flash_deal.cta_label : 'Shop now')}">
            </div>
            <div class="adm-field">
              <label>CTA Target URL / Anchor</label>
              <input type="text" id="classic_fd_cta_href" value="${esc(home.flash_deal ? home.flash_deal.cta_href : '#shop')}">
            </div>
          </div>
        </div>

        <!-- 3. POPULAR CATEGORIES -->
        <div class="adm-card">
          <h3><span>📂</span> 3. Popular Categories Section</h3>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Highlight Word (Green)</label>
              <input type="text" id="classic_pop_word" value="${esc((home.pop_categories && home.pop_categories.pop_word) || 'Popular')}">
            </div>
            <div class="adm-field">
              <label>Section Heading</label>
              <input type="text" id="classic_pop_title" value="${esc((home.pop_categories && home.pop_categories.title) || 'Categories')}">
            </div>
          </div>
          <div class="adm-grid3">
            <div class="adm-field">
              <label>"More Categories" Count</label>
              <input type="text" id="classic_pop_more_cnt" value="${esc((home.pop_categories && home.pop_categories.more_count) || '+9')}">
            </div>
            <div class="adm-field">
              <label>"More Categories" Title</label>
              <input type="text" id="classic_pop_more_title" value="${esc((home.pop_categories && home.pop_categories.more_title) || 'MORE CATEGORIES')}">
            </div>
            <div class="adm-field">
              <label>"More Categories" Subtitle</label>
              <input type="text" id="classic_pop_more_sub" value="${esc((home.pop_categories && home.pop_categories.more_sub) || 'Tap to view all')}">
            </div>
          </div>
          <div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" onclick="ADM.openSectionModal('cats')">🎨 Manage Tiles &amp; ➕ Create New Category →</button>
          </div>
        </div>

        <!-- 4. VIP BESTSELLERS -->
        <div class="adm-card">
          <h3><span>👑</span> 4. VIP Bestsellers Showcase</h3>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Badge Ribbon Text</label>
              <input type="text" id="classic_vip_badge" value="${esc((home.vip_section && home.vip_section.badge) || '')}">
            </div>
            <div class="adm-field">
              <label>Pulse Demand Text</label>
              <input type="text" id="classic_vip_pulse" value="${esc((home.vip_section && home.vip_section.pulse) || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Section Title</label>
            <input type="text" id="classic_vip_title" value="${esc((home.vip_section && home.vip_section.title) || '')}">
          </div>
          <div class="adm-field">
            <label>Description</label>
            <textarea id="classic_vip_desc" rows="2">${esc((home.vip_section && home.vip_section.desc) || '')}</textarea>
          </div>
        </div>

        <!-- 5. SHOP COLLECTION -->
        <div class="adm-card">
          <h3><span>🛍️</span> 5. The Collection / New Arrivals Section</h3>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Eyebrow Pill</label>
              <input type="text" id="classic_shop_eyebrow" value="${esc((home.shop_section && home.shop_section.eyebrow) || '')}">
            </div>
            <div class="adm-field">
              <label>Section Heading</label>
              <input type="text" id="classic_shop_title" value="${esc((home.shop_section && home.shop_section.title) || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Description</label>
            <textarea id="classic_shop_desc" rows="2">${esc((home.shop_section && home.shop_section.desc) || '')}</textarea>
          </div>
        </div>

        <!-- 6. TEREA BY ORIGIN -->
        <div class="adm-card">
          <h3><span>🎌</span> 6. TEREA by Origin Section</h3>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Eyebrow Pill</label>
              <input type="text" id="classic_terea_eyebrow" value="${esc((home.terea_section && home.terea_section.eyebrow) || '')}">
            </div>
            <div class="adm-field">
              <label>Section Heading</label>
              <input type="text" id="classic_terea_title" value="${esc((home.terea_section && home.terea_section.title) || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Description</label>
            <textarea id="classic_terea_desc" rows="2">${esc((home.terea_section && home.terea_section.desc) || '')}</textarea>
          </div>
          <div class="adm-field">
            <label>Origin Country Badges / Legend</label>
            <div id="classic_terea_legend"></div>
          </div>
        </div>

        <!-- 7. DISPOSABLES SHOWCASE -->
        <div class="adm-card">
          <h3><span>💨</span> 7. Disposable Vapes Showcase</h3>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Eyebrow Pill</label>
              <input type="text" id="classic_disp_eyebrow" value="${esc((home.disposables_section && home.disposables_section.eyebrow) || '')}">
            </div>
            <div class="adm-field">
              <label>Section Heading</label>
              <input type="text" id="classic_disp_title" value="${esc((home.disposables_section && home.disposables_section.title) || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Description</label>
            <textarea id="classic_disp_desc" rows="2">${esc((home.disposables_section && home.disposables_section.desc) || '')}</textarea>
          </div>
        </div>

        <!-- 8. REVIEWS & TESTIMONIALS -->
        <div class="adm-card">
          <h3><span>⭐</span> 8. Customer Reviews &amp; Testimonials Section</h3>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Eyebrow Pill</label>
              <input type="text" id="classic_rev_eyebrow" value="${esc((home.reviews_section && home.reviews_section.eyebrow) || '')}">
            </div>
            <div class="adm-field">
              <label>Section Heading</label>
              <input type="text" id="classic_rev_title" value="${esc((home.reviews_section && home.reviews_section.title) || '')}">
            </div>
          </div>
          <p style="font-size:12px;color:var(--adm-muted);">Manage full testimonials (reviews) via the Visual Customizer click or modal.</p>
        </div>

        <!-- 9. CTA BANNER -->
        <div class="adm-card">
          <h3><span>💬</span> 9. Call-To-Action (CTA) Concierge Banner</h3>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Eyebrow Pill</label>
              <input type="text" id="classic_cta_eyebrow" value="${esc((home.cta_section && home.cta_section.eyebrow) || '')}">
            </div>
            <div class="adm-field">
              <label>Button Label</label>
              <input type="text" id="classic_cta_btn" value="${esc((home.cta_section && home.cta_section.button_label) || '')}">
            </div>
          </div>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Title Prefix</label>
              <input type="text" id="classic_cta_pre" value="${esc((home.cta_section && home.cta_section.title_pre) || '')}">
            </div>
            <div class="adm-field">
              <label>Title Highlight (Green)</label>
              <input type="text" id="classic_cta_hl" value="${esc((home.cta_section && home.cta_section.title_highlight) || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Subtext Description</label>
            <textarea id="classic_cta_text" rows="2">${esc((home.cta_section && home.cta_section.text) || '')}</textarea>
          </div>
        </div>

        <!-- 10. 18+ AGE GATE -->
        <div class="adm-card">
          <h3><span>🔞</span> 10. 18+ Age Verification Modal</h3>
          <label class="adm-check" style="margin-bottom:12px;">
            <input type="checkbox" id="classic_ag_en" ${home.age_gate && home.age_gate.enabled ? 'checked' : ''}>
            <span>Enable 18+ Age Verification Popup</span>
          </label>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Modal Title</label>
              <input type="text" id="classic_ag_title" value="${esc((home.age_gate && home.age_gate.title) || '')}">
            </div>
            <div class="adm-field">
              <label>Compliance Footnote</label>
              <input type="text" id="classic_ag_note" value="${esc((home.age_gate && home.age_gate.note) || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Warning Text</label>
            <textarea id="classic_ag_text" rows="2">${esc((home.age_gate && home.age_gate.text) || '')}</textarea>
          </div>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Yes Button (18+)</label>
              <input type="text" id="classic_ag_yes" value="${esc((home.age_gate && home.age_gate.yes_label) || '')}">
            </div>
            <div class="adm-field">
              <label>No Button (Under 18)</label>
              <input type="text" id="classic_ag_no" value="${esc((home.age_gate && home.age_gate.no_label) || '')}">
            </div>
          </div>
        </div>

        <!-- 11. CHECKOUT & WHATSAPP BANNER -->
        <div class="adm-card">
          <h3><span>⚡</span> 11. Express Checkout &amp; WhatsApp Direct</h3>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Checkout Eyebrow</label>
              <input type="text" id="classic_chk_eyebrow" value="${esc((home.checkout && home.checkout.eyebrow) || '')}">
            </div>
            <div class="adm-field">
              <label>Checkout Heading</label>
              <input type="text" id="classic_chk_title" value="${esc((home.checkout && home.checkout.title) || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Checkout Subtitle</label>
            <input type="text" id="classic_chk_sub" value="${esc((home.checkout && home.checkout.sub) || '')}">
          </div>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>WhatsApp Banner Badge</label>
              <input type="text" id="classic_chk_wa_badge" value="${esc((home.checkout && home.checkout.wa_banner_badge) || '')}">
            </div>
            <div class="adm-field">
              <label>WhatsApp Banner Title</label>
              <input type="text" id="classic_chk_wa_title" value="${esc((home.checkout && home.checkout.wa_banner_title) || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>WhatsApp Banner Description</label>
            <textarea id="classic_chk_wa_text" rows="2">${esc((home.checkout && home.checkout.wa_banner_text) || '')}</textarea>
          </div>
        </div>

        <!-- 12. SEARCH PLACEHOLDERS -->
        <div class="adm-card">
          <h3><span>🔍</span> 12. Search Bar Text &amp; Placeholders</h3>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Desktop Search Placeholder</label>
              <input type="text" id="classic_srch_ph" value="${esc((home.search && home.search.placeholder) || '')}">
            </div>
            <div class="adm-field">
              <label>Mobile Modal Search Placeholder</label>
              <input type="text" id="classic_srch_modal_ph" value="${esc((home.search && home.search.modal_placeholder) || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Empty Results Message</label>
            <input type="text" id="classic_srch_empty" value="${esc((home.search && home.search.empty_text) || '')}">
          </div>
        </div>

        <div style="text-align:right;margin-top:20px;">
          <button type="button" class="adm-btn adm-btn-primary adm-btn-lg" id="btnClassicSaveBottom">💾 Save All Changes</button>
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
            <button type="button" class="adm-btn adm-btn-primary" id="admSecModalDone">✓ Done Editing &amp; Save</button>
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
      // Classic form bindings
      const bind = (id, obj, prop, isNum = false) => {
        const el = dom.content.querySelector('#' + id);
        if (el) el.addEventListener('input', (e) => {
          obj[prop] = isNum ? (parseFloat(e.target.value) || 0) : e.target.value;
          markDirty('home');
        });
      };
      const bindCheck = (id, obj, prop) => {
        const el = dom.content.querySelector('#' + id);
        if (el) el.addEventListener('change', (e) => {
          obj[prop] = e.target.checked;
          markDirty('home');
        });
      };

      dom.content.querySelector('#classic_announce_items').appendChild(
        renderStringListEditor(home.announce_items || [], (items) => {
          home.announce_items = items;
          markDirty('home');
        }, 'Ticker message', '+ Add Announcement')
      );
      bind('classic_curr_chip', home, 'currency_chip');
      bindCheck('classic_lang_toggle', home, 'show_language_toggle');

      if (!home.flash_deal) home.flash_deal = {};
      bindCheck('classic_fd_enabled', home.flash_deal, 'enabled');
      bind('classic_fd_badge', home.flash_deal, 'badge');
      bind('classic_fd_text', home.flash_deal, 'text');
      bind('classic_fd_cta_label', home.flash_deal, 'cta_label');
      bind('classic_fd_cta_href', home.flash_deal, 'cta_href');
      const btnClassicFdModal = dom.content.querySelector('#btnClassicFdModal');
      if (btnClassicFdModal) btnClassicFdModal.addEventListener('click', () => openSectionModal('flash'));

      if (!home.pop_categories) home.pop_categories = {};
      bind('classic_pop_word', home.pop_categories, 'pop_word');
      bind('classic_pop_title', home.pop_categories, 'title');
      bind('classic_pop_more_cnt', home.pop_categories, 'more_count');
      bind('classic_pop_more_title', home.pop_categories, 'more_title');
      bind('classic_pop_more_sub', home.pop_categories, 'more_sub');

      if (!home.vip_section) home.vip_section = {};
      bind('classic_vip_badge', home.vip_section, 'badge');
      bind('classic_vip_pulse', home.vip_section, 'pulse');
      bind('classic_vip_title', home.vip_section, 'title');
      bind('classic_vip_desc', home.vip_section, 'desc');

      if (!home.shop_section) home.shop_section = {};
      bind('classic_shop_eyebrow', home.shop_section, 'eyebrow');
      bind('classic_shop_title', home.shop_section, 'title');
      bind('classic_shop_desc', home.shop_section, 'desc');

      if (!home.terea_section) home.terea_section = {};
      bind('classic_terea_eyebrow', home.terea_section, 'eyebrow');
      bind('classic_terea_title', home.terea_section, 'title');
      bind('classic_terea_desc', home.terea_section, 'desc');
      const tereaLegendEl = dom.content.querySelector('#classic_terea_legend');
      if (tereaLegendEl) {
        tereaLegendEl.appendChild(
          renderStringListEditor(home.terea_section.legend || [], (items) => {
            home.terea_section.legend = items;
            markDirty('home');
          }, 'Country Origin (e.g. 🇮🇩 Indonesia)', '+ Add Origin')
        );
      }

      if (!home.disposables_section) home.disposables_section = {};
      bind('classic_disp_eyebrow', home.disposables_section, 'eyebrow');
      bind('classic_disp_title', home.disposables_section, 'title');
      bind('classic_disp_desc', home.disposables_section, 'desc');

      if (!home.reviews_section) home.reviews_section = {};
      bind('classic_rev_eyebrow', home.reviews_section, 'eyebrow');
      bind('classic_rev_title', home.reviews_section, 'title');

      if (!home.cta_section) home.cta_section = {};
      bind('classic_cta_eyebrow', home.cta_section, 'eyebrow');
      bind('classic_cta_pre', home.cta_section, 'title_pre');
      bind('classic_cta_hl', home.cta_section, 'title_highlight');
      bind('classic_cta_text', home.cta_section, 'text');
      bind('classic_cta_btn', home.cta_section, 'button_label');

      if (!home.age_gate) home.age_gate = {};
      bindCheck('classic_ag_en', home.age_gate, 'enabled');
      bind('classic_ag_title', home.age_gate, 'title');
      bind('classic_ag_note', home.age_gate, 'note');
      bind('classic_ag_text', home.age_gate, 'text');
      bind('classic_ag_yes', home.age_gate, 'yes_label');
      bind('classic_ag_no', home.age_gate, 'no_label');

      if (!home.checkout) home.checkout = {};
      bind('classic_chk_eyebrow', home.checkout, 'eyebrow');
      bind('classic_chk_title', home.checkout, 'title');
      bind('classic_chk_sub', home.checkout, 'sub');
      bind('classic_chk_wa_badge', home.checkout, 'wa_banner_badge');
      bind('classic_chk_wa_title', home.checkout, 'wa_banner_title');
      bind('classic_chk_wa_text', home.checkout, 'wa_banner_text');

      if (!home.search) home.search = {};
      bind('classic_srch_ph', home.search, 'placeholder');
      bind('classic_srch_modal_ph', home.search, 'modal_placeholder');
      bind('classic_srch_empty', home.search, 'empty_text');

      const classicSaveHandler = () => {
        saveAll();
      };
      const btnTop = document.getElementById('btnClassicSaveTop');
      const btnBtm = document.getElementById('btnClassicSaveBottom');
      if (btnTop) btnTop.addEventListener('click', classicSaveHandler);
      if (btnBtm) btnBtm.addEventListener('click', classicSaveHandler);
    }

    // Modal Close Handlers
    const modal = document.getElementById('admSecModal');
    const closeModal = () => {
      modal.classList.remove('is-open');
      if (state.dirty.size > 0) {
        saveAll();
      }
      renderHomepage();
    };
    document.getElementById('admSecModalClose').addEventListener('click', closeModal);
    document.getElementById('admSecModalDone').addEventListener('click', closeModal);
  }

  /* ---------- SECTION EDIT MODAL (ALL SECTIONS FULLY EDITABLE) ---------- */
  function openSectionModal(secKey) {
    const modal = document.getElementById('admSecModal');
    const titleEl = document.getElementById('admSecModalTitle');
    const bodyEl = document.getElementById('admSecModalBody');
    if (!modal || !titleEl || !bodyEl) return;

    secKey = (secKey || '').toLowerCase().trim();
    if (secKey === 'categories') secKey = 'cats';
    if (secKey === 'bestsellers' || secKey === 'bestseller') secKey = 'vip';
    if (secKey === 'faq') secKey = 'faqs';
    if (secKey === 'links') secKey = 'footer_links';
    if (secKey === 'badges') secKey = 'payment_badges';
    if (secKey === 'pages') secKey = 'guides';

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
        titleEl.innerHTML = '⚡ Edit Glowing Flash Deal Strip';
        if (!home.flash_deal) home.flash_deal = {};
        const fd = home.flash_deal;
        if (!fd.badge) fd.badge = 'FLASH DEAL';

        bodyEl.innerHTML = `
          <label class="adm-check" style="margin-bottom:14px;">
            <input type="checkbox" id="m_fd_enabled" ${fd.enabled ? 'checked' : ''}>
            <span>Enable Glowing Flash Deal Strip</span>
          </label>

          <!-- Storefront-Matching Live Preview -->
          <div class="adm-field" style="margin-bottom:16px;">
            <label style="font-size:12px;color:var(--adm-muted);">Live Storefront Preview</label>
            <div id="m_fd_preview_box" style="display:${fd.enabled ? 'flex' : 'none'};align-items:center;gap:8px;padding:10px 16px;border-radius:999px;border:1px solid rgba(245,158,11,0.5);background:linear-gradient(90deg,rgba(245,158,11,0.15),rgba(239,68,68,0.1));font-size:12px;font-weight:600;color:var(--adm-ink);overflow:hidden;">
              <span style="color:var(--adm-amber);font-size:15px;">⚡</span>
              <span id="m_fd_preview_badge" style="color:var(--adm-amber);font-weight:800;letter-spacing:0.07em;">${esc(fd.badge || 'FLASH DEAL')}</span>
              <span style="color:var(--adm-muted);">&mdash;</span>
              <span id="m_fd_preview_text" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(fd.text || 'Free TEREA pack with every ILUMA device · Today only')}</span>
              <span id="m_fd_preview_cta" style="color:var(--adm-amber);font-weight:700;text-decoration:underline;cursor:pointer;">${esc(fd.cta_label || 'Shop now')} &rarr;</span>
            </div>
            <div id="m_fd_preview_disabled" style="display:${fd.enabled ? 'none' : 'block'};padding:12px;border-radius:8px;border:1px dashed var(--adm-line);background:rgba(255,255,255,0.02);color:var(--adm-muted);text-align:center;font-size:12px;">
              ⚡ Flash Deal Strip is currently disabled. Check the box above to activate it.
            </div>
          </div>

          <!-- Quick 1-Click Presets -->
          <div class="adm-field" style="margin-bottom:16px;">
            <label style="font-size:12px;color:var(--adm-muted);">⚡ 1-Click Dubai Flash Deal Presets</label>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              <button type="button" class="adm-btn adm-btn-sm" id="fd_preset_1">🎁 Free TEREA Pack</button>
              <button type="button" class="adm-btn adm-btn-sm" id="fd_preset_2">🔥 15% OFF All Kits</button>
              <button type="button" class="adm-btn adm-btn-sm" id="fd_preset_3">🚚 Free 1-2H UAE Delivery</button>
              <button type="button" class="adm-btn adm-btn-sm" id="fd_preset_4">💨 Buy 2 Disposables Get 1 Free</button>
            </div>
          </div>

          <div class="adm-grid2">
            <div class="adm-field">
              <label>Deal Badge / Tag</label>
              <input type="text" id="m_fd_badge" value="${esc(fd.badge || 'FLASH DEAL')}" placeholder="e.g. FLASH DEAL, LIMITED OFFER">
            </div>
            <div class="adm-field">
              <label>Deal Offer / Announcement Description</label>
              <input type="text" id="m_fd_text" value="${esc(fd.text || '')}" placeholder="e.g. Free TEREA pack with every ILUMA device · Today only">
            </div>
          </div>

          <div class="adm-grid2">
            <div class="adm-field">
              <label>CTA Button Text</label>
              <input type="text" id="m_fd_cta_label" value="${esc(fd.cta_label || 'Shop now')}" placeholder="Shop now">
            </div>
            <div class="adm-field">
              <label>CTA Destination Link</label>
              <input type="text" id="m_fd_cta_href" value="${esc(fd.cta_href || '#shop')}" placeholder="#shop or /category.php?cat=iluma">
            </div>
          </div>
        `;

        const updatePreview = () => {
          const prevBox = bodyEl.querySelector('#m_fd_preview_box');
          const prevDis = bodyEl.querySelector('#m_fd_preview_disabled');
          const isEn = !!fd.enabled;
          if (prevBox) prevBox.style.display = isEn ? 'flex' : 'none';
          if (prevDis) prevDis.style.display = isEn ? 'none' : 'block';
          const bEl = bodyEl.querySelector('#m_fd_preview_badge');
          if (bEl) bEl.textContent = fd.badge || 'FLASH DEAL';
          const tEl = bodyEl.querySelector('#m_fd_preview_text');
          if (tEl) tEl.textContent = fd.text || '';
          const cEl = bodyEl.querySelector('#m_fd_preview_cta');
          if (cEl) cEl.textContent = (fd.cta_label || 'Shop now') + ' →';
        };

        const setValues = (badge, text, cta, href) => {
          fd.badge = badge;
          fd.text = text;
          fd.cta_label = cta;
          fd.cta_href = href;
          bodyEl.querySelector('#m_fd_badge').value = badge;
          bodyEl.querySelector('#m_fd_text').value = text;
          bodyEl.querySelector('#m_fd_cta_label').value = cta;
          bodyEl.querySelector('#m_fd_cta_href').value = href;
          updatePreview();
          markDirty('home');
        };

        bodyEl.querySelector('#fd_preset_1').addEventListener('click', () => {
          setValues('FLASH DEAL', 'Free TEREA pack with every ILUMA device · Today only', 'Claim Offer', '#shop');
        });
        bodyEl.querySelector('#fd_preset_2').addEventListener('click', () => {
          setValues('LIMITED OFFER', 'Instant 15% OFF on all IQOS ILUMA Prime kits', 'Shop Now', '/category.php?cat=iluma');
        });
        bodyEl.querySelector('#fd_preset_3').addEventListener('click', () => {
          setValues('EXPRESS PROMO', 'Free 1-2H VIP Courier Delivery in Dubai & Sharjah', 'Order Now', '#shop');
        });
        bodyEl.querySelector('#fd_preset_4').addEventListener('click', () => {
          setValues('VIP BUNDLE', 'Buy Any 2 Mega Disposables & Get 1 Free E-liquid', 'View Bundles', '#disposables');
        });

        bodyEl.querySelector('#m_fd_enabled').addEventListener('change', (e) => {
          fd.enabled = e.target.checked;
          updatePreview();
          markDirty('home');
        });
        bodyEl.querySelector('#m_fd_badge').addEventListener('input', (e) => {
          fd.badge = e.target.value;
          updatePreview();
          markDirty('home');
        });
        bodyEl.querySelector('#m_fd_text').addEventListener('input', (e) => {
          fd.text = e.target.value;
          updatePreview();
          markDirty('home');
        });
        bodyEl.querySelector('#m_fd_cta_label').addEventListener('input', (e) => {
          fd.cta_label = e.target.value;
          updatePreview();
          markDirty('home');
        });
        bodyEl.querySelector('#m_fd_cta_href').addEventListener('input', (e) => {
          fd.cta_href = e.target.value;
          updatePreview();
          markDirty('home');
        });
        break;
      }

      case 'hero': {
        titleEl.innerHTML = '🖼️ Edit Hero Banners';
        const slides = home.hero_slides || [];
        const s = slides[state.activeHeroSlide] || slides[0] || {};
        bodyEl.innerHTML = `
          <div style="display:flex;gap:6px;margin-bottom:16px;overflow-x:auto;padding-bottom:4px;">
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
          <div class="adm-grid2">
            <div class="adm-field">
              <label>CTA Button Label</label>
              <input type="text" id="m_hero_cta_label" value="${esc(s.cta_label || 'Add to Cart')}">
            </div>
            <div class="adm-field">
              <label>CTA Link / Target</label>
              <input type="text" id="m_hero_cta_href" value="${esc(s.cta_href || '#shop')}">
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
        bodyEl.querySelector('#m_hero_cta_label').addEventListener('input', (e) => { s.cta_label = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_hero_cta_href').addEventListener('input', (e) => { s.cta_href = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_hero_img_picker').appendChild(
          renderImgPicker('m_hero_img_input', s.image || '', (path) => {
            s.image = path;
            markDirty('home');
          }, 'hero')
        );
        break;
      }

      case 'cats': {
        titleEl.innerHTML = '📂 Edit Popular Categories Showcase';
        if (!home.pop_categories) home.pop_categories = {};
        const pc = home.pop_categories;
        if (!pc.tiles) pc.tiles = [];

        bodyEl.innerHTML = `
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Highlight Word (Green)</label>
              <input type="text" id="m_cats_word" value="${esc(pc.pop_word || 'Popular')}">
            </div>
            <div class="adm-field">
              <label>Section Heading</label>
              <input type="text" id="m_cats_title" value="${esc(pc.title || 'Categories')}">
            </div>
          </div>
          <div class="adm-grid3">
            <div class="adm-field">
              <label>"More Categories" Count</label>
              <input type="text" id="m_cats_more_cnt" value="${esc(pc.more_count || '+9')}">
            </div>
            <div class="adm-field">
              <label>"More Categories" Title</label>
              <input type="text" id="m_cats_more_title" value="${esc(pc.more_title || 'MORE CATEGORIES')}">
            </div>
            <div class="adm-field">
              <label>"More Categories" Subtitle</label>
              <input type="text" id="m_cats_more_sub" value="${esc(pc.more_sub || 'Tap to view all')}">
            </div>
          </div>

          <!-- Quick Inline Category Creator Box -->
          <div id="m_inline_cat_creator" class="adm-card is-highlight" style="display:none;margin-top:14px;background:var(--adm-panel3);border:1px solid var(--adm-emerald);padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <b style="color:var(--adm-emerald);font-size:15px;">✨ Create &amp; Add New Store Category</b>
              <button type="button" class="adm-btn adm-btn-sm" id="btnCancelInlineCat">✕ Cancel</button>
            </div>
            <div class="adm-grid2">
              <div class="adm-field">
                <label>Category Title *</label>
                <input type="text" id="inline_cat_title" placeholder="e.g. Vape Starter Kits">
              </div>
              <div class="adm-field">
                <label>Navigation Display Label *</label>
                <input type="text" id="inline_cat_label" placeholder="e.g. Starter Kits">
              </div>
            </div>
            <div class="adm-grid2">
              <div class="adm-field">
                <label>Category Slug (URL ID)</label>
                <input type="text" id="inline_cat_slug" placeholder="e.g. starter-kits">
              </div>
              <div class="adm-field">
                <label>Subtitle</label>
                <input type="text" id="inline_cat_sub" placeholder="e.g. Best starter kits in Dubai">
              </div>
            </div>
            <div class="adm-grid2">
              <div class="adm-field">
                <label>Accent Theme</label>
                <select id="inline_cat_theme">
                  <option value="art-emerald">Dubai Emerald (Green)</option>
                  <option value="art-purple">Electric Purple</option>
                  <option value="art-navy">Deep Navy (Blue)</option>
                  <option value="art-gold">Champagne Gold</option>
                  <option value="art-rose">Crimson Rose (Red)</option>
                  <option value="art-amber">Warm Amber (Orange)</option>
                  <option value="art-cyan">Ice Cyan</option>
                  <option value="art-slate">Sleek Slate</option>
                </select>
              </div>
              <div class="adm-field">
                <label>Category Photo</label>
                <div id="inline_cat_img_picker"></div>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:12px;">
              <button type="button" class="adm-btn adm-btn-primary" id="btnSubmitInlineCat">✓ Create Category &amp; Add Showcase Tile</button>
            </div>
          </div>

          <div class="adm-field" style="margin-top:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
              <label style="margin:0;font-size:14px;font-weight:700;">Category Showcase Tiles (${pc.tiles.length})</label>
              <div style="display:flex;gap:8px;">
                <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" id="btnToggleInlineCat">➕ Create New Category</button>
                <button type="button" class="adm-btn adm-btn-sm" id="btnAddCatTile">➕ Add Tile</button>
              </div>
            </div>
            <div id="m_cats_tiles_list" style="display:flex;flex-direction:column;gap:12px;"></div>
          </div>
        `;

        bodyEl.querySelector('#m_cats_word').addEventListener('input', (e) => { pc.pop_word = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_cats_title').addEventListener('input', (e) => { pc.title = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_cats_more_cnt').addEventListener('input', (e) => { pc.more_count = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_cats_more_title').addEventListener('input', (e) => { pc.more_title = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_cats_more_sub').addEventListener('input', (e) => { pc.more_sub = e.target.value; markDirty('home'); });

        let inlineCatPhoto = '';
        const inlineImgPickerBox = bodyEl.querySelector('#inline_cat_img_picker');
        if (inlineImgPickerBox) {
          inlineImgPickerBox.appendChild(
            renderImgPicker('m_inline_cat_photo', '', (path) => {
              inlineCatPhoto = path;
            }, 'categories')
          );
        }

        const inlineCard = bodyEl.querySelector('#m_inline_cat_creator');
        bodyEl.querySelector('#btnToggleInlineCat').addEventListener('click', () => {
          inlineCard.style.display = inlineCard.style.display === 'none' ? 'block' : 'none';
          if (inlineCard.style.display === 'block') {
            bodyEl.querySelector('#inline_cat_title').focus();
          }
        });
        bodyEl.querySelector('#btnCancelInlineCat').addEventListener('click', () => {
          inlineCard.style.display = 'none';
        });

        const renderTiles = () => {
          const list = bodyEl.querySelector('#m_cats_tiles_list');
          list.innerHTML = '';
          const catsObj = (state.data.categories && state.data.categories.cats) || {};
          const catLabels = (state.data.categories && state.data.categories.labels) || {};
          const catKeys = Object.keys(catsObj);

          pc.tiles.forEach((tile, idx) => {
            const card = document.createElement('div');
            card.className = 'adm-card';
            card.style.padding = '12px';
            card.style.background = 'var(--adm-panel2)';
            card.innerHTML = `
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <b>Tile #${idx + 1}: ${esc(tile.title || 'Category')}</b>
                <button type="button" class="adm-btn adm-btn-sm adm-btn-danger btn-del-tile">✕ Remove</button>
              </div>
              <div class="adm-grid2">
                <div class="adm-field">
                  <label>Title</label>
                  <input type="text" class="tile-title" value="${esc(tile.title || '')}">
                </div>
                <div class="adm-field">
                  <label>Subtitle</label>
                  <input type="text" class="tile-sub" value="${esc(tile.sub || '')}">
                </div>
              </div>
              <div class="adm-grid2">
                <div class="adm-field">
                  <label>Target Category</label>
                  <select class="tile-cat">
                    ${catKeys.map(k => `<option value="${esc(k)}" ${tile.cat === k ? 'selected' : ''}>${esc(catLabels[k] || k)} (${esc(k)})</option>`).join('')}
                  </select>
                </div>
                <div class="adm-field">
                  <label>Background Image</label>
                  <div class="tile-img-wrap"></div>
                </div>
              </div>
            `;
            card.querySelector('.tile-title').addEventListener('input', (e) => { tile.title = e.target.value; markDirty('home'); });
            card.querySelector('.tile-sub').addEventListener('input', (e) => { tile.sub = e.target.value; markDirty('home'); });
            card.querySelector('.tile-cat').addEventListener('change', (e) => { tile.cat = e.target.value; markDirty('home'); });
            card.querySelector('.tile-img-wrap').appendChild(
              renderImgPicker(`m_tile_bg_${idx}`, tile.bg || '', (path) => {
                tile.bg = path;
                markDirty('home');
              }, 'categories')
            );
            card.querySelector('.btn-del-tile').addEventListener('click', () => {
              pc.tiles.splice(idx, 1);
              markDirty('home');
              renderTiles();
            });
            list.appendChild(card);
          });
        };

        // Submit new category inline
        bodyEl.querySelector('#btnSubmitInlineCat').addEventListener('click', () => {
          const tIn = bodyEl.querySelector('#inline_cat_title');
          const lIn = bodyEl.querySelector('#inline_cat_label');
          const sIn = bodyEl.querySelector('#inline_cat_slug');
          const subIn = bodyEl.querySelector('#inline_cat_sub');
          const thIn = bodyEl.querySelector('#inline_cat_theme');

          const title = tIn.value.trim();
          const label = lIn.value.trim() || title;
          let slug = sIn.value.trim() || label;
          slug = slug.toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/^-|-$/g, '');

          if (!title || !slug) {
            toast('Please enter a Category Title and valid slug.', true);
            return;
          }

          if (!state.data.categories) state.data.categories = {};
          if (!state.data.categories.cats) state.data.categories.cats = {};
          if (!state.data.categories.labels) state.data.categories.labels = {};

          state.data.categories.cats[slug] = {
            title: title,
            sub: subIn.value.trim() || `Authentic ${title} in Dubai & UAE`,
            desc: `Shop premium ${title} with 1-2 hour express delivery in Dubai. 100% genuine and verified stock.`,
            theme: thIn.value || 'art-emerald',
            art: 'device',
            photo: inlineCatPhoto || 'assets/images/hero-iluma.webp'
          };
          state.data.categories.labels[slug] = label;
          markDirty('categories');

          // Automatically add as a tile in popular categories showcase
          pc.tiles.push({
            cat: slug,
            title: title.toUpperCase(),
            sub: subIn.value.trim() || 'Best in Dubai',
            bg: inlineCatPhoto || 'assets/images/hero-iluma.webp'
          });
          markDirty('home');

          saveAll();
          inlineCard.style.display = 'none';
          tIn.value = '';
          lIn.value = '';
          sIn.value = '';
          subIn.value = '';
          toast(`Category "${title}" created and added to showcase!`);
          renderTiles();
        });

        renderTiles();
        bodyEl.querySelector('#btnAddCatTile').addEventListener('click', () => {
          const firstCat = Object.keys((state.data.categories && state.data.categories.cats) || {})[0] || 'iluma';
          pc.tiles.push({ cat: firstCat, title: 'NEW CATEGORY', sub: 'Best in Dubai', bg: 'assets/images/hero-iluma.webp' });
          markDirty('home');
          renderTiles();
        });
        break;
      }

      case 'vip': {
        titleEl.innerHTML = '👑 Edit VIP Bestsellers Showcase';
        if (!home.vip_section) home.vip_section = {};
        const vip = home.vip_section;
        if (!vip.features) vip.features = [];

        bodyEl.innerHTML = `
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Ribbon Badge Text</label>
              <input type="text" id="m_vip_badge" value="${esc(vip.badge || '')}">
            </div>
            <div class="adm-field">
              <label>Pulse Demand Badge</label>
              <input type="text" id="m_vip_pulse" value="${esc(vip.pulse || 'High Demand Today')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Section Title</label>
            <input type="text" id="m_vip_title" value="${esc(vip.title || '')}">
          </div>
          <div class="adm-field">
            <label>Description Paragraph</label>
            <textarea id="m_vip_desc" rows="3">${esc(vip.desc || '')}</textarea>
          </div>
          <div class="adm-field" style="margin-top:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <label style="margin:0;">Guarantee Features List (${vip.features.length})</label>
              <button type="button" class="adm-btn adm-btn-sm" id="btnAddVipFeat">➕ Add Feature</button>
            </div>
            <div id="m_vip_feat_list" style="display:flex;flex-direction:column;gap:10px;"></div>
          </div>
        `;

        bodyEl.querySelector('#m_vip_badge').addEventListener('input', (e) => { vip.badge = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_vip_pulse').addEventListener('input', (e) => { vip.pulse = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_vip_title').addEventListener('input', (e) => { vip.title = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_vip_desc').addEventListener('input', (e) => { vip.desc = e.target.value; markDirty('home'); });

        const renderFeats = () => {
          const list = bodyEl.querySelector('#m_vip_feat_list');
          list.innerHTML = '';
          vip.features.forEach((feat, idx) => {
            const card = document.createElement('div');
            card.className = 'adm-card';
            card.style.padding = '10px 14px';
            card.style.background = 'var(--adm-panel2)';
            card.style.display = 'flex';
            card.style.gap = '10px';
            card.style.alignItems = 'center';
            card.innerHTML = `
              <select class="feat-icon" style="width:130px;">
                <option value="i-zap" ${feat.icon === 'i-zap' ? 'selected' : ''}>⚡ Fast (i-zap)</option>
                <option value="i-shield" ${feat.icon === 'i-shield' ? 'selected' : ''}>🛡️ Genuine (i-shield)</option>
                <option value="i-star" ${feat.icon === 'i-star' ? 'selected' : ''}>⭐ Rating (i-star)</option>
                <option value="i-truck" ${feat.icon === 'i-truck' ? 'selected' : ''}>🚚 Delivery (i-truck)</option>
                <option value="i-clock" ${feat.icon === 'i-clock' ? 'selected' : ''}>⏱️ Clock (i-clock)</option>
                <option value="i-check" ${feat.icon === 'i-check' ? 'selected' : ''}>✓ Check (i-check)</option>
              </select>
              <input type="text" class="feat-text" style="flex:1;" value="${esc(feat.text || '')}" placeholder="Feature description">
              <button type="button" class="adm-btn adm-btn-sm adm-btn-danger btn-del-feat">✕</button>
            `;
            card.querySelector('.feat-icon').addEventListener('change', (e) => { feat.icon = e.target.value; markDirty('home'); });
            card.querySelector('.feat-text').addEventListener('input', (e) => { feat.text = e.target.value; markDirty('home'); });
            card.querySelector('.btn-del-feat').addEventListener('click', () => {
              vip.features.splice(idx, 1);
              markDirty('home');
              renderFeats();
            });
            list.appendChild(card);
          });
        };

        renderFeats();
        bodyEl.querySelector('#btnAddVipFeat').addEventListener('click', () => {
          vip.features.push({ icon: 'i-check', text: 'New Guarantee' });
          markDirty('home');
          renderFeats();
        });
        break;
      }

      case 'shop': {
        titleEl.innerHTML = '🛍️ Edit Collection Header';
        if (!home.shop_section) home.shop_section = {};
        const shop = home.shop_section;
        bodyEl.innerHTML = `
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Eyebrow Pill</label>
              <input type="text" id="m_shop_eyebrow" value="${esc(shop.eyebrow || '')}">
            </div>
            <div class="adm-field">
              <label>Section Heading</label>
              <input type="text" id="m_shop_title" value="${esc(shop.title || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Description Paragraph</label>
            <textarea id="m_shop_desc" rows="3">${esc(shop.desc || '')}</textarea>
          </div>
        `;
        bodyEl.querySelector('#m_shop_eyebrow').addEventListener('input', (e) => { shop.eyebrow = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_shop_title').addEventListener('input', (e) => { shop.title = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_shop_desc').addEventListener('input', (e) => { shop.desc = e.target.value; markDirty('home'); });
        break;
      }

      case 'terea': {
        titleEl.innerHTML = '🎌 Edit TEREA by Origin Section';
        if (!home.terea_section) home.terea_section = {};
        const terea = home.terea_section;
        bodyEl.innerHTML = `
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Eyebrow Pill</label>
              <input type="text" id="m_terea_eyebrow" value="${esc(terea.eyebrow || '')}">
            </div>
            <div class="adm-field">
              <label>Section Heading</label>
              <input type="text" id="m_terea_title" value="${esc(terea.title || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Description Paragraph</label>
            <textarea id="m_terea_desc" rows="3">${esc(terea.desc || '')}</textarea>
          </div>
          <div class="adm-field">
            <label>Origin Country Badges / Legend</label>
            <div id="m_terea_legend_box"></div>
          </div>
        `;
        bodyEl.querySelector('#m_terea_eyebrow').addEventListener('input', (e) => { terea.eyebrow = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_terea_title').addEventListener('input', (e) => { terea.title = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_terea_desc').addEventListener('input', (e) => { terea.desc = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_terea_legend_box').appendChild(
          renderStringListEditor(terea.legend || [], (items) => {
            terea.legend = items;
            markDirty('home');
          }, 'e.g. 🇮🇩 Indonesia — fruity & cooling', '+ Add Origin Country')
        );
        break;
      }

      case 'disposables': {
        titleEl.innerHTML = '💨 Edit Disposable Vapes Showcase';
        if (!home.disposables_section) home.disposables_section = {};
        const disp = home.disposables_section;
        bodyEl.innerHTML = `
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Eyebrow Pill</label>
              <input type="text" id="m_disp_eyebrow" value="${esc(disp.eyebrow || '')}">
            </div>
            <div class="adm-field">
              <label>Section Heading</label>
              <input type="text" id="m_disp_title" value="${esc(disp.title || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Description Paragraph</label>
            <textarea id="m_disp_desc" rows="3">${esc(disp.desc || '')}</textarea>
          </div>
        `;
        bodyEl.querySelector('#m_disp_eyebrow').addEventListener('input', (e) => { disp.eyebrow = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_disp_title').addEventListener('input', (e) => { disp.title = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_disp_desc').addEventListener('input', (e) => { disp.desc = e.target.value; markDirty('home'); });
        break;
      }

      case 'reviews': {
        titleEl.innerHTML = '⭐ Edit Customer Reviews &amp; Testimonials';
        if (!home.reviews_section) home.reviews_section = {};
        if (!home.reviews) home.reviews = [];
        const revSec = home.reviews_section;

        bodyEl.innerHTML = `
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Eyebrow Pill</label>
              <input type="text" id="m_rev_eyebrow" value="${esc(revSec.eyebrow || 'Verified Buyers')}">
            </div>
            <div class="adm-field">
              <label>Section Heading</label>
              <input type="text" id="m_rev_title" value="${esc(revSec.title || 'Loved Across the Emirates')}">
            </div>
          </div>
          <div class="adm-field" style="margin-top:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <label style="margin:0;">Customer Testimonials (${home.reviews.length})</label>
              <button type="button" class="adm-btn adm-btn-sm" id="btnAddReview">➕ Add Review</button>
            </div>
            <div id="m_reviews_list" style="display:flex;flex-direction:column;gap:12px;"></div>
          </div>
        `;

        bodyEl.querySelector('#m_rev_eyebrow').addEventListener('input', (e) => { revSec.eyebrow = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_rev_title').addEventListener('input', (e) => { revSec.title = e.target.value; markDirty('home'); });

        const renderReviews = () => {
          const list = bodyEl.querySelector('#m_reviews_list');
          list.innerHTML = '';
          home.reviews.forEach((rev, idx) => {
            const card = document.createElement('div');
            card.className = 'adm-card';
            card.style.padding = '12px';
            card.style.background = 'var(--adm-panel2)';
            card.innerHTML = `
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <b>Review #${idx + 1}: ${esc(rev.name || 'Customer')}</b>
                <button type="button" class="adm-btn adm-btn-sm adm-btn-danger btn-del-rev">✕ Remove</button>
              </div>
              <div class="adm-grid3">
                <div class="adm-field">
                  <label>Customer Name</label>
                  <input type="text" class="rev-name" value="${esc(rev.name || '')}">
                </div>
                <div class="adm-field">
                  <label>Location (e.g. Dubai Marina)</label>
                  <input type="text" class="rev-loc" value="${esc(rev.location || '')}">
                </div>
                <div class="adm-field">
                  <label>Rating (Stars)</label>
                  <select class="rev-stars">
                    <option value="5" ${rev.stars === 5 ? 'selected' : ''}>★★★★★ (5 Stars)</option>
                    <option value="4" ${rev.stars === 4 ? 'selected' : ''}>★★★★☆ (4 Stars)</option>
                    <option value="3" ${rev.stars === 3 ? 'selected' : ''}>★★★☆☆ (3 Stars)</option>
                  </select>
                </div>
              </div>
              <div class="adm-field">
                <label>Review Content</label>
                <textarea class="rev-text" rows="2">${esc(rev.text || '')}</textarea>
              </div>
            `;
            card.querySelector('.rev-name').addEventListener('input', (e) => { rev.name = e.target.value; markDirty('home'); });
            card.querySelector('.rev-loc').addEventListener('input', (e) => { rev.location = e.target.value; markDirty('home'); });
            card.querySelector('.rev-stars').addEventListener('change', (e) => { rev.stars = parseInt(e.target.value, 10); markDirty('home'); });
            card.querySelector('.rev-text').addEventListener('input', (e) => { rev.text = e.target.value; markDirty('home'); });
            card.querySelector('.btn-del-rev').addEventListener('click', () => {
              home.reviews.splice(idx, 1);
              markDirty('home');
              renderReviews();
            });
            list.appendChild(card);
          });
        };

        renderReviews();
        bodyEl.querySelector('#btnAddReview').addEventListener('click', () => {
          home.reviews.push({ name: 'Rashid M.', location: 'Downtown Dubai', stars: 5, text: 'Excellent service and 1-hour fast delivery in Dubai.', avatar: 'R', avatar_class: 'av-emerald' });
          markDirty('home');
          renderReviews();
        });
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

      case 'faqs': {
        titleEl.innerHTML = '❓ Edit Frequently Asked Questions';
        if (!home.faq_section) home.faq_section = {};
        if (!home.faqs) home.faqs = [];
        const faqSec = home.faq_section;

        bodyEl.innerHTML = `
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Eyebrow Pill</label>
              <input type="text" id="m_faq_eyebrow" value="${esc(faqSec.eyebrow || 'Good to Know')}">
            </div>
            <div class="adm-field">
              <label>Section Heading</label>
              <input type="text" id="m_faq_title" value="${esc(faqSec.title || 'Delivery &amp; Ordering FAQ')}">
            </div>
          </div>
          <div class="adm-field" style="margin-top:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <label style="margin:0;">FAQ Questions (${home.faqs.length})</label>
              <button type="button" class="adm-btn adm-btn-sm" id="btnAddFaq">➕ Add FAQ Question</button>
            </div>
            <div id="m_faqs_list" style="display:flex;flex-direction:column;gap:12px;"></div>
          </div>
        `;

        bodyEl.querySelector('#m_faq_eyebrow').addEventListener('input', (e) => { faqSec.eyebrow = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_faq_title').addEventListener('input', (e) => { faqSec.title = e.target.value; markDirty('home'); });

        const renderFaqs = () => {
          const list = bodyEl.querySelector('#m_faqs_list');
          list.innerHTML = '';
          home.faqs.forEach((faq, idx) => {
            const card = document.createElement('div');
            card.className = 'adm-card';
            card.style.padding = '12px';
            card.style.background = 'var(--adm-panel2)';
            card.innerHTML = `
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <b>FAQ #${idx + 1}</b>
                <button type="button" class="adm-btn adm-btn-sm adm-btn-danger btn-del-faq">✕ Remove</button>
              </div>
              <div class="adm-field">
                <label>Question</label>
                <input type="text" class="faq-q" value="${esc(faq.q || '')}">
              </div>
              <div class="adm-field">
                <label>Answer (HTML allowed, e.g. &lt;b&gt;bold text&lt;/b&gt;)</label>
                <textarea class="faq-a" rows="3">${esc(faq.a || '')}</textarea>
              </div>
            `;
            card.querySelector('.faq-q').addEventListener('input', (e) => { faq.q = e.target.value; markDirty('home'); });
            card.querySelector('.faq-a').addEventListener('input', (e) => { faq.a = e.target.value; markDirty('home'); });
            card.querySelector('.btn-del-faq').addEventListener('click', () => {
              home.faqs.splice(idx, 1);
              markDirty('home');
              renderFaqs();
            });
            list.appendChild(card);
          });
        };

        renderFaqs();
        bodyEl.querySelector('#btnAddFaq').addEventListener('click', () => {
          home.faqs.push({ q: 'New question title?', a: 'Answer description with <b>bold</b> highlights.' });
          markDirty('home');
          renderFaqs();
        });
        break;
      }

      case 'cta': {
        titleEl.innerHTML = '💬 Edit Call-To-Action (CTA) Concierge Banner';
        if (!home.cta_section) home.cta_section = {};
        const cta = home.cta_section;
        bodyEl.innerHTML = `
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Eyebrow Pill</label>
              <input type="text" id="m_cta_eyebrow" value="${esc(cta.eyebrow || '')}">
            </div>
            <div class="adm-field">
              <label>Button Label</label>
              <input type="text" id="m_cta_btn" value="${esc(cta.button_label || '')}">
            </div>
          </div>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Title Prefix</label>
              <input type="text" id="m_cta_pre" value="${esc(cta.title_pre || '')}">
            </div>
            <div class="adm-field">
              <label>Title Highlight (Green)</label>
              <input type="text" id="m_cta_hl" value="${esc(cta.title_highlight || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Subtext Description</label>
            <textarea id="m_cta_text" rows="3">${esc(cta.text || '')}</textarea>
          </div>
        `;
        bodyEl.querySelector('#m_cta_eyebrow').addEventListener('input', (e) => { cta.eyebrow = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_cta_btn').addEventListener('input', (e) => { cta.button_label = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_cta_pre').addEventListener('input', (e) => { cta.title_pre = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_cta_hl').addEventListener('input', (e) => { cta.title_highlight = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_cta_text').addEventListener('input', (e) => { cta.text = e.target.value; markDirty('home'); });
        break;
      }

      case 'age_gate': {
        titleEl.innerHTML = '🔞 Edit 18+ Age Verification Modal';
        if (!home.age_gate) home.age_gate = {};
        const ag = home.age_gate;
        bodyEl.innerHTML = `
          <label class="adm-check" style="margin-bottom:14px;">
            <input type="checkbox" id="m_ag_en" ${ag.enabled ? 'checked' : ''}>
            <span>Enable 18+ Age Verification Popup</span>
          </label>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Modal Title</label>
              <input type="text" id="m_ag_title" value="${esc(ag.title || '')}">
            </div>
            <div class="adm-field">
              <label>Compliance Footnote</label>
              <input type="text" id="m_ag_note" value="${esc(ag.note || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Warning Message</label>
            <textarea id="m_ag_text" rows="2">${esc(ag.text || '')}</textarea>
          </div>
          <div class="adm-field">
            <label>Under-18 Rejection Message</label>
            <textarea id="m_ag_under" rows="2">${esc(ag.under_msg || '')}</textarea>
          </div>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Yes Button Label</label>
              <input type="text" id="m_ag_yes" value="${esc(ag.yes_label || '')}">
            </div>
            <div class="adm-field">
              <label>No Button Label</label>
              <input type="text" id="m_ag_no" value="${esc(ag.no_label || '')}">
            </div>
          </div>
        `;
        bodyEl.querySelector('#m_ag_en').addEventListener('change', (e) => { ag.enabled = e.target.checked; markDirty('home'); });
        bodyEl.querySelector('#m_ag_title').addEventListener('input', (e) => { ag.title = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_ag_note').addEventListener('input', (e) => { ag.note = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_ag_text').addEventListener('input', (e) => { ag.text = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_ag_under').addEventListener('input', (e) => { ag.under_msg = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_ag_yes').addEventListener('input', (e) => { ag.yes_label = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_ag_no').addEventListener('input', (e) => { ag.no_label = e.target.value; markDirty('home'); });
        break;
      }

      case 'checkout': {
        titleEl.innerHTML = '⚡ Edit Express Checkout &amp; WhatsApp Direct';
        if (!home.checkout) home.checkout = {};
        const chk = home.checkout;
        bodyEl.innerHTML = `
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Checkout Eyebrow</label>
              <input type="text" id="m_chk_eyebrow" value="${esc(chk.eyebrow || '')}">
            </div>
            <div class="adm-field">
              <label>Checkout Heading</label>
              <input type="text" id="m_chk_title" value="${esc(chk.title || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Checkout Subtitle</label>
            <input type="text" id="m_chk_sub" value="${esc(chk.sub || '')}">
          </div>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>WhatsApp Banner Badge</label>
              <input type="text" id="m_chk_wa_badge" value="${esc(chk.wa_banner_badge || '')}">
            </div>
            <div class="adm-field">
              <label>WhatsApp Banner Title</label>
              <input type="text" id="m_chk_wa_title" value="${esc(chk.wa_banner_title || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>WhatsApp Banner Text</label>
            <textarea id="m_chk_wa_text" rows="2">${esc(chk.wa_banner_text || '')}</textarea>
          </div>
          <div class="adm-field">
            <label>Age Confirmation Checkbox Label</label>
            <textarea id="m_chk_age_confirm" rows="2">${esc(chk.age_confirm_text || '')}</textarea>
          </div>
        `;
        bodyEl.querySelector('#m_chk_eyebrow').addEventListener('input', (e) => { chk.eyebrow = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_chk_title').addEventListener('input', (e) => { chk.title = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_chk_sub').addEventListener('input', (e) => { chk.sub = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_chk_wa_badge').addEventListener('input', (e) => { chk.wa_banner_badge = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_chk_wa_title').addEventListener('input', (e) => { chk.wa_banner_title = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_chk_wa_text').addEventListener('input', (e) => { chk.wa_banner_text = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_chk_age_confirm').addEventListener('input', (e) => { chk.age_confirm_text = e.target.value; markDirty('home'); });
        break;
      }

      case 'search': {
        titleEl.innerHTML = '🔍 Edit Search Bar Placeholders';
        if (!home.search) home.search = {};
        const srch = home.search;
        bodyEl.innerHTML = `
          <div class="adm-field">
            <label>Desktop Search Input Placeholder</label>
            <input type="text" id="m_srch_ph" value="${esc(srch.placeholder || '')}">
          </div>
          <div class="adm-field">
            <label>Mobile Search Modal Placeholder</label>
            <input type="text" id="m_srch_modal_ph" value="${esc(srch.modal_placeholder || '')}">
          </div>
          <div class="adm-field">
            <label>Empty Search Results Message</label>
            <input type="text" id="m_srch_empty" value="${esc(srch.empty_text || '')}">
          </div>
        `;
        bodyEl.querySelector('#m_srch_ph').addEventListener('input', (e) => { srch.placeholder = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_srch_modal_ph').addEventListener('input', (e) => { srch.modal_placeholder = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_srch_empty').addEventListener('input', (e) => { srch.empty_text = e.target.value; markDirty('home'); });
        break;
      }

      case 'footer': {
        titleEl.innerHTML = '🦶 Edit Footer &amp; Store Contact';
        bodyEl.innerHTML = `
          <div class="adm-field">
            <label>Footer Brand Note</label>
            <textarea id="m_foot_note" rows="2">${esc(settings.brand_footer_note || '')}</textarea>
          </div>
          <div class="adm-grid3">
            <div class="adm-field">
              <label>Phone (Display)</label>
              <input type="text" id="m_foot_phone" value="${esc(settings.phone_display || '')}">
            </div>
            <div class="adm-field">
              <label>WhatsApp Number</label>
              <input type="text" id="m_foot_wa" value="${esc(settings.wa_number || '')}">
            </div>
            <div class="adm-field">
              <label>Support Email</label>
              <input type="email" id="m_foot_email" value="${esc(settings.email || '')}">
            </div>
          </div>
          <div class="adm-grid2">
            <div class="adm-field">
              <label>Address</label>
              <input type="text" id="m_foot_address" value="${esc(settings.address || '')}">
            </div>
            <div class="adm-field">
              <label>Google Maps Link</label>
              <input type="url" id="m_foot_maps" value="${esc(settings.maps_url || '')}">
            </div>
          </div>
          <div class="adm-field">
            <label>Showroom Hours Lines</label>
            <div id="m_foot_hours_box"></div>
          </div>
          <div class="adm-field">
            <label>Copyright Notice</label>
            <input type="text" id="m_foot_copy" value="${esc(settings.copyright || '')}">
          </div>
          <div class="adm-field">
            <label>Legal 18+ Warning</label>
            <textarea id="m_foot_legal" rows="2">${esc(settings.legal_warning || '')}</textarea>
          </div>
        `;
        bodyEl.querySelector('#m_foot_note').addEventListener('input', (e) => { settings.brand_footer_note = e.target.value; markDirty('settings'); });
        bodyEl.querySelector('#m_foot_phone').addEventListener('input', (e) => { settings.phone_display = e.target.value; markDirty('settings'); });
        bodyEl.querySelector('#m_foot_wa').addEventListener('input', (e) => { settings.wa_number = e.target.value; markDirty('settings'); });
        bodyEl.querySelector('#m_foot_email').addEventListener('input', (e) => { settings.email = e.target.value; markDirty('settings'); });
        bodyEl.querySelector('#m_foot_address').addEventListener('input', (e) => { settings.address = e.target.value; markDirty('settings'); });
        bodyEl.querySelector('#m_foot_maps').addEventListener('input', (e) => { settings.maps_url = e.target.value; markDirty('settings'); });
        bodyEl.querySelector('#m_foot_copy').addEventListener('input', (e) => { settings.copyright = e.target.value; markDirty('settings'); });
        bodyEl.querySelector('#m_foot_legal').addEventListener('input', (e) => { settings.legal_warning = e.target.value; markDirty('settings'); });
        bodyEl.querySelector('#m_foot_hours_box').appendChild(
          renderStringListEditor(settings.hours || [], (items) => {
            settings.hours = items;
            markDirty('settings');
          }, 'Hours line (e.g. Daily 10:00 AM – 12:00 AM)', '+ Add Hours Line')
        );
        break;
      }

      case 'guides': {
        titleEl.innerHTML = '📚 Edit Buying Guides &amp; UAE Educational Pages';
        if (!home.guides) {
          home.guides = [
            {
              id: 'terea-guide',
              title: 'TEREA Flavor & Origin Guide (Japan vs Swiss)',
              sub: 'Complete UAE comparison of cooling, tobacco intensity & aroma profiles.',
              url: '/guide-terea.php',
              badge: 'Flavors Guide',
              badge_class: 'bg-emerald'
            },
            {
              id: 'iluma-guide',
              title: 'IQOS ILUMA i PRIME vs ONE vs Standard Comparison',
              sub: 'Battery life, flex battery mode, touch screen & price breakdown.',
              url: '/guide-iluma.php',
              badge: 'Device Comparison',
              badge_class: 'bg-gold'
            }
          ];
        }

        bodyEl.innerHTML = `
          <div style="font-size:13px;color:var(--adm-muted);margin-bottom:14px;">
            Manage and edit buying guides and informational resource pages available across the storefront:
          </div>
          <div id="m_guides_list" style="display:flex;flex-direction:column;gap:12px;"></div>
          <div style="margin-top:14px;text-align:right;">
            <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" id="btnAddGuide">➕ Add New Guide Card</button>
          </div>
        `;

        const renderGuides = () => {
          const list = bodyEl.querySelector('#m_guides_list');
          list.innerHTML = '';
          home.guides.forEach((g, idx) => {
            const card = document.createElement('div');
            card.className = 'adm-card';
            card.style.padding = '14px';
            card.style.background = 'var(--adm-panel2)';
            card.innerHTML = `
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <b>Guide #${idx + 1}: ${esc(g.title || 'Guide')}</b>
                <button type="button" class="adm-btn adm-btn-sm adm-btn-danger btn-del-guide">✕ Remove</button>
              </div>
              <div class="adm-grid2">
                <div class="adm-field">
                  <label>Guide Title</label>
                  <input type="text" class="g-title" value="${esc(g.title || '')}">
                </div>
                <div class="adm-field">
                  <label>Badge Pill</label>
                  <input type="text" class="g-badge" value="${esc(g.badge || '')}">
                </div>
              </div>
              <div class="adm-field">
                <label>Subtitle / Excerpt</label>
                <textarea class="g-sub" rows="2">${esc(g.sub || '')}</textarea>
              </div>
              <div class="adm-field">
                <label>Page URL / Destination</label>
                <input type="text" class="g-url" value="${esc(g.url || '')}">
              </div>
            `;
            card.querySelector('.g-title').addEventListener('input', (e) => { g.title = e.target.value; markDirty('home'); });
            card.querySelector('.g-badge').addEventListener('input', (e) => { g.badge = e.target.value; markDirty('home'); });
            card.querySelector('.g-sub').addEventListener('input', (e) => { g.sub = e.target.value; markDirty('home'); });
            card.querySelector('.g-url').addEventListener('input', (e) => { g.url = e.target.value; markDirty('home'); });
            card.querySelector('.btn-del-guide').addEventListener('click', () => {
              home.guides.splice(idx, 1);
              markDirty('home');
              renderGuides();
            });
            list.appendChild(card);
          });
        };

        renderGuides();
        bodyEl.querySelector('#btnAddGuide').addEventListener('click', () => {
          home.guides.push({
            id: 'custom-guide-' + Date.now(),
            title: 'New UAE Vape Guide',
            sub: 'Helpful recommendations and tips for Dubai vapers.',
            url: '/guide-terea.php',
            badge: 'Expert Guide',
            badge_class: 'bg-cyan'
          });
          markDirty('home');
          renderGuides();
        });
        break;
      }

      case 'ranks': {
        titleEl.innerHTML = '👑 Edit VIP Bestsellers Ranking Badges';
        if (!home.vip_section) home.vip_section = {};
        if (!home.vip_section.ranks) {
          home.vip_section.ranks = [
            { rank: '#1', label: 'TOP SELLER', class: 'rank-gold', icon: '👑' },
            { rank: '#2', label: 'MOST POPULAR', class: 'rank-emerald', icon: '🔥' },
            { rank: '#3', label: 'TOP FAVORITE', class: 'rank-cyan', icon: '💎' },
            { rank: '#4', label: 'TOP RATED 4.9★', class: 'rank-violet', icon: '⭐' },
            { rank: '#5', label: 'HOT DEMAND', class: 'rank-amber', icon: '⚡' },
            { rank: '#6', label: 'VALUE CHOICE', class: 'rank-rose', icon: '💨' }
          ];
        }
        const ranks = home.vip_section.ranks;

        bodyEl.innerHTML = `
          <div style="font-size:13px;color:var(--adm-muted);margin-bottom:14px;">
            Customize the ranking badges displayed on the top 6 best-selling products on the homepage:
          </div>
          <div id="m_ranks_list" style="display:flex;flex-direction:column;gap:10px;"></div>
        `;

        const list = bodyEl.querySelector('#m_ranks_list');
        ranks.forEach((r, idx) => {
          const card = document.createElement('div');
          card.className = 'adm-card';
          card.style.padding = '10px 14px';
          card.style.background = 'var(--adm-panel2)';
          card.style.display = 'flex';
          card.style.gap = '10px';
          card.style.alignItems = 'center';
          card.innerHTML = `
            <input type="text" class="r-rank" style="width:70px;text-align:center;font-weight:700;" value="${esc(r.rank || '')}">
            <input type="text" class="r-icon" style="width:50px;text-align:center;font-size:16px;" value="${esc(r.icon || '')}">
            <input type="text" class="r-label" style="flex:1;font-weight:600;" value="${esc(r.label || '')}">
            <select class="r-class" style="width:140px;">
              <option value="rank-gold" ${r.class === 'rank-gold' ? 'selected' : ''}>Gold (rank-gold)</option>
              <option value="rank-emerald" ${r.class === 'rank-emerald' ? 'selected' : ''}>Emerald (rank-emerald)</option>
              <option value="rank-cyan" ${r.class === 'rank-cyan' ? 'selected' : ''}>Cyan (rank-cyan)</option>
              <option value="rank-violet" ${r.class === 'rank-violet' ? 'selected' : ''}>Violet (rank-violet)</option>
              <option value="rank-amber" ${r.class === 'rank-amber' ? 'selected' : ''}>Amber (rank-amber)</option>
              <option value="rank-rose" ${r.class === 'rank-rose' ? 'selected' : ''}>Rose (rank-rose)</option>
            </select>
          `;
          card.querySelector('.r-rank').addEventListener('input', (e) => { r.rank = e.target.value; markDirty('home'); });
          card.querySelector('.r-icon').addEventListener('input', (e) => { r.icon = e.target.value; markDirty('home'); });
          card.querySelector('.r-label').addEventListener('input', (e) => { r.label = e.target.value; markDirty('home'); });
          card.querySelector('.r-class').addEventListener('change', (e) => { r.class = e.target.value; markDirty('home'); });
          list.appendChild(card);
        });
        break;
      }

      case 'emirates': {
        titleEl.innerHTML = '🚚 Edit UAE Emirates Delivery Options &amp; Times';
        if (!home.checkout) home.checkout = {};
        if (!home.checkout.emirates) {
          home.checkout.emirates = [
            { value: 'Dubai', label: 'Dubai (1–2h Express Delivery)' },
            { value: 'Sharjah', label: 'Sharjah (Same Day Delivery)' },
            { value: 'Ajman', label: 'Ajman (Same Day Delivery)' },
            { value: 'Abu Dhabi', label: 'Abu Dhabi (Next Day Delivery)' },
            { value: 'Ras Al Khaimah', label: 'Ras Al Khaimah (Next Day Delivery)' },
            { value: 'Fujairah', label: 'Fujairah (Next Day Delivery)' },
            { value: 'Umm Al Quwain', label: 'Umm Al Quwain (Same Day Delivery)' }
          ];
        }
        const emirates = home.checkout.emirates;

        bodyEl.innerHTML = `
          <div style="font-size:13px;color:var(--adm-muted);margin-bottom:14px;">
            Configure the 7 UAE Emirates options and dispatch delivery timeframes displayed at checkout:
          </div>
          <div id="m_emirates_list" style="display:flex;flex-direction:column;gap:10px;"></div>
        `;

        const list = bodyEl.querySelector('#m_emirates_list');
        emirates.forEach((em, idx) => {
          const card = document.createElement('div');
          card.className = 'adm-card';
          card.style.padding = '10px 14px';
          card.style.background = 'var(--adm-panel2)';
          card.style.display = 'flex';
          card.style.gap = '12px';
          card.style.alignItems = 'center';
          card.innerHTML = `
            <b style="width:130px;">${esc(em.value || 'Emirate')}</b>
            <input type="text" class="em-label" style="flex:1;" value="${esc(em.label || '')}" placeholder="e.g. Dubai (1-2h Express Delivery)">
          `;
          card.querySelector('.em-label').addEventListener('input', (e) => { em.label = e.target.value; markDirty('home'); });
          list.appendChild(card);
        });
        break;
      }

      case 'footer_links': {
        titleEl.innerHTML = '🔗 Edit Footer Shop &amp; Navigation Links';
        if (!home.footer_shop_links) home.footer_shop_links = [];
        const links = home.footer_shop_links;

        bodyEl.innerHTML = `
          <div style="font-size:13px;color:var(--adm-muted);margin-bottom:14px;">
            Navigation links displayed under "Shop &amp; Guides" column in the footer:
          </div>
          <div id="m_footer_links_list" style="display:flex;flex-direction:column;gap:10px;"></div>
          <div style="margin-top:12px;text-align:right;">
            <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" id="btnAddFooterLink">➕ Add Navigation Link</button>
          </div>
        `;

        const renderLinks = () => {
          const list = bodyEl.querySelector('#m_footer_links_list');
          list.innerHTML = '';
          links.forEach((l, idx) => {
            const card = document.createElement('div');
            card.className = 'adm-card';
            card.style.padding = '10px 14px';
            card.style.background = 'var(--adm-panel2)';
            card.style.display = 'flex';
            card.style.gap = '10px';
            card.style.alignItems = 'center';
            card.innerHTML = `
              <input type="text" class="fl-label" style="flex:1;" value="${esc(l.label || '')}" placeholder="Link label (e.g. IQOS ILUMA)">
              <input type="text" class="fl-href" style="flex:1;" value="${esc(l.href || '')}" placeholder="Target URL (e.g. #shop or /guide-terea.php)">
              <button type="button" class="adm-btn adm-btn-sm adm-btn-danger btn-del-fl">✕</button>
            `;
            card.querySelector('.fl-label').addEventListener('input', (e) => { l.label = e.target.value; markDirty('home'); });
            card.querySelector('.fl-href').addEventListener('input', (e) => { l.href = e.target.value; markDirty('home'); });
            card.querySelector('.btn-del-fl').addEventListener('click', () => {
              links.splice(idx, 1);
              markDirty('home');
              renderLinks();
            });
            list.appendChild(card);
          });
        };

        renderLinks();
        bodyEl.querySelector('#btnAddFooterLink').addEventListener('click', () => {
          links.push({ label: 'New Shop Link', href: '#shop', filter: '' });
          markDirty('home');
          renderLinks();
        });
        break;
      }

      case 'payment_badges': {
        titleEl.innerHTML = '💳 Edit Payment &amp; Trust Badges';
        if (!settings.payment_badges) settings.payment_badges = ['Cash on Delivery', 'Card on Delivery', 'Apple Pay', 'Visa / Mastercard', '100% Genuine ESMA'];

        bodyEl.innerHTML = `
          <div style="font-size:13px;color:var(--adm-muted);margin-bottom:14px;">
            Payment and authenticity guarantee badges shown in footer and checkout:
          </div>
          <div id="m_badges_box"></div>
        `;

        bodyEl.querySelector('#m_badges_box').appendChild(
          renderStringListEditor(settings.payment_badges, (items) => {
            settings.payment_badges = items;
            markDirty('settings');
          }, 'Payment badge (e.g. Apple Pay, Cash on Delivery)', '+ Add Payment Badge')
        );
        break;
      }

      case 'social': {
        titleEl.innerHTML = '📱 Edit Social Channels &amp; Direct Support';
        bodyEl.innerHTML = `
          <div class="adm-field">
            <label>Instagram Page Link</label>
            <input type="url" id="m_soc_insta" value="${esc(settings.instagram_url || '')}" placeholder="https://instagram.com/...">
          </div>
          <div class="adm-field">
            <label>Telegram Channel / Bot Link</label>
            <input type="url" id="m_soc_tele" value="${esc(settings.telegram_url || '')}" placeholder="https://t.me/...">
          </div>
          <div class="adm-field">
            <label>WhatsApp Hotline Link / Number</label>
            <input type="text" id="m_soc_wa" value="${esc(settings.wa_number || '')}" placeholder="+971 50 123 4567">
          </div>
        `;
        bodyEl.querySelector('#m_soc_insta').addEventListener('input', (e) => { settings.instagram_url = e.target.value; markDirty('settings'); });
        bodyEl.querySelector('#m_soc_tele').addEventListener('input', (e) => { settings.telegram_url = e.target.value; markDirty('settings'); });
        bodyEl.querySelector('#m_soc_wa').addEventListener('input', (e) => { settings.wa_number = e.target.value; markDirty('settings'); });
        break;
      }

      default: {
        const readableName = (secKey || 'Custom').replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        titleEl.innerHTML = `✏️ Edit ${esc(readableName)} Section`;

        let target = home[secKey] || settings[secKey] || null;
        if (!target) {
          home[secKey] = {
            title: readableName,
            eyebrow: 'Special Feature',
            desc: '',
            button_label: 'Explore Collection',
            button_link: '#shop'
          };
          target = home[secKey];
          markDirty('home');
        }

        if (typeof target === 'object' && target !== null && !Array.isArray(target)) {
          let fieldsHtml = '';
          for (const k of Object.keys(target)) {
            const val = target[k];
            const fieldLabel = k.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            if (typeof val === 'boolean') {
              fieldsHtml += `
                <label class="adm-check" style="margin-bottom:12px;">
                  <input type="checkbox" class="dyn-field" data-prop="${esc(k)}" ${val ? 'checked' : ''}>
                  <span>${esc(fieldLabel)}</span>
                </label>
              `;
            } else if (typeof val === 'string' && (val.length > 70 || k.includes('text') || k.includes('desc') || k.includes('note') || k.includes('content'))) {
              fieldsHtml += `
                <div class="adm-field">
                  <label>${esc(fieldLabel)}</label>
                  <textarea class="dyn-field" data-prop="${esc(k)}" rows="3">${esc(val)}</textarea>
                </div>
              `;
            } else if (typeof val === 'string' || typeof val === 'number') {
              fieldsHtml += `
                <div class="adm-field">
                  <label>${esc(fieldLabel)}</label>
                  <input type="text" class="dyn-field" data-prop="${esc(k)}" value="${esc(String(val))}">
                </div>
              `;
            }
          }

          bodyEl.innerHTML = `
            <div style="margin-bottom:14px;color:var(--adm-muted);font-size:13px;">
              Configuring live properties for <b>${esc(readableName)}</b>:
            </div>
            ${fieldsHtml}
            <div style="margin-top:16px;text-align:right;">
              <button type="button" class="adm-btn adm-btn-primary" id="btnSaveDynSec">💾 Save Section Settings</button>
            </div>
          `;

          bodyEl.querySelectorAll('.dyn-field').forEach(input => {
            const prop = input.dataset.prop;
            if (input.type === 'checkbox') {
              input.addEventListener('change', (e) => {
                target[prop] = e.target.checked;
                markDirty('home');
              });
            } else {
              input.addEventListener('input', (e) => {
                target[prop] = e.target.value;
                markDirty('home');
              });
            }
          });

          const btnDyn = bodyEl.querySelector('#btnSaveDynSec');
          if (btnDyn) {
            btnDyn.addEventListener('click', () => {
              saveAll();
              toast(`Saved ${readableName} section settings!`);
            });
          }
        }
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
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <p style="color:var(--adm-muted);margin:0;">Store branding, customer contact channels, showroom hours, payment badges and compliance.</p>
        <button type="button" class="adm-btn adm-btn-primary" id="btnSettingsSaveTop">💾 Save Settings</button>
      </div>

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

      <!-- CONTACT & EXPRESS DELIVERY -->
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

      <!-- SOCIAL MEDIA CHANNELS -->
      <div class="adm-card">
        <h3><span>🌐</span> Official Social Media Channels</h3>
        <p class="adm-card-sub">Used in Google Knowledge Graph, SEO LocalBusiness schema and footer links</p>
        <div class="adm-grid2">
          <div class="adm-field">
            <label>Instagram URL</label>
            <input type="url" id="set_instagram" value="${esc(s.instagram_url || '')}">
          </div>
          <div class="adm-field">
            <label>Telegram Channel / Contact URL</label>
            <input type="url" id="set_telegram" value="${esc(s.telegram_url || '')}">
          </div>
          <div class="adm-field">
            <label>Facebook Page URL</label>
            <input type="url" id="set_facebook" value="${esc(s.facebook_url || '')}">
          </div>
          <div class="adm-field">
            <label>TikTok Profile URL</label>
            <input type="url" id="set_tiktok" value="${esc(s.tiktok_url || '')}">
          </div>
        </div>
      </div>

      <!-- STORE REVIEWS & RATING BADGE -->
      <div class="adm-card">
        <h3><span>⭐</span> Storefront Customer Rating &amp; Schema Trust</h3>
        <p class="adm-card-sub">Values displayed on the trust badge and injected into Google Store AggregateRating schema</p>
        <div class="adm-grid3">
          <div class="adm-field">
            <label>Rating Value (Out of 5.0)</label>
            <input type="text" id="set_rating_val" value="${esc(s.rating_value || '4.9')}">
          </div>
          <div class="adm-field">
            <label>Total Reviews Count</label>
            <input type="text" id="set_rating_cnt" value="${esc(s.rating_count || '214')}">
          </div>
          <div class="adm-field">
            <label>Show Rating Badge on Store</label>
            <label class="adm-check" style="margin-top:10px;">
              <input type="checkbox" id="set_show_rating" ${s.show_rating !== false ? 'checked' : ''}>
              <span>Display ★ Rating Pill</span>
            </label>
          </div>
        </div>
      </div>

      <!-- SHOWROOM HOURS & PAYMENT BADGES -->
      <div class="adm-card">
        <h3><span>🕒</span> Showroom Hours &amp; Payment Badges</h3>
        <p class="adm-card-sub">Showroom operating hours and accepted payment badges rendered on storefront</p>
        <div class="adm-grid2">
          <div class="adm-field">
            <label>Showroom Hours Lines</label>
            <div id="set_hours_box"></div>
          </div>
          <div class="adm-field">
            <label>Accepted Payment Methods</label>
            <div id="set_payments_box"></div>
          </div>
        </div>
      </div>

      <!-- WHATSAPP CONCIERGE & MESSAGE TEMPLATES -->
      <div class="adm-card">
        <h3><span>💬</span> In-Page WhatsApp Concierge Templates</h3>
        <p class="adm-card-sub">Pre-filled messages when customers click chat or order buttons</p>
        <div class="adm-grid2">
          <div class="adm-field">
            <label>Concierge Display Name</label>
            <input type="text" id="set_wa_concierge_name" value="${esc(s.wa_concierge_name || 'Vape Club Dubai Concierge')}">
          </div>
          <div class="adm-field">
            <label>General Assistance Template</label>
            <input type="text" id="set_wa_msg_assist" value="${esc(s.wa_msg_assistance || 'Hello Vape Club Dubai! I need assistance.')}">
          </div>
        </div>
        <div class="adm-grid2">
          <div class="adm-field">
            <label>Direct Order Message Template</label>
            <input type="text" id="set_wa_msg_order" value="${esc(s.wa_msg_order || 'Hello Vape Club Dubai! I want to order.')}">
          </div>
          <div class="adm-field">
            <label>Product Question Template</label>
            <input type="text" id="set_wa_msg_q" value="${esc(s.wa_msg_question || 'Hello Vape Club Dubai! I have a question about a product.')}">
          </div>
        </div>
      </div>

      <!-- TELEGRAM BOT LEAD TELEMETRY -->
      <div class="adm-card is-highlight">
        <h3><span>🤖</span> Telegram Bot Lead Telemetry &amp; Alerts</h3>
        <p class="adm-card-sub">Instant background notifications to Telegram whenever a customer enters their WhatsApp number</p>

        <div class="adm-grid2">
          <div class="adm-field">
            <label>Telegram Lead Alerts</label>
            <select id="set_tg_enabled">
              <option value="1" ${s.telegram_alerts_enabled !== false ? 'selected' : ''}>✅ Enabled (Real-time Telegram Alerts)</option>
              <option value="0" ${s.telegram_alerts_enabled === false ? 'selected' : ''}>❌ Disabled</option>
            </select>
            <span class="adm-hint">Silently sends visitor phone numbers, cart total, and product viewed to Telegram</span>
          </div>
          <div class="adm-field">
            <label>Telegram Chat ID</label>
            <input type="text" id="set_tg_chat_id" value="${esc(s.telegram_chat_id || '')}" placeholder="e.g. 5987654321 or -100123456789">
            <span class="adm-hint">Your Telegram user ID or group channel ID</span>
          </div>
        </div>

        <div class="adm-field">
          <label>Telegram Bot API Token</label>
          <input type="password" id="set_tg_bot_token" value="${esc(s.telegram_bot_token || '')}" placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ">
          <span class="adm-hint">Created from @BotFather on Telegram. Stored safely in data/settings.json</span>
        </div>

        <div class="adm-grid2" style="margin-top:10px;">
          <div class="adm-field">
            <button type="button" class="adm-btn" id="btnOpenTgStudio" style="width:100%;background:rgba(0,136,204,0.15);border-color:rgba(0,136,204,0.3);color:#29b6f6;">🤖 Open Full Telegram Studio ↗</button>
          </div>
          <div class="adm-field">
            <button type="button" class="adm-btn adm-btn-secondary" id="btnTestTelegram" style="width:100%;">⚡ Send Test Telegram Alert</button>
          </div>
        </div>
      </div>

      <!-- LEGAL & FOOTER NOTE -->
      <div class="adm-card">
        <h3><span>⚖️</span> UAE Legal Compliance, Copyright &amp; Footer Note</h3>
        <p class="adm-card-sub">Mandatory 18+ nicotine health warning and copyright text</p>

        <div class="adm-field">
          <label>Footer Brand Summary Note</label>
          <textarea id="set_foot_note" rows="2">${esc(s.brand_footer_note || '')}</textarea>
        </div>
        <div class="adm-field">
          <label>Copyright Notice</label>
          <input type="text" id="set_copyright" value="${esc(s.copyright || '© 2026 Vape Club Dubai')}">
        </div>
        <div class="adm-field">
          <label>UAE 18+ Nicotine Health Warning Notice</label>
          <textarea id="set_legal_warning" rows="3">${esc(s.legal_warning || '')}</textarea>
        </div>
      </div>

      <div style="text-align:right;margin-top:20px;">
        <button type="button" class="adm-btn adm-btn-primary adm-btn-lg" id="btnSettingsSaveBottom">💾 Save All Settings</button>
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

    const bind = (id, prop, isNum = false) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', (e) => {
        s[prop] = isNum ? (parseFloat(e.target.value) || 0) : e.target.value;
        markDirty('settings');
      });
    };
    const bindCheck = (id, prop) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', (e) => {
        s[prop] = e.target.checked;
        markDirty('settings');
      });
    };

    bind('set_brand_name', 'brand_name');
    bind('set_brand_tagline', 'brand_tagline');
    bind('set_order_prefix', 'order_prefix');
    bind('set_wa_number', 'wa_number');
    bind('set_phone_display', 'phone_display');
    bind('set_email', 'email');
    bind('set_free_ship', 'free_ship_threshold', true);
    bind('set_del_fee', 'delivery_fee', true);
    bind('set_del_time', 'delivery_time');
    bind('set_address', 'address');
    bind('set_maps_url', 'maps_url');
    bind('set_instagram', 'instagram_url');
    bind('set_telegram', 'telegram_url');
    bind('set_facebook', 'facebook_url');
    bind('set_tiktok', 'tiktok_url');
    bind('set_rating_val', 'rating_value');
    bind('set_rating_cnt', 'rating_count');
    bindCheck('set_show_rating', 'show_rating');
    bind('set_wa_concierge_name', 'wa_concierge_name');
    bind('set_wa_msg_assist', 'wa_msg_assistance');
    bind('set_wa_msg_order', 'wa_msg_order');
    bind('set_wa_msg_q', 'wa_msg_question');
    bind('set_tg_chat_id', 'telegram_chat_id');
    bind('set_tg_bot_token', 'telegram_bot_token');
    bind('set_foot_note', 'brand_footer_note');
    bind('set_copyright', 'copyright');
    bind('set_legal_warning', 'legal_warning');

    const tgEn = document.getElementById('set_tg_enabled');
    if (tgEn) tgEn.addEventListener('change', (e) => { s.telegram_alerts_enabled = e.target.value === '1'; markDirty('settings'); });

    // Hours list
    document.getElementById('set_hours_box').appendChild(
      renderStringListEditor(s.hours || [], (items) => {
        s.hours = items;
        markDirty('settings');
      }, 'Hours line (e.g. Daily 10:00 AM – 12:00 AM)', '+ Add Hours Line')
    );

    // Payments list
    document.getElementById('set_payments_box').appendChild(
      renderStringListEditor(s.payment_badges || [], (items) => {
        s.payment_badges = items;
        markDirty('settings');
      }, 'Payment method (e.g. COD, VISA, APPLE PAY)', '+ Add Payment Badge')
    );

    // Test Telegram button
    const btnTest = document.getElementById('btnTestTelegram');
    if (btnTest) {
      btnTest.addEventListener('click', async () => {
        btnTest.disabled = true;
        btnTest.textContent = '⏳ Testing Telegram…';
        toast('Dispatching test telemetry to Telegram…');
        try {
          const res = await fetch('/api/wa-lead.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_phone: '+971 50 123 4567',
              phone: '501234567',
              country_code: '+971',
              message: '🔔 Test WhatsApp Lead Alert from Vape Club Dubai Admin Panel!',
              product_name: 'IQOS ILUMA i PRIME (Remix Edition)',
              cart_total: 450,
              cart_summary: '1x IQOS ILUMA, 2x TEREA Japan',
              device: 'Admin Panel Test Dispatch'
            })
          });
          const data = await res.json();
          if (data && data.telegram_sent) {
            toast('✅ Telegram test message delivered to your Telegram chat successfully!');
          } else if (data && data.ok) {
            toast('⚠️ Lead saved to database, but Telegram Bot did not send. Please verify Bot Token and Chat ID.', true);
          } else {
            toast('Failed to send test: ' + (data.error || 'Server error'), true);
          }
        } catch (err) {
          toast('Network error testing Telegram: ' + err.message, true);
        } finally {
          btnTest.disabled = false;
          btnTest.innerHTML = '⚡ Send Test Telegram Alert';
        }
      });
    }

    const btnOpenStudio = document.getElementById('btnOpenTgStudio');
    if (btnOpenStudio) btnOpenStudio.addEventListener('click', () => switchView('telegram'));

    const saveSettingsHandler = () => {
      saveAll();
    };
    const btnTop = document.getElementById('btnSettingsSaveTop');
    const btnBtm = document.getElementById('btnSettingsSaveBottom');
    if (btnTop) btnTop.addEventListener('click', saveSettingsHandler);
    if (btnBtm) btnBtm.addEventListener('click', saveSettingsHandler);
  }

  /* ============================================================
     VIEW: SEO & SCHEMA ENGINE
     ============================================================ */
    function renderSEO() {
    dom.viewTitle.textContent = 'SEO & Schema Engine';
    const seo = state.data.seo;
    const settings = state.data.settings;
    const prods = (state.data.products && state.data.products.products) || state.data.products || [];

    if (!seo.pages) seo.pages = {};
    if (!seo.pages.home) seo.pages.home = {};
    if (!seo.pages.category) seo.pages.category = {};
    if (!seo.pages.product) seo.pages.product = {};

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <p style="color:var(--adm-muted);margin:0;">Google UAE Search ranking, SERP snippets, structured data schemas, Meta Pixel, GA4, and webmaster verification.</p>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <a href="/sitemap.xml" target="_blank" rel="noopener" class="adm-btn adm-btn-sm" style="background:rgba(0,229,153,0.15);color:#00e599;border:1px solid rgba(0,229,153,0.35);">
            🗺️ Live Sitemap (sitemap.xml) ↗
          </a>
          <a href="/SEO_SEARCH_CONSOLE_GUIDE.md" target="_blank" rel="noopener" class="adm-btn adm-btn-sm" style="background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid rgba(56,189,248,0.35);">
            📖 Search Console Guide (.md) ↗
          </a>
          <button type="button" class="adm-btn adm-btn-primary" id="btnSeoSaveTop">💾 Save SEO Settings</button>
        </div>
      </div>

      <!-- 1. PRODUCTION URL & SCHEMAS -->
      <div class="adm-card is-highlight">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
          <div>
            <h3 style="margin:0;"><span>🔍</span> Production URL &amp; Google Structured Data Schemas</h3>
            <p class="adm-card-sub" style="margin-top:4px;">Zero SEO gaps: Canonical URLs, JSON-LD rich snippets and Google Star Ratings</p>
          </div>
          <div style="font-size:12px;color:var(--adm-emerald);font-weight:700;display:flex;align-items:center;gap:6px;">
            <span>⚡ Sitemaps &amp; Schemas Auto-Synced</span>
          </div>
        </div>

        <div class="adm-grid2">
          <div class="adm-field">
            <label>Canonical Production URL</label>
            <input type="url" id="seo_site_url" value="${esc(seo.site_url || 'https://iqosae.com')}">
          </div>
          <div class="adm-field">
            <label>Geo Region (ISO 3166-2 UAE)</label>
            <input type="text" id="seo_geo_region" value="${esc(seo.geo_region || 'AE-DU')}">
          </div>
        </div>

        <div class="adm-card" style="background:var(--adm-panel2);margin-top:14px;">
          <h4>Structured Data Schemas (JSON-LD Google Rich Results)</h4>
          <div class="adm-grid2" style="margin-top:10px;">
            <label class="adm-check">
              <input type="checkbox" id="sc_prod" ${seo.schema_product !== false ? 'checked' : ''}>
              <span>Product Schema (AggregateRating + Offers + Verified Review)</span>
            </label>
            <label class="adm-check">
              <input type="checkbox" id="sc_local" ${seo.schema_local_business !== false ? 'checked' : ''}>
              <span>Store / LocalBusiness Schema (Dubai Coordinates + Rating Stars)</span>
            </label>
            <label class="adm-check">
              <input type="checkbox" id="sc_faq" ${seo.schema_faq_page !== false ? 'checked' : ''}>
              <span>FAQPage Schema (Google Search Expandable Accordions)</span>
            </label>
            <label class="adm-check">
              <input type="checkbox" id="sc_bread" ${seo.schema_breadcrumb !== false ? 'checked' : ''}>
              <span>BreadcrumbList Schema (Google Category Hierarchy)</span>
            </label>
            <label class="adm-check">
              <input type="checkbox" id="sc_search" ${seo.schema_website_search !== false ? 'checked' : ''}>
              <span>WebSite SearchAction Schema (Google Sitelinks Searchbox)</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 2. ANALYTICS, FACEBOOK PIXEL & WEBMASTER VERIFICATION -->
      <div class="adm-card is-highlight">
        <h3><span>📊</span> Web Analytics, Tracking Pixels &amp; Webmaster Verification</h3>
        <p class="adm-card-sub">Integrate Google Search Console, Meta / Facebook Pixel, Google Analytics 4, Tag Manager, and TikTok Pixel</p>

        <div class="adm-grid2">
          <div class="adm-field">
            <label>Google Search Console Verification Tag or Code</label>
            <input type="text" id="seo_g_code" value="${esc(seo.google_verification_code || '')}" placeholder='e.g. 4d7b1e8f2a9c3b or <meta name="google-site-verification" content="..." />'>
            <span class="adm-hint">Generates &lt;meta name="google-site-verification"&gt; in &lt;head&gt; automatically</span>
          </div>
          <div class="adm-field">
            <label>Meta / Facebook Pixel ID</label>
            <input type="text" id="seo_fb_pixel" value="${esc(seo.facebook_pixel_id || '')}" placeholder="e.g. 123456789012345">
            <span class="adm-hint">Automatically injects official Facebook Pixel SDK and tracks PageView</span>
          </div>
        </div>

        <div class="adm-grid3" style="margin-top:12px;">
          <div class="adm-field">
            <label>Google Analytics 4 (GA4) Measurement ID</label>
            <input type="text" id="seo_ga4" value="${esc(seo.ga4_id || '')}" placeholder="e.g. G-XXXXXXXXXX">
            <span class="adm-hint">Loads official gtag.js container</span>
          </div>
          <div class="adm-field">
            <label>Google Tag Manager (GTM) ID</label>
            <input type="text" id="seo_gtm" value="${esc(seo.gtm_id || '')}" placeholder="e.g. GTM-XXXXXXX">
            <span class="adm-hint">Injects head and noscript body tags</span>
          </div>
          <div class="adm-field">
            <label>TikTok Pixel ID (Optional)</label>
            <input type="text" id="seo_tt_pixel" value="${esc(seo.tiktok_pixel_id || '')}" placeholder="e.g. CXXXXXXXXXXXXXXXXX">
            <span class="adm-hint">TikTok Analytics SDK integration</span>
          </div>
        </div>

        <div class="adm-field" style="margin-top:14px;">
          <label>Custom Header Code &amp; SEO Meta Tags (Injected before &lt;/head&gt;)</label>
          <textarea id="seo_extra_head" rows="3" style="font-family:monospace;font-size:12px;" placeholder='<meta name="custom-meta" content="..." />&#10;<script>/* Custom tracking script */</script>'>${esc(seo.extra_head_code || '')}</textarea>
          <span class="adm-hint">Custom HTML, third-party verification meta tags, or CSS injected directly into the &lt;head&gt; of all pages.</span>
        </div>

        <div class="adm-field">
          <label>Custom Body Tracking &amp; Conversion Scripts (Injected before &lt;/body&gt;)</label>
          <textarea id="seo_extra_body" rows="3" style="font-family:monospace;font-size:12px;" placeholder='<script>/* Custom conversion tracker, live chat widget (Tawk.to, Crisp), etc. */</script>'>${esc(seo.extra_body_code || '')}</textarea>
          <span class="adm-hint">Scripts executed right before &lt;/body&gt; closing tag (e.g. live chat widgets, event tracking).</span>
        </div>
      </div>

      <!-- 3. SOCIAL MEDIA PREVIEWS (OPEN GRAPH & TWITTER) -->
      <div class="adm-card">
        <h3><span>📱</span> Open Graph &amp; Twitter Card Previews</h3>
        <p class="adm-card-sub">Controls how links appear when shared on WhatsApp, iMessage, Facebook, and Twitter/X</p>
        <div class="adm-grid2">
          <div class="adm-field">
            <label>Twitter / X Site Handle</label>
            <input type="text" id="seo_tw_site" value="${esc(seo.twitter_site || '')}" placeholder="@vapeclubdubai">
          </div>
          <div class="adm-field">
            <label>Twitter Card Display Type</label>
            <select id="seo_tw_card">
              <option value="summary_large_image" ${seo.twitter_card === 'summary_large_image' ? 'selected' : ''}>Large Image Summary Card (Recommended)</option>
              <option value="summary" ${seo.twitter_card === 'summary' ? 'selected' : ''}>Standard Compact Summary Card</option>
            </select>
          </div>
        </div>
        <div class="adm-field">
          <label>Default Social Share Image (OpenGraph 1200x630)</label>
          <div id="seo_og_img_picker"></div>
        </div>
      </div>

      <!-- 4. HOMEPAGE SEO & SERP PREVIEW -->
      <div class="adm-card is-highlight">
        <h3><span>🏠</span> Homepage SEO &amp; Google Search Snippet</h3>
        <p class="adm-card-sub">Exact preview of how Vape Club Dubai appears in Google search results across the UAE</p>

        <!-- Google SERP Snippet Preview for Homepage -->
        <div class="adm-serp-preview">
          <div class="adm-serp-toggle">
            <span style="font-size:12px;font-weight:700;color:#9aa0a6;">HOMEPAGE GOOGLE SEARCH PREVIEW</span>
            <span style="font-size:11px;color:#8ab4f8;">Google Search AE</span>
          </div>
          <div class="adm-serp-url-row">
            <span class="adm-serp-fav">⚡</span>
            <span class="adm-serp-site">${esc(seo.site_url ? seo.site_url.replace(/^https?:\/\//, '') : 'iqosae.com')}</span>
          </div>
          <div class="adm-serp-title" id="homeSerpTitle">${esc(seo.pages.home.title || '')}</div>
          <div class="adm-serp-desc" id="homeSerpDesc">${esc(seo.pages.home.description || '')}</div>
          <div class="adm-serp-rating">★★★★★ <span>${esc(settings.rating_value || '4.9')} (${esc(settings.rating_count || '214')} reviews) · Dubai Express</span></div>
        </div>

        <div class="adm-field" style="margin-top:18px;">
          <label>Homepage SEO Title</label>
          <input type="text" id="seo_home_title" value="${esc(seo.pages.home.title || '')}">
        </div>
        <div class="adm-field">
          <label>Homepage Meta Description</label>
          <textarea id="seo_home_desc" rows="3">${esc(seo.pages.home.description || '')}</textarea>
        </div>
        <div class="adm-grid2">
          <div class="adm-field">
            <label>Homepage Focus Keywords</label>
            <input type="text" id="seo_home_kw" value="${esc(seo.pages.home.keywords || '')}">
          </div>
          <div class="adm-field">
            <label>Robots Indexing Directive</label>
            <input type="text" id="seo_home_robots" value="${esc(seo.pages.home.robots || 'index, follow')}">
          </div>
        </div>
      </div>

      <!-- 5. INDIVIDUAL PRODUCT SEO & LIVE SERP CUSTOMIZER -->
      <div class="adm-card is-highlight" id="seoProductCustomizerCard">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
          <div>
            <h3 style="margin:0;"><span>🎯</span> Individual Product SEO &amp; Live Google SERP Customizer</h3>
            <p class="adm-card-sub" style="margin:4px 0 0;">Select any product in your store to inspect, fine-tune, and optimize its custom Google Title, Meta Description, Search Keywords, and Live SERP Result.</p>
          </div>
          <button type="button" class="adm-btn adm-btn-primary adm-btn-sm" id="btnSaveProdSeoTop">💾 Save Product SEO</button>
        </div>

        <div class="adm-field">
          <label style="font-size:14px;font-weight:700;color:var(--adm-emerald);">Choose Product to Customize SEO (${prods.length} products in store):</label>
          <select id="seo_prod_picker" style="font-size:14px;font-weight:600;padding:10px 14px;background:var(--adm-panel2);border:1px solid var(--adm-emerald);border-radius:8px;color:#fff;width:100%;">
            ${prods.map((p, idx) => `
              <option value="${idx}">[${esc((p.cat || 'store').toUpperCase())}] ${esc(p.name)} — ${esc(p.price)} AED ${p.seo_title ? '✓ (Custom SEO active)' : ''}</option>
            `).join('')}
          </select>
        </div>

        <div id="seo_prod_details_box" style="margin-top:16px;"></div>
      </div>

      <!-- 6. CATEGORY PAGES DYNAMIC SEO TEMPLATE -->
      <div class="adm-card">
        <h3><span>📂</span> Category Pages Dynamic SEO Template</h3>
        <p class="adm-card-sub">Pattern applied to all category pages. Variable <code>{category}</code> is dynamically replaced by the category title.</p>
        <div class="adm-field">
          <label>Category Meta Title Pattern</label>
          <input type="text" id="seo_cat_title" value="${esc(seo.pages.category.title || '')}">
        </div>
        <div class="adm-field">
          <label>Category Meta Description Pattern</label>
          <textarea id="seo_cat_desc" rows="2">${esc(seo.pages.category.description || '')}</textarea>
        </div>
        <div class="adm-grid2">
          <div class="adm-field">
            <label>Category Focus Keywords Pattern</label>
            <input type="text" id="seo_cat_kw" value="${esc(seo.pages.category.keywords || '')}">
          </div>
          <div class="adm-field">
            <label>Category Robots Directive</label>
            <input type="text" id="seo_cat_robots" value="${esc(seo.pages.category.robots || 'index, follow')}">
          </div>
        </div>
      </div>

      <!-- 6. PRODUCT PAGES DYNAMIC SEO TEMPLATE -->
      <div class="adm-card">
        <h3><span>🏷️</span> Product Detail Pages (PDP) Dynamic SEO Template</h3>
        <p class="adm-card-sub">Fallback pattern applied when a product has no custom SEO title. Variables <code>{product}</code> and <code>{price}</code> are automatically replaced.</p>
        <div class="adm-field">
          <label>Product Meta Title Pattern</label>
          <input type="text" id="seo_prod_title" value="${esc(seo.pages.product.title || '')}">
        </div>
        <div class="adm-field">
          <label>Product Meta Description Pattern</label>
          <textarea id="seo_prod_desc" rows="2">${esc(seo.pages.product.description || '')}</textarea>
        </div>
        <div class="adm-grid2">
          <div class="adm-field">
            <label>Product Focus Keywords Pattern</label>
            <input type="text" id="seo_prod_kw" value="${esc(seo.pages.product.keywords || '')}">
          </div>
          <div class="adm-field">
            <label>Product Robots Directive</label>
            <input type="text" id="seo_prod_robots" value="${esc(seo.pages.product.robots || 'index, follow')}">
          </div>
        </div>
      </div>

      <div style="text-align:right;margin-top:20px;">
        <button type="button" class="adm-btn adm-btn-primary adm-btn-lg" id="btnSeoSaveBottom">💾 Save All SEO Settings</button>
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

    const bind = (id, obj, prop) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', (e) => {
        obj[prop] = e.target.value;
        markDirty('seo');
      });
    };
    const bindCheck = (id, obj, prop) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', (e) => {
        obj[prop] = e.target.checked;
        markDirty('seo');
      });
    };

    bind('seo_site_url', seo, 'site_url');
    bind('seo_geo_region', seo, 'geo_region');
    bind('seo_g_code', seo, 'google_verification_code');
    bind('seo_fb_pixel', seo, 'facebook_pixel_id');
    bind('seo_ga4', seo, 'ga4_id');
    bind('seo_gtm', seo, 'gtm_id');
    bind('seo_tt_pixel', seo, 'tiktok_pixel_id');
    bind('seo_extra_head', seo, 'extra_head_code');
    bind('seo_extra_body', seo, 'extra_body_code');
    bind('seo_tw_site', seo, 'twitter_site');
    bind('seo_home_kw', seo.pages.home, 'keywords');
    bind('seo_home_robots', seo.pages.home, 'robots');
    bind('seo_cat_title', seo.pages.category, 'title');
    bind('seo_cat_desc', seo.pages.category, 'description');
    bind('seo_cat_kw', seo.pages.category, 'keywords');
    bind('seo_cat_robots', seo.pages.category, 'robots');
    bind('seo_prod_title', seo.pages.product, 'title');
    bind('seo_prod_desc', seo.pages.product, 'description');
    bind('seo_prod_kw', seo.pages.product, 'keywords');
    bind('seo_prod_robots', seo.pages.product, 'robots');

    const twCardSel = document.getElementById('seo_tw_card');
    if (twCardSel) twCardSel.addEventListener('change', (e) => { seo.twitter_card = e.target.value; markDirty('seo'); });

    bindCheck('sc_prod', seo, 'schema_product');
    bindCheck('sc_local', seo, 'schema_local_business');
    bindCheck('sc_faq', seo, 'schema_faq_page');
    bindCheck('sc_bread', seo, 'schema_breadcrumb');
    bindCheck('sc_search', seo, 'schema_website_search');

    // OG Image Picker
    document.getElementById('seo_og_img_picker').appendChild(
      renderImgPicker('seo_og_img_input', seo.default_og_image || '', (path) => {
        seo.default_og_image = path;
        markDirty('seo');
      }, 'branding')
    );

    // ============ PRODUCT SEO ENGINE ============
    const prodPicker = document.getElementById('seo_prod_picker');
    const prodBox = document.getElementById('seo_prod_details_box');

    const renderProdSeoEditor = (idx) => {
      const p = prods[idx];
      if (!p || !prodBox) return;

      const prodPhoto = p.photo ? (p.photo.startsWith('/') ? p.photo : '/' + p.photo) : '/assets/images/hero-iluma.png';
      const prodSlug = p.slug || p.id;
      const liveUrl = `/product.php?slug=${encodeURIComponent(prodSlug)}`;
      
      const currentTitle = p.seo_title || `${p.name} UAE — Buy Online Dubai | Fast Delivery`;
      const currentDesc = p.seo_desc || (p.short_desc || (p.description ? p.description.slice(0, 155) : '') || `Order authentic ${p.name} in Dubai & UAE. 100% genuine ESMA certified stock, 1-2 hour express delivery. Best price ${p.price} AED.`);

      prodBox.innerHTML = `
        <!-- Product Quick Bar -->
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--adm-panel2);padding:14px;border-radius:10px;border:1px solid var(--adm-line);margin-bottom:16px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${esc(prodPhoto)}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;border:1px solid var(--adm-line);background:#000;" alt="${esc(p.name)}" onerror="this.src='/assets/images/hero-iluma.png'">
            <div>
              <b style="font-size:15px;color:#fff;">${esc(p.name)}</b>
              <div style="font-size:12px;color:var(--adm-muted);margin-top:2px;">
                <span class="adm-pill cat">${esc(p.cat || 'catalog')}</span>
                <span style="margin-left:8px;color:var(--adm-emerald);font-weight:700;">${esc(p.price)} AED</span>
                <span style="margin-left:8px;color:var(--adm-muted);">SKU: ${esc(p.sku || p.id)}</span>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button type="button" class="adm-btn adm-btn-sm" id="btnAutoSeoProd" style="color:var(--adm-emerald);border-color:rgba(0,229,153,0.4);">⚡ Auto-Generate Dubai SEO</button>
            <a href="${esc(liveUrl)}" target="_blank" rel="noopener" class="adm-btn adm-btn-sm" style="text-decoration:none;">↗ View Live Page</a>
          </div>
        </div>

        <!-- Google SERP Snippet Preview for Product -->
        <div class="adm-serp-preview" style="margin-bottom:18px;">
          <div class="adm-serp-toggle">
            <span style="font-size:12px;font-weight:700;color:#9aa0a6;">PRODUCT GOOGLE SEARCH SNIPPET</span>
            <span style="font-size:11px;color:#8ab4f8;">Google Search AE (Desktop &amp; Mobile)</span>
          </div>
          <div class="adm-serp-url-row">
            <span class="adm-serp-fav">⚡</span>
            <span class="adm-serp-site">${esc(seo.site_url ? seo.site_url.replace(/^https?:\/\//, '') : 'iqosae.com')} › product.php?slug=${esc(prodSlug)}</span>
          </div>
          <div class="adm-serp-title" id="prodSerpTitle">${esc(currentTitle)}</div>
          <div class="adm-serp-desc" id="prodSerpDesc">${esc(currentDesc)}</div>
          <div class="adm-serp-rating">★★★★★ <span>${esc(p.rating_value || '4.9')} (${esc(p.rating_count || '128')} reviews) · AED ${esc(p.price)} · In stock · 1-2h Dubai Delivery</span></div>
        </div>

        <!-- Form Fields -->
        <div class="adm-field">
          <label>Custom Product SEO Title</label>
          <input type="text" id="seo_cur_prod_title" value="${esc(p.seo_title || '')}" placeholder="e.g. ${esc(p.name)} UAE — Buy Online Dubai · Fast Delivery">
          <span class="adm-hint">Recommended: 50–60 characters. If empty, the global PDP dynamic template will be used.</span>
        </div>

        <div class="adm-field">
          <label>Custom Product Meta Description</label>
          <textarea id="seo_cur_prod_desc" rows="3" placeholder="e.g. Buy authentic ${esc(p.name)} in Dubai &amp; UAE. Factory sealed ESMA certified stock, 1-2 hour express delivery. Best price guaranteed.">${esc(p.seo_desc || '')}</textarea>
          <span class="adm-hint">Recommended: 140–160 characters.</span>
        </div>

        <div class="adm-grid2">
          <div class="adm-field">
            <label>Focus Keywords</label>
            <input type="text" id="seo_cur_prod_kw" value="${esc(p.seo_keywords || '')}" placeholder="e.g. ${esc(p.name.toLowerCase())}, ${esc(p.name.toLowerCase())} dubai, buy ${esc(p.name.toLowerCase())} uae">
          </div>
          <div class="adm-field">
            <label>Permanent URL Slug</label>
            <input type="text" id="seo_cur_prod_slug" value="${esc(p.slug || p.id)}" placeholder="e.g. iluma-prime-remix">
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;">
          <button type="button" class="adm-btn adm-btn-primary" id="btnSaveSingleProdSeo">💾 Save Product SEO</button>
        </div>
      `;

      const titleIn = prodBox.querySelector('#seo_cur_prod_title');
      const descIn = prodBox.querySelector('#seo_cur_prod_desc');
      const kwIn = prodBox.querySelector('#seo_cur_prod_kw');
      const slugIn = prodBox.querySelector('#seo_cur_prod_slug');
      const pSerpTitle = prodBox.querySelector('#prodSerpTitle');
      const pSerpDesc = prodBox.querySelector('#prodSerpDesc');

      attachCharMeter(titleIn, 45, 65);
      attachCharMeter(descIn, 140, 160);

      titleIn.addEventListener('input', (e) => {
        p.seo_title = e.target.value.trim();
        pSerpTitle.textContent = e.target.value.trim() || `${p.name} UAE — Buy Online Dubai | Fast Delivery`;
        markDirty('products');
      });

      descIn.addEventListener('input', (e) => {
        p.seo_desc = e.target.value.trim();
        pSerpDesc.textContent = e.target.value.trim() || `Buy authentic ${p.name} in Dubai & UAE. 1-2 hour express delivery.`;
        markDirty('products');
      });

      kwIn.addEventListener('input', (e) => {
        p.seo_keywords = e.target.value.trim();
        markDirty('products');
      });

      slugIn.addEventListener('input', (e) => {
        p.slug = e.target.value.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/^-|-$/g, '');
        markDirty('products');
      });

      // Auto-Generate Assistant
      prodBox.querySelector('#btnAutoSeoProd').addEventListener('click', () => {
        const brand = p.brand || 'Vape';
        titleIn.value = `${p.name} UAE — Buy Online Dubai · Fast Delivery`;
        descIn.value = `Order authentic ${p.name} in Dubai, Sharjah & Abu Dhabi. 100% genuine ESMA certified stock with 1-2 hour express delivery. Best UAE price ${p.price} AED.`;
        kwIn.value = `${p.name.toLowerCase()}, ${p.name.toLowerCase()} dubai, buy ${p.name.toLowerCase()} uae, ${brand.toLowerCase()} delivery dubai`;

        p.seo_title = titleIn.value;
        p.seo_desc = descIn.value;
        p.seo_keywords = kwIn.value;
        pSerpTitle.textContent = titleIn.value;
        pSerpDesc.textContent = descIn.value;
        markDirty('products');
        toast(`Generated optimized SEO for "${p.name}"!`);
      });

      const saveProdSeoHandler = () => {
        saveAll();
        toast(`SEO settings for "${p.name}" saved!`);
        const opt = prodPicker.options[idx];
        if (opt && !opt.textContent.includes('✓')) {
          opt.textContent += ' ✓ (Custom SEO active)';
        }
      };

      prodBox.querySelector('#btnSaveSingleProdSeo').addEventListener('click', saveProdSeoHandler);
      const topBtn = document.getElementById('btnSaveProdSeoTop');
      if (topBtn) topBtn.onclick = saveProdSeoHandler;
    };

    if (prodPicker && prods.length > 0) {
      prodPicker.addEventListener('change', (e) => {
        renderProdSeoEditor(parseInt(e.target.value, 10));
      });
      renderProdSeoEditor(0);
    }

    const saveSeoHandler = () => {
      saveAll();
    };
    const btnTop = document.getElementById('btnSeoSaveTop');
    const btnBtm = document.getElementById('btnSeoSaveBottom');
    if (btnTop) btnTop.addEventListener('click', saveSeoHandler);
    if (btnBtm) btnBtm.addEventListener('click', saveSeoHandler);
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

  /* ============================================================
     VIEW: CAPTURED WHATSAPP LEADS & TELEMETRY
     ============================================================ */
  function renderLeads() {
    dom.viewTitle.textContent = 'WhatsApp Leads';
    const leads = (state.data.leads && state.data.leads.leads) || [];

    let html = `
      <div class="adm-card" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <h3 style="margin:0 0 4px;display:flex;align-items:center;gap:8px;">
            <span>💬</span> Captured WhatsApp Leads (${leads.length})
          </h3>
          <div style="font-size:12px;color:var(--adm-muted);">
            Real-time telemetry captured when visitors open in-page WhatsApp chat
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="adm-btn adm-btn-sm" onclick="ADM.refreshLeads()">🔄 Refresh</button>
          <button class="adm-btn adm-btn-sm adm-btn-danger" onclick="ADM.clearLeads()">🗑️ Clear All</button>
        </div>
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Captured Time</th>
              <th>WhatsApp Number</th>
              <th>Inquiry / Message</th>
              <th>Product Viewed</th>
              <th>Cart Context</th>
              <th>Device &amp; IP</th>
              <th style="text-align:right">Direct WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            ${leads.length === 0 ? `
              <tr><td colspan="7" style="text-align:center;padding:48px;color:var(--adm-muted)">
                <div style="font-size:32px;margin-bottom:8px;">💬</div>
                <b>No WhatsApp leads captured yet.</b>
                <p style="font-size:12px;margin:4px 0 0;">Leads will appear here in real time when visitors interact with WhatsApp buttons.</p>
              </td></tr>
            ` : leads.map(l => {
              const rawNum = l.raw_phone || (l.phone || '').replace(/\\D/g, '');
              const waLink = `https://wa.me/${rawNum}`;
              return `
                <tr>
                  <td>
                    <b>${esc(l.formatted_time || l.timestamp || 'Recent')}</b>
                    <div style="font-size:11px;color:var(--adm-muted)">${esc(l.id || '')}</div>
                  </td>
                  <td>
                    <b style="font-size:14px;color:var(--adm-emerald)">${esc(l.phone || 'N/A')}</b>
                    <div style="font-size:11px;color:var(--adm-muted)">Country: ${esc(l.country_code || 'UAE')}</div>
                  </td>
                  <td style="max-width:220px;word-break:break-word;">
                    ${esc(l.message || 'Initiated Chat')}
                  </td>
                  <td>
                    ${l.product ? `<span class="adm-badge">${esc(l.product)}</span>` : '<span style="color:var(--adm-muted)">-</span>'}
                  </td>
                  <td>
                    ${(l.cart_total > 0) ? `
                      <b style="color:var(--adm-emerald)">${esc(l.cart_total)} AED</b>
                      <div style="font-size:11px;color:var(--adm-muted)">${esc(l.cart_summary || '')}</div>
                    ` : '<span style="color:var(--adm-muted)">Empty Cart</span>'}
                  </td>
                  <td>
                    <div>${esc(l.device || 'Mobile')}</div>
                    <div style="font-size:11px;color:var(--adm-muted)"><code>${esc(l.ip || '')}</code></div>
                  </td>
                  <td style="text-align:right;white-space:nowrap;">
                    <a href="${waLink}" target="_blank" rel="noopener" class="adm-btn adm-btn-sm" style="background:#25D366;color:#000;font-weight:700;margin-right:4px;">
                      💬 Chat
                    </a>
                    <button class="adm-btn adm-btn-sm adm-btn-danger" onclick="ADM.deleteLead('${esc(l.id)}')">✕</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    dom.content.innerHTML = html;
  }

  /* ============================================================
     VIEW: TELEGRAM BOT & REAL-TIME TELEMETRY
     ============================================================ */
  /* ============================================================
     VIEW: TELEGRAM BOT & REAL-TIME TELEMETRY (SIMPLIFIED + (i) GUIDANCE)
     ============================================================ */
  function renderTelegram() {
    dom.viewTitle.textContent = 'Telegram Bot & Alerts';
    const s = state.data.settings || {};

    const hasToken = !!(s.telegram_bot_token && s.telegram_bot_token.trim());
    const hasChatId = !!(s.telegram_chat_id && s.telegram_chat_id.trim());
    const isConfigured = hasToken && hasChatId;

    let statusBadge = '';
    if (isConfigured) {
      statusBadge = '<span style="background:rgba(0,229,153,0.15);color:var(--adm-emerald);border:1px solid rgba(0,229,153,0.4);padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:6px;">● Active &amp; Ready</span>';
    } else if (hasToken || hasChatId) {
      statusBadge = '<span style="background:rgba(255,170,0,0.15);color:#ffaa00;border:1px solid rgba(255,170,0,0.4);padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:6px;">⚠️ Incomplete</span>';
    } else {
      statusBadge = '<span style="background:rgba(255,255,255,0.06);color:var(--adm-muted);border:1px solid rgba(255,255,255,0.12);padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:6px;">○ Not Connected</span>';
    }

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <h3 style="margin:0;font-size:16px;">Telegram Bot Configuration</h3>
          ${statusBadge}
        </div>
        <div style="display:flex;gap:10px;">
          <button type="button" class="adm-btn adm-btn-secondary" id="btnTgTestHeader">⚡ Test Connection</button>
          <button type="button" class="adm-btn adm-btn-primary" id="btnTgSaveTop">💾 Save Settings</button>
        </div>
      </div>

      <!-- CARD 1: BOT CREDENTIALS -->
      <div class="adm-card">
        <h3><span>🤖</span> Bot Credentials</h3>
        <p class="adm-card-sub">Essential API credentials for your Telegram Bot (click <b>ⓘ</b> next to any field for instant instructions)</p>

        <div class="adm-field">
          <label>
            Telegram Bot API Token
            <button type="button" class="adm-info-btn js-tg-info" data-topic="bot_token" title="How to get Bot API Token">ⓘ</button>
          </label>
          <div style="display:flex;gap:8px;">
            <input type="password" id="tg_view_bot_token" value="${esc(s.telegram_bot_token || '')}" placeholder="e.g. 8772277899:AAEbGGNrRLW57qqOuDi6VXT9YVPbYDwZqaM" style="flex:1;">
            <button type="button" class="adm-btn adm-btn-sm" id="btnToggleTokenVis">👁️ Show</button>
            <button type="button" class="adm-btn adm-btn-sm" id="btnCopyToken">📋 Copy</button>
          </div>
        </div>

        <div class="adm-grid3" style="margin-top:14px;">
          <div class="adm-field">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <label style="margin:0;">
                Telegram Chat ID
                <button type="button" class="adm-info-btn js-tg-info" data-topic="chat_id" title="How to get Chat ID">ⓘ</button>
              </label>
              <button type="button" class="adm-btn adm-btn-sm" id="btnAutoDetectChatId" style="background:rgba(0,136,204,0.15);border-color:rgba(0,136,204,0.3);color:#29b6f6;font-size:11px;padding:2px 8px;">
                🔍 Auto-Detect
              </button>
            </div>
            <input type="text" id="tg_view_chat_id" value="${esc(s.telegram_chat_id || '')}" placeholder="e.g. 6532343622">
          </div>

          <div class="adm-field">
            <label>
              Bot Username
              <button type="button" class="adm-info-btn js-tg-info" data-topic="bot_username" title="How to find Bot Username">ⓘ</button>
            </label>
            <input type="text" id="tg_view_bot_username" value="${esc(s.telegram_bot_username || '@iqosaibot')}" placeholder="@iqosaibot">
          </div>

          <div class="adm-field">
            <label>
              Public Link / Channel URL
              <button type="button" class="adm-info-btn js-tg-info" data-topic="channel_url" title="What is Public Link">ⓘ</button>
            </label>
            <input type="url" id="tg_view_channel_url" value="${esc(s.telegram_url || 'https://t.me/iqosaibot')}" placeholder="https://t.me/iqosaibot">
          </div>
        </div>

        <div id="tgDetectResultBox" style="display:none;margin-top:14px;"></div>
      </div>

      <!-- CARD 2: REAL-TIME TELEMETRY & ALERT TRIGGERS -->
      <div class="adm-card">
        <h3><span>⚡</span> Real-Time Alert Triggers &amp; Telemetry</h3>
        <p class="adm-card-sub">Select which website events automatically dispatch instant notifications to your Telegram Bot</p>

        <div class="adm-grid2">
          <div class="adm-field">
            <label>
              👁️ Live Website Visitor Traffic Alert
              <button type="button" class="adm-info-btn js-tg-info" data-topic="traffic_alert" title="About Visitor Tracking">ⓘ</button>
            </label>
            <select id="tg_view_traffic_enabled">
              <option value="1" ${s.telegram_traffic_alerts_enabled !== false ? 'selected' : ''}>✅ Enabled (Real-time Visitor IP &amp; Device Alert)</option>
              <option value="0" ${s.telegram_traffic_alerts_enabled === false ? 'selected' : ''}>❌ Disabled</option>
            </select>
            <span class="adm-hint">Sends an instant alert with visitor IP, Country/City, Device, Landing Page, and Referrer when a new user enters the website.</span>
          </div>

          <div class="adm-field">
            <label>
              💬 Live Chat &amp; Customer Phone Leads
              <button type="button" class="adm-info-btn js-tg-info" data-topic="leads_alert" title="About Live Chat Leads">ⓘ</button>
            </label>
            <select id="tg_view_leads_enabled">
              <option value="1" ${s.telegram_alerts_enabled !== false ? 'selected' : ''}>✅ Enabled (Instant Chat Alert)</option>
              <option value="0" ${s.telegram_alerts_enabled === false ? 'selected' : ''}>❌ Disabled</option>
            </select>
            <span class="adm-hint">Sends visitor phone number and chat inquiries directly to Telegram.</span>
          </div>

          <div class="adm-field">
            <label>
              🔄 2-Way Telegram Chat Reply
              <button type="button" class="adm-info-btn js-tg-info" data-topic="2way_chat" title="How 2-Way Chat Works">ⓘ</button>
            </label>
            <select id="tg_view_2way_enabled">
              <option value="1" ${s.telegram_2way_chat_enabled !== false ? 'selected' : ''}>✅ Enabled (Reply from Telegram to Website)</option>
              <option value="0" ${s.telegram_2way_chat_enabled === false ? 'selected' : ''}>❌ Disabled</option>
            </select>
            <span class="adm-hint">Allows you to reply directly from Telegram to the website visitor in real time!</span>
          </div>

          <div class="adm-field">
            <label>
              🛍️ Store Orders Alert
              <button type="button" class="adm-info-btn js-tg-info" data-topic="orders_alert" title="About Order Alerts">ⓘ</button>
            </label>
            <select id="tg_view_orders_enabled">
              <option value="1" ${s.telegram_order_alerts_enabled !== false ? 'selected' : ''}>✅ Enabled (Instant Order Alert)</option>
              <option value="0" ${s.telegram_order_alerts_enabled === false ? 'selected' : ''}>❌ Disabled</option>
            </select>
            <span class="adm-hint">Sends customer phone, items, address, and total amount when an order is placed online.</span>
          </div>
        </div>
      </div>

      <!-- CARD 3: 2-WAY WEBHOOK & LIVE DIAGNOSTICS -->
      <div class="adm-card">
        <h3><span>🧪</span> 2-Way Webhook &amp; Live Test</h3>
        <p class="adm-card-sub">Test communication and activate Telegram Webhook for real-time 2-way chat</p>

        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <button type="button" class="adm-btn adm-btn-secondary" id="btnRunTelegramTest">
            ⚡ Send Test Telegram Message
          </button>
          <div style="display:inline-flex;align-items:center;gap:4px;">
            <button type="button" class="adm-btn adm-btn-secondary" id="btnConnectWebhook" style="border-color:rgba(0,136,204,0.4);background:rgba(0,136,204,0.1);color:#29b6f6;">
              🔗 Connect / Update 2-Way Webhook
            </button>
            <button type="button" class="adm-info-btn js-tg-info" data-topic="webhook_guide" title="How Webhook Works">ⓘ</button>
          </div>
        </div>

        <div id="tgTestResultBox" style="display:none;margin-top:14px;padding:12px 16px;border-radius:8px;font-size:13px;line-height:1.5;"></div>
      </div>

      <div style="text-align:right;margin-top:20px;">
        <button type="button" class="adm-btn adm-btn-primary adm-btn-lg" id="btnTgSaveBottom">💾 Save Telegram Settings</button>
      </div>

      <!-- INTERACTIVE GUIDELINE MODAL -->
      <div id="tgInfoModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);z-index:99999;align-items:center;justify-content:center;padding:16px;">
        <div style="background:#0d1522;border:1px solid rgba(0,136,204,0.35);box-shadow:0 16px 50px rgba(0,0,0,0.7);border-radius:16px;max-width:520px;width:100%;overflow:hidden;">
          <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.02);">
            <h3 id="tgModalTitle" style="margin:0;font-size:15px;display:flex;align-items:center;gap:8px;color:#fff;">
              <span>ℹ️</span> Guideline
            </h3>
            <button type="button" id="tgModalClose" style="background:none;border:none;color:var(--adm-muted);font-size:20px;cursor:pointer;line-height:1;padding:4px 8px;">✕</button>
          </div>
          <div id="tgModalBody" style="padding:20px;font-size:13px;line-height:1.6;color:#cbd5e1;max-height:70vh;overflow-y:auto;">
          </div>
          <div id="tgModalFoot" style="padding:12px 20px;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.02);gap:10px;">
            <div id="tgModalAction"></div>
            <button type="button" class="adm-btn adm-btn-secondary" id="tgModalOk">Got it / ঠিক আছে</button>
          </div>
        </div>
      </div>
    `;

    dom.content.innerHTML = html;

    // Element references
    const inpToken = document.getElementById('tg_view_bot_token');
    const inpChatId = document.getElementById('tg_view_chat_id');
    const inpUsername = document.getElementById('tg_view_bot_username');
    const inpChanUrl = document.getElementById('tg_view_channel_url');
    const selTraffic = document.getElementById('tg_view_traffic_enabled');
    const selLeads = document.getElementById('tg_view_leads_enabled');
    const sel2Way = document.getElementById('tg_view_2way_enabled');
    const selOrders = document.getElementById('tg_view_orders_enabled');

    const btnToggleVis = document.getElementById('btnToggleTokenVis');
    const btnCopy = document.getElementById('btnCopyToken');
    const btnDetect = document.getElementById('btnAutoDetectChatId');
    const detectBox = document.getElementById('tgDetectResultBox');
    const resultBox = document.getElementById('tgTestResultBox');
    const btnTestRun = document.getElementById('btnRunTelegramTest');
    const btnTestHead = document.getElementById('btnTgTestHeader');
    const btnWebhook = document.getElementById('btnConnectWebhook');

    // Guideline Modal elements & dictionary
    const modalWrap = document.getElementById('tgInfoModal');
    const modalTitle = document.getElementById('tgModalTitle');
    const modalBody = document.getElementById('tgModalBody');
    const modalAction = document.getElementById('tgModalAction');
    const modalClose = document.getElementById('tgModalClose');
    const modalOk = document.getElementById('tgModalOk');

    const tgGuides = {
      bot_token: {
        title: '🤖 Telegram Bot API Token কি এবং কিভাবে পাবেন?',
        body: `
          <div style="font-size:13px;line-height:1.6;">
            <p style="margin-top:0;">বটের API Token হলো Telegram Bot-কে আপনার ওয়েবসাইটের সাথে কানেক্ট করার চাবি (Key)।</p>
            <div style="background:rgba(0,136,204,0.08);border:1px solid rgba(0,136,204,0.25);padding:12px;border-radius:8px;margin-bottom:12px;">
              <b style="color:#38bdf8;">টোকেন পাওয়ার সহজ ধাপ:</b>
              <ol style="margin:6px 0 0 16px;padding:0;">
                <li>টেলিগ্রাম অ্যাপে গিয়ে <b>@BotFather</b> সার্চ করুন (বা নিচের বাটনে ক্লিক করুন)।</li>
                <li>মেসেজ বক্সে <code>/newbot</code> লিখে পাঠান।</li>
                <li>আপনার বটের একটি নাম দিন (যেমন: <i>IQOS Dubai Alerts</i>)।</li>
                <li>এরপর একটি ইউনিক ইউজারনেম দিন যার শেষে <code>_bot</code> থাকবে (যেমন: <i>iqos_dubai_bot</i>)।</li>
                <li>BotFather আপনাকে সাথে সাথে একটি <b>HTTP API Token</b> দেবে।</li>
                <li>সেই টোকেনটি কপি করে এই ঘরে পেস্ট করে দিন!</li>
              </ol>
            </div>
            <div style="font-size:12px;color:var(--adm-muted);">
              💡 <b>উদাহরণ:</b> <code>8772277899:AAEbGGNrRLW57qqOuDi6VXT9YVPbYDwZqaM</code>
            </div>
          </div>
        `,
        action: `<a href="https://t.me/BotFather" target="_blank" rel="noopener" class="adm-btn adm-btn-sm" style="background:#0088cc;color:#fff;border-color:#0088cc;">👉 Open @BotFather ↗</a>`
      },
      chat_id: {
        title: '🆔 Telegram Chat ID কি এবং কিভাবে পাবেন?',
        body: `
          <div style="font-size:13px;line-height:1.6;">
            <p style="margin-top:0;">Chat ID হলো আপনার টেলিগ্রাম একাউন্টের একটি ইউনিক নাম্বার, যাতে বট সরাসরি আপনার ফোনে নোটিফিকেশন পাঠাতে পারে।</p>
            <div style="background:rgba(0,229,153,0.08);border:1px solid rgba(0,229,153,0.25);padding:12px;border-radius:8px;margin-bottom:12px;">
              <b style="color:var(--adm-emerald);">চ্যাট আইডি বের করার পদ্ধতি:</b>
              <ol style="margin:6px 0 0 16px;padding:0;">
                <li>প্রথমে আপনার তৈরি করা বটে যান এবং <b>START</b> বাটনে চাপুন (বা <code>/start</code> লিখে পাঠান)।</li>
                <li>এরপর পাশে থাকা <b>🔍 Auto-Detect</b> বাটনে ক্লিক করলে আপনার চ্যাট আইডি অটো বসে যাবে!</li>
                <li>অথবা টেলিগ্রামে <b>@userinfobot</b>-এ মেসেজ দিলে আপনার Numeric ID (যেমন: <code>6532343622</code>) দেখা যাবে।</li>
                <li>যদি কোনো গ্রুপে এলার্ট পেতে চান, তবে বটকে সেই গ্রুপে Admin বানিয়ে গ্রুপের চ্যাট আইডি (যেমন: <code>-100123456789</code>) দিন।</li>
              </ol>
            </div>
          </div>
        `,
        action: `<a href="https://t.me/userinfobot" target="_blank" rel="noopener" class="adm-btn adm-btn-sm" style="background:rgba(255,255,255,0.08);">👉 Open @userinfobot ↗</a>`
      },
      bot_username: {
        title: '🏷️ Bot Username কি?',
        body: `
          <div style="font-size:13px;line-height:1.6;">
            <p style="margin-top:0;">এটি আপনার বটের পাবলিক ইউজারনেম যা @BotFather দিয়ে তৈরি করার সময় নির্ধারণ করেছিলেন।</p>
            <ul style="margin:6px 0 0 16px;padding:0;">
              <li>ইউজারনেম সবসময় <code>@</code> দিয়ে শুরু হয় এবং শেষে <code>bot</code> থাকে।</li>
              <li>যেমন: <code>@iqosaibot</code> বা <code>@vapeclubbot</code></li>
              <li>এটি কাস্টমারকে বট ওপেন করতে এবং ওয়েব হুকের সাথে ভেরিফিকেশনে ব্যবহৃত হয়।</li>
            </ul>
          </div>
        `,
        action: `<a href="https://t.me/iqosaibot" target="_blank" rel="noopener" class="adm-btn adm-btn-sm" style="background:#0088cc;color:#fff;">👉 Open @iqosaibot ↗</a>`
      },
      channel_url: {
        title: '🔗 Public Link / Channel URL কি?',
        body: `
          <div style="font-size:13px;line-height:1.6;">
            <p style="margin-top:0;">ওয়েবসাইটের ফুটার (Footer) এবং সোশ্যাল মিডিয়া আইকনে ভিজিটরদের দেখানোর জন্য আপনার অফিসিয়াল টেলিগ্রাম লিংক।</p>
            <p>ভিজিটররা যখন ওয়েবসাইটে টেলিগ্রাম আইকনে ক্লিক করবে, সরাসরি এই লিংকে গিয়ে আপনার সাথে চ্যাট বা চ্যানেল দেখতে পারবে।</p>
            <div style="font-size:12px;color:var(--adm-muted);">💡 <b>উদাহরণ:</b> <code>https://t.me/iqosaibot</code></div>
          </div>
        `,
        action: ``
      },
      traffic_alert: {
        title: '👁️ Live Website Visitor Traffic Alert কি?',
        body: `
          <div style="font-size:13px;line-height:1.6;">
            <p style="margin-top:0;">যখনই কোনো নতুন ভিজিটর ওয়েবসাইটে প্রবেশ করবে, সাথে সাথে তার বিস্তারিত তথ্য আপনার টেলিগ্রাম বটে চলে আসবে:</p>
            <ul style="margin:6px 0 0 16px;padding:0;">
              <li><b>🌐 IP Address</b> — ভিজিটরের আইপি ঠিকানা</li>
              <li><b>📍 Location</b> — দেশ ও শহর (যেমন: 🇦🇪 Dubai, United Arab Emirates)</li>
              <li><b>📱 Device &amp; OS</b> — মোবাইল/পিসি ও ব্রাউজার (iPhone Safari, Android Chrome ইত্যাদি)</li>
              <li><b>🔗 Landing Page</b> — কোন প্রোডাক্ট বা পেজে ঢুকেছে</li>
              <li><b>🧭 Source</b> — ভিজিটর কোথা থেকে এসেছে (গুগল সার্চ, ফেসবুক নাকি সরাসরি)</li>
            </ul>
            <div style="margin-top:10px;padding:10px;background:rgba(255,255,255,0.03);border-radius:6px;font-size:12px;color:var(--adm-muted);">
              🛡️ <b>অ্যান্টি-স্প্যাম ফিল্টার:</b> একই ব্যক্তি পেজ রিলোড দিলে বারবার এলার্ট আসবে না। স্মার্ট ১৫ মিনিটের সেশন ক্যাশ থাকবে।
            </div>
          </div>
        `,
        action: ``
      },
      leads_alert: {
        title: '💬 Live Chat & WhatsApp Leads Alert কি?',
        body: `
          <div style="font-size:13px;line-height:1.6;">
            <p style="margin-top:0;">ওয়েবসাইটে থাকা লাইভ চ্যাট উইন্ডোতে গ্রাহকের প্রতিটি মুভমেন্ট ও মেসেজ বটে পৌঁছানোর ফিচার:</p>
            <ul style="margin:6px 0 0 16px;padding:0;">
              <li>গ্রাহক তার WhatsApp/মোবাইল নাম্বার ইনপুট করলেই সেই নাম্বার সরাসরি বটে সেন্ড হবে।</li>
              <li>গ্রাহক কোনো প্রশ্ন বা মেসেজ টাইপ করলে মেসেজের সাথে সাথে তার কার্টের আইটেম ও প্রোডাক্ট নাম সহ নোটিফিকেশন আসবে।</li>
            </ul>
          </div>
        `,
        action: ``
      },
      '2way_chat': {
        title: '🔄 2-Way Telegram Chat Reply (বট থেকে উত্তর দেওয়া)',
        body: `
          <div style="font-size:13px;line-height:1.6;">
            <p style="margin-top:0;">এই ফিচারের মাধ্যমে আপনি টেলিগ্রাম থেকেই সরাসরি ওয়েবসাইটের গ্রাহককে উত্তর দিতে পারবেন!</p>
            <div style="background:rgba(0,229,153,0.08);border:1px solid rgba(0,229,153,0.25);padding:12px;border-radius:8px;margin-bottom:10px;">
              <b style="color:var(--adm-emerald);">কিভাবে কাজ করে:</b>
              <ol style="margin:6px 0 0 16px;padding:0;">
                <li>ওয়েবসাইটে কাস্টমার মেসেজ দিলে আপনার টেলিগ্রাম বটে মেসেজ আসবে (যেমন: <code>#CHAT-7429</code>)।</li>
                <li>টেলিগ্রামে সেই মেসেজটি <b>Swipe / Reply</b> করে লিখে সেন্ড করে দিন!</li>
                <li>অথবা <code>/reply 7429 আপনার উত্তর</code> লিখে সেন্ড করুন।</li>
                <li>আপনার পাঠানো উত্তর সাথে সাথে ওয়েবসাইটের কাস্টমারের চ্যাট স্ক্রিনে লাইভ Support Agent বাবল হিসেবে ভেসে উঠবে!</li>
              </ol>
            </div>
          </div>
        `,
        action: ``
      },
      orders_alert: {
        title: '🛍️ Store Orders Alert কি?',
        body: `
          <div style="font-size:13px;line-height:1.6;">
            <p style="margin-top:0;">ওয়েবসাইট থেকে যেকোনো কাস্টমার অর্ডার কনফার্ম করলেই সাথে সাথে পুরো অর্ডারের সামারি আপনার টেলিগ্রাম বটে রিয়েল-টাইমে চলে আসবে:</p>
            <ul style="margin:6px 0 0 16px;padding:0;">
              <li>অর্ডার নম্বর ও গ্রাহকের নাম</li>
              <li>মোবাইল নাম্বার (ক্লিক করে সরাসরি কল দেওয়ার সুবিধা)</li>
              <li>সম্পূর্ণ ডেলিভারি ঠিকানা ও এমিরেটস (দুবাই/শারজাহ ইত্যাদি)</li>
              <li>কার্টের প্রোডাক্ট তালিকা, কোয়ান্টিটি এবং মোট বিল</li>
              <li>পেমেন্ট মেথড (Cash on Delivery / Card on Delivery)</li>
            </ul>
          </div>
        `,
        action: ``
      },
      webhook_guide: {
        title: '🔗 2-Way Live Chat Webhook কি?',
        body: `
          <div style="font-size:13px;line-height:1.6;">
            <p style="margin-top:0;">টেলিগ্রাম বট যাতে আপনার পাঠানো রিপ্লাই স্বয়ংক্রিয়ভাবে আমাদের ওয়েবসাইটের সার্ভারে পাঠাতে পারে, সেজন্য Webhook কানেক্ট করতে হয়।</p>
            <ul style="margin:6px 0 0 16px;padding:0;">
              <li><b>Webhook URL:</b> <code>https://iqosae.com/api/tg-webhook.php</code></li>
              <li>"Connect / Update 2-Way Webhook" বাটনে ক্লিক করলে টেলিগ্রাম API-এর সাথে এটি সম্পূর্ণ স্বয়ংক্রিয়ভাবে কানেক্ট হয়ে যায়।</li>
              <li>এর ফলে আলাদা কোনো সার্ভার অ্যাপ্লিকেশন ছাড়া ব্যাকগ্রাউন্ডেই টেলিগ্রামের সাথে ওয়েবসাইটের সরাসরি ২-ওয়ে যোগাযোগ চালু থাকে।</li>
            </ul>
          </div>
        `,
        action: ``
      }
    };

    // Open guideline modal handler
    const openGuideModal = (topicKey) => {
      const g = tgGuides[topicKey];
      if (!g || !modalWrap) return;
      if (modalTitle) modalTitle.innerHTML = `<span>ℹ️</span> ${g.title}`;
      if (modalBody) modalBody.innerHTML = g.body;
      if (modalAction) modalAction.innerHTML = g.action || '';
      modalWrap.style.display = 'flex';
    };

    const closeGuideModal = () => {
      if (modalWrap) modalWrap.style.display = 'none';
    };

    // Bind all info buttons
    dom.content.querySelectorAll('.js-tg-info').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const topic = btn.dataset.topic;
        openGuideModal(topic);
      });
    });

    if (modalClose) modalClose.addEventListener('click', closeGuideModal);
    if (modalOk) modalOk.addEventListener('click', closeGuideModal);
    if (modalWrap) {
      modalWrap.addEventListener('click', (e) => {
        if (e.target === modalWrap) closeGuideModal();
      });
    }

    // Toggle password visibility
    if (btnToggleVis && inpToken) {
      btnToggleVis.addEventListener('click', () => {
        if (inpToken.type === 'password') {
          inpToken.type = 'text';
          btnToggleVis.textContent = '🔒 Hide';
        } else {
          inpToken.type = 'password';
          btnToggleVis.textContent = '👁️ Show';
        }
      });
    }

    // Copy Token
    if (btnCopy && inpToken) {
      btnCopy.addEventListener('click', () => {
        if (!inpToken.value) { toast('No token to copy', true); return; }
        navigator.clipboard.writeText(inpToken.value).then(() => {
          toast('📋 Telegram Bot Token copied');
        }).catch(() => { toast('Failed to copy', true); });
      });
    }

    // Input bindings
    if (inpToken) inpToken.addEventListener('input', (e) => { s.telegram_bot_token = e.target.value.trim(); markDirty('settings'); });
    if (inpChatId) inpChatId.addEventListener('input', (e) => { s.telegram_chat_id = e.target.value.trim(); markDirty('settings'); });
    if (inpUsername) inpUsername.addEventListener('input', (e) => { s.telegram_bot_username = e.target.value.trim(); markDirty('settings'); });
    if (inpChanUrl) inpChanUrl.addEventListener('input', (e) => { s.telegram_url = e.target.value.trim(); markDirty('settings'); });
    if (selTraffic) selTraffic.addEventListener('change', (e) => { s.telegram_traffic_alerts_enabled = e.target.value === '1'; markDirty('settings'); });
    if (selLeads) selLeads.addEventListener('change', (e) => { s.telegram_alerts_enabled = e.target.value === '1'; markDirty('settings'); });
    if (sel2Way) sel2Way.addEventListener('change', (e) => { s.telegram_2way_chat_enabled = e.target.value === '1'; markDirty('settings'); });
    if (selOrders) selOrders.addEventListener('change', (e) => { s.telegram_order_alerts_enabled = e.target.value === '1'; markDirty('settings'); });

    // Auto-detect Chat ID
    if (btnDetect) {
      btnDetect.addEventListener('click', async () => {
        const tokenVal = inpToken ? inpToken.value.trim() : (s.telegram_bot_token || '');
        if (!tokenVal) {
          toast('⚠️ Please enter your Bot API Token first.', true);
          if (inpToken) inpToken.focus();
          return;
        }

        btnDetect.disabled = true;
        btnDetect.innerHTML = '⏳ Scanning…';
        if (detectBox) {
          detectBox.style.display = 'block';
          detectBox.innerHTML = '<div style="background:rgba(255,255,255,0.03);padding:10px 14px;border-radius:8px;font-size:12.5px;">⏳ Scanning Telegram updates (/getUpdates)…</div>';
        }

        try {
          const res = await fetch('/admin/api.php?action=detect_telegram_chat_id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF': window.ADM_CSRF || '' },
            body: JSON.stringify({ bot_token: tokenVal })
          });
          const data = await res.json();

          if (data && data.ok) {
            if (data.chats && data.chats.length > 0) {
              toast(`✅ Discovered ${data.chats.length} Telegram chat(s)!`);
              let chatsHtml = data.chats.map(c => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(0,229,153,0.04);border:1px solid rgba(0,229,153,0.2);border-radius:6px;margin-bottom:6px;gap:8px;">
                  <div>
                    <b>${esc(c.name)}</b> <span style="color:var(--adm-emerald);font-size:11px;">${esc(c.username || '')}</span>
                    <div style="font-size:11px;color:var(--adm-muted);">ID: <code style="color:var(--adm-emerald);">${esc(c.chat_id)}</code> · ${esc(c.time)}</div>
                  </div>
                  <button type="button" class="adm-btn adm-btn-sm adm-btn-primary js-use-chat-id" data-cid="${esc(c.chat_id)}">Use This</button>
                </div>
              `).join('');

              if (detectBox) {
                detectBox.innerHTML = `<div style="background:rgba(0,229,153,0.06);border:1px solid rgba(0,229,153,0.25);padding:12px;border-radius:8px;">${chatsHtml}</div>`;
                detectBox.querySelectorAll('.js-use-chat-id').forEach(btn => {
                  btn.addEventListener('click', () => {
                    const cid = btn.dataset.cid;
                    if (inpChatId) inpChatId.value = cid;
                    s.telegram_chat_id = cid;
                    markDirty('settings');
                    toast(`Chat ID set to ${cid}`);
                  });
                });
              }
            } else {
              toast('No messages found. Please send /start to your bot in Telegram first.', true);
              if (detectBox) {
                detectBox.innerHTML = '<div style="background:rgba(255,170,0,0.1);border:1px solid rgba(255,170,0,0.3);padding:10px 14px;border-radius:8px;font-size:12px;color:#ffaa00;">⚠️ Bot has not received any messages yet. Open Telegram, send <b>/start</b> to your bot, then click Auto-Detect again.</div>';
              }
            }
          } else {
            toast('Auto-detection failed: ' + (data.message || 'Error'), true);
          }
        } catch (err) {
          toast('Network error: ' + err.message, true);
        } finally {
          btnDetect.disabled = false;
          btnDetect.innerHTML = '🔍 Auto-Detect';
        }
      });
    }

    // Connect Webhook handler
    if (btnWebhook) {
      btnWebhook.addEventListener('click', async () => {
        const tokenVal = inpToken ? inpToken.value.trim() : (s.telegram_bot_token || '');
        if (!tokenVal) {
          toast('⚠️ Please enter your Bot API Token first.', true);
          return;
        }

        btnWebhook.disabled = true;
        btnWebhook.innerHTML = '⏳ Connecting Webhook…';

        try {
          const res = await fetch('/admin/api.php?action=set_telegram_webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF': window.ADM_CSRF || '' },
            body: JSON.stringify({
              bot_token: tokenVal,
              webhook_url: 'https://iqosae.com/api/tg-webhook.php'
            })
          });
          const data = await res.json();

          if (data && data.ok) {
            toast('✅ Telegram Webhook connected! 2-Way live chat is active.');
            if (resultBox) {
              resultBox.style.display = 'block';
              resultBox.style.background = 'rgba(0,229,153,0.08)';
              resultBox.style.border = '1px solid rgba(0,229,153,0.3)';
              resultBox.style.color = '#fff';
              resultBox.innerHTML = `
                <b style="color:var(--adm-emerald);">✅ Webhook Connected Successfully!</b><br>
                <span style="color:var(--adm-muted);font-size:12px;">URL: <code>${esc(data.webhook_url)}</code></span><br>
                <span style="font-size:12px;">You can now swipe &amp; reply to visitor messages directly in Telegram to answer website customers in real time!</span>
              `;
            }
          } else {
            toast('Webhook setup failed: ' + (data.message || 'Error'), true);
          }
        } catch (err) {
          toast('Network error: ' + err.message, true);
        } finally {
          btnWebhook.disabled = false;
          btnWebhook.innerHTML = '🔗 Connect / Update 2-Way Webhook';
        }
      });
    }

    // Test Message handler
    const runTestHandler = async (btnTrigger) => {
      const tokenVal = inpToken ? inpToken.value.trim() : (s.telegram_bot_token || '');
      const chatIdVal = inpChatId ? inpChatId.value.trim() : (s.telegram_chat_id || '');

      if (!tokenVal || !chatIdVal) {
        toast('⚠️ Please enter both Bot Token and Chat ID first.', true);
        return;
      }

      if (btnTrigger) {
        btnTrigger.disabled = true;
        btnTrigger.innerHTML = '⏳ Dispatching…';
      }

      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.style.background = 'rgba(255,255,255,0.04)';
        resultBox.style.border = '1px solid rgba(255,255,255,0.1)';
        resultBox.style.color = '#fff';
        resultBox.innerHTML = '⏳ Contacting Telegram API…';
      }

      try {
        const res = await fetch('/admin/api.php?action=test_telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF': window.ADM_CSRF || '' },
          body: JSON.stringify({ bot_token: tokenVal, chat_id: chatIdVal })
        });
        const data = await res.json();

        if (data && data.ok) {
          toast('✅ Telegram test message delivered successfully!');
          if (resultBox) {
            resultBox.style.background = 'rgba(0,229,153,0.08)';
            resultBox.style.border = '1px solid rgba(0,229,153,0.3)';
            resultBox.innerHTML = `
              <b style="color:var(--adm-emerald);">✅ Test Alert Delivered Successfully!</b><br>
              <span style="font-size:12px;color:var(--adm-muted);">Delivered to Chat ID: <b>${esc(data.chat_id || chatIdVal)}</b> at ${esc(data.timestamp || 'now')}.</span>
            `;
          }
        } else {
          toast('❌ Test failed: ' + (data.message || 'Error'), true);
          if (resultBox) {
            resultBox.style.background = 'rgba(255,77,106,0.08)';
            resultBox.style.border = '1px solid rgba(255,77,106,0.3)';
            resultBox.innerHTML = `<b style="color:#ff4d6a;">❌ Test Failed:</b> ${esc(data.message || 'Error')}<br><span style="font-size:12px;color:var(--adm-muted);">${esc(data.advice || '')}</span>`;
          }
        }
      } catch (err) {
        toast('Network error: ' + err.message, true);
      } finally {
        if (btnTrigger) {
          btnTrigger.disabled = false;
          btnTrigger.innerHTML = '⚡ Send Test Telegram Message';
        }
      }
    };

    if (btnTestRun) btnTestRun.addEventListener('click', () => runTestHandler(btnTestRun));
    if (btnTestHead) btnTestHead.addEventListener('click', () => runTestHandler(btnTestHead));

    // Save Handlers
    const saveTelegramHandler = async () => {
      if (inpToken) s.telegram_bot_token = inpToken.value.trim();
      if (inpChatId) s.telegram_chat_id = inpChatId.value.trim();
      if (inpUsername) s.telegram_bot_username = inpUsername.value.trim();
      if (inpChanUrl) s.telegram_url = inpChanUrl.value.trim();
      if (selTraffic) s.telegram_traffic_alerts_enabled = selTraffic.value === '1';
      if (selLeads) s.telegram_alerts_enabled = selLeads.value === '1';
      if (sel2Way) s.telegram_2way_chat_enabled = sel2Way.value === '1';
      if (selOrders) s.telegram_order_alerts_enabled = selOrders.value === '1';

      markDirty('settings');
      await saveAll();
      renderTelegram();
    };

    const btnSaveTop = document.getElementById('btnTgSaveTop');
    const btnSaveBtm = document.getElementById('btnTgSaveBottom');
    if (btnSaveTop) btnSaveTop.addEventListener('click', saveTelegramHandler);
    if (btnSaveBtm) btnSaveBtm.addEventListener('click', saveTelegramHandler);
  }

    function renderCategories() {
    dom.viewTitle.textContent = 'Categories Studio';
    if (!state.data.categories) state.data.categories = {};
    if (!state.data.categories.cats) state.data.categories.cats = {};
    if (!state.data.categories.labels) state.data.categories.labels = {};

    const cats = state.data.categories.cats;
    const labels = state.data.categories.labels;
    const prods = (state.data.products && state.data.products.products) || state.data.products || [];

    const themes = [
      ['art-emerald', 'Dubai Emerald (Green)'],
      ['art-purple', 'Electric Purple'],
      ['art-navy', 'Deep Navy (Blue)'],
      ['art-gold', 'Champagne Gold'],
      ['art-rose', 'Crimson Rose (Red)'],
      ['art-amber', 'Warm Amber (Orange)'],
      ['art-cyan', 'Ice Cyan'],
      ['art-slate', 'Sleek Slate']
    ];

    const arts = [
      ['pack', 'TEREA Pack (art-pack)'],
      ['device', 'IQOS Device (art-device)'],
      ['pod', 'Pod System (art-pod)'],
      ['vape', 'Disposable Vape (art-vape)'],
      ['juice', 'Saltnic Juice (art-juice)'],
      ['box', 'Accessory Box (art-box)']
    ];

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
        <div>
          <h3 style="margin:0;font-size:18px;">🗂️ Store Categories &amp; Navigation (${Object.keys(cats).length})</h3>
          <p style="color:var(--adm-muted);font-size:13px;margin:4px 0 0;">Create, edit, or remove catalog categories, hero cards, and navigation labels.</p>
        </div>
        <div style="display:flex;gap:10px;">
          <button type="button" class="adm-btn" id="btnOpenAddCatModal">➕ Add New Category</button>
          <button type="button" class="adm-btn adm-btn-primary" id="btnSaveCatsTop">💾 Save All Categories</button>
        </div>
      </div>

      <div class="adm-grid2" style="gap:20px;">
        ${Object.keys(cats).map(slug => {
          const c = cats[slug] || {};
          const prodCount = prods.filter(p => p.cat === slug).length;
          const displayLabel = labels[slug] || c.title || slug;
          return `
            <div class="adm-card" style="background:var(--adm-panel2);padding:18px;position:relative;" data-cat-slug="${esc(slug)}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;gap:10px;">
                <div>
                  <b style="font-size:16px;">${esc(displayLabel)}</b>
                  <div style="margin-top:4px;">
                    <span class="adm-pill cat" style="font-family:monospace;">${esc(slug)}</span>
                    <span style="font-size:12px;color:var(--adm-muted);margin-left:6px;">📦 ${prodCount} products</span>
                  </div>
                </div>
                <button type="button" class="adm-btn adm-btn-sm adm-btn-danger btn-del-cat" data-slug="${esc(slug)}">✕ Delete</button>
              </div>

              <div class="adm-grid2">
                <div class="adm-field">
                  <label>Title</label>
                  <input type="text" class="cat-in-title" data-slug="${esc(slug)}" value="${esc(c.title || '')}">
                </div>
                <div class="adm-field">
                  <label>Subtitle</label>
                  <input type="text" class="cat-in-sub" data-slug="${esc(slug)}" value="${esc(c.sub || '')}">
                </div>
              </div>

              <div class="adm-field">
                <label>Navigation Display Label</label>
                <input type="text" class="cat-in-label" data-slug="${esc(slug)}" value="${esc(displayLabel)}">
              </div>

              <div class="adm-field">
                <label>Description Paragraph</label>
                <textarea class="cat-in-desc" data-slug="${esc(slug)}" rows="2">${esc(c.desc || '')}</textarea>
              </div>

              <div class="adm-grid2">
                <div class="adm-field">
                  <label>Card Theme Accent</label>
                  <select class="cat-in-theme" data-slug="${esc(slug)}">
                    ${themes.map(([thKey, thLabel]) => `<option value="${esc(thKey)}" ${c.theme === thKey ? 'selected' : ''}>${esc(thLabel)}</option>`).join('')}
                  </select>
                </div>
                <div class="adm-field">
                  <label>Fallback Vector Art Icon</label>
                  <select class="cat-in-art" data-slug="${esc(slug)}">
                    ${arts.map(([artKey, artLabel]) => `<option value="${esc(artKey)}" ${c.art === artKey ? 'selected' : ''}>${esc(artLabel)}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="adm-field">
                <label>Category Hero Photo</label>
                <div class="cat-img-box" data-slug="${esc(slug)}"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="text-align:right;margin-top:24px;">
        <button type="button" class="adm-btn adm-btn-primary adm-btn-lg" id="btnSaveCatsBottom">💾 Save All Categories</button>
      </div>

      <!-- Add Category Modal -->
      <div class="adm-modal-overlay" id="admAddCatModal">
        <div class="adm-modal-box">
          <div class="adm-modal-head">
            <h3>➕ Add New Store Category</h3>
            <button type="button" class="adm-modal-close" id="btnAddCatClose">✕</button>
          </div>
          <div class="adm-modal-body">
            <div class="adm-grid2">
              <div class="adm-field">
                <label>Category Slug (Lowercase URL identifier)</label>
                <input type="text" id="new_cat_slug" placeholder="e.g. vape-kits">
              </div>
              <div class="adm-field">
                <label>Navigation Display Label</label>
                <input type="text" id="new_cat_label" placeholder="e.g. Vape Kits">
              </div>
            </div>
            <div class="adm-grid2">
              <div class="adm-field">
                <label>Category Title</label>
                <input type="text" id="new_cat_title" placeholder="e.g. Vape Starter Kits">
              </div>
              <div class="adm-field">
                <label>Category Subtitle</label>
                <input type="text" id="new_cat_sub" placeholder="e.g. Best starter kits in Dubai">
              </div>
            </div>
            <div class="adm-field">
              <label>Description</label>
              <textarea id="new_cat_desc" rows="2" placeholder="Brief description for category page and SEO..."></textarea>
            </div>
            <div class="adm-grid2">
              <div class="adm-field">
                <label>Theme Color</label>
                <select id="new_cat_theme">
                  ${themes.map(([thKey, thLabel]) => `<option value="${esc(thKey)}">${esc(thLabel)}</option>`).join('')}
                </select>
              </div>
              <div class="adm-field">
                <label>Vector Icon</label>
                <select id="new_cat_art">
                  ${arts.map(([artKey, artLabel]) => `<option value="${esc(artKey)}">${esc(artLabel)}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="adm-field">
              <label>Category Photo</label>
              <div id="new_cat_img_picker"></div>
            </div>
          </div>
          <div class="adm-modal-foot">
            <button type="button" class="adm-btn" id="btnAddCatCancel">Cancel</button>
            <button type="button" class="adm-btn adm-btn-primary" id="btnAddCatSubmit">Create Category</button>
          </div>
        </div>
      </div>
    `;

    dom.content.innerHTML = html;

    // Attach Image Pickers for existing categories
    dom.content.querySelectorAll('.cat-img-box').forEach(box => {
      const slug = box.dataset.slug;
      const c = cats[slug] || {};
      box.appendChild(
        renderImgPicker(`cat_photo_${slug}`, c.photo || '', (path) => {
          c.photo = path;
          markDirty('categories');
        }, 'categories')
      );
    });

    // In-place field bindings
    dom.content.querySelectorAll('.cat-in-title').forEach(input => {
      input.addEventListener('input', (e) => {
        const slug = e.target.dataset.slug;
        if (cats[slug]) cats[slug].title = e.target.value;
        markDirty('categories');
      });
    });
    dom.content.querySelectorAll('.cat-in-sub').forEach(input => {
      input.addEventListener('input', (e) => {
        const slug = e.target.dataset.slug;
        if (cats[slug]) cats[slug].sub = e.target.value;
        markDirty('categories');
      });
    });
    dom.content.querySelectorAll('.cat-in-desc').forEach(input => {
      input.addEventListener('input', (e) => {
        const slug = e.target.dataset.slug;
        if (cats[slug]) cats[slug].desc = e.target.value;
        markDirty('categories');
      });
    });
    dom.content.querySelectorAll('.cat-in-label').forEach(input => {
      input.addEventListener('input', (e) => {
        const slug = e.target.dataset.slug;
        labels[slug] = e.target.value;
        markDirty('categories');
      });
    });
    dom.content.querySelectorAll('.cat-in-theme').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const slug = e.target.dataset.slug;
        if (cats[slug]) cats[slug].theme = e.target.value;
        markDirty('categories');
      });
    });
    dom.content.querySelectorAll('.cat-in-art').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const slug = e.target.dataset.slug;
        if (cats[slug]) cats[slug].art = e.target.value;
        markDirty('categories');
      });
    });

    // Delete category
    dom.content.querySelectorAll('.btn-del-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        const slug = btn.dataset.slug;
        if (slug === 'all') {
          toast('Cannot delete the root "all" category.', true);
          return;
        }
        if (confirm(`Are you sure you want to delete category "${labels[slug] || slug}"?`)) {
          delete cats[slug];
          delete labels[slug];
          markDirty('categories');
          saveAll();
          renderCategories();
        }
      });
    });

    // Save buttons
    const saveCatsHandler = () => {
      saveAll();
    };
    const btnTop = document.getElementById('btnSaveCatsTop');
    const btnBtm = document.getElementById('btnSaveCatsBottom');
    if (btnTop) btnTop.addEventListener('click', saveCatsHandler);
    if (btnBtm) btnBtm.addEventListener('click', saveCatsHandler);

    // Add Category Modal Logic
    const addModal = document.getElementById('admAddCatModal');
    let newCatPhoto = '';
    const newCatPicker = document.getElementById('new_cat_img_picker');
    if (newCatPicker) {
      newCatPicker.appendChild(
        renderImgPicker('new_cat_photo_input', '', (path) => {
          newCatPhoto = path;
        }, 'categories')
      );
    }

    const openAddCat = () => {
      addModal.classList.add('is-open');
    };
    const closeAddCat = () => {
      addModal.classList.remove('is-open');
    };

    document.getElementById('btnOpenAddCatModal').addEventListener('click', openAddCat);
    document.getElementById('btnAddCatClose').addEventListener('click', closeAddCat);
    document.getElementById('btnAddCatCancel').addEventListener('click', closeAddCat);

    document.getElementById('btnAddCatSubmit').addEventListener('click', () => {
      const slugInput = document.getElementById('new_cat_slug');
      const labelInput = document.getElementById('new_cat_label');
      const titleInput = document.getElementById('new_cat_title');
      const subInput = document.getElementById('new_cat_sub');
      const descInput = document.getElementById('new_cat_desc');
      const themeSelect = document.getElementById('new_cat_theme');
      const artSelect = document.getElementById('new_cat_art');

      let slug = (slugInput.value.trim() || labelInput.value.trim()).toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/^-|-$/g, '');
      if (!slug) {
        toast('Please enter a valid category slug.', true);
        return;
      }
      if (cats[slug]) {
        toast('A category with this slug already exists.', true);
        return;
      }

      cats[slug] = {
        title: titleInput.value.trim() || labelInput.value.trim(),
        sub: subInput.value.trim() || 'Dubai',
        desc: descInput.value.trim(),
        photo: newCatPhoto,
        theme: themeSelect.value,
        art: artSelect.value
      };
      labels[slug] = labelInput.value.trim() || titleInput.value.trim() || slug;

      markDirty('categories');
      closeAddCat();
      saveAll();
      toast(`Category "${labels[slug]}" created successfully!`);
      renderCategories();
    });
  }

  function renderAccount() {
    dom.viewTitle.textContent = 'Account & Backup';
    let html = `
      <div class="adm-card" style="border-left: 4px solid var(--adm-emerald);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:6px;">
          <div>
            <h3 style="margin:0;display:flex;align-items:center;gap:8px;">
              <span>💾</span> Full Store Data Backup (ডাটা ব্যাকআপ)
            </h3>
            <p class="adm-card-sub" style="margin:6px 0 0;">
              ক্যাটালগের সমস্ত প্রোডাক্ট, ক্যাটাগরি, হোমপেজ কাস্টমাইজার সেটিংস, এসইও মেটা ও অর্ডার ডাটা একটি JSON ফাইলে সেভ করুন।
            </p>
          </div>
          <button class="adm-btn adm-btn-primary" onclick="window.location.href='/admin/api.php?action=backup'">
            📥 Download JSON Backup
          </button>
        </div>
      </div>

      <div class="adm-card" style="border-left: 4px solid var(--adm-blue);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;margin-bottom:14px;">
          <div>
            <h3 style="margin:0;display:flex;align-items:center;gap:8px;">
              <span>🧹</span> Website Cache &amp; Browser Asset Reset (ক্যাশ রিসেট)
            </h3>
            <p class="adm-card-sub" style="margin:6px 0 0;line-height:1.6;">
              ওয়েবসাইট ফাস্ট লোডিং এর জন্য ব্রাউজার বা মোবাইলে পুরোনো ফাইল ক্যাশ হয়ে থাকলে এই বাটনে ক্লিক করুন। এটি ইনস্ট্যান্ট ক্যাশ-বাস্টিং ভার্সন আপডেট করবে এবং সার্ভার ও ব্রাউজারের পুরোনো ক্যাশ পরিষ্কার করবে।
            </p>
          </div>
          <button class="adm-btn adm-btn-gold" id="btnFlushCache" style="display:inline-flex;align-items:center;gap:8px;font-size:14px;">
            <span id="flushIcon">🧹</span> Flush Cache &amp; Reset Browser Assets
          </button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;background:rgba(255,255,255,0.03);border:1px solid var(--adm-line);padding:14px;border-radius:10px;">
          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--adm-muted);letter-spacing:0.06em;">Active Asset Version</div>
            <div style="font-size:16px;font-weight:800;color:#38bdf8;margin-top:2px;" id="cacheVerText">Loading...</div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--adm-muted);letter-spacing:0.06em;">Last Purged Time</div>
            <div style="font-size:14px;font-weight:600;color:var(--adm-text);margin-top:2px;" id="cacheTimeText">Loading...</div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--adm-muted);letter-spacing:0.06em;">Status &amp; Scope</div>
            <div style="font-size:13px;font-weight:600;color:var(--adm-emerald);margin-top:2px;">⚡ Zero Downtime · Auto-Sync</div>
          </div>
        </div>

        <div style="margin-top:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:12.5px;color:var(--adm-muted);">
          <span>💡 যেকোনো ডিজাইন বা টেক্সট আপডেটের পর মোবাইলে সরাসরি দেখতে একবার ক্যাশ ফ্ল্যাশ করুন।</span>
          <a href="/TELEGRAM_BOT_GUIDE.md" target="_blank" rel="noopener" class="adm-btn adm-btn-sm" style="background:rgba(0,136,204,0.15);color:#38bdf8;border-color:rgba(0,136,204,0.3);">
            📖 View Telegram &amp; System Guide (.md) ↗
          </a>
        </div>
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

    // Load cache info asynchronously
    api('get_cache_info').then(res => {
      if (res && res.ok) {
        const verEl = document.getElementById('cacheVerText');
        const timeEl = document.getElementById('cacheTimeText');
        if (verEl) verEl.textContent = 'v' + res.version;
        if (timeEl) timeEl.textContent = res.last_cleared;
      }
    }).catch(() => {});

    // Bind Flush Cache button
    const btnFlush = document.getElementById('btnFlushCache');
    if (btnFlush) {
      btnFlush.addEventListener('click', async () => {
        const icon = document.getElementById('flushIcon');
        btnFlush.disabled = true;
        if (icon) icon.textContent = '⏳';
        try {
          const res = await api('clear_cache');
          if (res && res.ok) {
            toast('✅ ' + (res.message || 'Cache flushed successfully!'));
            const verEl = document.getElementById('cacheVerText');
            const timeEl = document.getElementById('cacheTimeText');
            if (verEl) verEl.textContent = 'v' + res.version;
            if (timeEl) timeEl.textContent = res.cleared_at;
          } else {
            toast('Failed to flush cache: ' + (res.error || 'Server error'), true);
          }
        } catch (ex) {
          toast('Error clearing cache.', true);
        } finally {
          btnFlush.disabled = false;
          if (icon) icon.textContent = '🧹';
        }
      });
    }

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
     STAFF & ROLE-BASED ACCESS CONTROL (RBAC)
     ============================================================ */
  function renderTeam() {
    dom.viewTitle.textContent = 'Staff & Role Management';
    const team = (state.data && state.data.team) || [];

    let html = `
      <div class="adm-card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
          <h3 style="margin:0;"><span>👥</span> Staff &amp; Team Accounts</h3>
          <p class="adm-card-sub" style="margin:4px 0 0;">Create and manage Author, Editor, and Admin users with Phone Number and Password access.</p>
        </div>
        <button class="adm-btn adm-btn-primary" id="btnAddNewStaff">
          ➕ Add New Staff / Admin
        </button>
      </div>

      <!-- ROLE EXPLAINER CARDS -->
      <div class="adm-team-overview">
        <div class="adm-role-card">
          <h4><span>👑 Super Admin</span> <span class="adm-user-role-tag adm-role-admin">Full Access</span></h4>
          <p>Full control over entire store operations, credentials, and settings.</p>
          <ul>
            <li>Products, Categories &amp; Pricing</li>
            <li>Visual Homepage Customizer &amp; Banners</li>
            <li>SEO Engine &amp; Meta Schemas</li>
            <li>Customer Orders &amp; WhatsApp Leads</li>
            <li>Staff &amp; Role Management (Add/Edit)</li>
            <li>Full System Backup &amp; Reset</li>
          </ul>
        </div>
        <div class="adm-role-card">
          <h4><span>✏️ Editor</span> <span class="adm-user-role-tag adm-role-editor">Content &amp; Ops</span></h4>
          <p>Manages products, catalog content, visual layouts, orders and customer leads.</p>
          <ul>
            <li>Full Catalog &amp; Product Management</li>
            <li>Homepage Customizer &amp; Content</li>
            <li>SEO Meta Titles &amp; Descriptions</li>
            <li>Process Customer Orders</li>
            <li>View and follow up WhatsApp Leads</li>
            <li><em>No access to staff accounts or backups</em></li>
          </ul>
        </div>
        <div class="adm-role-card">
          <h4><span>📝 Author</span> <span class="adm-user-role-tag adm-role-author">Products Only</span></h4>
          <p>Dedicated staff member for catalog inventory, stock, and product publishing.</p>
          <ul>
            <li>Add new vape and pod products</li>
            <li>Update product prices, stock, &amp; tags</li>
            <li>Upload product gallery images</li>
            <li>Edit product flavors and nicotine specs</li>
            <li><em>Locked out of orders, settings, &amp; SEO</em></li>
          </ul>
        </div>
      </div>

      <!-- STAFF LIST TABLE -->
      <div class="adm-card">
        <h3><span>📋</span> Active Team Members (${team.length})</h3>
        <div class="adm-team-table-wrap">
          <table class="adm-team-table">
            <thead>
              <tr>
                <th>User / Name</th>
                <th>Role</th>
                <th>Phone Number (Direct Login)</th>
                <th>Username</th>
                <th>Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
    `;

    if (team.length === 0) {
      html += `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--adm-muted);">No staff records found.</td></tr>`;
    } else {
      team.forEach(u => {
        const isMe = (state.data.admin_user && state.data.admin_user === u.username) || (u.id === 'usr_admin');
        const roleClass = u.role === 'admin' ? 'adm-role-admin' : (u.role === 'editor' ? 'adm-role-editor' : 'adm-role-author');
        const roleName = u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : 'Author';
        const phoneDisplay = u.phone ? `<span class="adm-phone-tag">📞 ${esc(u.phone)}</span>` : '<span style="color:var(--adm-muted);font-size:12px;">None</span>';
        const statusBadge = (u.status || 'active') === 'active'
          ? '<span style="color:#34d399;font-weight:700;font-size:12px;">● Active</span>'
          : '<span style="color:#f87171;font-weight:700;font-size:12px;">○ Inactive</span>';

        html += `
          <tr>
            <td>
              <div style="font-weight:700; color:var(--adm-text);">${esc(u.name || u.username)}</div>
              ${isMe ? '<span style="font-size:11px;color:var(--adm-muted);">(Current Session)</span>' : ''}
            </td>
            <td><span class="adm-user-role-tag ${roleClass}">${esc(roleName)}</span></td>
            <td>${phoneDisplay}</td>
            <td><code style="background:rgba(255,255,255,0.05);padding:2px 6px;border-radius:4px;font-size:12px;">${esc(u.username || '—')}</code></td>
            <td>${statusBadge}</td>
            <td style="text-align:right;">
              <div style="display:inline-flex; gap:8px;">
                <button class="adm-btn adm-btn-sm" onclick="window.ADM.editStaff('${esc(u.id)}')">✏️ Edit</button>
                ${(u.id !== 'usr_admin' && !isMe) ? `<button class="adm-btn adm-btn-sm adm-btn-danger" onclick="window.ADM.deleteStaff('${esc(u.id)}', '${esc(u.name || u.username)}')">🗑️</button>` : ''}
              </div>
            </td>
          </tr>
        `;
      });
    }

    html += `
            </tbody>
          </table>
        </div>
      </div>

      <!-- STAFF MODAL -->
      <div class="adm-modal-overlay" id="admStaffModal">
        <div class="adm-modal-box" style="max-width:540px;">
          <div class="adm-modal-head">
            <h3 id="admStaffModalTitle">👤 Staff Account</h3>
            <button type="button" class="adm-modal-close" id="admStaffModalClose">✕</button>
          </div>
          <div class="adm-modal-body" id="admStaffModalBody"></div>
          <div class="adm-modal-foot">
            <button type="button" class="adm-btn" id="admStaffModalCancel">Cancel</button>
            <button type="button" class="adm-btn adm-btn-primary" id="admStaffModalSave">💾 Save Staff Account</button>
          </div>
        </div>
      </div>
    `;

    dom.content.innerHTML = html;

    const btnAdd = document.getElementById('btnAddNewStaff');
    if (btnAdd) btnAdd.addEventListener('click', () => showStaffModal(null));

    const modal = document.getElementById('admStaffModal');
    const closeModal = () => modal.classList.remove('is-open');
    const closeBtn = document.getElementById('admStaffModalClose');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    const cancelBtn = document.getElementById('admStaffModalCancel');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  }

  function showStaffModal(staffId) {
    const team = (state.data && state.data.team) || [];
    const staff = staffId ? team.find(u => u.id === staffId) : null;
    const isEdit = !!staff;

    const modal = document.getElementById('admStaffModal');
    const title = document.getElementById('admStaffModalTitle');
    const body = document.getElementById('admStaffModalBody');
    if (!modal || !title || !body) return;

    title.textContent = isEdit ? `✏️ Edit Staff: ${staff.name || staff.username}` : '➕ Add New Staff Account';

    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div class="adm-field">
          <label>Full Name *</label>
          <input type="text" id="stf_name" value="${esc(isEdit ? staff.name : '')}" placeholder="e.g. Tariq Al Nuaimi" required>
        </div>

        <div class="adm-grid2">
          <div class="adm-field">
            <label>Phone Number (Login with this!) *</label>
            <input type="text" id="stf_phone" value="${esc(isEdit ? staff.phone : '')}" placeholder="+971 50 123 4567 or 0501234567">
            <small style="color:var(--adm-muted);font-size:11px;margin-top:3px;display:block;">User can sign in with this phone number</small>
          </div>
          <div class="adm-field">
            <label>Username (Optional handle)</label>
            <input type="text" id="stf_user" value="${esc(isEdit ? staff.username : '')}" placeholder="e.g. tariq">
          </div>
        </div>

        <div class="adm-grid2">
          <div class="adm-field">
            <label>Role / Permissions *</label>
            <select id="stf_role">
              <option value="author" ${isEdit && staff.role === 'author' ? 'selected' : ''}>Author (Products Only)</option>
              <option value="editor" ${isEdit && staff.role === 'editor' ? 'selected' : ''}>Editor (Products, Layouts, Orders, Leads)</option>
              <option value="admin" ${isEdit && staff.role === 'admin' ? 'selected' : ''}>Admin (Full Store Control)</option>
            </select>
          </div>
          <div class="adm-field">
            <label>Account Status</label>
            <select id="stf_status">
              <option value="active" ${!isEdit || staff.status === 'active' ? 'selected' : ''}>Active (Can log in)</option>
              <option value="inactive" ${isEdit && staff.status === 'inactive' ? 'selected' : ''}>Inactive (Blocked)</option>
            </select>
          </div>
        </div>

        <div class="adm-field">
          <label>${isEdit ? 'New Password (Leave blank to keep current)' : 'Password (min 6 chars) *'}</label>
          <input type="password" id="stf_pass" placeholder="${isEdit ? '••••••••' : 'Enter login password'}" ${isEdit ? '' : 'required'}>
        </div>

        <div id="stf_modal_err" style="color:var(--adm-red);font-size:12.5px;font-weight:600;display:none;"></div>
      </div>
    `;

    modal.classList.add('is-open');

    const saveBtn = document.getElementById('admStaffModalSave');
    saveBtn.onclick = async () => {
      const errEl = document.getElementById('stf_modal_err');
      errEl.style.display = 'none';

      const name = document.getElementById('stf_name').value.trim();
      const phone = document.getElementById('stf_phone').value.trim();
      const username = document.getElementById('stf_user').value.trim();
      const role = document.getElementById('stf_role').value;
      const status = document.getElementById('stf_status').value;
      const pass = document.getElementById('stf_pass').value;

      if (!name) {
        errEl.textContent = 'Please enter staff name.';
        errEl.style.display = 'block';
        return;
      }
      if (!phone && !username) {
        errEl.textContent = 'Please provide a Phone Number or Username.';
        errEl.style.display = 'block';
        return;
      }
      if (!isEdit && (!pass || pass.length < 6)) {
        errEl.textContent = 'Password must be at least 6 characters.';
        errEl.style.display = 'block';
        return;
      }
      if (isEdit && pass && pass.length < 6) {
        errEl.textContent = 'Password must be at least 6 characters.';
        errEl.style.display = 'block';
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      try {
        let res;
        if (isEdit) {
          res = await api('team_update', {
            id: staff.id,
            name,
            phone,
            username,
            role,
            status,
            password: pass || undefined
          });
        } else {
          res = await api('team_create', {
            name,
            phone,
            username,
            role,
            password: pass
          });
        }

        if (res && res.ok) {
          toast(isEdit ? 'Staff account updated!' : 'Staff account created successfully!');
          modal.classList.remove('is-open');
          const refreshed = await api('get');
          if (refreshed && refreshed.ok && refreshed.data) {
            state.data.team = refreshed.data.team;
          }
          renderTeam();
        } else {
          errEl.textContent = res.error === 'phone_taken' ? 'Phone number is already in use.'
            : (res.error === 'username_taken' ? 'Username is already taken.' : (res.error || 'Failed to save staff account.'));
          errEl.style.display = 'block';
        }
      } catch (ex) {
        errEl.textContent = 'Network or server error.';
        errEl.style.display = 'block';
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Save Staff Account';
      }
    };
  }

  /* ============================================================
     ROUTER & VIEW SWITCHER
     ============================================================ */
  function switchView(viewName, subview = '') {
    const role = (window.ADM_ROLE || (state.data && state.data.admin_role) || 'admin').toLowerCase();
    if (role === 'author' && viewName !== 'products') {
      viewName = 'products';
    } else if (role === 'editor' && ['team', 'settings', 'account'].includes(viewName)) {
      viewName = 'dashboard';
    }

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
      case 'leads': renderLeads(); break;
      case 'telegram': renderTelegram(); break;
      case 'team': renderTeam(); break;
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
    deleteLead: async (id) => {
      if (confirm(`Delete lead ${id}?`)) {
        try {
          const res = await api('lead_delete', { id });
          if (res && res.ok) {
            toast(`Lead ${id} deleted.`);
            if (state.data.leads) {
              state.data.leads.leads = (state.data.leads.leads || []).filter(l => l.id !== id);
            }
            renderLeads();
          }
        } catch (e) {
          toast('Failed to delete lead', true);
        }
      }
    },
    clearLeads: async () => {
      if (confirm('Are you sure you want to clear all captured WhatsApp leads?')) {
        try {
          const res = await api('leads_clear');
          if (res && res.ok) {
            toast('All captured leads cleared.');
            if (state.data.leads) state.data.leads.leads = [];
            renderLeads();
          }
        } catch (e) {
          toast('Failed to clear leads', true);
        }
      }
    },
    refreshLeads: async () => {
      try {
        const res = await api('get');
        if (res && res.ok && res.data && res.data.leads) {
          state.data.leads = res.data.leads;
          renderLeads();
          toast('Leads refreshed.');
        }
      } catch (e) {
        toast('Failed to refresh leads', true);
      }
    },
    newStaff: () => showStaffModal(null),
    editStaff: (id) => showStaffModal(id),
    deleteStaff: async (id, name) => {
      if (confirm(`Are you sure you want to delete staff member "${name}"?`)) {
        try {
          const res = await api('team_delete', { id });
          if (res && res.ok) {
            toast(`Staff member "${name}" deleted.`);
            const refreshed = await api('get');
            if (refreshed && refreshed.ok && refreshed.data) {
              state.data.team = refreshed.data.team;
            }
            renderTeam();
          } else {
            toast('Failed to delete staff: ' + (res.error || 'Server error'), true);
          }
        } catch (e) {
          toast('Error deleting staff member.', true);
        }
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
    window.addEventListener('resize', () => {
      if (window.innerWidth > 960) closeMobileMenu();
    });

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

      // Apply role permission filtering to navigation
      const role = (window.ADM_ROLE || (state.data && state.data.admin_role) || 'admin').toLowerCase();
      if (dom.nav) {
        dom.nav.querySelectorAll('.adm-nav-btn').forEach(btn => {
          const v = btn.dataset.view;
          if (role === 'author') {
            if (v !== 'products') btn.style.display = 'none';
          } else if (role === 'editor') {
            if (['team', 'settings', 'account'].includes(v)) btn.style.display = 'none';
          } else {
            btn.style.display = '';
          }
        });
      }

      // Initial view based on role
      if (role === 'author') {
        switchView('products');
      } else {
        switchView('dashboard');
      }

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
