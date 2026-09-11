# -*- coding: utf-8 -*-

MODULE_SETTINGS = r'''  function renderSettings() {
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
          <div></div>
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

    const saveSettingsHandler = () => {
      saveAll();
    };
    const btnTop = document.getElementById('btnSettingsSaveTop');
    const btnBtm = document.getElementById('btnSettingsSaveBottom');
    if (btnTop) btnTop.addEventListener('click', saveSettingsHandler);
    if (btnBtm) btnBtm.addEventListener('click', saveSettingsHandler);
  }'''

print("Module Settings length:", len(MODULE_SETTINGS))
