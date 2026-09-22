<?php
/**
 * VCD Render helpers — PHP twins of the JS renderers so all public
 * markup can be served server-side (SEO) while JS re-renders the
 * identical DOM client-side for interactivity.
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

const VCD_ART = ['device' => '#art-device', 'pack' => '#art-pack', 'vape' => '#art-vape', 'pod' => '#art-pod', 'juice' => '#art-juice'];

function media_bg(array $p): string
{
    $art = $p['art'] ?? 'pack';
    return match ($art) {
        'device' => 'bg-device',
        'pack'   => 'bg-terea',
        'vape'   => 'bg-vape',
        'pod'    => 'bg-pod',
        default  => 'bg-juice',
    };
}

function art_use(array $p, string $extraClass = ''): string
{
    $art = '#art-' . ($p['art'] ?? 'pack');
    $cls = trim('prod-art ' . ($p['theme'] ?? '') . ($extraClass ? ' ' . $extraClass : ''));
    return '<svg class="' . e($cls) . '" aria-hidden="true"><use href="' . e($art) . '"/></svg>';
}

function rating_line(string $class = 'card-rating-line', string $scoreSuffix = ''): string
{
    global $VCD_SETTINGS;
    if (!($VCD_SETTINGS['show_rating'] ?? true)) {
        return '';
    }
    $score = (string) ($VCD_SETTINGS['rating_value'] ?? '4.9');
    return '<div class="' . $class . '"><span class="stars">★★★★★</span><span class="score">' . e($score . $scoreSuffix) . '</span></div>';
}

/** Sale % or NEW pill used on shop/category cards */
function card_pill(array $p): string
{
    $old = (float) ($p['old'] ?? 0);
    $price = (float) ($p['price'] ?? 0);
    if ($old > $price && $price > 0) {
        return '<span class="card-sale-pill">-' . round((1 - $price / $old) * 100) . '%</span>';
    }
    if (in_array('new', $p['badges'] ?? [], true)) {
        return '<span class="card-new-pill">NEW</span>';
    }
    return '';
}

/** badgeHtml() twin — PDP hero: sale > hot > new > original */
function badge_stack(array $p): string
{
    $old = (float) ($p['old'] ?? 0);
    $price = (float) ($p['price'] ?? 0);
    $badges = $p['badges'] ?? [];
    if ($old > $price && $price > 0) {
        $b = '<span class="badge badge-sale">-' . round((1 - $price / $old) * 100) . '%</span>';
    } elseif (in_array('hot', $badges, true)) {
        $b = '<span class="badge badge-hot">Hot</span>';
    } elseif (in_array('new', $badges, true)) {
        $b = '<span class="badge badge-new">New</span>';
    } else {
        $b = '<span class="badge badge-orig">100% Original</span>';
    }
    return '<div class="badge-stack">' . $b . '</div>';
}

function stock_html(array $p): string
{
    $stock = $p['stock'] ?? 'in';
    if ($stock === 'low') {
        return '<span class="card-stock stock-low"><span class="dot"></span>Low Stock</span>';
    }
    if ($stock === 'out') {
        return '<span class="card-stock stock-out"><span class="dot"></span>Out of Stock</span>';
    }
    return '<span class="card-stock"><span class="dot"></span>In Stock</span>';
}

/** main.js cardHtml() twin — home shop / terea / disposables grids */
function card_html(array $p): string
{
    $photo = !empty($p['photo'])
        ? '<img class="prod-photo" src="' . e($p['photo']) . '" alt="' . e($p['name'] ?? '') . '" loading="lazy" onerror="this.remove()">'
        : '';
    $price = '<span class="card-price">' . e($p['price'] ?? 0) . '<small> AED</small></span>'
        . (!empty($p['old']) ? '<span class="card-old">' . e($p['old']) . ' AED</span>' : '');
    return '<article class="card" data-id="' . e($p['id'] ?? '') . '" data-qv="' . e($p['id'] ?? '') . '" role="button" tabindex="0" aria-label="' . e($p['name'] ?? '') . '">'
        . '<div class="card-media ' . media_bg($p) . ' ' . e($p['theme'] ?? '') . '">'
        . card_pill($p) . $photo . art_use($p)
        . '</div>'
        . '<div class="card-body">'
        . rating_line()
        . '<h3 class="card-name" title="' . e($p['name'] ?? '') . '"><a href="/product.php?id=' . e($p['id'] ?? '') . '" style="color:inherit;text-decoration:none;">' . e($p['name'] ?? '') . '</a></h3>'
        . '<div class="card-price-row">' . $price . '</div>'
        . '<div class="card-actions">'
        . '<button class="add-btn" data-add="' . e($p['id'] ?? '') . '"><svg class="icon icon-sm"><use href="#i-wa"/></svg> Order Now</button>'
        . '</div>'
        . '</div>'
        . '</article>';
}

/** main.js vipBestCardHtml() twin */
function vip_card_html(array $p, int $index): string
{
    global $VCD_HOME;
    $ranks = $VCD_HOME['vip_section']['ranks'] ?? [];
    $meta = $ranks[$index] ?? ['rank' => '#' . ($index + 1), 'label' => 'BEST SELLER', 'class' => 'rank-gold', 'icon' => '👑'];
    $old = (float) ($p['old'] ?? 0);
    $price = (float) ($p['price'] ?? 0);
    $pct = ($old > $price && $price > 0) ? round((1 - $price / $old) * 100) : 0;
    $photo = !empty($p['photo'])
        ? '<img class="prod-photo" src="' . e($p['photo']) . '" alt="' . e($p['name'] ?? '') . '" loading="lazy" onerror="this.remove()">'
        : '';
    return '<article class="vip-card ' . e($meta['class']) . '" data-id="' . e($p['id'] ?? '') . '" data-qv="' . e($p['id'] ?? '') . '" role="button" tabindex="0" aria-label="' . e($p['name'] ?? '') . '">'
        . '<div class="vip-rank-pill"><span>' . e($meta['icon'] . ' ' . $meta['rank']) . '</span></div>'
        . ($pct > 0 ? '<span class="vip-sale-pill">-' . $pct . '%</span>' : '')
        . '<div class="vip-card-media ' . media_bg($p) . ' ' . e($p['theme'] ?? '') . '">' . $photo . art_use($p) . '</div>'
        . '<div class="vip-card-body">'
        . rating_line('vip-rating-line', ' · Verified')
        . '<h3 class="vip-card-name" title="' . e($p['name'] ?? '') . '"><a href="/product.php?id=' . e($p['id'] ?? '') . '" style="color:inherit;text-decoration:none;">' . e($p['name'] ?? '') . '</a></h3>'
        . '<div class="vip-price-box"><div class="vip-price-main">'
        . '<span class="vip-price">' . e($p['price'] ?? 0) . '<small> AED</small></span>'
        . (!empty($p['old']) ? '<span class="vip-old">' . e($p['old']) . ' AED</span>' : '')
        . '</div></div>'
        . '<div class="vip-card-actions">'
        . '<button class="vip-add-btn" data-add="' . e($p['id'] ?? '') . '"><svg class="icon icon-sm"><use href="#i-wa"/></svg> Order Now</button>'
        . '</div>'
        . '</div>'
        . '</article>';
}

/** category-page.js card twin (flag + stock line) */
function cat_card_html(array $p): string
{
    $photo = !empty($p['photo'])
        ? '<img class="rel-photo" src="' . e($p['photo']) . '" alt="' . e($p['name'] ?? '') . '" onerror="this.remove()">'
        : '';
    $flag = !empty($p['flag']) ? '<span class="origin-flag">' . e($p['flag']) . '</span>' : '';
    return '<article class="card" data-id="' . e($p['id'] ?? '') . '" data-qv="' . e($p['id'] ?? '') . '" role="button" tabindex="0" aria-label="' . e($p['name'] ?? '') . '">'
        . '<div class="card-media ' . media_bg($p) . ' ' . e($p['theme'] ?? '') . '">'
        . card_pill($p) . $flag . art_use($p) . $photo
        . '</div>'
        . '<div class="card-body">'
        . rating_line()
        . '<h3 class="card-name" title="' . e($p['name'] ?? '') . '"><a href="/product.php?id=' . e($p['id'] ?? '') . '" style="color:inherit;text-decoration:none;">' . e($p['name'] ?? '') . '</a></h3>'
        . stock_html($p)
        . '<div class="card-price-row">'
        . '<span class="card-price">' . e($p['price'] ?? 0) . '<small> AED</small></span>'
        . (!empty($p['old']) ? '<span class="card-old">' . e($p['old']) . ' AED</span>' : '')
        . '</div>'
        . '<div class="card-actions">'
        . '<button class="add-btn" data-add="' . e($p['id'] ?? '') . '"><svg class="icon icon-sm"><use href="#i-wa"/></svg> Order Now</button>'
        . '</div>'
        . '</div>'
        . '</article>';
}

/** product-page.js related-card twin */
function rel_card_html(array $p): string
{
    global $VCD_LABELS;
    $photo = !empty($p['photo'])
        ? '<img class="rel-photo" src="' . e($p['photo']) . '" alt="' . e($p['name'] ?? '') . '" onerror="this.remove()">'
        : '';
    $flag = !empty($p['flag']) ? '<span class="origin-flag">' . e($p['flag']) . '</span>' : '';
    return '<article class="card rel-card" data-id="' . e($p['id'] ?? '') . '" data-qv="' . e($p['id'] ?? '') . '" role="button" tabindex="0" title="Click to view details">'
        . '<div class="card-media ' . media_bg($p) . ' ' . e($p['theme'] ?? '') . '">'
        . badge_stack($p) . $flag . art_use($p) . $photo
        . '</div>'
        . '<div class="card-body">'
        . '<p class="card-cat">' . e($VCD_LABELS[$p['cat'] ?? ''] ?? ($p['cat'] ?? '')) . '</p>'
        . '<h3 class="card-name">' . e($p['name'] ?? '') . '</h3>'
        . '<div class="card-foot">'
        . '<div class="card-price-row">'
        . '<span class="card-price">' . e($p['price'] ?? 0) . '<small> AED</small></span>'
        . (!empty($p['old']) ? '<span class="card-old">' . e($p['old']) . ' AED</span>' : '')
        . '</div>'
        . '<button class="add-btn" data-add="' . e($p['id'] ?? '') . '" aria-label="Order Now"><svg class="icon"><use href="#i-wa"/></svg> Order Now</button>'
        . '</div>'
        . '</div>'
        . '</article>';
}
