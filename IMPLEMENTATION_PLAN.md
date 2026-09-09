# Vape Club Dubai — Master Implementation Plan
_Single source of truth for this workspace. Updated: 2026-09-08_

## Goal
A **static, mobile-first, luxury eCommerce homepage** for a Dubai/UAE vape store.
Zero build step: pure HTML5 + Vanilla CSS + Vanilla ES6 JS.
Runs on XAMPP (`http://localhost/Vape%20Website/`), any static server (`http://localhost:8010/`), or directly from the file system.

## Ordering & Compliance
- **WhatsApp-first ordering** to `+971 56 284 8450` (single product + full cart, pre-typed AED totals)
- **18+ age gate** (ESMA), `localStorage` persisted, cannot be bypassed with Escape/backdrop
- Free-delivery threshold: **150 AED** · Delivery fee: **20 AED**

## File Map
| File | Contract |
|---|---|
| `index.html` | Markup + inline SVG sprite. IDs/classes are the JS/CSS contract — do NOT rename. |
| `assets/css/style.css` | Design system. Mobile-first. Theme engine via `html[data-theme]` + `html[data-accent]`. |
| `assets/js/main.js` | `PRODUCTS[]` catalog, cart (`localStorage`), WhatsApp builder, modals, carousel, countdown, theme picker. |

## Design System
- Fonts: **Outfit** (display) · **Plus Jakarta Sans** (body)
- Token-driven colors: `--bg --surface --ink --body --muted --line` + accent vars `--emerald --ac-d --emerald-ink`
- **Theme engine**: `data-theme = light | dark | midnight` (light = default) · `data-accent = emerald | azure | violet | amber | rose` · persisted in `localStorage` (`vcd_theme`, `vcd_accent`)
- **Floating color picker FAB** (bottom-right) opens panel with 3 themes + 5 accents + reset

## Feature Checklist
- [x] Announcement marquee + EN/العربية toggle + AED chip
- [x] Sticky glass header + desktop nav + mobile menu drawer
- [x] **Compact animated hero carousel** — 3 slides, staggered copy entrance, shine sweep, autoplay progress dots, swipe, prev/next
- [x] Live Dubai dispatch **countdown** (23:00 UTC+4 cut-off)
- [x] Trust badges (2h delivery · ESMA · COD · 24/7 WhatsApp)
- [x] 17-product catalog across IQOS ILUMA / TEREA (ID·JP·CH·KZ·IT) / disposables / pods / e-liquids
- [x] Category filter pills + result count
- [x] Product cards: origin flags, badges, AED price, stock line, hover zoom, Quick View
- [x] Sections: Shop · Best Sellers · TEREA by Origin · Disposables · Reviews · FAQ accordion · WhatsApp CTA · footer w/ legal warning
- [x] Slide-over cart drawer: qty +/−, remove, subtotal, delivery logic, animated free-shipping progress, WhatsApp checkout
- [x] Live search modal (`/` shortcut) with category chips
- [x] Quick View modal with qty picker + direct WhatsApp buy
- [x] Mobile bottom app-bar (Home · Shop · WhatsApp · Cart · Search)
- [x] Toasts, reveal-on-scroll, `prefers-reduced-motion` support, `:focus-visible`, skip link
- [x] Theme picker FAB + Light/Dark/Midnight + 5 accent colors
- [ ] main.js final restore (quick view, search, age gate, carousel, countdown, theme switcher) — **in progress**
- [ ] Full verification pass (syntax + HTTP + tag balance)

## Responsive Rules
- < 768px: mobile app experience (bottom nav, 2-col product grid, compact hero banner w/ horizontal layout, ≤380px extra-tight)
- 768–1023px: 3-col grid, trust ×2, desktop header
- ≥ 1024px: 4-col grid, hero with side visual (164px art), trust ×4

## Next (backlog, not started)
- Real product photography in `assets/images/`
- Arabic (RTL) full translation
- Product detail pages / multi-page version

## Change Log — 2026-09-08 (hero refinement round)
- [x] Hero strip pills removed; slide title now sits at the top (aligned with dots)
- [x] One CTA per slide (Add to Cart / Shop TEREA / Shop Disposables)
- [x] Countdown relocated as a slim pill strip UNDER the hero card — single-line on mobile (long label hidden < 520px), wider pill on desktop
- [x] Real product photos downloaded into `assets/images/` (hero-iluma.webp, hero-terea.png, hero-vape.png) layered over SVG art; `onerror` falls back to SVG art automatically

## Change Log — 2026-09-08 (round 2: slider UX)
- [x] Finger-drag swipe with live follow (0.85x travel) + snap-back; ignores taps on buttons/links
- [x] Countdown is an in-card bottom strip (full-width, thin, backdrop-blur); slide content reserves space
- [x] Responsive countdown cells (30px mobile / roomier on desktop)
- [x] 3 distinct slide layouts: S1 image-right · S2 image-left (row-reverse) · S3 image top-center
- [x] 3 distinct entrance animations: S1 glide-from-right · S2 spring zoom-rotate · S3 drop-blur
- [x] Dots wrapped in glass chip; animated accent ring border on hero card
- [x] Hi-res product photos (iluma 33KB webp, terea 438KB png, vozol 157KB png) with SVG fallback

## Change Log — 2026-09-08 (round 3: finalized hero)
- [x] All 3 slides use Slide-1 layout (copy-left / image-right); variant classes removed
- [x] Fixed card height: 286px mobile, 300px (<=380px), 316px desktop; active slide is position:absolute
- [x] Dots shrunk (16px/30px, glass chip 4px padding)
- [x] Countdown strip slimmer (6px pad, 26px cells, 11.5px digits, 13px icon)
- [x] Per-product countdowns: S1 Express dispatch 23:00 · S2 TEREA restock 20:00 · S3 Flash deal 17:00 (+ dynamic label via #dTitle)
- [x] Time-change animation: staggered cellTick digit roll on slide switch + subtle roll on minute change
- [x] Per-slide entrance animations retained (glide / spring-zoom / drop-blur)

## ROUND 4 PLAN — 2026-09-08 (executing next, in order)

### A. Hero stroke + countdown polish (eye-catchy)
1. Replace masked ring `hero-shell::before` with clean border: `1px color-mix(emerald 30%, line)` + soft emerald glow + inner top highlight (cross-browser safe).
2. Countdown strip: emerald-tinted gradient bg, cells with 2px emerald bottom accent, pulsing separators, uppercase micro label.

### B. Product pages (separate per product)
3. `assets/js/catalog.js` — shared catalog + helpers (WA_NUMBER, PRODUCTS, esc, fmt, mediaBg, waLink…).
4. `main.js` strips its duplicate definitions; `index.html` loads catalog.js BEFORE main.js.
5. `product.html?id=<productId>` — dedicated page: breadcrumb back, big photo/SVG art, single badge, price, qty stepper, Add to Cart (SHARED localStorage cart), WhatsApp buy, specs, trust rows, "You may also like" grid, theme attrs restored from localStorage, age-gate guard (redirects to home if unverified).

### C. Quick view fixes
6. Responsive: panel `max-height: calc(100dvh - 28px)`, internal scroll, sticky close — never overflows mobile screen.
7. Quick View trigger becomes a single round EYE icon at the right-center of product media (no text pill). Desktop: appears on hover; touch: always visible.
8. Quick view gets a "View full details →" link to product.html.

### D. Product card rules
9. Max ONE badge per product (priority: -X% sale > Hot > New > 100% Original).
10. Product name links to product.html?id=…

### E. Verification
11. JS syntax ×2, tag balance, HTTP probes on :8010 (index + product.html?id=…), ID contract check.

## Change Log — 2026-09-08 (round 4 DONE)
- [x] Hero stroke: clean emerald-tinted border + glow + inset highlight (mask ring removed)
- [x] Countdown strip: emerald gradient tint, accented cell underlines, pulsing separators, micro-uppercase label
- [x] `assets/js/catalog.js` shared catalog (constants, 17 products, helpers, single-badge rule); main.js deduped; load order in index.html
- [x] `product.html?id=<id>` + `product-page.js` — full product pages (photo/SVG art, qty, shared cart, WhatsApp buy, specs, trust rows, related grid, theme restore, age-gate redirect)
- [x] Quick view: max-height 100dvh w/ sticky close (no mobile overflow), "View full details →" link to product page
- [x] Quick View trigger: single round eye icon at right-center of card media (hover on desktop, visible on touch)
- [x] ONE badge per product (sale > hot > new > original); product names link to product.html

## ROUND 5 PLAN — 2026-09-08 (executing in order)

### A. Hero cleanup
1. REMOVE the in-card countdown strip completely (markup + JS tick + per-slide cutoff data).
2. ADD a slim FLASH DEAL strip above the hero card (amber gradient, shimmer sweep, pulsing bolt, Shop-now link).
3. Reclaim slide padding (no dispatch reserve).

### B. Replace trust badges with "SHOP BY VAPE CATEGORIES"
4. Delete the 4 trust cards; insert 12-tile quick-category grid (subtitle "…in Dubai" + big label + icon):
   VAPE KIT, POD KIT, DISPOSABLE, DISPOSABLE KIT, HEATING DEVICE, SALTNIC JUICE, E JUICE, TANK, PODS, COILS, BATTERIES, ACCESSORIES
   → each tile scrolls to shop grid + applies mapped filter (pod / disposables / iluma / eliquid / all).
5. Grid: 2 cols mobile · 3 ≥640 · 4 ≥960 · 6 ≥1180.

### C. Quick View redesign (buyer-focused)
6. Only real-buyer info: photo stage, name, flavor line, price, stock, qty.
7. Multi-image gallery: real photo + render view thumb switcher.
8. NO internal scrollbar: fixed header (category chip + flag + close) + fixed footer (qty stepper, details-eye icon, Add btn, WA buy btn).

### D. Add-to-Cart celebration flow
9. On add: cart drawer OPENS first (nice animation) → item row enters with glow highlight → free-delivery progress animates; crossing 150 AED fires "unlocked" shine + 🎉 toast.

### E. Cleanup & verify
10. Remove dead countdown JS, verify syntax/tags/HTTP.

## Change Log — 2026-09-08 (round 5 DONE)
- [x] Countdown strip removed completely (markup, CSS reserve, JS tick, data attrs)
- [x] FLASH DEAL shimmer strip above hero ("Free TEREA with every ILUMA · Today only")
- [x] Trust cards replaced with SHOP BY VAPE CATEGORIES: 12 tiles (icon + "…in Dubai" subtitle + label) → filter-mapped scroll targets
- [x] Quick View redesigned: buyer-only info, photo+render gallery thumbs, sticky header (cat chip + flag + close), fixed footer (qty, details-eye, Add, WA), zero internal scroll
- [x] Add-to-cart celebration: drawer opens first → item row glow highlight → progress animate → 150 AED cross fires "unlocked" shine + 🎉 toast

## ROUND 6 PLAN — 2026-09-08 (executing in order)

### A. Popular categories (4 tiles w/ photo backgrounds)
1. Section shows ONLY 4 popular cats: HEATING DEVICE, DISPOSABLE, POD KIT, SALTNIC JUICE.
2. Each tile gets a product photo BEHIND the card content at low, controllable opacity (CSS var --cat-o, brightens on hover). Fallback: SVG art if photo missing.
3. Download Caliburn G3 (pod) + e-liquid bottle photos; fallback to 2 existing photos + art.

### B. "View All" → all-categories popup
4. Ghost button beside section title opens #catModal with ALL category tiles (12 SEO names + TEREA).
5. Tiles in popup link to the new category page.

### C. Separate category page — category.html?cat=<key>
6. Shared `CATS` metadata in catalog.js (title, subtitle, desc, photo, theme).
7. Page top: rich category hero (gradient band, photo/art, title, description, count + delivery chips).
8. Below: that category's products grid (add-to-cart via SHARED localStorage cart, names link to product.html).
9. New `category-page.js` renderer; theme attrs restored; age-gate redirect to home.

### D. Verify: syntax ×3, tag balance, HTTP probes for all new routes.

## Change Log — 2026-09-08 (round 6 DONE)
- [x] Categories section: 4 popular tiles only (HEATING DEVICE / DISPOSABLE / POD KIT / SALTNIC JUICE)
- [x] Tile photo backgrounds with tunable opacity via `--cat-o` (0.16 idle → 0.30 on hover)
- [x] Downloaded Caliburn G3 lineup (cat-pod.jpg) + saltnic juice (cat-juice.jpg) photos
- [x] "All Categories" ghost button → #catModal popup with 13 tiles → links out to category pages
- [x] `category.html?cat=<key>` + `category-page.js`: rich category hero (photo/art, title, sub, desc, count + delivery chips) then category product grid (shared cart add + product.html links)
- [x] `CATS` metadata + `catProducts()` added to catalog.js

## Change Log — 2026-09-08 (round 7 DONE)
- [x] Compact popular category tiles: horizontal layout (icon chip left, title & subtitle right)
- [x] 3 prominent categories (HEATING DEVICE / DISPOSABLE / POD KIT) + 4th "+9 MORE CATEGORIES" tile linking to `#catModal`
- [x] 4-column responsive desktop layout for popular categories grid (`.cat-grid-pop`)
- [x] CSS rules added for `.cat-grid-pop`, `.cat-more`, `.more-n`, `.more-t` in `style.css`

## ROUND 8 — On-Site Website Direct Checkout (DONE)
- [x] Cart Drawer Dual Checkout:
  - Prominent WhatsApp Order button preserved (`#checkoutWa` — green, 1-2h fastest)
  - Added **"Checkout on Website (Cash / Card)"** button (`#btnOpenCheckout`)
- [x] Full-fledged **Website Checkout Modal** (`#checkoutModal`):
  - Live order summary preview (thumbnails, quantities, pricing, free delivery logic)
  - Delivery information form: Full Name, UAE Phone (+971), Emirate selector (Dubai, Sharjah, Ajman, Abu Dhabi, RAK, Fujairah, UAQ), Area, Address, Delivery Notes
  - Payment method selector: 💵 Cash on Delivery (COD) & 💳 Card Machine on Delivery (Visa/Mastercard/Apple Pay)
  - ESMA 18+ age confirmation checkbox
  - Order submission with unique order ID generation (`#VCD-XXXXX`)
  - Order history saved to `localStorage` (`vcd_orders`)
  - Instant Order Confirmation screen (`#checkoutSuccessView`) with details and direct **"Track Live Delivery on WhatsApp"** button
  - Auto-opens cart drawer when navigating to `index.html#cart` from product/category pages
- [x] Real product visual assets:
  - 3 ultra-luxurious 8K hero images in `assets/images/hero/`
  - 15 authentic UAE product photos in `assets/images/products/`
  - Fully mapped into `catalog.js` and rendered via `.prod-photo` in cards with hover zoom and SVG fallback
