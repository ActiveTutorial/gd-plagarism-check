const { getObjects } = require("./getObjects");
const { loadDB, saveDB, TYPES, TYPE_COUNT, BINS, BYTES_PER_BIN, FINGERPRINT_SIZE } = require("./db");
const SAMPLES = 4096;

// fingerprinting logic :sob:

function centroidNormalize(objects) {
  let sx = 0, sy = 0;
  for (const o of objects) {
    sx += o.x;
    sy += o.y;
  }
  const cx = sx / objects.length;
  const cy = sy / objects.length;

  return objects.map(o => ({
    type: o.type,
    x: o.x - cx,
    y: o.y - cy
  }));
}

function fingerprint(objects) {
  const bins = new Uint16Array(TYPE_COUNT * BINS);
  const groups = {};

  for (const t of TYPES) groups[t] = [];

  for (const o of objects) {
    if (groups[o.type]) groups[o.type].push(o);
  }

  for (let t = 0; t < TYPE_COUNT; t++) {
    const pts = groups[TYPES[t]];
    if (pts.length < 2) continue;

    const step = Math.max(1, Math.floor(pts.length / SAMPLES));
    let maxDist = 0;

    for (let i = 0; i < pts.length; i += step) {
      for (let j = i + step; j < pts.length; j += step) {
        const d = Math.hypot(
          pts[i].x - pts[j].x,
          pts[i].y - pts[j].y
        );
        if (d > maxDist) maxDist = d;
      }
    }
    if (maxDist === 0) maxDist = 1;

    const base = t * BINS;

    for (let i = 0; i < pts.length; i += step) {
      for (let j = i + step; j < pts.length; j += step) {
        const d = Math.hypot(
          pts[i].x - pts[j].x,
          pts[i].y - pts[j].y
        );
        const norm = d / maxDist;
        const bin = Math.min(BINS - 1, Math.floor(norm * BINS));
        bins[base + bin]++;
      }
    }
  }

  return Buffer.from(bins.buffer);
}

function similarity(a, b) {
  let dot = 0, na = 0, nb = 0;

  for (let i = 0; i < FINGERPRINT_SIZE; i += 2) {
    const va = a.readUInt16LE(i);
    const vb = b.readUInt16LE(i);
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }

  // Handle degenerate cases where one or both fingerprints are all-zeros.
  // If both are zero-vectors they should be considered identical (score=1).
  // If only one is zero, return 0 to avoid division-by-zero/NaN.
  if (na === 0 && nb === 0) return 1;
  if (na === 0 || nb === 0) return 0;

  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// exported API (file-based)

function addFromFile(arrayId, gmdFile) {
  const db = loadDB();
  if (db[arrayId]) throw new Error("array id already exists");

  const objects = getObjects(gmdFile);
  const norm = centroidNormalize(objects);
  const fp = fingerprint(norm);
  // Warn if parsing produced too few objects or an all-zero fingerprint.
  if (!Array.isArray(objects) || objects.length < 2) {
    console.warn(`WARNING: ${gmdFile} produced ${Array.isArray(objects) ? objects.length : 0} objects — fingerprint may be empty due to parsing issues.`);
  } else {
    let nonzero = 0, sum = 0;
    for (let i = 0; i < fp.length; i += 2) {
      const v = fp.readUInt16LE(i);
      if (v !== 0) nonzero++;
      sum += v;
    }
    if (nonzero === 0) {
      console.warn(`WARNING: fingerprint for ${gmdFile} has no nonzero bins (sum=${sum}) — check XML parsing or object extraction.`);
    }
  }
  db[arrayId] = fp;
  saveDB(db);
}

function detectFromFile(gmdFile, threshold = 0.85) {
  const db = loadDB();
  const objects = getObjects(gmdFile);
  const norm = centroidNormalize(objects);
  const fp = fingerprint(norm);

  // Warn if parsing produced too few objects or an all-zero fingerprint for detection.
  if (!Array.isArray(objects) || objects.length < 2) {
    console.warn(`WARNING: ${gmdFile} produced ${Array.isArray(objects) ? objects.length : 0} objects during detection — results may be incomplete.`);
  } else {
    let nonzero = 0, sum = 0;
    for (let i = 0; i < fp.length; i += 2) {
      const v = fp.readUInt16LE(i);
      if (v !== 0) nonzero++;
      sum += v;
    }
    if (nonzero === 0) {
      console.warn(`WARNING: detection fingerprint for ${gmdFile} has no nonzero bins (sum=${sum}) — check XML parsing or object extraction.`);
    }
  }

  const matches = [];
  for (const id in db) {
    const score = similarity(fp, db[id]);
    if (score >= threshold) {
      matches.push({ id: Number(id), score });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches;
}

module.exports = {
  addFromFile,
  detectFromFile
};
