// main.js
import { getObjects } from './getObjects';
import { getID } from '../gmd-api/load';
import { loadDB, saveDB } from './db';
import { centroidNormalize, fingerprint, similarity } from './fingerprint';

// exported API (file-based)
export function addFromFile(gmdFile: string): void {
  const levelId = getID(gmdFile);
  const db = loadDB();
  if (db[levelId]) throw new Error('level id already exists');

  const objects = getObjects(gmdFile);
  const norm = centroidNormalize(objects);
  const fp = fingerprint(norm);

  if (!Array.isArray(objects) || objects.length < 2) {
    console.warn(
      `WARNING: ${gmdFile} produced ${Array.isArray(objects) ? objects.length : 0} objects — fingerprint may be empty due to parsing issues.`,
    );
  } else {
    let nonzero = 0, sum = 0;
    for (let i = 0; i < fp.length; i += 2) {
      const v = fp.readUInt16LE(i);
      if (v !== 0) nonzero++;
      sum += v;
    }
    if (nonzero === 0) {
      console.warn(
        `WARNING: fingerprint for ${gmdFile} has no nonzero bins (sum=${sum}) — check XML parsing or object extraction.`,
      );
    }
  }

  db[levelId] = fp;
  saveDB(db);
}

export function detectFromFile(gmdFile: string, threshold = 0.85) {
  const db = loadDB();
  const objects = getObjects(gmdFile);
  const norm = centroidNormalize(objects);
  const fp = fingerprint(norm);

  if (!Array.isArray(objects) || objects.length < 2) {
    console.warn(
      `WARNING: ${gmdFile} produced ${Array.isArray(objects) ? objects.length : 0} objects during detection — results may be incomplete.`,
    );
  } else {
    let nonzero = 0, sum = 0;
    for (let i = 0; i < fp.length; i += 2) {
      const v = fp.readUInt16LE(i);
      if (v !== 0) nonzero++;
      sum += v;
    }
    if (nonzero === 0) {
      console.warn(
        `WARNING: detection fingerprint for ${gmdFile} has no nonzero bins (sum=${sum}) — check XML parsing or object extraction.`,
      );
    }
  }

  const matches: Array<{ id: number; score: number }> = [];
  for (const id in db) {
    const score = similarity(fp, db[id]);
    if (score >= threshold) {
      matches.push({ id: Number(id), score });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches;
}

export default {
  addFromFile,
  detectFromFile,
};
