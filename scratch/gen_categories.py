# -*- coding: utf-8 -*-

MODULE_CATEGORIES = r'''  function renderCategories() {
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
  }'''

print("Module Categories length:", len(MODULE_CATEGORIES))
