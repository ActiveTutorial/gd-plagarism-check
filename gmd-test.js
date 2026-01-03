const path = require('path');
const { parseGMD } = require('./gmd-api/main');
const { getObjects } = require('./plag-detect/getObjects');
const { getID } = require('./gmd-api/load');

const gmdFile = path.resolve(__dirname, '../fingerprint-test-lvls/back-on-track.gmd');

const result = parseGMD(gmdFile);
console.log('\nLoaded Level String:');
console.log(result.levelString);

console.log('\nParsed Level Start Object:');
console.dir(result.levelStart, { depth: null });

console.log('\nParsed Objects:');
console.dir(result.objects, { depth: null });

console.log('\nLevel parsing complete.');

// Try to read and print the level id from the .gmd (second <i> node)
try {
	const id = getID(path.resolve(__dirname, '../fingerprint-test-lvls/back-on-track.gmd'));
	console.log('\nParsed Level ID:');
	console.log(id);
} catch (err) {
	console.error('\ngetID error:', err && err.message ? err.message : err);
}

// If run directly, also run the simplified objects extractor and print JSON
if (require.main === module) {
	const items = getObjects(path.resolve(__dirname, '../fingerprint-test-lvls/back-on-track.gmd'));
	console.log('\nObjects from getObjects():');
	console.log(JSON.stringify(items, null, 2));
}
