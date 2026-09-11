# -*- coding: utf-8 -*-
import sys

# =========================================================================
# MODULE 1: renderHomepage and openSectionModal
# =========================================================================
MODULE_HOME = r'''  function renderHomepage() {
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

          <!-- 17. FOOTER -->
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
          <h3><span>⚡</span> 2. Flash Deal Strip</h3>
          <label class="adm-check" style="margin-bottom:12px;">
            <input type="checkbox" id="classic_fd_enabled" ${home.flash_deal && home.flash_deal.enabled ? 'checked' : ''}>
            <span>Enable Glowing Flash Deal Strip</span>
          </label>
          <div class="adm-field">
            <label>Flash Deal Text</label>
            <input type="text" id="classic_fd_text" value="${esc(home.flash_deal ? home.flash_deal.text : '')}">
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
      bind('classic_fd_text', home.flash_deal, 'text');
      bind('classic_fd_cta_label', home.flash_deal, 'cta_label');
      bind('classic_fd_cta_href', home.flash_deal, 'cta_href');

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
          <div class="adm-field" style="margin-top:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <label style="margin:0;">Category Showcase Tiles (${pc.tiles.length})</label>
              <button type="button" class="adm-btn adm-btn-sm" id="btnAddCatTile">➕ Add Tile</button>
            </div>
            <div id="m_cats_tiles_list" style="display:flex;flex-direction:column;gap:12px;"></div>
          </div>
        `;

        bodyEl.querySelector('#m_cats_word').addEventListener('input', (e) => { pc.pop_word = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_cats_title').addEventListener('input', (e) => { pc.title = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_cats_more_cnt').addEventListener('input', (e) => { pc.more_count = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_cats_more_title').addEventListener('input', (e) => { pc.more_title = e.target.value; markDirty('home'); });
        bodyEl.querySelector('#m_cats_more_sub').addEventListener('input', (e) => { pc.more_sub = e.target.value; markDirty('home'); });

        const renderTiles = () => {
          const list = bodyEl.querySelector('#m_cats_tiles_list');
          list.innerHTML = '';
          const catKeys = Object.keys((state.data.categories && state.data.categories.cats) || {});

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
                    ${catKeys.map(k => `<option value="${esc(k)}" ${tile.cat === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}
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

        renderTiles();
        bodyEl.querySelector('#btnAddCatTile').addEventListener('click', () => {
          pc.tiles.push({ cat: 'iluma', title: 'NEW CATEGORY', sub: 'Best in Dubai', bg: 'assets/images/hero-iluma.webp' });
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

      default: {
        titleEl.innerHTML = '✏️ Edit Section';
        bodyEl.innerHTML = `<p>Section settings can be modified here.</p>`;
        break;
      }
    }

    modal.classList.add('is-open');
  }'''

print("Module Home length:", len(MODULE_HOME))
