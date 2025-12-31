const path = require('path');
const { parseGMD } = require('./gmd-api/main');

const gmdFile = path.resolve(__dirname, '../one spike and block.gmd');

try {
  const levelStart = parseGMD(gmdFile);
  console.log('\nLevel Start parsing complete.');
} catch (err) {
  console.error('Error parsing GMD file:', err.message);
}
