/* ============================================================
   SHARED CATALOG & HELPERS — loaded before main.js / product-page.js
   Do NOT redeclare these constants anywhere else (top-level const
   in classic scripts share the global lexical scope).
   ============================================================ */
'use strict';

/* Site data is injected by PHP (window.VCD) from the admin-managed JSON store.
   Fallbacks below keep the site working when opened as plain static files. */
const VCD = window.VCD || {};

const WA_NUMBER = VCD.waNumber || '971562848450';
const FREE_SHIP_THRESHOLD = VCD.freeShipThreshold || 450; // AED
const DELIVERY_FEE = VCD.deliveryFee || 20;               // AED
const QTY_CAP = VCD.qtyCap || 20;
const ORDER_PREFIX = VCD.orderPrefix || 'VCD';
const RATING_VALUE = VCD.ratingValue || '4.9';
const RATING_COUNT = VCD.ratingCount || '214';
const SHOW_RATING = VCD.showRating !== false;
const SITE_URL = VCD.siteUrl || location.origin;
const LS_CART = 'vcd_cart';
const LS_AGE = 'vape_age_verified';

const ART = { device: '#art-device', pack: '#art-pack', vape: '#art-vape', pod: '#art-pod', juice: '#art-juice' };

const PRODUCTS = (VCD.products && VCD.products.length) ? VCD.products : [
  {
    id: 'iluma-prime-remix',
    photo: 'assets/images/products/iluma_i_prime_purple.jpg',
    name: 'IQOS ILUMA i PRIME Remix — Electric Purple',
    brand: 'IQOS (Philip Morris International)',
    flavor: 'Smartcore Induction · Pause Mode · Touch Screen',
    cat: 'iluma',
    price: 440,
    old: 520,
    badges: ['new', 'orig'],
    art: 'device',
    theme: 'art-purple',
    stock: 'in',
    best: true,
    sku: 'ILUMA-PRIME-PURPLE-UAE',
    variants: {
      type: 'device',
      colors: [
        { id: 'purple', name: 'Electric Purple (Remix)', hex: '#8B5CF6', photo: 'assets/images/products/iluma_i_prime_purple.jpg' },
        { id: 'black', name: 'Obsidian Black', hex: '#1E293B', photo: 'assets/images/products/iluma_i_one_remix.jpg' },
        { id: 'bronze', name: 'Breeze Gold & Bronze', hex: '#D97706', photo: 'assets/images/products/iluma_i_breeze_blue.jpg' }
      ],
      bundles: [
        { id: 'device_only', label: 'Device Kit Only', priceDiff: 0, note: 'Complete holder & pocket charger set' },
        { id: 'bundle_1pack', label: 'Device + 1x TEREA Pack (+120 AED)', priceDiff: 120, note: 'Choose any TEREA pack on delivery' },
        { id: 'bundle_carton', label: 'Device + 1x TEREA Carton (+1,150 AED)', priceDiff: 1150, note: 'Full 10-pack carton (200 sticks) · Free 1h Delivery' }
      ]
    },
    specs: [
      'Bladeless Smartcore Induction heating',
      'Pause mode + holder touch screen',
      '2 consecutive uses per charge',
      '12-month UAE warranty handled by us'
    ],
    specsTable: {
      'Device Model': 'IQOS ILUMA i PRIME (Remix Flagship Edition)',
      'Heating System': 'Smartcore Induction System™ (Bladeless)',
      'Compatible Sticks': 'TEREA™ Induction Sticks only (Do not use Heets)',
      'Consecutive Uses': 'Up to 3 uses without holder recharge',
      'Pocket Charger Capacity': 'Up to 20 uses per full charge',
      'Charging Time': 'Approx. 135 minutes via USB-C fast charging',
      'Holder Touch Screen': 'Digital LED battery & puff status indicator',
      'Pause Mode': 'Allows pausing your session for up to 8 minutes',
      'UAE ESMA Certification': 'UAE.S 5030 Compliant & Approved for GCC',
      'Warranty': '12 Months Official UAE Replacement Warranty'
    },
    boxContents: [
      '1x IQOS ILUMA i PRIME Holder',
      '1x Luxury Anodized Aluminum Pocket Charger',
      '1x USB Type-C Fast Charging Cable',
      '1x Official UAE AC Power Adapter',
      '1x Multilingual User Manual & Warranty Card'
    ],
    flavorMeter: { sweetness: 1, cooling: 0, throatHit: 4, intensity: 5 },
    description: `Experience the pinnacle of heated tobacco technology in Dubai. The IQOS ILUMA i PRIME Remix in Electric Purple represents Philip Morris International's most advanced innovation. Featuring the revolutionary bladeless Smartcore Induction System™, it heats tobacco from within the sealed TEREA stick without burning it, ensuring zero residue, no blade breakage, and absolutely no cleaning required.\n\nThe new touch screen on the holder shows your heating status, remaining puffs, and battery level at a glance. Featuring FlexPuff and Pause Mode, you can pause your session for up to 8 minutes and resume without wasting your stick. Available in Dubai, Sharjah, and Ajman with 1-2 hour express courier dispatch and official 12-month UAE warranty.`,
    faqs: [
      { q: 'Can I use regular HEETS in the IQOS ILUMA i PRIME?', a: 'No, IQOS ILUMA devices only work with TEREA sticks designed with internal metal heating elements. Traditional HEETS will not heat in ILUMA devices.' },
      { q: 'How fast can this be delivered in Dubai?', a: 'We offer express delivery across Dubai within 1 to 2 hours of order confirmation. Same-day delivery is also available across Sharjah, Ajman, and Abu Dhabi.' },
      { q: 'Is there a warranty in the UAE?', a: 'Yes, all IQOS devices purchased through Vape Club Dubai come with our 12-month local replacement warranty covering manufacturer hardware defects.' }
    ]
  },
  {
    id: 'iluma-i-one',
    photo: 'assets/images/products/iluma_i_one_remix.jpg',
    name: 'IQOS ILUMA i ONE — Midnight Black',
    brand: 'IQOS (Philip Morris International)',
    flavor: 'Compact all-in-one · 20 uses per charge',
    cat: 'iluma',
    price: 220,
    old: 260,
    badges: ['orig'],
    art: 'device',
    theme: 'art-slate',
    stock: 'in',
    best: false,
    sku: 'ILUMA-ONE-BLACK-UAE',
    variants: {
      type: 'device',
      colors: [
        { id: 'black', name: 'Midnight Black', hex: '#111827', photo: 'assets/images/products/iluma_i_one_remix.jpg' },
        { id: 'purple', name: 'Breeze Purple', hex: '#8B5CF6', photo: 'assets/images/products/iluma_i_prime_purple.jpg' },
        { id: 'blue', name: 'Azure Blue', hex: '#0284C7', photo: 'assets/images/products/iluma_i_breeze_blue.jpg' }
      ],
      bundles: [
        { id: 'device_only', label: 'Device Kit Only', priceDiff: 0, note: 'All-in-one pocket unit & USB-C cable' },
        { id: 'bundle_1pack', label: 'Device + 1x TEREA Pack (+120 AED)', priceDiff: 120, note: 'Includes 1 sealed TEREA pack of choice' },
        { id: 'bundle_carton', label: 'Device + 1x TEREA Carton (+1,150 AED)', priceDiff: 1150, note: 'Full 10-pack carton (200 sticks)' }
      ]
    },
    specs: [
      'All-in-one pocket format',
      '20 consecutive uses per charge',
      'USB-C fast charge',
      '100% sealed UAE stock'
    ],
    specsTable: {
      'Device Model': 'IQOS ILUMA i ONE (All-in-One Compact)',
      'Heating System': 'Smartcore Induction System™ (Bladeless)',
      'Compatible Sticks': 'TEREA™ Induction Sticks',
      'Uses per Charge': '20 consecutive sessions on single full charge',
      'Battery Capacity': 'Integrated 1728mAh rechargeable lithium cell',
      'Charging Time': 'Approx. 90 minutes via USB-C',
      'Cleaning Required': 'None (Sealed stick leaves zero tobacco crumbs)',
      'Dimensions': '121.6 x 30.6 x 16.4 mm',
      'ESMA Compliance': 'UAE.S 5030 Certified Legal Nicotine Heating Device'
    },
    boxContents: [
      '1x IQOS ILUMA i ONE All-in-One Device',
      '1x USB Type-C Charging Cable',
      '1x Power Adapter',
      '1x UAE Quick Start Manual'
    ],
    flavorMeter: { sweetness: 1, cooling: 0, throatHit: 4, intensity: 4 },
    description: `The IQOS ILUMA i ONE Midnight Black is the ultimate on-the-go heated tobacco solution for busy professionals and travelers in Dubai. Packed into a sleek, monolithic pocket device, it delivers 20 uninterrupted sessions on a single full charge without requiring a separate charger case.\n\nPowered by Philip Morris' bladeless Smartcore Induction technology, each TEREA stick is heated thoroughly and cleanly. No loose tobacco crumbs, no cleaning tools needed, and no smoke smell clinging to your car or clothes. 100% verified authentic stock with UAE fast dispatch.`,
    faqs: [
      { q: 'How many sticks can I use on one full charge?', a: 'The ILUMA i ONE provides up to 20 consecutive sessions per full charge, making it ideal for full-day use without carrying a charger.' },
      { q: 'Does it require cleaning brushes or swabs?', a: 'Zero cleaning is required. Because TEREA sticks are fully sealed at both ends, no tobacco debris or residue ever enters the heating chamber.' }
    ]
  },
  {
    id: 'iluma-i-standard',
    photo: 'assets/images/products/iluma_i_breeze_blue.jpg',
    name: 'IQOS ILUMA i Standard — Breeze Blue',
    brand: 'IQOS (Philip Morris International)',
    flavor: 'Classic holder + charger format',
    cat: 'iluma',
    price: 295,
    old: 330,
    badges: ['orig'],
    art: 'device',
    theme: 'art-navy',
    stock: 'in',
    best: false,
    sku: 'ILUMA-STD-BLUE-UAE',
    variants: {
      type: 'device',
      colors: [
        { id: 'blue', name: 'Breeze Blue', hex: '#0284C7', photo: 'assets/images/products/iluma_i_breeze_blue.jpg' },
        { id: 'black', name: 'Pebble Black', hex: '#1E293B', photo: 'assets/images/products/iluma_i_one_remix.jpg' },
        { id: 'purple', name: 'Electric Purple', hex: '#8B5CF6', photo: 'assets/images/products/iluma_i_prime_purple.jpg' }
      ],
      bundles: [
        { id: 'device_only', label: 'Device Kit Only', priceDiff: 0, note: 'Holder & Pocket Charger' },
        { id: 'bundle_1pack', label: 'Device + 1x TEREA Pack (+120 AED)', priceDiff: 120, note: 'Includes 1 sealed TEREA pack' },
        { id: 'bundle_carton', label: 'Device + 1x TEREA Carton (+1,150 AED)', priceDiff: 1150, note: 'Full 10-pack carton (200 sticks)' }
      ]
    },
    specs: [
      'Holder + pocket charger set',
      'Smartcore Induction — zero cleaning',
      '2 consecutive uses per charge',
      '12-month UAE warranty'
    ],
    specsTable: {
      'Device Model': 'IQOS ILUMA i Standard',
      'Format': 'Ergonomic Holder + Pocket Charger Set',
      'Heating System': 'Smartcore Induction System™ (Bladeless)',
      'Compatible Sticks': 'TEREA™ Sticks only',
      'Holder Sessions': '2 consecutive uses before returning to pocket charger',
      'Pocket Charger Capacity': 'Charges holder up to 20 times',
      'Charging Port': 'USB Type-C Fast Charge',
      'Warranty': '12-Month UAE Warranty'
    },
    boxContents: [
      '1x IQOS ILUMA i Holder',
      '1x IQOS ILUMA i Pocket Charger',
      '1x USB Type-C Cable',
      '1x AC Power Adapter',
      '1x User Manual'
    ],
    flavorMeter: { sweetness: 1, cooling: 0, throatHit: 4, intensity: 4 },
    description: `The iconic two-piece format, now perfected with Smartcore Induction. The IQOS ILUMA i Standard in Breeze Blue provides the comfortable in-hand feel of a lightweight pen holder paired with an elegant protective charging case. Offering 2 consecutive uses per charge and up to 20 uses from the pocket charger, it is the golden standard of modern tobacco heating in the UAE.`,
    faqs: [
      { q: 'Is this the original Philip Morris device?', a: 'Yes, all products sold by Vape Club Dubai are 100% genuine original sealed devices with verifiable serial numbers.' }
    ]
  },
  {
    id: 'terea-sun-pearl-id',
    photo: 'assets/images/products/terea_sun_pearl_italy.jpg',
    name: 'TEREA Sun Pearl — Indonesia Pack',
    brand: 'TEREA (Philip Morris Indonesia)',
    flavor: 'Watermelon-mint pearl capsule · cooling',
    cat: 'terea-id',
    price: 120,
    old: 145,
    badges: ['hot', 'orig'],
    art: 'pack',
    theme: 'art-emerald',
    flag: '🇮🇩',
    stock: 'in',
    best: true,
    sku: 'TEREA-SUN-PEARL-ID',
    variants: {
      type: 'packSize',
      packSizes: [
        { id: 'single', label: 'Single Pack (20 Sticks)', price: 120, old: 145, note: '1 Pack · 20 Sticks sealed' },
        { id: 'carton', label: 'Carton / 10 Packs (200 Sticks)', price: 1150, old: 1350, save: 'Save 50 AED', note: 'Full 10-pack sealed carton · Free Express Delivery' }
      ]
    },
    specs: [
      'Flown in weekly from Jakarta',
      '20 sticks · sealed box',
      'Click-capsule flavor burst',
      'Batch code verifiable'
    ],
    specsTable: {
      'Product Name': 'TEREA Sun Pearl Indonesia',
      'Origin': 'Indonesia (PT Philip Morris Indonesia)',
      'Flavor Profile': 'Smooth balanced tobacco with crushable juicy watermelon-mint pearl',
      'Menthol Intensity': '4 / 5 (After clicking pearl capsule)',
      'Packaging': '20 heatsticks per pack / 200 per carton',
      'Compatibility': 'IQOS ILUMA, ILUMA ONE, ILUMA PRIME devices ONLY',
      'Authenticity': 'Sealed duty-paid tax band with readable batch code'
    },
    boxContents: [
      '1x Sealed Pack of 20 TEREA Sun Pearl Sticks (or 10-pack carton depending on selection)'
    ],
    flavorMeter: { sweetness: 4, cooling: 4, throatHit: 3, intensity: 4 },
    description: `TEREA Sun Pearl from Indonesia is Dubai's undisputed #1 best-selling click-capsule heatstick. Each stick starts with a rich, toasted Indonesian tobacco aroma. When you press the pearl capsule embedded in the filter, a surge of chilled watermelon essence combined with crisp, frosted mint bursts onto your palate.\n\nFlown in directly from Jakarta weekly in temperature-controlled shipments to guarantee maximum freshness. Zero tobacco fallout, no messy blades, and clean vapor throughout your session.`,
    faqs: [
      { q: 'How do I activate the Sun Pearl flavor?', a: 'Simply press firmly on the pearl icon located on the filter of the stick before or during your session until you hear a crisp click. This releases the juicy watermelon-mint essence.' },
      { q: 'Is this carton sealed with the original Indonesian stamp?', a: 'Yes, every carton and pack is factory sealed with the official Indonesian revenue stamp and verifiable batch codes.' }
    ]
  },
  {
    id: 'terea-dimensions-yugen-id',
    photo: 'assets/images/products/terea_black_green_indonesia.jpg',
    name: 'TEREA Dimensions Yugen — Indonesia',
    brand: 'TEREA Dimensions Series',
    flavor: 'Pear · lavender · soft floral finish',
    cat: 'terea-id',
    price: 130,
    old: 0,
    badges: ['new', 'orig'],
    art: 'pack',
    theme: 'art-rose',
    flag: '🇮🇩',
    stock: 'in',
    best: false,
    sku: 'TEREA-DIM-YUGEN-ID',
    variants: {
      type: 'packSize',
      packSizes: [
        { id: 'single', label: 'Single Pack (20 Sticks)', price: 130, old: 150, note: '1 Pack · 20 Sticks' },
        { id: 'carton', label: 'Carton / 10 Packs (200 Sticks)', price: 1250, old: 1450, save: 'Save 50 AED', note: '10 Packs · Free Express Delivery' }
      ]
    },
    specs: [
      'Limited Dimensions series',
      '20 sticks · sealed box',
      'Smooth aromatic blend',
      'Batch code verifiable'
    ],
    specsTable: {
      'Product': 'TEREA Dimensions Yugen',
      'Collection': 'Master Chef Collaboration Dimensions Series',
      'Aroma Profile': 'Ripe pear, wild berries, lavender and chilled floral mist',
      'Tobacco Body': 'Light to medium roasted Virginia tobacco',
      'Cooling Level': '3 / 5 (Crisp soothing menthol finish)',
      'Compatibility': 'IQOS ILUMA series'
    },
    boxContents: ['1x Sealed Pack of 20 TEREA Dimensions Yugen Sticks'],
    flavorMeter: { sweetness: 3, cooling: 3, throatHit: 3, intensity: 4 },
    description: `Co-created with culinary master chefs, TEREA Dimensions Yugen is an exquisite sensory journey. It harmoniously weaves sweet ripe pear with delicate lavender botanicals and subtle berry undertones over a smooth, mellow Indonesian tobacco foundation. A sophisticated choice for discerning heatstick enthusiasts in the UAE.`,
    faqs: [
      { q: 'What is the Dimensions series?', a: 'The Dimensions series is Philip Morris’s ultra-premium collection formulated with master flavorists, offering complex multi-layered fruit and floral notes.' }
    ]
  },
  {
    id: 'terea-rich-regular-jp',
    photo: 'assets/images/products/terea_rich_regular_japan.jpg',
    name: 'TEREA Rich Regular — Japan',
    brand: 'TEREA (Japan Domestic Market)',
    flavor: 'Deep roasted tobacco · full body',
    cat: 'terea-jp',
    price: 140,
    old: 165,
    badges: ['hot', 'orig'],
    art: 'pack',
    theme: 'art-gold',
    flag: '🇯🇵',
    stock: 'in',
    best: true,
    sku: 'TEREA-RICH-REG-JP',
    variants: {
      type: 'packSize',
      packSizes: [
        { id: 'single', label: 'Single Pack (20 Sticks)', price: 140, old: 165, note: '1 Pack · 20 Sticks Japan Domestic' },
        { id: 'carton', label: 'Carton / 10 Packs (200 Sticks)', price: 1350, old: 1550, save: 'Save 50 AED', note: 'Full 10-pack Japan carton · Free Express Delivery' }
      ]
    },
    specs: [
      'Imported Japanese market stock',
      '20 sticks · sealed box',
      'Duty-free original seal',
      'Batch code verifiable'
    ],
    specsTable: {
      'Product': 'TEREA Rich Regular Japan Market',
      'Origin': 'Japan (PMI Japan Domestic Market)',
      'Aroma Notes': 'Deep toasted malt, roasted tobacco leaves, dark cocoa hints',
      'Body & Intensity': '5 / 5 (Full-bodied traditional tobacco hit)',
      'Menthol': '0 / 5 (Pure Non-menthol tobacco)',
      'Compatibility': 'IQOS ILUMA devices'
    },
    boxContents: ['1x Authentic Japan Sealed Pack of 20 TEREA Rich Regular Sticks'],
    flavorMeter: { sweetness: 1, cooling: 0, throatHit: 5, intensity: 5 },
    description: `For smokers transitioning to heated tobacco who demand an authentic, deeply satisfying cigarette-like body, TEREA Rich Regular from Japan is the gold standard. Carefully curated for the Japanese domestic market, it uses sun-cured and toasted tobaccos with rich nutty notes and zero artificial aftertaste. Delivered in Dubai within 1-2 hours.`,
    faqs: [
      { q: 'Is there any menthol in Rich Regular?', a: 'No, Rich Regular is 100% pure classic toasted tobacco with no menthol or mint additives.' }
    ]
  },
  {
    id: 'terea-mint-jp',
    photo: 'assets/images/products/terea_oasis_pearl_indonesia.jpg',
    name: 'TEREA Mint — Japan',
    brand: 'TEREA (Japan Domestic Market)',
    flavor: 'Crisp double mint · clean finish',
    cat: 'terea-jp',
    price: 140,
    old: 165,
    badges: ['orig'],
    art: 'pack',
    theme: 'art-navy',
    flag: '🇯🇵',
    stock: 'in',
    best: false,
    sku: 'TEREA-MINT-JP',
    variants: {
      type: 'packSize',
      packSizes: [
        { id: 'single', label: 'Single Pack (20 Sticks)', price: 140, old: 165, note: '1 Pack · 20 Sticks' },
        { id: 'carton', label: 'Carton / 10 Packs (200 Sticks)', price: 1350, old: 1550, save: 'Save 50 AED', note: '10 Packs · Free Express Delivery' }
      ]
    },
    specs: [
      'Imported Japanese market stock',
      '20 sticks · sealed box',
      'Duty-free original seal',
      'Batch code verifiable'
    ],
    specsTable: {
      'Origin': 'Japan (Direct Duty Free Import)',
      'Flavor Type': 'Crisp natural spearmint & clean peppermint',
      'Cooling Level': '4 / 5',
      'Tobacco Body': 'Medium'
    },
    boxContents: ['1x Japan TEREA Mint Pack (20 sticks)'],
    flavorMeter: { sweetness: 2, cooling: 4, throatHit: 3, intensity: 4 },
    description: `Imported straight from Tokyo, TEREA Mint Japan offers a pristine, icy spearmint sensation balanced with a mellow tobacco foundation. Unlike heavy sweet menthols, it leaves your palate feeling refreshed and clean after every puff.`,
    faqs: [{ q: 'Is Japanese TEREA better than European?', a: 'Japanese market TEREA is renowned worldwide for its superior leaf selection, consistent draw, and refined filtration.' }]
  },
  {
    id: 'terea-amber-ch',
    photo: 'assets/images/products/terea_teak_swiss.jpg',
    name: 'TEREA Amber — Switzerland',
    flavor: 'Woody · nutty · refined aroma',
    brand: 'TEREA Swiss Alps Reserve',
    cat: 'terea-ch',
    price: 150,
    old: 175,
    badges: ['hot', 'orig'],
    art: 'pack',
    theme: 'art-amber',
    flag: '🇨🇭',
    stock: 'in',
    best: true,
    sku: 'TEREA-AMBER-CH',
    variants: {
      type: 'packSize',
      packSizes: [
        { id: 'single', label: 'Single Pack (20 Sticks)', price: 150, old: 175, note: '1 Pack · 20 Swiss Sticks' },
        { id: 'carton', label: 'Carton / 10 Packs (200 Sticks)', price: 1450, old: 1650, save: 'Save 50 AED', note: 'Full 10-pack Swiss carton · Free 1h Delivery' }
      ]
    },
    specs: [
      'Swiss refined tobacco blend',
      '20 sticks · sealed box',
      'Duty-free original seal',
      'Batch code verifiable'
    ],
    specsTable: {
      'Origin': 'Neuchâtel, Switzerland (PMI R&D Center)',
      'Flavor Profile': 'Toasted woody notes with subtle nutty undertones',
      'Tobacco Body': 'Medium to full (Classic European blend)',
      'Menthol Level': '0 / 5 (Non-menthol)'
    },
    boxContents: ['1x Sealed Swiss TEREA Amber Pack (20 Sticks)'],
    flavorMeter: { sweetness: 1, cooling: 0, throatHit: 4, intensity: 4 },
    description: `Engineered in Neuchâtel, Switzerland, TEREA Amber represents the pinnacle of European heated tobacco refinement. It delivers a rich, rounded taste with fragrant woody tones and velvety hazelnut nuances. 100% original Swiss import stock in Dubai.`,
    faqs: [{ q: 'Is TEREA Amber similar to Heets Amber?', a: 'Yes, TEREA Amber carries the same beloved flavor profile of Heets Amber, but with bladeless Smartcore induction for a cleaner taste.' }]
  },
  {
    id: 'terea-turquoise-ch',
    photo: 'assets/images/products/terea_yellow_swiss.jpg',
    name: 'TEREA Turquoise — Switzerland',
    brand: 'TEREA Swiss Collection',
    flavor: 'Cool menthol wave · zesty',
    cat: 'terea-ch',
    price: 150,
    old: 0,
    badges: ['orig'],
    art: 'pack',
    theme: 'art-emerald',
    flag: '🇨🇭',
    stock: 'low',
    best: false,
    sku: 'TEREA-TURQ-CH',
    variants: {
      type: 'packSize',
      packSizes: [
        { id: 'single', label: 'Single Pack (20 Sticks)', price: 150, old: 170, note: '1 Pack · 20 Sticks' },
        { id: 'carton', label: 'Carton / 10 Packs (200 Sticks)', price: 1450, old: 1650, save: 'Save 50 AED', note: '10 Packs · Free Delivery' }
      ]
    },
    specs: [
      'Swiss menthol blend',
      '20 sticks · sealed box',
      'Duty-free original seal',
      'Batch code verifiable'
    ],
    specsTable: {
      'Origin': 'Switzerland',
      'Flavor Profile': 'Crisp menthol with citrusy zesty undertone',
      'Cooling': '3 / 5',
      'Compatibility': 'IQOS ILUMA Series'
    },
    boxContents: ['1x Swiss TEREA Turquoise Pack (20 Sticks)'],
    flavorMeter: { sweetness: 2, cooling: 3, throatHit: 3, intensity: 3 },
    description: `Crisp and revitalizing, TEREA Turquoise from Switzerland brings together a lightly toasted tobacco base with a brisk, soothing menthol wave accented by subtle zesty citrus notes.`,
    faqs: [{ q: 'Is Turquoise strong in menthol?', a: 'Turquoise is a mild-to-medium cooling menthol, perfect for all-day vaping without being overpowering.' }]
  },
  {
    id: 'terea-purple-kz',
    photo: 'assets/images/products/terea_purple_kazakhstan.jpg',
    name: 'TEREA Purple Wave — Kazakhstan',
    brand: 'TEREA Kazakhstan Collection',
    flavor: 'Forest berries · menthol twist',
    cat: 'terea-kz',
    price: 115,
    old: 135,
    badges: ['orig'],
    art: 'pack',
    theme: 'art-rose',
    flag: '🇰🇿',
    stock: 'in',
    best: false,
    sku: 'TEREA-PURPLE-KZ',
    variants: {
      type: 'packSize',
      packSizes: [
        { id: 'single', label: 'Single Pack (20 Sticks)', price: 115, old: 135, note: '1 Pack · 20 Sticks' },
        { id: 'carton', label: 'Carton / 10 Packs (200 Sticks)', price: 1100, old: 1250, save: 'Save 50 AED', note: '10 Packs · Best Value · Free 1h Delivery' }
      ]
    },
    specs: [
      'Kazakh market favorite',
      '20 sticks · sealed box',
      'Fruity-cool profile',
      'Batch code verifiable'
    ],
    specsTable: {
      'Origin': 'Kazakhstan (Official PMI Almaty Plant)',
      'Flavor Profile': 'Dark wild forest berries with refreshing menthol breeze',
      'Cooling': '3.5 / 5',
      'Compatibility': 'All IQOS ILUMA Models'
    },
    boxContents: ['1x Sealed Kazakhstan TEREA Purple Wave Pack'],
    flavorMeter: { sweetness: 3, cooling: 3.5, throatHit: 3, intensity: 4 },
    description: `A regional favorite across the GCC, TEREA Purple Wave Kazakhstan infuses wild dark forest berries, blueberries, and fragrant alpine botanicals with an icy menthol finish over rich tobacco. Outstanding value and authentic quality in Dubai.`,
    faqs: [{ q: 'Why is Kazakhstan TEREA more affordable?', a: 'Favorable regional duties allow us to offer authentic sealed Kazakhstan TEREA at a competitive price while maintaining genuine Philip Morris tobacco quality.' }]
  },
  {
    id: 'terea-bronze-it',
    photo: 'assets/images/products/terea_teak_swiss.jpg',
    name: 'TEREA Bronze — Italy',
    brand: 'TEREA Italian Reserve',
    flavor: 'Cocoa · dried fruit · velvet body',
    cat: 'terea-it',
    price: 135,
    old: 0,
    badges: ['new', 'orig'],
    art: 'pack',
    theme: 'art-orange',
    flag: '🇮🇹',
    stock: 'in',
    best: false,
    sku: 'TEREA-BRONZE-IT',
    variants: {
      type: 'packSize',
      packSizes: [
        { id: 'single', label: 'Single Pack (20 Sticks)', price: 135, old: 155, note: '1 Pack · 20 Sticks Italian Blend' },
        { id: 'carton', label: 'Carton / 10 Packs (200 Sticks)', price: 1280, old: 1450, save: 'Save 70 AED', note: 'Full 10-pack Italian carton · Free Delivery' }
      ]
    },
    specs: [
      'Italian aromatic blend',
      '20 sticks · sealed box',
      'Duty-free original seal',
      'Batch code verifiable'
    ],
    specsTable: {
      'Origin': 'Bologna, Italy (PMI European Manufacturing)',
      'Flavor Profile': 'Rich cocoa, dried fruits, velvety tobacco body',
      'Intensity': '4.5 / 5'
    },
    boxContents: ['1x Italian TEREA Bronze Pack (20 Sticks)'],
    flavorMeter: { sweetness: 2, cooling: 0, throatHit: 4, intensity: 4.5 },
    description: `Straight from Bologna, Italy, TEREA Bronze is a connoisseur's blend. Warm roasted tobacco is layered with notes of dark cacao, sun-dried raisins, and a touch of sweetness for a deep, velvety finish.`,
    faqs: [{ q: 'Is Italian TEREA sealed?', a: 'Yes, 100% factory sealed with Italian European excise seals.' }]
  },
  {
    id: 'vozol-gear-10k',
    photo: 'assets/images/products/vozol_gear_10000.jpg',
    name: 'Vozol Gear 10000 — Watermelon Ice',
    brand: 'Vozol Official UAE',
    flavor: '10,000 puffs · mesh coil · 50mg',
    cat: 'disposables',
    price: 65,
    old: 85,
    badges: ['hot', 'orig'],
    art: 'vape',
    theme: 'art-rose',
    stock: 'in',
    best: true,
    sku: 'VOZOL-GEAR-10K',
    variants: {
      type: 'vape',
      flavors: [
        { id: 'watermelon_ice', name: 'Watermelon Ice', note: 'Sweet chilled melon slice' },
        { id: 'blue_razz', name: 'Blue Razz Ice', note: 'Tangy blueberry raspberry slush' },
        { id: 'cool_mint', name: 'Cool Mint', note: 'Ultra-crisp Arctic blast' },
        { id: 'strawberry_kiwi', name: 'Strawberry Kiwi', note: 'Juicy ripe summer berries' },
        { id: 'mango_peach', name: 'Mango Peach Smoothie', note: 'Tropical nectar blend' }
      ],
      strengths: [
        { id: '50mg', label: '50mg (5% Salt Nic)', note: 'Maximum satisfying throat hit' },
        { id: '20mg', label: '20mg (2% Smooth)', note: 'Gentle, EU-compliant salt nic' }
      ],
      bundles: [
        { id: '1pc', label: '1 Piece', priceDiff: 0, note: 'Individual retail pack' },
        { id: '3pack', label: '3-Pack Bundle (Save 25 AED)', priceDiff: 110, note: 'Total 3 vapes (175 AED) · Mix flavors on WhatsApp' },
        { id: '10pack', label: 'Box of 10 (Wholesale 520 AED)', priceDiff: 455, note: 'Full box · Best price in UAE' }
      ]
    },
    specs: [
      'Up to 10,000 puffs',
      'Mesh coil — no fade flavor',
      'USB-C rechargeable',
      '20+ flavors in stock'
    ],
    specsTable: {
      'Device Model': 'Vozol Gear 10000 Outdoor Series',
      'Puff Capacity': 'Approx. 10,000 Puffs',
      'Coil Technology': 'VAMT Mesh Coil (Zero burnt taste)',
      'E-Liquid Capacity': '20ml Pre-filled Premium Salt Nic',
      'Nicotine Strength': '50mg (5%) or 20mg (2%)',
      'Battery Capacity': '500mAh USB-C Rechargeable',
      'Special Feature': 'Carabiner ring & hygienic silicone mouthpiece protector',
      'Certification': 'ESMA Compliant UAE Import'
    },
    boxContents: [
      '1x Vozol Gear 10000 Disposable Vape',
      '1x Removable Silicone Mouthpiece Cap',
      '1x Carabiner Clip Hook'
    ],
    flavorMeter: { sweetness: 4, cooling: 4.5, throatHit: 5, intensity: 5 },
    description: `The Vozol Gear 10000 is engineered for endurance and intense flavor delivery. Featuring a rugged outdoor casing with a removable hygienic mouthpiece cap and carabiner hook, it is Dubai's favorite high-capacity disposable vape. The advanced VAMT mesh coil maintains silky, dense vapor and vibrant taste from your first draw right down to the 10,000th puff. 45-minute Type-C fast charging ensures you never miss a beat.`,
    faqs: [
      { q: 'Can I recharge the Vozol Gear 10000?', a: 'Yes! It features a standard Type-C fast charging port on the base so you can utilize every single drop of the 20ml e-liquid.' },
      { q: 'How long does 10,000 puffs last?', a: 'For an average vaper taking 300 to 400 puffs per day, one Vozol Gear 10000 comfortably lasts between 2 to 3 weeks.' }
    ]
  },
  {
    id: 'tugboat-evo-4500',
    photo: 'assets/images/products/tugboat_evo_4500.jpg',
    name: 'Tugboat EVO 4500 — Mango Aloe',
    brand: 'Tugboat Vape Dubai',
    flavor: '4,500 puffs · 5% salt nic',
    cat: 'disposables',
    price: 45,
    old: 60,
    badges: ['orig'],
    art: 'vape',
    theme: 'art-amber',
    stock: 'in',
    best: true,
    sku: 'TUGBOAT-EVO-4500',
    variants: {
      type: 'vape',
      flavors: [
        { id: 'mango_aloe', name: 'Mango Aloe', note: 'Sweet Alphonso mango & soothing aloe' },
        { id: 'lush_ice', name: 'Lush Ice', note: 'Crisp iced watermelon' },
        { id: 'purple_rain', name: 'Purple Rain', note: 'Mixed forest berries & menthol' },
        { id: 'strawberry_banana', name: 'Strawberry Banana', note: 'Creamy tropical fruit smoothie' }
      ],
      strengths: [
        { id: '50mg', label: '50mg (5% Salt Nic)', note: 'Classic Tugboat hit' }
      ],
      bundles: [
        { id: '1pc', label: '1 Piece (45 AED)', priceDiff: 0, note: 'Single device' },
        { id: '3pack', label: 'Pack of 3 (120 AED)', priceDiff: 75, note: 'Save 15 AED' },
        { id: '10pack', label: 'Box of 10 (360 AED)', priceDiff: 315, note: 'Wholesale UAE Price' }
      ]
    },
    specs: [
      'Up to 4,500 puffs',
      'Sweet aloe finish',
      'Draw activated',
      'UAE most-sold disposable'
    ],
    specsTable: {
      'Device Model': 'Tugboat EVO 4500',
      'Puff Count': '4,500 Puffs',
      'Airflow Control': 'Adjustable bottom airflow ring (MTL to RDL)',
      'Battery': '850mAh Built-in Battery',
      'E-Liquid Volume': '10ml Pre-filled Salt Nicotine',
      'Nicotine Strength': '5% (50mg)',
      'Coil': '1.2 ohm Mesh Coil'
    },
    boxContents: ['1x Tugboat EVO 4500 Disposable Vape'],
    flavorMeter: { sweetness: 4, cooling: 3, throatHit: 4, intensity: 4 },
    description: `Tugboat EVO 4500 is one of the most trusted and consistent disposable vapes in the UAE market. With a built-in airflow control dial on the base, you can toggle between a tight cigarette-style draw and a breezy cloud. Mango Aloe pairs juicy ripe tropical mango with a soothing aloe vera exhale.`,
    faqs: [{ q: 'Does Tugboat EVO have airflow adjustment?', a: 'Yes, turn the airflow dial at the bottom to customize your vapor density and draw resistance.' }]
  },
  {
    id: 'fummo-prince-12k',
    photo: 'assets/images/products/fummo_prince_5000.jpg',
    name: 'Fummo Prince 12000 — Blue Razz',
    brand: 'Fummo Dubai',
    flavor: '12,000 puffs · Type-C fast charge',
    cat: 'disposables',
    price: 70,
    old: 90,
    badges: ['new', 'orig'],
    art: 'vape',
    theme: 'art-navy',
    stock: 'in',
    best: false,
    sku: 'FUMMO-PRINCE-12K',
    variants: {
      type: 'vape',
      flavors: [
        { id: 'blue_razz', name: 'Blue Razz Ice', note: 'Icy blue raspberries' },
        { id: 'watermelon_bubblegum', name: 'Watermelon Bubblegum', note: 'Sweet nostalgic candy' },
        { id: 'double_apple', name: 'Double Apple Shisha', note: 'Rich anise & red-green apples' },
        { id: 'grape_ice', name: 'Grape Ice', note: 'Sweet chilled Concord grapes' }
      ],
      strengths: [
        { id: '50mg', label: '50mg (5% Salt Nic)', note: 'Maximum satisfaction' },
        { id: '20mg', label: '20mg (2% Smooth)', note: 'Mild smooth vapor' }
      ],
      bundles: [
        { id: '1pc', label: '1 Piece (70 AED)', priceDiff: 0, note: 'Standard unit' },
        { id: '3pack', label: '3-Pack Bundle (190 AED)', priceDiff: 120, note: 'Save 20 AED' }
      ]
    },
    specs: [
      'Up to 12,000 puffs',
      'Smart LED puff display',
      'Type-C rechargeable',
      'Icy blue raspberry'
    ],
    specsTable: {
      'Device Model': 'Fummo Prince 12000 Smart LED',
      'Puff Count': '12,000 Puffs',
      'Screen Display': 'Smart LED showing exact battery % and juice level',
      'Coil': 'Dual Mesh Flavor Optimization Coil',
      'Capacity': '20ml Premium Salt Nic',
      'Charging': 'USB-C Ultra Fast Charge'
    },
    boxContents: ['1x Fummo Prince 12000 Smart Disposable Vape Device'],
    flavorMeter: { sweetness: 4, cooling: 4.5, throatHit: 4.5, intensity: 5 },
    description: `Never guess when your vape is running dry again. The Fummo Prince 12000 features a sleek digital display showing real-time battery percentage and remaining e-liquid volume. Dual mesh coil engineering guarantees thick, flavor-packed clouds from dawn till dusk.`,
    faqs: [{ q: 'What does the LED screen display?', a: 'The smart LED screen displays live battery percentage and oil drop indicators so you always know your remaining capacity.' }]
  },
  {
    id: 'podsalt-go-2500',
    photo: 'assets/images/products/pod_salt_go_2500.jpg',
    name: 'Pod Salt Go 2500 — Double Apple',
    brand: 'Pod Salt UK',
    flavor: '2,500 puffs · 20mg smooth salt',
    cat: 'disposables',
    price: 30,
    old: 40,
    badges: ['orig'],
    art: 'vape',
    theme: 'art-gold',
    stock: 'low',
    best: false,
    sku: 'PODSALT-GO-2500',
    variants: {
      type: 'vape',
      flavors: [
        { id: 'double_apple', name: 'Double Apple Shisha', note: 'Authentic Middle Eastern double apple' },
        { id: 'cuban_creme', name: 'Cuban Creme Cigar', note: 'Rich Cuban cigar with vanilla cream' },
        { id: 'mixed_berries', name: 'Mixed Berries Ice', note: 'Sweet berries with cool frost' }
      ],
      strengths: [
        { id: '20mg', label: '20mg (2% British Salt Nic)', note: 'Award-winning smooth nicotine salt' }
      ],
      bundles: [
        { id: '1pc', label: '1 Piece (30 AED)', priceDiff: 0, note: 'Compact pocket vape' },
        { id: '5pack', label: 'Pack of 5 (135 AED)', priceDiff: 105, note: 'Save 15 AED' }
      ]
    },
    specs: [
      'Up to 2,500 puffs',
      'Classic shisha flavor',
      'Pocket friendly',
      'Nicotine salts by Pod Salt UK'
    ],
    specsTable: {
      'Manufacturer': 'Pod Salt (United Kingdom)',
      'Puff Count': '2,500 Puffs',
      'Nicotine Type': 'Proprietary Nicotine Salt Formula (UK Lab Tested)',
      'Nicotine Strength': '20mg/ml (2%)',
      'Compliance': 'ESMA and TPD Certified'
    },
    boxContents: ['1x Pod Salt Go 2500 Disposable Vape'],
    flavorMeter: { sweetness: 3, cooling: 2, throatHit: 3.5, intensity: 4 },
    description: `Formulated in Great Britain with award-winning nicotine salt liquid, Pod Salt Go 2500 delivers exceptionally smooth satisfaction without the harsh throat bite. Double Apple captures authentic shisha aromas of crisp red and tart green apples with gentle anise spice.`,
    faqs: [{ q: 'Is 20mg nicotine enough?', a: 'Pod Salt’s UK salt formula absorbs faster in your body, providing equal satisfaction to higher doses while feeling gentler on your throat.' }]
  },
  {
    id: 'caliburn-g3',
    photo: 'assets/images/cat-pod.jpg',
    name: 'Uwell Caliburn G3 Pod Kit — Silver',
    brand: 'Uwell Official',
    flavor: '25W · 900mAh · top-fill pods',
    cat: 'pod',
    price: 140,
    old: 165,
    badges: ['orig'],
    art: 'pod',
    theme: 'art-navy',
    stock: 'in',
    best: false,
    sku: 'CALIBURN-G3-SILVER',
    variants: {
      type: 'podKit',
      colors: [
        { id: 'silver', name: 'Metallic Silver', hex: '#E2E8F0', photo: 'assets/images/cat-pod.jpg' },
        { id: 'black', name: 'Midnight Black', hex: '#0F172A', photo: 'assets/images/products/iluma_i_one_remix.jpg' },
        { id: 'blue', name: 'Cobalt Blue', hex: '#1D4ED8', photo: 'assets/images/products/iluma_i_breeze_blue.jpg' }
      ],
      resistance: [
        { id: '0.6ohm', label: '0.6Ω Meshed Pod (RDL / Freebase)', note: 'Warm cloud & rich vapor' },
        { id: '0.9ohm', label: '0.9Ω Meshed Pod (MTL / Salt Nic)', note: 'Tight draw & optimal nicotine hit' }
      ],
      bundles: [
        { id: 'kit_only', label: 'Standard Kit Only', priceDiff: 0, note: 'Includes device + 2 pods' },
        { id: 'kit_plus_pods', label: 'Kit + 4x Extra Replacement Pods (+55 AED)', priceDiff: 55, note: 'Complete full-month setup' }
      ]
    },
    specs: [
      '25W adjustable output',
      '900mAh all-day battery',
      'Top-fill 2ml pods (GCC legal)',
      'Official GCC stock'
    ],
    specsTable: {
      'Device Model': 'Uwell Caliburn G3 Pod System',
      'Maximum Output': 'Up to 25W adjustable wattage',
      'Battery Capacity': '900mAh internal battery',
      'Pod Resistance Options': '0.6Ω and 0.9Ω integrated coil pods',
      'Pod Capacity': '2ml (GCC & ESMA legal anti-leak top fill)',
      'Firing Modes': 'Button fire & auto-draw activation',
      'OLED Screen': 'Shows wattage, battery bar, puff counter, coil resistance'
    },
    boxContents: [
      '1x Uwell Caliburn G3 Device',
      '1x 0.6Ω Caliburn G3 Meshed Pod',
      '1x 0.9Ω Caliburn G3 Meshed Pod',
      '1x Type-C Fast Charging Cable',
      '1x User Manual'
    ],
    flavorMeter: { sweetness: 3, cooling: 2, throatHit: 4, intensity: 4 },
    description: `The Uwell Caliburn G3 is the undisputed benchmark of refillable pod kits. Upgraded with a crisp OLED display, adjustable power up to 25W, and ultrasonic welded anti-leak pods, it delivers unmatched flavor fidelity for both Nic Salts and Freebase e-liquids. Perfect for UAE vapers who want full control over their nicotine and coil resistance.`,
    faqs: [
      { q: 'Can I use salt nic in the Caliburn G3?', a: 'Yes! The 0.9Ω pod is specifically tuned for nicotine salt e-liquids (20mg to 50mg), providing a smooth and satisfying MTL draw.' }
    ]
  },
  {
    id: 'nasty-bad-blood',
    photo: 'assets/images/cat-juice.jpg',
    name: 'Nasty Juice 60ml — Bad Blood 3mg',
    brand: 'Nasty Juice Worldwide',
    flavor: 'Blackcurrant · subtle mint',
    cat: 'eliquid',
    price: 55,
    old: 70,
    badges: ['orig'],
    art: 'juice',
    theme: 'art-purple',
    stock: 'in',
    best: false,
    sku: 'NASTY-BAD-BLOOD-60ML',
    variants: {
      type: 'juice',
      strengths: [
        { id: '3mg', label: '3mg (Sub-Ohm Clouds)', note: 'Light throat hit for high wattage' },
        { id: '6mg', label: '6mg (Medium Hit)', note: 'Balanced satisfaction' },
        { id: '35mg_salt', label: '35mg Salt Nic (30ml Pod Bottle)', note: 'Special salt nic formulation' },
        { id: '50mg_salt', label: '50mg Salt Nic (30ml Pod Bottle)', note: 'Maximum nicotine hit for pod systems' }
      ],
      bundles: [
        { id: '1bottle', label: '1 Bottle (55 AED)', priceDiff: 0, note: 'Official tamper-sealed bottle' },
        { id: '2pack', label: 'Twin Pack (2x Bottles — 95 AED)', priceDiff: 40, note: 'Save 15 AED' }
      ]
    },
    specs: [
      '60ml shortfill bottle',
      '3mg freebase nicotine',
      'Award-winning Malaysian brand',
      'ESMA compliant import'
    ],
    specsTable: {
      'Brand': 'Nasty Juice (Malaysia)',
      'Flavor Profile': 'Sweet blackcurrant berries with subtle cooling mint',
      'VG / PG Ratio': '70% VG / 30% PG (Rich dense clouds)',
      'Bottle Size': '60ml Chubby Gorilla childproof bottle',
      'Nicotine Quality': 'USP Pharmaceutical Grade Nicotine',
      'Compliance': 'UAE ESMA Approved & Certified'
    },
    boxContents: ['1x 60ml Tamper-Evident Sealed Bottle of Nasty Juice Bad Blood'],
    flavorMeter: { sweetness: 4, cooling: 3, throatHit: 3, intensity: 5 },
    description: `One of the most celebrated e-liquids in vaping history, Nasty Juice Bad Blood blends the earthy sweetness of freshly picked ripe blackcurrants with a delicate, refreshing hint of mint. Smooth on the inhale and delightfully aromatic on the exhale. Formulated with 70/30 VG/PG for magnificent cloud production in Dubai.`,
    faqs: [
      { q: 'Is this genuine Nasty Juice?', a: 'Yes, every bottle includes the official Nasty Juice hologram authentication sticker and scratch-off QR code.' }
    ]
  }
];

const CAT_LABELS = VCD.labels || {
  all: 'All Products', iluma: 'IQOS ILUMA', 'terea-id': 'TEREA Indonesia', 'terea-jp': 'TEREA Japan',
  'terea-ch': 'TEREA Swiss', terea: 'TEREA Sticks', 'terea-kz': 'TEREA Kazakhstan', 'terea-it': 'TEREA Italy',
  disposables: 'Disposables 10k+', pod: 'Pod Systems', eliquid: 'E-Liquids', bestsellers: 'Best Sellers'
};

/* ---------- Shared helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const fmt = (n) => n.toLocaleString('en-US') + ' AED';
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function mediaBg(p) {
  return p.art === 'device' ? 'bg-device' : p.art === 'pack' ? 'bg-terea' : p.art === 'vape' ? 'bg-vape' : p.art === 'pod' ? 'bg-pod' : 'bg-juice';
}
function waLink(text) {
  return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
}

/* Parse cart key into base product ID and variant tag */
function parseCartKey(key) {
  if (!key) return { baseId: '', variantKey: '' };
  const str = String(key);
  const idx = str.indexOf('__');
  if (idx === -1) return { baseId: str, variantKey: '' };
  return { baseId: str.substring(0, idx), variantKey: str.substring(idx + 2) };
}

/* Resolve a cart key (with or without variant) to a fully qualified item */
function getItemVariant(cartKey) {
  const { baseId, variantKey } = parseCartKey(cartKey);
  const p = byId(baseId);
  if (!p) return null;

  let price = p.price;
  let variantLabel = '';
  let variantDetails = [];
  let photo = p.photo;

  if (variantKey) {
    const parts = variantKey.split('__');
    parts.forEach((tok) => {
      // Carton vs single pack
      if (tok === 'carton') {
        const c = p.variants?.packSizes?.find((x) => x.id === 'carton');
        if (c) {
          price = c.price;
          variantDetails.push(c.label);
        }
      }
      // Color
      if (tok.startsWith('col_')) {
        const cid = tok.replace('col_', '');
        const col = p.variants?.colors?.find((c) => c.id === cid);
        if (col) {
          variantDetails.push(col.name);
          if (col.photo) photo = col.photo;
        }
      }
      // Bundle
      if (tok.startsWith('bdl_')) {
        const bid = tok.replace('bdl_', '');
        const b = (p.variants?.bundles || []).find((x) => x.id === bid);
        if (b) {
          if (b.priceDiff) price += b.priceDiff;
          variantDetails.push(b.label);
        }
      }
      // Flavor
      if (tok.startsWith('flv_')) {
        const fid = tok.replace('flv_', '');
        const f = (p.variants?.flavors || []).find((x) => x.id === fid);
        if (f) variantDetails.push(f.name);
      }
      // Nicotine strength
      if (tok.startsWith('nic_')) {
        const nid = tok.replace('nic_', '');
        const s = (p.variants?.strengths || []).find((x) => x.id === nid);
        if (s) variantDetails.push(s.label);
      }
      // Pod resistance
      if (tok.startsWith('res_')) {
        const rid = tok.replace('res_', '');
        const r = (p.variants?.resistance || []).find((x) => x.id === rid);
        if (r) variantDetails.push(r.label);
      }
    });
    variantLabel = variantDetails.join(' · ');
  }

  return {
    key: cartKey,
    baseId: p.id,
    name: p.name,
    fullName: variantLabel ? p.name + ' [' + variantLabel + ']' : p.name,
    variantLabel,
    price,
    photo,
    theme: p.theme,
    art: p.art,
    cat: p.cat,
    flag: p.flag || '',
    badges: p.badges || []
  };
}

function singleWaText(p, qty, variantText = '') {
  const title = variantText ? p.name + ' [' + variantText + ']' : p.name;
  return (
    '*ORDER REQUEST - VAPE CLUB DUBAI*\n' +
    '---------------------------\n' +
    '• ' + title + ' (' + qty + 'x) - ' + (p.price * qty) + ' AED\n' +
    '---------------------------\n' +
    '*Total: ' + (p.price * qty) + ' AED*\n' +
    'Delivery: Dubai (Express 1-2h)\n' +
    'Please confirm my order!'
  );
}

/* ONE badge per product — priority: sale > hot > new > original */
function badgeHtml(p) {
  let b;
  if (p.old && p.old > p.price) {
    b = '<span class="badge badge-sale">-' + Math.round((1 - p.price / p.old) * 100) + '%</span>';
  } else if (p.badges && p.badges.includes('hot')) b = '<span class="badge badge-hot">Hot</span>';
  else if (p.badges && p.badges.includes('new')) b = '<span class="badge badge-new">New</span>';
  else b = '<span class="badge badge-orig">100% Original</span>';
  return '<div class="badge-stack">' + b + '</div>';
}

function loadCartRaw() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_CART) || '{}');
    return typeof raw === 'object' && raw !== null ? raw : {};
  } catch (e) { return {}; }
}

/* ---------- Category metadata (category page + tiles) ---------- */
const CATS = VCD.cats || {
  iluma: { title: 'Heating Device', sub: 'Best heating kit in Dubai', desc: 'Bladeless Smartcore induction devices — ILUMA i PRIME, ILUMA i and ILUMA i ONE. No blade, no cleaning — pure taste from TEREA sticks with up to 3 consecutive uses.', photo: 'assets/images/hero-iluma.webp', theme: 'art-purple', art: 'device' },
  pod: { title: 'Pod Kit', sub: 'Best pod kit in Dubai', desc: 'Rechargeable pod systems by Uwell, Vaporesso & SMOK — pocket-friendly MTL/RDL setups with 2ml GCC-legal pods and all-day batteries.', photo: 'assets/images/cat-pod.jpg', theme: 'art-navy', art: 'pod' },
  disposables: { title: 'Disposable', sub: 'Dubai best disposables', desc: 'Mega-puff disposables up to 12,000 puffs — Vozol, Tugboat, Fummo & Pod Salt. Mesh coil, Type-C charging and ice-cold flavors that never fade.', photo: 'assets/images/hero-vape.png', theme: 'art-rose', art: 'vape' },
  eliquid: { title: 'Saltnic Juice', sub: 'Saltnic vape juice in Dubai', desc: 'Premium 20–50mg salt nic e-liquids — Nasty Juice, Pod Salt and more. Smooth throat hit in ESMA-compliant bottles, 10–60ml.', photo: 'assets/images/cat-juice.jpg', theme: 'art-purple', art: 'juice' },
  terea: { title: 'TEREA Sticks', sub: 'TEREA by country in Dubai', desc: 'Authentic sealed TEREA packs flown in weekly from Indonesia, Japan, Switzerland, Kazakhstan and Italy — batch-code verifiable.', photo: 'assets/images/hero-terea.png', theme: 'art-gold', art: 'pack' }
};

function catProducts(key) {
  if (key === 'all') return PRODUCTS;
  if (key === 'terea') return PRODUCTS.filter((p) => p.cat.indexOf('terea-') === 0);
  return PRODUCTS.filter((p) => p.cat === key);
}
