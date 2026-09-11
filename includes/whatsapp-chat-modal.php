<?php
/**
 * Authentic In-Page WhatsApp Chat Modal & Lead Capture
 * Realistic WhatsApp UI with Phone Verifier, Quick Replies, and Real WhatsApp Handoff.
 */
declare(strict_types=1);

$S = $VCD_SETTINGS ?? [];
$waConciergeName = $S['wa_concierge_name'] ?? 'Vape Club Dubai';
$waNumber = $S['wa_number'] ?? '971562848450';
?>
<!-- ========== REALISTIC IN-PAGE WHATSAPP CHAT MODAL ========== -->
<div class="wa-modal-overlay" id="waChatModal" role="dialog" aria-modal="true" aria-hidden="true">
  <div class="wa-modal-container">

    <!-- WhatsApp Header -->
    <header class="wa-modal-head">
      <button type="button" class="wa-head-back" id="waModalClose" aria-label="Close chat">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
      <div class="wa-avatar-wrap">
        <img src="/assets/images/icons/favicon-32.png" alt="Vape Club Dubai" class="wa-avatar-img">
        <span class="wa-online-dot"></span>
      </div>
      <div class="wa-head-info">
        <div class="wa-business-name">
          <span><?= e($waConciergeName) ?></span>
          <svg class="wa-verified-icon" viewBox="0 0 18 18" width="16" height="16" fill="#00E599">
            <path d="M9 0L10.9 2.1L13.8 2.2L14.7 4.9L17.3 6.1L17 9L18.4 11.4L16.7 13.7L16.8 16.6L14 17.1L12.4 19.5L9.6 18.9L7.3 20.6L5.3 18.7L2.4 19L1.9 16.2L0 14.6L0.9 11.8L0 9L1.9 6.2L1.6 3.4L4.4 3.1L6 0.7L8.8 1.3L9 0Z" transform="scale(0.85) translate(1,1)"/>
            <path d="M5 9L7.5 11.5L13 6" fill="none" stroke="#070A0F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="wa-status-text" id="waStatusText">online</div>
      </div>
      <div class="wa-head-actions">
        <button type="button" class="wa-icon-action" aria-label="Video call">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
        </button>
        <button type="button" class="wa-icon-action" aria-label="Audio call">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.43-3.9-6.63-6.82l1.97-1.61c.24-.26.35-.64.24-1.03-.36-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
        </button>
        <button type="button" class="wa-icon-action" id="waModalMenu" aria-label="Options">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
        </button>
      </div>
    </header>

    <!-- Chat Canvas -->
    <div class="wa-modal-body" id="waModalBody">
      <!-- Date Separator -->
      <div class="wa-date-pill"><span>TODAY</span></div>

      <!-- End-to-End Encryption Notice -->
      <div class="wa-encryption-pill">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
        </svg>
        <span>Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.</span>
      </div>

      <!-- STEP 1: PHONE NUMBER VERIFIER CARD -->
      <div class="wa-phone-card" id="waPhoneCard">
        <div class="wa-phone-card-head">
          <span class="wa-phone-card-icon">💬</span>
          <div>
            <strong>Connect with Dubai Concierge</strong>
            <small>Enter your WhatsApp number to begin direct chat &amp; confirm 1-2h express delivery</small>
          </div>
        </div>
        <form class="wa-phone-form" id="waPhoneForm">
          <div class="wa-phone-input-row">
            <select class="wa-country-select" id="waCountrySelect" aria-label="Select Country">
              <option value="+971" data-flag="🇦🇪" selected>🇦🇪 +971 (UAE)</option>
              <option value="+966" data-flag="🇸🇦">🇸🇦 +966 (Saudi)</option>
              <option value="+974" data-flag="🇶🇦">🇶🇦 +974 (Qatar)</option>
              <option value="+965" data-flag="🇰🇼">🇰🇼 +965 (Kuwait)</option>
              <option value="+968" data-flag="🇴🇲">🇴🇲 +968 (Oman)</option>
              <option value="+973" data-flag="🇧🇭">🇧🇭 +973 (Bahrain)</option>
              <option value="+44" data-flag="🇬🇧">🇬🇧 +44 (UK)</option>
              <option value="+1" data-flag="🇺🇸">🇺🇸 +1 (US/CA)</option>
              <option value="+91" data-flag="🇮🇳">🇮🇳 +91 (India)</option>
              <option value="+92" data-flag="🇵🇰">🇵🇰 +92 (Pakistan)</option>
              <option value="+880" data-flag="🇧🇩">🇧🇩 +880 (BD)</option>
              <option value="+7" data-flag="🇷🇺">🇷🇺 +7 (Russia)</option>
            </select>
            <input type="tel" class="wa-phone-number-input" id="waPhoneInput" placeholder="50 123 4567" required autocomplete="tel-national">
          </div>
          <div class="wa-phone-verify-status" id="waVerifyStatus">
            <span class="wa-verify-indicator"></span>
            <span class="wa-verify-text">Validating WhatsApp number…</span>
          </div>
          <button type="submit" class="wa-phone-submit-btn" id="waBtnStartChat">
            <span>Continue to WhatsApp Chat</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-7.85-1.42 1.42L16.86 11H5v2z"/>
            </svg>
          </button>
        </form>
      </div>

      <!-- STEP 2: CHAT MESSAGES STREAM -->
      <div class="wa-chat-stream" id="waChatStream" style="display:none;">
        <!-- Incoming Welcome Message -->
        <div class="wa-msg wa-msg-in">
          <div class="wa-msg-bubble">
            <div class="wa-msg-sender"><?= e($waConciergeName) ?></div>
            <p>👋 Hello and welcome to <b>Vape Club Dubai</b>! I am your personal concierge. How can I assist you with your order or questions today?</p>
            <span class="wa-msg-time" id="waGreetingTime">10:00 AM</span>
          </div>
        </div>

        <!-- Pre-built Quick Reply Options -->
        <div class="wa-quick-replies" id="waQuickReplies">
          <span class="wa-qr-label">Quick options:</span>
          <div class="wa-qr-chips">
            <button type="button" class="wa-qr-chip" data-reply="track">
              <span>🚚</span> Track 1-2h Express Delivery
            </button>
            <button type="button" class="wa-qr-chip" data-reply="recommend">
              <span>💨</span> Best TEREA Flavors &amp; ILUMA
            </button>
            <button type="button" class="wa-qr-chip" data-reply="order">
              <span>📦</span> Order My Cart Now
            </button>
            <button type="button" class="wa-qr-chip" data-reply="bundles">
              <span>🏷️</span> Today's VIP Bundles &amp; Deals
            </button>
            <button type="button" class="wa-qr-chip" data-reply="payment">
              <span>💳</span> Cash / Card on Delivery
            </button>
            <button type="button" class="wa-qr-chip" data-reply="agent">
              <span>👤</span> Chat with Human Specialist
            </button>
          </div>
        </div>

        <!-- Dynamic User & Bot Messages will append here -->
        <div id="waDynamicMessages"></div>

        <!-- Realistic Typing Indicator -->
        <div class="wa-typing-indicator" id="waTypingBubble" style="display:none;">
          <div class="wa-typing-dot"></div>
          <div class="wa-typing-dot"></div>
          <div class="wa-typing-dot"></div>
        </div>

        <!-- Handoff Card to Official WhatsApp -->
        <div class="wa-handoff-card" id="waHandoffCard" style="display:none;">
          <div class="wa-handoff-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="#25D366">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z"/>
            </svg>
          </div>
          <strong>Connecting Directly to Dubai Agent…</strong>
          <p>Click below to continue your conversation in official WhatsApp Messenger:</p>
          <a href="#" class="wa-handoff-btn" id="waBtnRealWhatsApp" target="_blank" rel="noopener">
            <span>👉 Open in WhatsApp Now</span>
          </a>
        </div>
      </div>
    </div>

    <!-- WhatsApp Typing Bar -->
    <footer class="wa-modal-foot" id="waModalFoot" style="display:none;">
      <button type="button" class="wa-foot-icon" aria-label="Emoji">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
        </svg>
      </button>
      <button type="button" class="wa-foot-icon" aria-label="Attachment">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
        </svg>
      </button>
      <input type="text" class="wa-text-input" id="waInputMessage" placeholder="Type a message…" autocomplete="off">
      <button type="button" class="wa-send-btn" id="waBtnSend" aria-label="Send message">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </footer>

  </div>
</div>
<script src="/assets/js/wa-chat.js?v=<?= defined('VCD_ASSET_VER') ? VCD_ASSET_VER : '3.0' ?>" defer></script>
