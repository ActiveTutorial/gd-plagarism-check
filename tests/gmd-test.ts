import 'ts-node/register';
import * as path from 'path';
import { parseGMD } from '../gmd-api/main';
import { getObjects } from '../plag-detect/getObjects';
import { getID } from '../gmd-api/load';

const gmdFile = path.resolve(__dirname, '../../fingerprint-test-lvls/back-on-track.gmd');

const result = parseGMD(gmdFile as any);
console.log('\nLoaded Level String:');
console.log(result.levelString);

console.log('\nParsed Level Start Object:');
console.dir(result.levelStart, { depth: null });

console.log('\nParsed Objects:');
console.dir(result.objects, { depth: null });

console.log('\nLevel parsing complete.');

// Test getID function
const id = getID(gmdFile as any);
console.log('\nParsed Level ID:');
console.log(id);


// Test getObjects function
const items = getObjects(gmdFile as any);
console.log('\nObjects from getObjects():');
console.log(JSON.stringify(items, null, 2));

export {};
