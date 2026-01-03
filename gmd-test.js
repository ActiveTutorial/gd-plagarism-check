const path = require('path');
const { parseGMD } = require('./gmd-api/main');
const { getObjects } = require('./plag-detect/getObjects');

const gmdFile = path.resolve(__dirname, '../one spike and block.gmd');

const result = parseGMD(gmdFile);
console.log('\nLoaded Level String:');
console.log(result.levelString);

console.log('\nParsed Level Start Object:');
console.dir(result.levelStart, { depth: null });

console.log('\nParsed Objects:');
console.dir(result.objects, { depth: null });

console.log('\nLevel parsing complete.');

// If run directly, also run the simplified objects extractor and print JSON
if (require.main === module) {
	const items = getObjects(gmdFile);
	console.log('\nObjects from getObjects():');
	console.log(JSON.stringify(items, null, 2));
}
