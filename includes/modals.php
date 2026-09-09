<?php
/**
 * Shared overlays: cart drawer, checkout modal, quick view, search modal,
 * toasts, bottom nav. Previously duplicated in all 3 HTML files ×3.
 */
declare(strict_types=1);

$S  = $VCD_SETTINGS;
$HM = $VCD_HOME;
$CO = $HM['checkout'] ?? [];
$threshold = (float) ($S['free_ship_threshold'] ?? 450);
$delivery  = (float) ($S['delivery_fee'] ?? 20);
?>
<!-- ========== CART DRAWER ========== -->
<aside class="cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-label="Shopping cart">
  <div class="cart-head">
    <h3><svg class="icon"><use href="#i-cart"/></svg> Your Cart <span class="pill-count cart-count-text">0</span></h3>
    <button class="icon-btn" id="cartClose" aria-label="Close cart"><svg class="icon"><use href="#i-close"/></svg></button>
  </div>

  <div class="ship-progress">
    <p class="msg" id="shipMsg">Add <b><?= e(aed($threshold)) ?></b> more for <b>FREE delivery all UAE</b></p>
    <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
  </div>

  <div class="cart-items" id="cartItems"></div>

  <div class="cart-foot">
    <div class="totals-row"><span>Subtotal</span><span id="cartSubtotal">0 AED</span></div>
    <div class="totals-row"><span>Express Delivery</span><span id="cartDelivery"><?= e(aed($delivery)) ?></span></div>
    <div class="totals-row grand"><span>Total</span><span class="aed" id="cartTotal">0 AED</span></div>
    <button class="btn btn-wa btn-block btn-lg cart-wa-btn" id="btnOpenCheckout" type="button">
      <svg class="icon"><use href="#i-wa"/></svg> Proceed to Complete Order
    </button>
    <p class="cart-note"><svg class="icon"><use href="#i-shield"/></svg> 1-2h Express Delivery · Pay Cash or Card on Delivery</p>
    <button class="clear-cart" id="clearCart">Clear cart</button>
  </div>
</aside>

<!-- ========== WEBSITE CHECKOUT MODAL ========== -->
<div class="modal" id="checkoutModal" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle">
  <div class="modal-panel checkout-panel">
    <button class="modal-close" data-close-modal aria-label="Close checkout"><svg class="icon"><use href="#i-close"/></svg></button>

    <div id="checkoutFormView">
      <div class="checkout-head">
        <span class="eyebrow"><?= e($CO['eyebrow'] ?? 'Express Checkout') ?></span>
        <h2 id="checkoutTitle"><svg class="icon" style="color:var(--emerald)"><use href="#i-shield"/></svg> <?= e($CO['title'] ?? 'Complete Your Order') ?></h2>
        <p><?= e($CO['sub'] ?? '') ?></p>
      </div>

      <!-- Prominent Highlighted WhatsApp Order Banner -->
      <div class="checkout-wa-banner">
        <div class="wa-banner-badge"><?= e($CO['wa_banner_badge'] ?? '') ?></div>
        <div class="wa-banner-body">
          <div class="wa-banner-icon"><svg class="icon icon-lg"><use href="#i-wa"/></svg></div>
          <div class="wa-banner-info">
            <strong><?= e($CO['wa_banner_title'] ?? '') ?></strong>
            <p><?= e($CO['wa_banner_text'] ?? '') ?></p>
          </div>
        </div>
        <a class="btn btn-wa btn-block btn-lg wa-banner-btn" id="btnWaInstantCheckout" href="#" target="_blank" rel="noopener">
          <svg class="icon"><use href="#i-wa"/></svg> Send Order on WhatsApp (<span class="co-wa-total-chip">0 AED</span>)
        </a>
      </div>

      <!-- Choose Finishing Checkout Method -->
      <div class="checkout-method-tabs" role="tablist">
        <button type="button" class="co-tab is-active" id="tabMethodWa" role="tab" aria-selected="true">
          <svg class="icon" style="color:#25D366"><use href="#i-wa"/></svg>
          <span><strong>WhatsApp Order</strong><small>Instant 1-Click Chat</small></span>
        </button>
        <button type="button" class="co-tab" id="tabMethodOnline" role="tab" aria-selected="false">
          <svg class="icon" style="color:var(--emerald)"><use href="#i-shield"/></svg>
          <span><strong>Online Form</strong><small>Cash or Card on Delivery</small></span>
        </button>
      </div>

      <!-- Order Summary -->
      <div class="checkout-summary-box">
        <div class="cs-head">
          <span>Order Items (<span id="coItemCount">0</span>)</span>
          <button type="button" class="btn-ghost btn-sm" id="coEditCart" style="padding:2px 8px;font-size:11px">Edit Cart</button>
        </div>
        <div class="cs-items" id="coItemsList"></div>
        <div class="cs-totals">
          <div class="cs-row"><span>Subtotal</span><span id="coSubtotal">0 AED</span></div>
          <div class="cs-row"><span>Express Delivery</span><span id="coDelivery"><?= e(aed($delivery)) ?></span></div>
          <div class="cs-row grand"><span>Total to Pay</span><span class="aed" id="coTotal">0 AED</span></div>
        </div>
      </div>

      <!-- Checkout Form -->
      <form class="checkout-form" id="checkoutForm" novalidate>
        <div class="form-row-2">
          <div class="form-group">
            <label for="coName">Full Name <span class="req">*</span></label>
            <input type="text" id="coName" name="name" placeholder="e.g. Mohammed Al-Falasi" required autocomplete="name">
          </div>
          <div class="form-group">
            <label for="coPhone">Phone / WhatsApp Number <span class="req">*</span></label>
            <input type="tel" id="coPhone" name="phone" placeholder="+971 50 123 4567" required autocomplete="tel">
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label for="coEmirate">Emirate / City <span class="req">*</span></label>
            <select id="coEmirate" name="emirate" required>
<?php foreach (($CO['emirates'] ?? []) as $i => $em): ?>
              <option value="<?= e($em['value'] ?? '') ?>"<?= $i === 0 ? ' selected' : '' ?>><?= e($em['label'] ?? '') ?></option>
<?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label for="coArea">Area / District <span class="req">*</span></label>
            <input type="text" id="coArea" name="area" placeholder="e.g. Downtown Dubai / Marina / JBR" required>
          </div>
        </div>

        <div class="form-group">
          <label for="coAddress">Street &amp; Building / Villa / Apt No. <span class="req">*</span></label>
          <input type="text" id="coAddress" name="address" placeholder="e.g. Marina Gate 1, Apt 1402, Al Marsa St" required>
        </div>

        <div class="form-group">
          <label for="coNotes">Delivery Notes (Optional)</label>
          <input type="text" id="coNotes" name="notes" placeholder="e.g. Leave at reception or call when near">
        </div>

        <!-- Payment Method -->
        <div class="form-group">
          <label>Payment Method on Delivery</label>
          <div class="pm-cards">
            <label class="pm-card is-active" id="pmCashLabel">
              <input type="radio" name="paymentMethod" value="Cash on Delivery" checked>
              <div class="pm-ico"><svg class="icon"><use href="#i-cash"/></svg></div>
              <div class="pm-text">
                <strong>Cash on Delivery</strong>
                <small>Pay cash to courier</small>
              </div>
            </label>
            <label class="pm-card" id="pmCardLabel">
              <input type="radio" name="paymentMethod" value="Card on Delivery">
              <div class="pm-ico"><svg class="icon"><use href="#i-shield"/></svg></div>
              <div class="pm-text">
                <strong>Card on Delivery</strong>
                <small>Visa / MC / Apple Pay POS</small>
              </div>
            </label>
          </div>
        </div>

        <label class="check-age">
          <input type="checkbox" id="coAgeCheck" checked required>
          <span><?= e($CO['age_confirm_text'] ?? '') ?></span>
        </label>

        <button type="submit" class="btn btn-primary btn-block btn-lg" id="btnPlaceOrder" style="margin-top:6px;min-height:50px;font-size:16px">
          <svg class="icon"><use href="#i-check"/></svg> Confirm Order (<span id="btnOrderTotal">0 AED</span>)
        </button>

        <p class="cart-note" style="text-align:center;margin-top:4px">
          <svg class="icon"><use href="#i-truck"/></svg> Dispatches immediately from our Dubai hub
        </p>
      </form>

      <!-- WhatsApp Direct Order Tab View -->
      <div id="checkoutWaView" style="display:none">
        <div class="checkout-wa-box">
          <p style="font-size:13px;color:var(--body);margin-bottom:14px;line-height:1.45">
            Your cart items and total AED will be formatted directly into a WhatsApp chat with our 24/7 Dubai team for immediate 1-2 hour express courier dispatch.
          </p>
          <div class="form-group" style="margin-bottom:12px">
            <label for="waCustName">Your Name (Optional)</label>
            <input type="text" id="waCustName" placeholder="e.g. Mohammed Al-Falasi">
          </div>
          <div class="form-group" style="margin-bottom:16px">
            <label for="waEmirate">Delivery Emirate</label>
            <select id="waEmirate">
<?php foreach (($CO['emirates'] ?? []) as $i => $em): ?>
              <option value="<?= e($em['value'] ?? '') ?>"<?= $i === 0 ? ' selected' : '' ?>><?= e($em['label'] ?? '') ?></option>
<?php endforeach; ?>
            </select>
          </div>
          <a class="btn btn-wa btn-block btn-lg" id="btnSubmitWaOrder" href="#" target="_blank" rel="noopener" style="min-height:50px;font-size:16px">
            <svg class="icon"><use href="#i-wa"/></svg> Complete Order on WhatsApp (<span id="btnWaOrderTotal">0 AED</span>)
          </a>
          <p class="cart-note" style="text-align:center;margin-top:8px">
            <svg class="icon"><use href="#i-shield"/></svg> Pay Cash or Card to Courier upon receipt
          </p>
        </div>
      </div>
    </div>

    <!-- Order Placed Success Screen -->
    <div id="checkoutSuccessView" style="display:none">
      <div class="order-success-screen">
        <div class="success-icon">✓</div>
        <div>
          <h2 class="success-title"><?= e($CO['success_title'] ?? 'Order Confirmed!') ?></h2>
          <p style="color:var(--body);font-size:14px"><?= e($CO['success_text'] ?? '') ?></p>
        </div>

        <div class="order-pill-badge">
          <span class="pulse"></span> Order <strong id="successOrderId">#VCD-XXXXX</strong>
        </div>

        <div class="success-details" id="successDetails"></div>

        <div class="success-actions">
          <a class="btn btn-wa btn-block btn-lg" id="successWaTrack" href="#" target="_blank" rel="noopener">
            <svg class="icon"><use href="#i-wa"/></svg> Track Live Delivery on WhatsApp
          </a>
          <button class="btn btn-ghost btn-block" data-close-modal type="button">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>

  </div>
</div>

<!-- ========== QUICK VIEW MODAL ========== -->
<div class="modal" id="qvModal" role="dialog" aria-modal="true" aria-label="Product quick view">
  <div class="modal-panel qv-panel">
    <div id="qvContent" style="display:flex;flex-direction:column;height:100%;min-height:0;flex:1;"></div>
  </div>
</div>

<!-- ========== SEARCH MODAL ========== -->
<div class="modal search-modal" id="searchModal" role="dialog" aria-modal="true" aria-label="Search products">
  <div class="modal-panel search-panel">
    <div class="search-input-row">
      <svg class="icon"><use href="#i-search"/></svg>
      <input type="search" id="searchInput" placeholder="<?= e($HM['search']['modal_placeholder'] ?? 'Search ILUMA, TEREA, flavors, puffs…') ?>" autocomplete="off" aria-label="Search products">
      <button class="search-clear" id="searchClear" aria-label="Clear search"><svg class="icon"><use href="#i-close"/></svg></button>
      <button class="modal-close" style="position:static;flex:none" data-close-modal aria-label="Close search"><svg class="icon"><use href="#i-close"/></svg></button>
    </div>
    <div class="search-chips" id="searchChips"></div>
    <div class="search-results" id="searchResults"></div>
  </div>
</div>

<!-- ========== TOASTS ========== -->
<div class="toast-stack" id="toastStack" aria-live="polite"></div>
