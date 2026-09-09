<?php
/**
 * VCD Head renderer — full SEO meta, Open Graph, Twitter cards,
 * JSON-LD structured data, PWA links. Driven by data/seo.json.
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

/**
 * @param array $m  title, description, keywords, robots, canonical (abs),
 *                  og_type, og_image (rel path), jsonld (list of schema arrays),
 *                  body_attrs (string)
 */
function render_head(array $m): void
{
    global $VCD_SETTINGS, $VCD_SEO;

    $brand    = trim(($VCD_SETTINGS['brand_name'] ?? 'VAPE CLUB') . ' ' . ($VCD_SETTINGS['brand_tagline'] ?? ''));
    $title    = (string) ($m['title'] ?? $brand);
    $desc     = (string) ($m['description'] ?? '');
    $keywords = (string) ($m['keywords'] ?? '');
    $robots   = (string) ($m['robots'] ?? 'index, follow');
    $canon    = (string) ($m['canonical'] ?? site_url('/'));
    $ogType   = (string) ($m['og_type'] ?? 'website');
    $ogImage  = (string) ($m['og_image'] ?? '');
    if ($ogImage === '') {
        $ogImage = (string) ($VCD_SEO['default_og_image'] ?? '');
    }
    $ogImageAbs = $ogImage !== '' ? site_url($ogImage) : '';
    $twCard   = (string) ($VCD_SEO['twitter_card'] ?? 'summary_large_image');
    $twSite   = (string) ($VCD_SEO['twitter_site'] ?? '');
    $theme    = (string) ($VCD_SETTINGS['theme_color'] ?? '#070A0F');
    $jsonld   = is_array($m['jsonld'] ?? null) ? $m['jsonld'] : [];
    $cssVer   = '2.6';
    ?>
<!DOCTYPE html>
<html lang="en" dir="ltr" data-theme="dark" data-accent="emerald">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title><?= e($title) ?></title>
  <meta name="description" id="metaDesc" content="<?= e($desc) ?>">
<?php if ($keywords !== ''): ?>
  <meta name="keywords" content="<?= e($keywords) ?>">
<?php endif; ?>
  <meta name="robots" content="<?= e($robots) ?>">
  <meta name="author" content="<?= e($brand) ?>">
  <meta name="geo.region" content="<?= e($VCD_SEO['geo_region'] ?? 'AE-DU') ?>">
  <meta name="geo.placename" content="Dubai">
  <link rel="canonical" id="canonicalUrl" href="<?= e($canon) ?>">
  <meta name="theme-color" content="<?= e($theme) ?>">

  <!-- Open Graph -->
  <meta property="og:type" content="<?= e($ogType) ?>">
  <meta property="og:site_name" content="<?= e($brand) ?>">
  <meta property="og:title" id="ogTitle" content="<?= e($title) ?>">
  <meta property="og:description" id="ogDesc" content="<?= e($desc) ?>">
  <meta property="og:url" id="ogUrl" content="<?= e($canon) ?>">
<?php if ($ogImageAbs !== ''): ?>
  <meta property="og:image" id="ogImage" content="<?= e($ogImageAbs) ?>">
<?php else: ?>
  <meta property="og:image" id="ogImage" content="">
<?php endif; ?>
  <meta property="og:locale" content="en_AE">

  <!-- Twitter -->
  <meta name="twitter:card" content="<?= e($twCard) ?>">
<?php if ($twSite !== ''): ?>
  <meta name="twitter:site" content="<?= e($twSite) ?>">
<?php endif; ?>
  <meta name="twitter:title" id="twTitle" content="<?= e($title) ?>">
  <meta name="twitter:description" id="twDesc" content="<?= e($desc) ?>">
  <meta name="twitter:image" id="twImage" content="<?= e($ogImageAbs) ?>">

  <!-- PWA & icons -->
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/images/icons/favicon-32.png">
  <link rel="apple-touch-icon" href="assets/images/icons/apple-touch-icon.png">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%2300E599' d='M13 2 4.5 13.5H11L9.5 22 19 9.5h-6.5L13 2z'/%3E%3C/svg%3E">
  <script>try{var r=document.documentElement;r.classList.add('js');var t=localStorage.getItem('vcd_theme')||'dark';r.dataset.theme=(t==='midnight'?'dark':t);r.dataset.accent='emerald'}catch(e){}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css?v=<?= e($cssVer) ?>">
<?php foreach ($jsonld as $schema): ?>
  <script type="application/ld+json"<?= ($schema['@type'] ?? '') === 'Product' ? ' id="productSchema"' : '' ?>><?= json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?></script>
<?php endforeach; ?>
<?php
    $extra = (string) ($VCD_SEO['extra_head_code'] ?? '');
    if ($extra !== '') {
        echo $extra . "\n";
    }
    ?>
</head>
<?php
}

/** Injects window.VCD so catalog.js / shop JS run entirely from the JSON store */
function render_vcd_script(): void
{
    global $VCD_SETTINGS, $VCD_PRODUCTS, $VCD_CATS, $VCD_LABELS, $VCD_SEO;
    $payload = [
        'waNumber'          => $VCD_SETTINGS['wa_number'] ?? '',
        'freeShipThreshold' => (float) ($VCD_SETTINGS['free_ship_threshold'] ?? 450),
        'deliveryFee'       => (float) ($VCD_SETTINGS['delivery_fee'] ?? 20),
        'qtyCap'            => (int) ($VCD_SETTINGS['qty_cap'] ?? 20),
        'orderPrefix'       => (string) ($VCD_SETTINGS['order_prefix'] ?? 'VCD'),
        'ratingValue'       => (string) ($VCD_SETTINGS['rating_value'] ?? '4.9'),
        'ratingCount'       => (string) ($VCD_SETTINGS['rating_count'] ?? '214'),
        'showRating'        => (bool) ($VCD_SETTINGS['show_rating'] ?? true),
        'currency'          => (string) ($VCD_SETTINGS['currency'] ?? 'AED'),
        'brandName'         => (string) ($VCD_SETTINGS['brand_name'] ?? 'VAPE CLUB'),
        'siteUrl'           => (string) ($VCD_SEO['site_url'] ?? ''),
        'searchChips'       => [['all','All'],['iluma','ILUMA'],['terea-id','🇮🇩 Indonesia'],['terea-jp','🇯🇵 Japan'],['terea-ch','🇨🇭 Swiss'],['disposables','🔥 10k+'],['pod','Pods'],['eliquid','E-Liquids']],
        'products'          => array_values($VCD_PRODUCTS),
        'cats'              => $VCD_CATS,
        'labels'            => $VCD_LABELS,
    ];
    echo '<script>window.VCD = ' . json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ";</script>\n";
}

/* ---------- JSON-LD builders ---------- */

function jsonld_local_business(): array
{
    global $VCD_SETTINGS;
    $brand = trim(($VCD_SETTINGS['brand_name'] ?? '') . ' ' . ($VCD_SETTINGS['brand_tagline'] ?? ''));
    return [
        '@context' => 'https://schema.org',
        '@type'    => 'Store',
        'name'     => $brand,
        'url'      => site_url('/'),
        'telephone' => $VCD_SETTINGS['phone_tel'] ?? '',
        'email'    => $VCD_SETTINGS['email'] ?? '',
        'address'  => [
            '@type'           => 'PostalAddress',
            'streetAddress'   => $VCD_SETTINGS['address'] ?? '',
            'addressLocality' => 'Dubai',
            'addressCountry'  => 'AE',
        ],
        'openingHours' => 'Mo-Su 10:00-24:00',
        'priceRange'   => 'AED',
        'sameAs'       => array_values(array_filter([$VCD_SETTINGS['instagram_url'] ?? '', $VCD_SETTINGS['telegram_url'] ?? ''])),
    ];
}

function jsonld_website(): array
{
    return [
        '@context' => 'https://schema.org',
        '@type'    => 'WebSite',
        'name'     => 'Vape Club Dubai',
        'url'      => site_url('/'),
        'potentialAction' => [
            '@type'       => 'SearchAction',
            'target'      => ['@type' => 'EntryPoint', 'urlTemplate' => site_url('/index.php?q={search_term_string}')],
            'query-input' => 'required name=search_term_string',
        ],
    ];
}

function jsonld_faq_page(array $faqs): array
{
    return [
        '@context' => 'https://schema.org',
        '@type'    => 'FAQPage',
        'mainEntity' => array_map(fn($f) => [
            '@type' => 'Question',
            'name'  => strip_tags((string) ($f['q'] ?? '')),
            'acceptedAnswer' => ['@type' => 'Answer', 'text' => strip_tags((string) ($f['a'] ?? ''))],
        ], $faqs),
    ];
}

function jsonld_item_list(array $products, string $listName): array
{
    return [
        '@context' => 'https://schema.org',
        '@type'    => 'ItemList',
        'name'     => $listName,
        'itemListElement' => array_map(fn($p, $i) => [
            '@type'    => 'ListItem',
            'position' => $i + 1,
            'url'      => site_url('/product.php?id=' . rawurlencode((string) ($p['id'] ?? ''))),
            'name'     => $p['name'] ?? '',
        ], $products, array_keys($products)),
    ];
}

function jsonld_breadcrumb(array $items): array
{
    return [
        '@context' => 'https://schema.org',
        '@type'    => 'BreadcrumbList',
        'itemListElement' => array_map(fn($it, $i) => [
            '@type'    => 'ListItem',
            'position' => $i + 1,
            'name'     => $it['name'],
            'item'     => $it['url'],
        ], $items, array_keys($items)),
    ];
}
