import 'ts-node/register';
import * as fs from 'fs';
import * as path from 'path';

import { addFromFile, detectFromFile } from '../plag-detect/main';
import { getID } from '../gmd-api/load';

// Directory that contains the sample .gmd levels (relative to repo root)
const LEVEL_DIR = path.resolve(__dirname, '../../fingerprint-test-lvls');

// Files to add to the DB (these will be added)
const ADD_LEVEL_FILES = [
  'back-on-track.gmd',
  'polargeist.gmd',
  'stereo-madness.gmd',
  'bloodbath.gmd',
].map(f => path.join(LEVEL_DIR, f));

// Files to run detection on (includes an extra file that will NOT be added)
const DETECT_LEVEL_FILES = ADD_LEVEL_FILES.concat([
  path.join(LEVEL_DIR, 'polargeist-slightly-diffrent.gmd'),
  path.join(LEVEL_DIR, 'bloodbath-auto.gmd')
]);

// The database file used by plag-detect is at plag-detect/fingerprints.bin (repo root/plag-detect)
const DB_PATH = path.join(__dirname, '..', 'plag-detect', 'fingerprints.bin');

// Start fresh: remove existing DB so the test is deterministic
if (fs.existsSync(DB_PATH)) {
  try {
    fs.unlinkSync(DB_PATH);
    console.log('Removed existing DB at', DB_PATH);
  } catch (err) {
    console.error('Failed to remove DB:', err && (err as any).message ? (err as any).message : err);
  }
}

// Add each level to the plag-detect DB using its parsed id
// (only add the intended files; the slightly-different polargeist will NOT be added)
for (const file of ADD_LEVEL_FILES) {
  try {
    const id = getID(file as any);
    console.log(`Adding ${path.basename(file)} as id=${id}`);
    const addStart = process.hrtime.bigint();
    addFromFile(id, file as any);
    const addDurMs = Number(process.hrtime.bigint() - addStart) / 1e6;
    console.log(`  added in ${addDurMs.toFixed(2)}ms.`);
  } catch (err) {
    console.error(`Failed to add ${file}:`, err && (err as any).message ? (err as any).message : err);
  }
}

// Run detection for each file and print matches
console.log('\nDetection results:');
for (const file of DETECT_LEVEL_FILES) {
  try {
    console.log('\nDetecting for', path.basename(file));
    const detectStart = process.hrtime.bigint();
    const matches = detectFromFile(file as any);
    const detectDurMs = Number(process.hrtime.bigint() - detectStart) / 1e6;
    console.log(`  detection took ${detectDurMs.toFixed(2)}ms.`);
    if (matches.length === 0) {
      console.log('  no matches');
    } else {
      for (const m of matches) console.log(`  match id=${m.id} score=${m.score.toFixed(4)}`);
    }
  } catch (err) {
    console.error(`Detection failed for ${file}:`, err && (err as any).message ? (err as any).message : err);
  }
}

export {};
