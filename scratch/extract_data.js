/* One-time extraction: catalog.js -> data/products.json + data/categories.json */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'assets/js/catalog.js'), 'utf8');
let __out;
eval(src + '\n__out = { products: PRODUCTS, cats: CATS, labels: CAT_LABELS };');

const outDir = path.join(root, 'data');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, 'products.json'),
  JSON.stringify({ products: __out.products }, null, 2)
);

/* Extend category metadata so origin sub-pages get real heroes (SEO improvement) */
const cats = Object.assign({}, __out.cats);
const originExtras = {
  'terea-id': { title: 'TEREA Indonesia', sub: 'Indonesian TEREA in Dubai', desc: 'Fruity & cooling Indonesian-market TEREA sticks — sealed packs flown in weekly with verifiable batch codes.', photo: 'assets/images/hero-terea.png', theme: 'art-emerald', art: 'pack' },
  'terea-jp': { title: 'TEREA Japan', sub: 'Japanese TEREA in Dubai', desc: 'Smooth & rich Japanese-market TEREA sticks — sealed Japan packs with verified batch codes and weekly restock.', photo: 'assets/images/hero-terea.png', theme: 'art-navy', art: 'pack' },
  'terea-ch': { title: 'TEREA Swiss', sub: 'Swiss TEREA in Dubai', desc: 'Refined & balanced Swiss-market TEREA sticks — factory-sealed European stock for IQOS ILUMA devices.', photo: 'assets/images/hero-terea.png', theme: 'art-gold', art: 'pack' },
  'terea-kz': { title: 'TEREA Kazakhstan', sub: 'Kazakh TEREA in Dubai', desc: 'Bold classic blends from the Kazakhstan market — authentic sealed packs for IQOS ILUMA.', photo: 'assets/images/hero-terea.png', theme: 'art-rose', art: 'pack' },
  'terea-it': { title: 'TEREA Italy', sub: 'Italian TEREA in Dubai', desc: 'Aromatic Italian-market TEREA sticks — sealed European packs with verified batch codes.', photo: 'assets/images/hero-terea.png', theme: 'art-amber', art: 'pack' }
};
for (const [k, v] of Object.entries(originExtras)) {
  if (!cats[k]) cats[k] = v;
}

fs.writeFileSync(
  path.join(outDir, 'categories.json'),
  JSON.stringify({ cats, labels: __out.labels }, null, 2)
);

console.log('OK products:', __out.products.length, '| cats:', Object.keys(cats).length, '| labels:', Object.keys(__out.labels).length);
