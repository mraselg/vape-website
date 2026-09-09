<?php
/**
 * TEREA UAE FLAVOR & COUNTRY GUIDE — guide-terea.php
 * High-authority, commercial-intent SEO landing page for TEREA sticks in Dubai & UAE.
 */
declare(strict_types=1);

require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/render.php';
require_once __DIR__ . '/lib/head.php';

$S = $VCD_SETTINGS;
$canonical = site_url('/guide-terea.php');

$faqs = [
    [
        'q' => 'What is the main difference between TEREA Japan, Swiss, and Indonesia editions?',
        'a' => 'TEREA Japan is renowned for its ultra-smooth vapor, robust throat hit, and exotic menthol profiles like Black Menthol. TEREA Swiss offers a traditional, European refined tobacco taste similar to classic Marlboro/Parliament blends. TEREA Indonesia provides aromatic, aromatic-rich clove and herbal infusions at an accessible price point.'
    ],
    [
        'q' => 'Are TEREA sticks compatible with older IQOS 3 DUO or IQOS Multi devices?',
        'a' => 'No. TEREA sticks are exclusively designed for IQOS ILUMA series (ILUMA i PRIME, ILUMA, ILUMA ONE) which use bladeless induction heating. Inserting TEREA sticks into older blade devices will damage the heating blade.'
    ],
    [
        'q' => 'How fast can I get TEREA delivered in Dubai and Sharjah?',
        'a' => 'Vape Club Dubai offers 1-2 hour express delivery across all Dubai neighborhoods (Dubai Marina, Downtown, Business Bay, JBR, Palm Jumeirah) and 2-3 hour delivery to Sharjah and Ajman with Cash or Card on delivery.'
    ],
    [
        'q' => 'What are the top 3 best-selling TEREA flavors in Dubai?',
        'a' => 'The most popular flavors among UAE customers are: 1) TEREA Black Menthol (Japan) for intense cooling, 2) TEREA Purple Wave (Japan/Swiss) for rich berry aroma with mild menthol, and 3) TEREA Bronze (Swiss) for rich cocoa and warm tobacco depth.'
    ]
];

$jsonld = [
    jsonld_breadcrumb([
        ['name' => 'Home', 'url' => site_url('/')],
        ['name' => 'Guides', 'url' => site_url('/#categories')],
        ['name' => 'TEREA UAE Guide', 'url' => $canonical]
    ]),
    jsonld_faq_page($faqs),
    [
        '@context' => 'https://schema.org',
        '@type'    => 'Article',
        'headline' => 'The Ultimate TEREA UAE Guide — Japan vs Swiss vs Indonesia Editions in Dubai',
        'image'    => site_url('assets/images/hero-iluma.png'),
        'author'   => ['@type' => 'Organization', 'name' => 'Vape Club Dubai'],
        'publisher'=> [
            '@type' => 'Organization',
            'name'  => 'Vape Club Dubai',
            'logo'  => ['@type' => 'ImageObject', 'url' => site_url('assets/images/branding/logo.png')]
        ],
        'datePublished' => '2026-01-15',
        'dateModified'  => date('Y-m-d'),
        'description'   => 'Comprehensive comparison of TEREA Japan, Swiss, and Indonesian sticks for IQOS ILUMA in Dubai. Flavor notes, nicotine strength, and 1-2 hour UAE delivery details.'
    ]
];

render_head([
    'title'       => 'TEREA UAE Flavor & Country Editions Guide — Japan, Swiss, Indonesia | Vape Club Dubai',
    'description' => 'Detailed comparison of TEREA Japan, Swiss & Indonesia sticks for IQOS ILUMA in Dubai. Discover top-rated flavors, nicotine profiles, and order with 1-2h express UAE delivery.',
    'keywords'    => 'terea dubai, terea sticks uae, terea japan dubai, terea swiss uae, terea flavours comparison, buy terea online dubai',
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
    <a href="/category.php?cat=terea">TEREA</a> <span>/</span>
    <strong style="color:var(--adm-text, #fff)">Country Editions &amp; Flavor Guide</strong>
  </nav>

  <article class="cat-hero art-emerald" style="border-radius: 20px; padding: 36px 30px; margin-bottom: 34px;">
    <div class="cat-hero-copy">
      <span class="eyebrow" style="letter-spacing:1px;">DUBAI VAPE CONCIERGE · BUYER'S GUIDE</span>
      <h1 style="font-size: clamp(24px, 4vw, 36px); font-weight: 800; line-height: 1.25; margin: 10px 0 14px;">The Ultimate TEREA Sticks Guide in the UAE</h1>
      <p style="font-size: 15.5px; line-height: 1.6; color: #cbd5e1; max-width: 780px;">
        Everything you need to know about original <strong>TEREA Smartcore Induction Sticks™</strong> for IQOS ILUMA in Dubai. Compare flavors, throat hits, and characteristics across the <strong>Japan, Swiss, and Indonesian</strong> editions before ordering.
      </p>
      <div class="cat-hero-chips" style="margin-top: 18px; display: flex; flex-wrap: wrap; gap: 10px;">
        <span class="chip"><svg class="icon icon-sm"><use href="#i-zap"/></svg> 1-2h Dubai Express</span>
        <span class="chip"><svg class="icon icon-sm"><use href="#i-shield"/></svg> 100% Genuine ESMA Certified</span>
        <span class="chip"><svg class="icon icon-sm"><use href="#i-truck"/></svg> Cash / Card on Delivery</span>
      </div>
    </div>
  </article>

  <!-- COMPARISON TABLE SECTION -->
  <section style="margin-bottom: 40px;">
    <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
      <span>🌍</span> TEREA Country Editions Comparison
    </h2>
    <div style="overflow-x: auto; background: var(--bg-card, #0f1520); border: 1px solid var(--border, rgba(255,255,255,0.08)); border-radius: 14px;">
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
        <thead>
          <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.08);">
            <th style="padding: 14px 18px; font-weight: 700;">Edition</th>
            <th style="padding: 14px 18px; font-weight: 700;">Flavor Profile</th>
            <th style="padding: 14px 18px; font-weight: 700;">Cooling / Menthol</th>
            <th style="padding: 14px 18px; font-weight: 700;">Throat Hit</th>
            <th style="padding: 14px 18px; font-weight: 700;">Price (Carton)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
            <td style="padding: 14px 18px;"><strong>🇯🇵 TEREA Japan</strong></td>
            <td style="padding: 14px 18px; color: #cbd5e1;">Exotic fruit, intense mints, clean vapor finish</td>
            <td style="padding: 14px 18px;"><span style="color:#00e599;font-weight:700;">★★★★★ (High)</span></td>
            <td style="padding: 14px 18px;">Crisp &amp; Smooth</td>
            <td style="padding: 14px 18px; font-weight: 700; color: #00e599;">From 280 AED</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
            <td style="padding: 14px 18px;"><strong>🇨🇭 TEREA Swiss</strong></td>
            <td style="padding: 14px 18px; color: #cbd5e1;">Classic European rich tobacco, cocoa, subtle herbs</td>
            <td style="padding: 14px 18px;"><span style="color:#38bdf8;font-weight:700;">★★★☆☆ (Balanced)</span></td>
            <td style="padding: 14px 18px;">Traditional &amp; Bold</td>
            <td style="padding: 14px 18px; font-weight: 700; color: #00e599;">From 260 AED</td>
          </tr>
          <tr>
            <td style="padding: 14px 18px;"><strong>🇮🇩 TEREA Indonesia</strong></td>
            <td style="padding: 14px 18px; color: #cbd5e1;">Warm spices, sweet cloves, aromatic tobacco depth</td>
            <td style="padding: 14px 18px;"><span style="color:#fbbf24;font-weight:700;">★★★☆☆ (Moderate)</span></td>
            <td style="padding: 14px 18px;">Aromatic &amp; Warm</td>
            <td style="padding: 14px 18px; font-weight: 700; color: #00e599;">From 240 AED</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- POPULAR FLAVORS SHOWCASE -->
  <section style="margin-bottom: 40px;">
    <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 18px; display: flex; align-items: center; gap: 10px;">
      <span>⭐</span> Best Selling TEREA Flavors in Dubai
    </h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px;">
      
      <div style="background: var(--bg-card, #0f1520); border: 1px solid var(--border, rgba(255,255,255,0.08)); border-radius: 14px; padding: 20px;">
        <h3 style="font-size: 16px; margin: 0 0 8px; color: #00e599;">TEREA Black Menthol (Japan)</h3>
        <p style="font-size: 13.5px; color: #94a3b8; line-height: 1.5; margin-bottom: 14px;">The #1 best-seller in Dubai. Delivers an icy, freezing arctic burst combined with deep, rich roasted tobacco flavor.</p>
        <a href="/category.php?cat=terea-jp" class="btn btn-sm btn-primary" style="display:inline-flex; width:100%; justify-content:center;">View Japanese Edition</a>
      </div>

      <div style="background: var(--bg-card, #0f1520); border: 1px solid var(--border, rgba(255,255,255,0.08)); border-radius: 14px; padding: 20px;">
        <h3 style="font-size: 16px; margin: 0 0 8px; color: #c084fc;">TEREA Purple Wave (Swiss / Japan)</h3>
        <p style="font-size: 13.5px; color: #94a3b8; line-height: 1.5; margin-bottom: 14px;">Luscious dark forest berries infused with a cooling aromatic breeze. Perfect balance of sweet berry and satisfying tobacco.</p>
        <a href="/category.php?cat=terea-ch" class="btn btn-sm btn-primary" style="display:inline-flex; width:100%; justify-content:center;">View Swiss Edition</a>
      </div>

      <div style="background: var(--bg-card, #0f1520); border: 1px solid var(--border, rgba(255,255,255,0.08)); border-radius: 14px; padding: 20px;">
        <h3 style="font-size: 16px; margin: 0 0 8px; color: #fb923c;">TEREA Bronze (Swiss)</h3>
        <p style="font-size: 13.5px; color: #94a3b8; line-height: 1.5; margin-bottom: 14px;">A connoisseur's choice. Mellow tobacco with subtle notes of rich cocoa and dried fruits. Zero menthol, maximum tobacco authenticity.</p>
        <a href="/category.php?cat=terea-ch" class="btn btn-sm btn-primary" style="display:inline-flex; width:100%; justify-content:center;">Shop TEREA Bronze</a>
      </div>

    </div>
  </section>

  <!-- FAQS ACCORDION -->
  <section style="margin-bottom: 40px;">
    <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 18px; display: flex; align-items: center; gap: 10px;">
      <span>❓</span> Frequently Asked Questions About TEREA in Dubai
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

  <!-- EXPRESS ORDER CTA -->
  <div style="text-align: center; background: linear-gradient(135deg, rgba(0, 229, 153, 0.1), rgba(0, 168, 255, 0.08)); border: 1px solid rgba(0, 229, 153, 0.3); border-radius: 18px; padding: 32px 20px;">
    <h3 style="font-size: 20px; font-weight: 800; margin: 0 0 10px;">Ready for 1-2 Hour TEREA Delivery in Dubai?</h3>
    <p style="font-size: 14.5px; color: #94a3b8; max-width: 540px; margin: 0 auto 20px;">Browse our full in-stock collection of genuine Japanese, Swiss, and Indonesian TEREA cartons with instant WhatsApp order support.</p>
    <div style="display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
      <a href="/category.php?cat=terea" class="btn btn-primary"><svg class="icon"><use href="#i-cart"/></svg> Shop All TEREA Sticks</a>
      <a href="<?= e(wa_link('Hello, I want to order TEREA sticks with 1-2 hour delivery')) ?>" class="btn btn-whatsapp js-open-wa-chat"><svg class="icon"><use href="#i-wa"/></svg> Order on WhatsApp</a>
    </div>
  </div>

</main>

<?php require __DIR__ . '/includes/modals.php'; ?>
<?php render_vcd_script(); ?>
<script src="/assets/js/catalog.js?v=2.6"></script>
<script src="/assets/js/shop-shared.js?v=2.6"></script>
<script src="/assets/js/wa-chat.js?v=2.6"></script>
</body>
</html>
