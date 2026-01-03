// fingerprint.ts
import { SimpleObject } from './getObjects';
import { TYPES, TYPE_COUNT, BINS, FINGERPRINT_SIZE } from './db';

const SAMPLES = 4096;

/**
 * Normalize objects by subtracting their centroid.
 * This makes the fingerprint translation-invariant.
 */
function centroidNormalize(objects: SimpleObject[]): SimpleObject[] {
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
    y: o.y - cy,
  }));
}

/**
 * Build a distance-distribution fingerprint for a set of objects.
 * Objects are grouped by type, distances are normalized per type,
 * and accumulated into fixed-size bins.
 */
function fingerprint(objects: SimpleObject[]): Buffer {
  const bins = new Uint16Array(TYPE_COUNT * BINS);
  const groups: Record<string, SimpleObject[]> = {};

  for (const t of TYPES) groups[t] = [];
  for (const o of objects) if (groups[o.type]) groups[o.type].push(o);

  for (let t = 0; t < TYPE_COUNT; t++) {
    const pts = groups[TYPES[t]];
    if (pts.length < 2) continue;

    let seed = ((t + 1) * (pts.length + 1)) | 0;
    const rand = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 0xffffffff;
    };

    const indices = Array.from({ length: pts.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const step = Math.max(1, Math.floor(pts.length / SAMPLES));
    const sampled = indices.filter((_, i) => i % step === 0);

    let maxDistSquared = 0;

    // Compute max distance in one pass
    for (let i = 0; i < sampled.length; i++) {
      const a = pts[sampled[i]];
      for (let j = i + 1; j < sampled.length; j++) {
        const b = pts[sampled[j]];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > maxDistSquared) maxDistSquared = distSq;
      }
    }
    if (maxDistSquared === 0) maxDistSquared = 1;

    const base = t * BINS;

    // Fill histogram using squared distance, avoid sqrt
    for (let i = 0; i < sampled.length; i++) {
      const a = pts[sampled[i]];
      for (let j = i + 1; j < sampled.length; j++) {
        const b = pts[sampled[j]];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const norm = Math.sqrt((dx * dx + dy * dy) / maxDistSquared);
        const bin = Math.min(BINS - 1, Math.floor(norm * BINS));
        bins[base + bin]++;
      }
    }
  }

  return Buffer.from(bins.buffer);
}

/**
 * Cosine similarity between two fingerprints.
 */
function similarity(a: Buffer, b: Buffer): number {
  let dot = 0, na = 0, nb = 0;

  for (let i = 0; i < FINGERPRINT_SIZE; i += 2) {
    const va = a.readUInt16LE(i);
    const vb = b.readUInt16LE(i);
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }

  if (na === 0 && nb === 0) return 1;
  if (na === 0 || nb === 0) return 0;

  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export {
  centroidNormalize,
  fingerprint,
  similarity,
};
