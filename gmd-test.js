const path = require('path');
const { parseGMD } = require('./gmd-api/main');

const gmdFile = path.resolve(__dirname, '../one spike and block.gmd');

try {
  const result = parseGMD(gmdFile, { objectsOnly: false });
  console.log('\nLoaded Level String:');
  console.log(result.levelString);

  console.log('\nParsed Level Start Object:');
  console.dir(result.levelStart, { depth: null });

  console.log('\nParsed Objects:');
  console.dir(result.objects, { depth: null });

  console.log('\nLevel Start parsing complete.');
} catch (err) {
  console.error('Error parsing GMD file:', err.message);
}
