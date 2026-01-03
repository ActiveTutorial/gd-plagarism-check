import * as fs from 'fs';
import * as path from 'path';

export const TYPES = ["solid", "hazard", "other", "none"] as const;
export const TYPE_COUNT = TYPES.length;

export const BINS = 128;
export const BYTES_PER_BIN = 2;
export const FINGERPRINT_SIZE = TYPE_COUNT * BINS * BYTES_PER_BIN;

export const DB_PATH = path.join(__dirname, 'fingerprints.bin');

export type DB = Record<number, Buffer>;

export function loadDB(): DB {
  if (!fs.existsSync(DB_PATH)) return {};
  const raw = fs.readFileSync(DB_PATH);
  const db: DB = {};
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

export function saveDB(db: DB): void {
  const buffers: Buffer[] = [];
  for (const id in db) {
    const buf = Buffer.alloc(4 + FINGERPRINT_SIZE);
    buf.writeUInt32BE(Number(id), 0);
    const fp = db[Number(id)];
    fp.copy(buf, 4);
    buffers.push(buf);
  }
  fs.writeFileSync(DB_PATH, Buffer.concat(buffers));
}

export default {
  loadDB,
  saveDB,
  TYPES,
  TYPE_COUNT,
  BINS,
  BYTES_PER_BIN,
  FINGERPRINT_SIZE,
};
