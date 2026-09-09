const fs = require('fs');
let code = fs.readFileSync('assets/js/catalog.js', 'utf8');
code += '\nmodule.exports = { PRODUCTS, CATS };';
fs.writeFileSync('scratch/temp_catalog.js', code);
const { PRODUCTS, CATS } = require('./temp_catalog.js');
console.log("Total PRODUCTS:", PRODUCTS.length);
PRODUCTS.forEach((p, i) => {
  console.log(`${i+1}. id: "${p.id}", name: "${p.name}", cat: "${p.cat}", best: ${p.best}, price: ${p.price}`);
});
