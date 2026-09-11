<?php
/**
 * IQOS ILUMA DEVICE GUIDE — guide-iluma.php
 * Comparison guide: ILUMA i PRIME vs ILUMA vs ILUMA ONE in Dubai & UAE.
 */
declare(strict_types=1);

require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/render.php';
require_once __DIR__ . '/lib/head.php';

$S = $VCD_SETTINGS;
$canonical = site_url('/guide-iluma.php');

$faqs = [
    [
        'q' => 'What is the main difference between IQOS ILUMA i PRIME, Standard ILUMA, and ILUMA ONE?',
        'a' => 'IQOS ILUMA i PRIME is the luxury flagship featuring an anodized aluminum body with an interchangeable magnetic wrap, Touch Screen display, Pause Mode, and FlexPuff technology. Standard ILUMA offers the classic pocket charger + separate holder design. ILUMA ONE is an ultra-compact all-in-one device allowing 20 consecutive uses on a single charge without a separate charger.'
    ],
    [
        'q' => 'Do IQOS ILUMA devices require cleaning like older IQOS 3 DUO?',
        'a' => 'No cleaning is ever required. IQOS ILUMA utilizes the Smartcore Induction System™ where the heating element is sealed inside each TEREA stick rather than on a fragile internal heating blade. There is zero tobacco residue and no blade to break.'
    ],
    [
        'q' => 'How long does the battery last on ILUMA i PRIME?',
        'a' => 'The pocket charger holds enough power for 20 experiences. The holder allows 2-3 consecutive sessions before needing to be placed back in the charger for a quick 1-minute 50-second top up.'
    ],
    [
        'q' => 'Can I get IQOS ILUMA delivered today in Dubai?',
        'a' => 'Yes. Vape Club Dubai provides 1-2 hour express courier delivery across Dubai, with direct Cash or Card payment upon delivery. Every device is 100% original and comes sealed with full warranty.'
    ]
];

$jsonld = [
    jsonld_breadcrumb([
        ['name' => 'Home', 'url' => site_url('/')],
        ['name' => 'Guides', 'url' => site_url('/#categories')],
        ['name' => 'IQOS ILUMA Device Guide', 'url' => $canonical]
    ]),
    jsonld_faq_page($faqs),
    [
        '@context' => 'https://schema.org',
        '@type'    => 'Article',
        'headline' => 'IQOS ILUMA vs ILUMA i PRIME vs ILUMA ONE Comparison Guide Dubai UAE',
        'image'    => site_url('assets/images/hero-iluma.png'),
        'author'   => ['@type' => 'Organization', 'name' => 'Vape Club Dubai'],
        'publisher'=> [
            '@type' => 'Organization',
            'name'  => 'Vape Club Dubai',
            'logo'  => ['@type' => 'ImageObject', 'url' => site_url('assets/images/branding/logo.png')]
        ],
        'datePublished' => '2026-01-20',
        'dateModified'  => date('Y-m-d'),
        'description'   => 'Complete comparison of IQOS ILUMA, ILUMA i PRIME, and ILUMA ONE devices in Dubai. Compare battery life, specs, prices, and same-day UAE delivery.'
    ]
];

render_head([
    'title'       => 'IQOS ILUMA vs ILUMA i PRIME vs ONE Comparison Guide Dubai | Vape Club',
    'description' => 'Detailed buyer guide comparing IQOS ILUMA i PRIME, Standard ILUMA, and ILUMA ONE in Dubai. Specs, battery life, prices in AED, and 1-2h express delivery across UAE.',
    'keywords'    => 'iqos iluma dubai, iqos iluma prime price uae, iqos iluma one dubai, buy iqos iluma, iqos comparison uae',
    'robots'      => 'index, follow',
    'canonical'   => $canonical,
    'og_type'     => 'article',
    'og_image'    => 'assets/images/hero-iluma.png',
    'jsonld'      => $jsonld
]);
?>
<body class="pd-body">
<?php require __DIR__ . '/includes/sprite.php'; ?>
<div class="backdrop" id="backdrop"></div>
<?php $backAnchor = '#categories'; require __DIR__ . '/includes/pdp-header.php'; ?>

<main class="pd-wrap container" style="max-width: 1040px; margin-inline: auto; padding-block: 28px 60px;">
  
  <nav class="pd-crumb" aria-label="Breadcrumb" style="margin-bottom: 20px;">
    <a href="/">Home</a> <span>/</span>
    <a href="/category.php?cat=iluma">IQOS ILUMA</a> <span>/</span>
    <strong style="color:var(--adm-text, #fff)">Device Comparison Guide</strong>
  </nav>

  <article class="cat-hero art-gold" style="border-radius: 20px; padding: 36px 30px; margin-bottom: 34px;">
    <div class="cat-hero-copy">
      <span class="eyebrow" style="letter-spacing:1px;">HARDWARE BUYER'S GUIDE · DUBAI</span>
      <h1 style="font-size: clamp(24px, 4vw, 36px); font-weight: 800; line-height: 1.25; margin: 10px 0 14px;">IQOS ILUMA vs. ILUMA i PRIME vs. ILUMA ONE</h1>
      <p style="font-size: 15.5px; line-height: 1.6; color: #cbd5e1; max-width: 780px;">
        Not sure which heat-not-burn model fits your lifestyle? Explore our comprehensive comparison of the latest <strong>Smartcore Induction System™</strong> devices available at Vape Club Dubai with 1-2 hour delivery.
      </p>
      <div class="cat-hero-chips" style="margin-top: 18px; display: flex; flex-wrap: wrap; gap: 10px;">
        <span class="chip"><svg class="icon icon-sm"><use href="#i-zap"/></svg> Next-Gen Induction Heating</span>
        <span class="chip"><svg class="icon icon-sm"><use href="#i-shield"/></svg> Zero Cleaning · No Blade</span>
        <span class="chip"><svg class="icon icon-sm"><use href="#i-truck"/></svg> 1-2h Delivery Across Dubai</span>
      </div>
    </div>
  </article>

  <!-- COMPARISON SPECS TABLE -->
  <section style="margin-bottom: 40px;">
    <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
      <span>⚡</span> Model Specifications &amp; Feature Comparison
    </h2>
    <div style="overflow-x: auto; background: var(--bg-card, #0f1520); border: 1px solid var(--border, rgba(255,255,255,0.08)); border-radius: 14px;">
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
        <thead>
          <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.08);">
            <th style="padding: 14px 18px; font-weight: 700;">Feature</th>
            <th style="padding: 14px 18px; font-weight: 700; color: #c084fc;">ILUMA i PRIME</th>
            <th style="padding: 14px 18px; font-weight: 700; color: #00e599;">Standard ILUMA</th>
            <th style="padding: 14px 18px; font-weight: 700; color: #38bdf8;">ILUMA ONE</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
            <td style="padding: 14px 18px; font-weight: 700;">Design &amp; Material</td>
            <td style="padding: 14px 18px;">Anodized aluminum + Luxury magnetic wrap</td>
            <td style="padding: 14px 18px;">Sleek pocket charger + Holder</td>
            <td style="padding: 14px 18px;">All-in-one compact handheld</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
            <td style="padding: 14px 18px; font-weight: 700;">Touch Display</td>
            <td style="padding: 14px 18px;"><span style="color:#00e599;font-weight:700;">✓ Touch Screen (New)</span></td>
            <td style="padding: 14px 18px;">LED Indicators</td>
            <td style="padding: 14px 18px;">LED Indicators</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
            <td style="padding: 14px 18px; font-weight: 700;">Consecutive Uses</td>
            <td style="padding: 14px 18px;">2 to 3 sessions (FlexPuff)</td>
            <td style="padding: 14px 18px;">2 consecutive sessions</td>
            <td style="padding: 14px 18px;"><span style="color:#00e599;font-weight:700;">20 consecutive sessions</span></td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
            <td style="padding: 14px 18px; font-weight: 700;">Pause Mode</td>
            <td style="padding: 14px 18px;"><span style="color:#00e599;font-weight:700;">✓ Up to 8 minutes pause</span></td>
            <td style="padding: 14px 18px;">✕</td>
            <td style="padding: 14px 18px;">✕</td>
          </tr>
          <tr>
            <td style="padding: 14px 18px; font-weight: 700;">Typical Price (Dubai)</td>
            <td style="padding: 14px 18px; font-weight: 700; color: #00e599;">From 399 AED</td>
            <td style="padding: 14px 18px; font-weight: 700; color: #00e599;">From 280 AED</td>
            <td style="padding: 14px 18px; font-weight: 700; color: #00e599;">From 160 AED</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- MODEL BREAKDOWN -->
  <section style="margin-bottom: 40px;">
    <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 18px; display: flex; align-items: center; gap: 10px;">
      <span>🏆</span> Which IQOS Should You Buy?
    </h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px;">
      
      <div style="background: var(--bg-card, #0f1520); border: 1px solid var(--border, rgba(255,255,255,0.08)); border-radius: 14px; padding: 22px;">
        <h3 style="font-size: 17px; margin: 0 0 6px; color: #c084fc;">Best for VIP Luxury: ILUMA i PRIME</h3>
        <p style="font-size: 13.5px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px;">The absolute pinnacle of heat-not-burn technology. The interactive touch screen shows real-time puff status and heating countdowns. Perfect for executives and luxury enthusiasts.</p>
        <a href="/product.php?id=1" class="btn btn-sm btn-primary" style="display:inline-flex; width:100%; justify-content:center;">Shop ILUMA i PRIME</a>
      </div>

      <div style="background: var(--bg-card, #0f1520); border: 1px solid var(--border, rgba(255,255,255,0.08)); border-radius: 14px; padding: 22px;">
        <h3 style="font-size: 17px; margin: 0 0 6px; color: #00e599;">Best All-Rounder: Standard ILUMA</h3>
        <p style="font-size: 13.5px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px;">The benchmark everyday device. Familiar holder and charger design with rapid induction technology. Ergonomic, lightweight, and durable.</p>
        <a href="/category.php?cat=iluma" class="btn btn-sm btn-primary" style="display:inline-flex; width:100%; justify-content:center;">Shop Standard ILUMA</a>
      </div>

      <div style="background: var(--bg-card, #0f1520); border: 1px solid var(--border, rgba(255,255,255,0.08)); border-radius: 14px; padding: 22px;">
        <h3 style="font-size: 17px; margin: 0 0 6px; color: #38bdf8;">Best for Portability: ILUMA ONE</h3>
        <p style="font-size: 13.5px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px;">The favorite for travelers and active users. Slip it into any pocket and enjoy 20 back-to-back sessions without needing to wait for a holder recharge.</p>
        <a href="/product.php?id=2" class="btn btn-sm btn-primary" style="display:inline-flex; width:100%; justify-content:center;">Shop ILUMA ONE</a>
      </div>

    </div>
  </section>

  <!-- FAQS ACCORDION -->
  <section style="margin-bottom: 40px;">
    <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 18px; display: flex; align-items: center; gap: 10px;">
      <span>❓</span> Common IQOS Questions in Dubai
    </h2>
    <div class="faq-list">
      <?php foreach ($faqs as $i => $faq): ?>
      <details class="faq-item" style="background: var(--bg-card, #0f1520); border: 1px solid var(--border, rgba(255,255,255,0.08)); border-radius: 12px; margin-bottom: 12px; padding: 14px 18px;">
        <summary style="font-weight: 700; font-size: 15px; cursor: pointer; color: var(--adm-text, #fff);"><?= e($faq['q']) ?></summary>
        <p style="margin: 12px 0 0; font-size: 14px; color: #94a3b8; line-height: 1.6;"><?= e($faq['a']) ?></p>
      </details>
      <?php endforeach; ?>
    </div>
  </section>

  <!-- ORDER CTA -->
  <div style="text-align: center; background: linear-gradient(135deg, rgba(0, 229, 153, 0.1), rgba(0, 168, 255, 0.08)); border: 1px solid rgba(0, 229, 153, 0.3); border-radius: 18px; padding: 32px 20px;">
    <h3 style="font-size: 20px; font-weight: 800; margin: 0 0 10px;">Get Your IQOS ILUMA in Dubai in 1-2 Hours</h3>
    <p style="font-size: 14.5px; color: #94a3b8; max-width: 540px; margin: 0 auto 20px;">All colors in stock: Pebble Beige, Moss Green, Sunset Red, Azure Blue, and Midnight Black. Cash or Card on delivery.</p>
    <div style="display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
      <a href="/category.php?cat=iluma" class="btn btn-primary"><svg class="icon"><use href="#i-box"/></svg> Browse All ILUMA Devices</a>
      <a href="<?= e(wa_link('Hello, I want to order an IQOS ILUMA device with 1-2 hour delivery')) ?>" class="btn btn-whatsapp js-open-wa-chat"><svg class="icon"><use href="#i-wa"/></svg> Order Now</a>
    </div>
  </div>

</main>

<?php require __DIR__ . '/includes/modals.php'; ?>
<?php render_vcd_script(); ?>
<script src="/assets/js/catalog.js?v=<?= VCD_ASSET_VER ?>"></script>
<script src="/assets/js/shop-shared.js?v=<?= VCD_ASSET_VER ?>"></script>
<script src="/assets/js/wa-chat.js?v=<?= VCD_ASSET_VER ?>"></script>
</body>
</html>
