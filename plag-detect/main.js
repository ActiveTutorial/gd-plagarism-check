const fs = require("fs");
const path = require("path");
const { getObjects } = require("./getObjects");

const DB_PATH = path.join(__dirname, "fingerprints.bin");

const TYPES = ["solid", "hazard", "other", "none"];
const TYPE_COUNT = TYPES.length;

const BINS = 128;
const BYTES_PER_BIN = 2;
const FINGERPRINT_SIZE = TYPE_COUNT * BINS * BYTES_PER_BIN;
const SAMPLES = 4096;

/* ---------- internal ---------- */

function loadDB() {
  if (!fs.existsSync(DB_PATH)) return {};
  const raw = fs.readFileSync(DB_PATH);
  const db = {};
  let offset = 0;

  while (offset < raw.length) {
    const id = raw.readUInt32BE(offset);
    offset += 4;
    const fp = raw.slice(offset, offset + FINGERPRINT_SIZE);
    offset += FINGERPRINT_SIZE;
    db[id] = fp;
  }
  return db;
}

function saveDB(db) {
  const buffers = [];
  for (const id in db) {
    const buf = Buffer.alloc(4 + FINGERPRINT_SIZE);
    buf.writeUInt32BE(Number(id), 0);
    db[id].copy(buf, 4);
    buffers.push(buf);
  }
  fs.writeFileSync(DB_PATH, Buffer.concat(buffers));
}

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

  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/* ---------- exported API (file-based) ---------- */

function addFromFile(arrayId, gmdFile) {
  const db = loadDB();
  if (db[arrayId]) throw new Error("array id already exists");

  const objects = getObjects(gmdFile);
  const norm = centroidNormalize(objects);
  const fp = fingerprint(norm);

  db[arrayId] = fp;
  saveDB(db);
}

function detectFromFile(gmdFile, threshold = 0.85) {
  const db = loadDB();
  const objects = getObjects(gmdFile);
  const norm = centroidNormalize(objects);
  const fp = fingerprint(norm);

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
