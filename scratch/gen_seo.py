# -*- coding: utf-8 -*-

MODULE_SEO = r'''  function renderSEO() {
    dom.viewTitle.textContent = 'SEO & Schema Engine';
    const seo = state.data.seo;
    const settings = state.data.settings;

    if (!seo.pages) seo.pages = {};
    if (!seo.pages.home) seo.pages.home = {};
    if (!seo.pages.category) seo.pages.category = {};
    if (!seo.pages.product) seo.pages.product = {};

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <p style="color:var(--adm-muted);margin:0;">Google UAE Search ranking, SERP snippets, structured data schemas and webmaster verification.</p>
        <button type="button" class="adm-btn adm-btn-primary" id="btnSeoSaveTop">💾 Save SEO Settings</button>
      </div>

      <div class="adm-card is-highlight">
        <h3><span>🔍</span> Production URL &amp; Google Structured Data Schemas</h3>
        <p class="adm-card-sub">Zero SEO gaps: Canonical URLs, JSON-LD rich snippets and Google Star Ratings</p>

        <div class="adm-grid2">
          <div class="adm-field">
            <label>Canonical Production URL</label>
            <input type="url" id="seo_site_url" value="${esc(seo.site_url || 'https://iqosai.com')}">
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

      <!-- WEBMASTER VERIFICATION & HEAD SCRIPTS -->
      <div class="adm-card">
        <h3><span>🛡️</span> Google Search Console &amp; Webmaster Verification</h3>
        <p class="adm-card-sub">Add Google Search Console HTML verification tag, Google Analytics 4 (GA4), or Meta Pixel</p>
        <div class="adm-field">
          <label>Webmaster Verification Code / Extra Head Scripts (&lt;meta&gt; or &lt;script&gt;)</label>
          <textarea id="seo_extra_head" rows="4" style="font-family:monospace;font-size:12.5px;" placeholder='<meta name="google-site-verification" content="your_verification_token" />'>${esc(seo.extra_head_code || '')}</textarea>
          <span class="adm-hint">This code is injected directly before &lt;/head&gt; on every page of the website.</span>
        </div>
      </div>

      <!-- SOCIAL MEDIA PREVIEW TAGS (OPEN GRAPH & TWITTER) -->
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

      <!-- HOMEPAGE SEO -->
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
            <span class="adm-serp-site">${esc(seo.site_url ? seo.site_url.replace(/^https?:\/\//, '') : 'iqosai.com')}</span>
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

      <!-- CATEGORY PAGES DYNAMIC SEO TEMPLATE -->
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

      <!-- PRODUCT PAGES DYNAMIC SEO TEMPLATE -->
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
    bind('seo_extra_head', seo, 'extra_head_code');
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

    const saveSeoHandler = () => {
      saveAll();
    };
    const btnTop = document.getElementById('btnSeoSaveTop');
    const btnBtm = document.getElementById('btnSeoSaveBottom');
    if (btnTop) btnTop.addEventListener('click', saveSeoHandler);
    if (btnBtm) btnBtm.addEventListener('click', saveSeoHandler);
  }'''

print("Module SEO length:", len(MODULE_SEO))
