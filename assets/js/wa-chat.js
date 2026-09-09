/**
 * Vape Club Dubai — In-Page WhatsApp Chat & Lead Telemetry System
 * Authentic WhatsApp UI, Phone Number Verifier, Silent Telegram Dispatcher,
 * Automated Quick Replies, and Real WhatsApp Handoff.
 */
(function () {
  'use strict';

  const WA_NUMBER = (window.VCD && window.VCD.waNumber) || '971562848450';
  const LS_KEY = 'vcd_wa_lead';

  const dom = {
    modal: document.getElementById('waChatModal'),
    modalClose: document.getElementById('waModalClose'),
    modalBody: document.getElementById('waModalBody'),
    modalFoot: document.getElementById('waModalFoot'),
    phoneCard: document.getElementById('waPhoneCard'),
    phoneForm: document.getElementById('waPhoneForm'),
    countrySelect: document.getElementById('waCountrySelect'),
    phoneInput: document.getElementById('waPhoneInput'),
    verifyStatus: document.getElementById('waVerifyStatus'),
    btnStartChat: document.getElementById('waBtnStartChat'),
    chatStream: document.getElementById('waChatStream'),
    greetingTime: document.getElementById('waGreetingTime'),
    quickReplies: document.getElementById('waQuickReplies'),
    dynamicMessages: document.getElementById('waDynamicMessages'),
    typingBubble: document.getElementById('waTypingBubble'),
    handoffCard: document.getElementById('waHandoffCard'),
    btnRealWhatsApp: document.getElementById('waBtnRealWhatsApp'),
    inputMessage: document.getElementById('waInputMessage'),
    btnSend: document.getElementById('waBtnSend'),
    statusText: document.getElementById('waStatusText')
  };

  let activeLead = null;
  let activeProductContext = '';
  let activeCartContext = '';

  function getLocalLead() {
    try {
      const data = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      return data && data.fullPhone ? data : null;
    } catch (e) {
      return null;
    }
  }

  function saveLocalLead(data) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      activeLead = data;
    } catch (e) {}
  }

  function getTimeString() {
    const now = new Date();
    let h = now.getHours();
    let m = now.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    m = m < 10 ? '0' + m : m;
    return `${h}:${m} ${ampm}`;
  }

  function getDeviceString() {
    const ua = navigator.userAgent || '';
    if (/iPhone/i.test(ua)) return 'iPhone (iOS)';
    if (/iPad/i.test(ua)) return 'iPad (iPadOS)';
    if (/Android/i.test(ua)) return 'Android Mobile';
    if (/Macintosh/i.test(ua)) return 'Mac OS Desktop';
    if (/Windows/i.test(ua)) return 'Windows PC';
    return 'Web Browser';
  }

  function getCartSummary() {
    try {
      const cartRaw = JSON.parse(localStorage.getItem('vcd_cart_v2') || '{}');
      const keys = Object.keys(cartRaw);
      if (keys.length === 0) return { total: 0, summary: '' };
      let total = 0;
      let items = [];
      keys.forEach(k => {
        const qty = cartRaw[k];
        items.push(`${qty}x ${k}`);
      });
      return { total: total, summary: items.slice(0, 5).join(', ') };
    } catch (e) {
      return { total: 0, summary: '' };
    }
  }

  async function postLeadTelemetry(payload) {
    try {
      const res = await fetch('/api/wa-lead.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      return { ok: false };
    }
  }

  /* ---------- Phone Number Formatter & Verifier ---------- */
  function validatePhoneNumber(countryCode, number) {
    const cleanNum = number.replace(/\D/g, '');
    if (countryCode === '+971') {
      // UAE Mobile: 9 digits starting with 5 (e.g. 50 123 4567)
      const validUae = cleanNum.length === 9 && cleanNum.startsWith('5');
      return {
        valid: validUae,
        formatted: cleanNum.length === 9 ? cleanNum.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3') : cleanNum,
        hint: validUae ? '✓ Active UAE WhatsApp Number' : 'Enter 9 digits starting with 5 (e.g. 50 123 4567)'
      };
    } else if (countryCode === '+966') {
      // KSA: 9 digits starting with 5
      const validKsa = cleanNum.length === 9 && cleanNum.startsWith('5');
      return {
        valid: validKsa,
        formatted: cleanNum,
        hint: validKsa ? '✓ Active Saudi WhatsApp Number' : 'Enter 9 digits starting with 5'
      };
    } else {
      const validGen = cleanNum.length >= 7 && cleanNum.length <= 15;
      return {
        valid: validGen,
        formatted: cleanNum,
        hint: validGen ? '✓ Valid WhatsApp International Number' : 'Enter a valid mobile phone number'
      };
    }
  }

  function updatePhoneValidation() {
    if (!dom.phoneInput || !dom.verifyStatus) return;
    const code = dom.countrySelect.value;
    const rawVal = dom.phoneInput.value;
    const result = validatePhoneNumber(code, rawVal);

    if (rawVal.trim() === '') {
      dom.verifyStatus.className = 'wa-phone-verify-status';
      dom.verifyStatus.innerHTML = '<span class="wa-verify-indicator"></span><span>Enter your active WhatsApp number</span>';
      dom.btnStartChat.disabled = true;
      return;
    }

    if (result.valid) {
      dom.verifyStatus.className = 'wa-phone-verify-status is-valid';
      dom.verifyStatus.innerHTML = '<span class="wa-verify-indicator"></span><span>' + result.hint + '</span>';
      dom.btnStartChat.disabled = false;
    } else {
      dom.verifyStatus.className = 'wa-phone-verify-status is-invalid';
      dom.verifyStatus.innerHTML = '<span class="wa-verify-indicator"></span><span>' + result.hint + '</span>';
      dom.btnStartChat.disabled = true;
    }
  }

  /* ---------- Message Append Helpers ---------- */
  function appendOutgoingMessage(text) {
    if (!dom.dynamicMessages) return;
    const timeStr = getTimeString();
    const el = document.createElement('div');
    el.className = 'wa-msg wa-msg-out';
    el.innerHTML = `
      <div class="wa-msg-bubble">
        <p>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>
        <div class="wa-msg-meta">
          <span class="wa-msg-time">${timeStr}</span>
          <span class="wa-ticks">✓✓</span>
        </div>
      </div>
    `;
    dom.dynamicMessages.appendChild(el);
    scrollChatToBottom();
  }

  function appendIncomingMessage(text, delayMs = 1200) {
    if (dom.typingBubble) dom.typingBubble.style.display = 'flex';
    if (dom.statusText) dom.statusText.textContent = 'typing…';
    scrollChatToBottom();

    setTimeout(() => {
      if (dom.typingBubble) dom.typingBubble.style.display = 'none';
      if (dom.statusText) dom.statusText.textContent = 'online';
      const timeStr = getTimeString();
      const el = document.createElement('div');
      el.className = 'wa-msg wa-msg-in';
      el.innerHTML = `
        <div class="wa-msg-bubble">
          <div class="wa-msg-sender">Vape Club Dubai Concierge</div>
          <p>${text.replace(/\n/g, '<br>')}</p>
          <span class="wa-msg-time">${timeStr}</span>
        </div>
      `;
      dom.dynamicMessages.appendChild(el);
      scrollChatToBottom();
    }, delayMs);
  }

  function scrollChatToBottom() {
    if (dom.modalBody) {
      setTimeout(() => {
        dom.modalBody.scrollTop = dom.modalBody.scrollHeight;
      }, 50);
    }
  }

  function triggerRealWhatsApp(customMsg = '') {
    const msg = customMsg || 'Hello Vape Club Dubai! I need assistance with an order.';
    const link = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    if (dom.btnRealWhatsApp) {
      dom.btnRealWhatsApp.href = link;
    }
    if (dom.handoffCard) {
      dom.handoffCard.style.display = 'block';
    }
    scrollChatToBottom();

    // Launch WhatsApp directly after a brief delay
    setTimeout(() => {
      window.open(link, '_blank');
    }, 1200);
  }

  /* ---------- Modal Open & State Initialization ---------- */
  function openWhatsAppModal(contextMsg = '', productTitle = '') {
    if (!dom.modal) return;
    activeProductContext = productTitle || document.title.split('—')[0].trim();
    const cart = getCartSummary();

    if (dom.greetingTime) dom.greetingTime.textContent = getTimeString();

    dom.modal.classList.add('is-open');
    dom.modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('wa-modal-locked');

    activeLead = getLocalLead();

    if (activeLead && activeLead.fullPhone) {
      // Returning verified user: skip phone prompt
      dom.phoneCard.style.display = 'none';
      dom.chatStream.style.display = 'block';
      dom.modalFoot.style.display = 'flex';

      if (contextMsg) {
        appendOutgoingMessage(contextMsg);
        postLeadTelemetry({
          full_phone: activeLead.fullPhone,
          phone: activeLead.phone,
          country_code: activeLead.countryCode,
          message: contextMsg,
          page: window.location.pathname + window.location.search,
          product_name: activeProductContext,
          cart_total: cart.total,
          cart_summary: cart.summary,
          device: getDeviceString()
        });
        appendIncomingMessage(`Hello again! I see your inquiry regarding "${activeProductContext}". Our Dubai dispatch team is on standby to prepare your order within 1-2 hours.`);
      }
    } else {
      // First-time user: show phone verifier
      dom.phoneCard.style.display = 'block';
      dom.chatStream.style.display = 'none';
      dom.modalFoot.style.display = 'none';
      if (dom.phoneInput) {
        setTimeout(() => dom.phoneInput.focus(), 300);
      }
    }

    scrollChatToBottom();
  }

  function closeWhatsAppModal() {
    if (!dom.modal) return;
    dom.modal.classList.remove('is-open');
    dom.modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('wa-modal-locked');
  }

  /* ---------- Initialization & Event Bindings ---------- */
  function init() {
    // Phone input validation listener
    if (dom.phoneInput) {
      dom.phoneInput.addEventListener('input', updatePhoneValidation);
    }
    if (dom.countrySelect) {
      dom.countrySelect.addEventListener('change', updatePhoneValidation);
    }

    // Phone form submission
    if (dom.phoneForm) {
      dom.phoneForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = dom.countrySelect.value;
        const phone = dom.phoneInput.value.replace(/\D/g, '');
        const fullPhone = `${code} ${phone}`;
        const cart = getCartSummary();

        saveLocalLead({ fullPhone, phone, countryCode: code });

        // Silent Telemetry Dispatch to /api/wa-lead.php -> Telegram Bot
        postLeadTelemetry({
          full_phone: fullPhone,
          phone: phone,
          country_code: code,
          message: 'Initiated WhatsApp Chat',
          page: window.location.pathname + window.location.search,
          product_name: activeProductContext,
          cart_total: cart.total,
          cart_summary: cart.summary,
          device: getDeviceString()
        });

        // Transition smoothly to Chat Stream
        dom.phoneCard.style.opacity = '0';
        dom.phoneCard.style.transform = 'translateY(-10px)';
        dom.phoneCard.style.transition = 'opacity 0.25s, transform 0.25s';

        setTimeout(() => {
          dom.phoneCard.style.display = 'none';
          dom.chatStream.style.display = 'block';
          dom.modalFoot.style.display = 'flex';
          scrollChatToBottom();
          if (dom.inputMessage) dom.inputMessage.focus();
        }, 260);
      });
    }

    // Quick replies
    if (dom.quickReplies) {
      dom.quickReplies.addEventListener('click', (e) => {
        const chip = e.target.closest('.wa-qr-chip');
        if (!chip) return;
        const text = chip.textContent.trim();
        const replyKey = chip.dataset.reply;

        appendOutgoingMessage(text);

        // Silent telemetry of question
        const lead = activeLead || getLocalLead() || {};
        postLeadTelemetry({
          full_phone: lead.fullPhone || '',
          phone: lead.phone || '',
          country_code: lead.countryCode || '+971',
          message: `[Quick Reply] ${text}`,
          page: window.location.pathname + window.location.search,
          product_name: activeProductContext,
          device: getDeviceString()
        });

        // Automated responses
        switch (replyKey) {
          case 'track':
            appendIncomingMessage('🚚 Our Dubai express couriers deliver in 1-2 hours across Downtown, Marina, Business Bay, JBR, Deira, and all Dubai zones! Cash or Card on Delivery.');
            setTimeout(() => triggerRealWhatsApp(text), 1600);
            break;
          case 'recommend':
            appendIncomingMessage('💨 Top Pick Today: IQOS ILUMA i PRIME (Remix Edition) + TEREA Japan Black Purple Menthol or Swiss Amber. Sealed authentic Japanese & Swiss stock guaranteed.');
            setTimeout(() => triggerRealWhatsApp(text), 1600);
            break;
          case 'order':
            appendIncomingMessage('📦 Excellent! Your cart items are queued for fast dispatch. Connecting you with WhatsApp order confirmation right now…');
            setTimeout(() => triggerRealWhatsApp(text), 1600);
            break;
          case 'bundles':
            appendIncomingMessage('🏷️ Today\'s VIP Deal: Order any 2 ILUMA devices or 5+ TEREA packs to receive Free Express Shipping across all UAE + complimentary lighter!');
            setTimeout(() => triggerRealWhatsApp(text), 1600);
            break;
          case 'payment':
            appendIncomingMessage('💳 We accept Cash on Delivery (COD), Card on Delivery (all credit/debit cards), and Apple Pay directly at your door in Dubai.');
            setTimeout(() => triggerRealWhatsApp(text), 1600);
            break;
          case 'agent':
          default:
            appendIncomingMessage('👤 Connecting you directly with our Dubai concierge specialist right now…');
            setTimeout(() => triggerRealWhatsApp(text), 1600);
            break;
        }
      });
    }

    // Custom text send handler
    const sendHandler = () => {
      if (!dom.inputMessage) return;
      const text = dom.inputMessage.value.trim();
      if (!text) return;
      dom.inputMessage.value = '';

      appendOutgoingMessage(text);

      // Silent telemetry dispatch
      const lead = activeLead || getLocalLead() || {};
      postLeadTelemetry({
        full_phone: lead.fullPhone || '',
        phone: lead.phone || '',
        country_code: lead.countryCode || '+971',
        message: text,
        page: window.location.pathname + window.location.search,
        product_name: activeProductContext,
        device: getDeviceString()
      });

      appendIncomingMessage('Thank you! Launching official WhatsApp Messenger to complete your request directly with our Dubai agent…', 800);
      setTimeout(() => triggerRealWhatsApp(text), 1500);
    };

    if (dom.btnSend) dom.btnSend.addEventListener('click', sendHandler);
    if (dom.inputMessage) {
      dom.inputMessage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendHandler();
        }
      });
    }

    if (dom.modalClose) dom.modalClose.addEventListener('click', closeWhatsAppModal);

    // Global Click Interceptor for all WhatsApp Buttons
    document.addEventListener('click', (e) => {
      const waBtn = e.target.closest('.js-open-wa-chat, .bnav-fab-wa, a[href*="wa.me"], a[href*="api.whatsapp.com"], #btnWaInstantCheckout, .btn-wa:not(#btnOpenCheckout)');
      if (!waBtn) return;
      if (waBtn.id === 'btnOpenCheckout') return;

      // Don't intercept if inside the WhatsApp modal itself!
      if (waBtn.closest('#waChatModal')) return;

      e.preventDefault();
      e.stopPropagation();

      let contextMsg = '';
      let prodTitle = '';

      if (waBtn.id === 'btnWaInstantCheckout') {
        const cart = getCartSummary();
        contextMsg = `Hello Vape Club Dubai! I would like to place an order for: ${cart.summary || 'items in my cart'}.`;
      } else {
        // Check for product card context
        const card = waBtn.closest('[data-id], .card, .vip-card, .pd-wrap');
        if (card) {
          prodTitle = (card.querySelector('.card-title, .vip-title, h1') || {}).textContent || '';
          contextMsg = `Hello Vape Club Dubai! I am interested in ordering ${prodTitle.trim()}.`;
        }
      }

      openWhatsAppModal(contextMsg, prodTitle.trim());
    }, true);

    // Expose controller globally
    window.VCD_WA_CHAT = {
      open: openWhatsAppModal,
      close: closeWhatsAppModal
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
