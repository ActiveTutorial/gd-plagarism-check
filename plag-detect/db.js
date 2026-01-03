const fs = require('fs');
const path = require('path');

const TYPES = ["solid", "hazard", "other", "none"];
const TYPE_COUNT = TYPES.length;

const BINS = 128;
const BYTES_PER_BIN = 2;
const FINGERPRINT_SIZE = TYPE_COUNT * BINS * BYTES_PER_BIN;

const DB_PATH = path.join(__dirname, 'fingerprints.bin');

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

module.exports = {
  loadDB,
  saveDB,
  TYPES,
  TYPE_COUNT,
  BINS,
  BYTES_PER_BIN,
  FINGERPRINT_SIZE
};
