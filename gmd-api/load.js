const fs = require('fs');
const zlib = require('zlib');
const { XMLParser } = require('fast-xml-parser');

/**
 * Read a .gmd file and return the decoded level string from the second <s> node.
 * Robustness improvements:
 * - Accept URL-safe base64 and add proper padding.
 * - Detect gzip by magic bytes and fall back to returning raw utf8 if not compressed.
 * - Clearer errors and optional debug logging.
 *
 * @param {string} filePath - Path to the .gmd file
 * @param {{debug?: boolean}} [options]
 * @returns {string} decompressed UTF-8 level string
 */
function loadGMDString(filePath, options = {}) {
  const debug = Boolean(options.debug);

  if (!filePath || typeof filePath !== 'string') throw new Error('filePath must be a non-empty string');
  if (!fs.existsSync(filePath)) throw new Error(`File does not exist: ${filePath}`);

  if (debug) console.log(`Reading GMD file: ${filePath}`);
  const xmlData = fs.readFileSync(filePath, 'utf8');

  const parser = new XMLParser({ ignoreDeclaration: true, ignoreAttributes: false, textNodeName: '#text' });
  const jObj = parser.parse(xmlData);

  // Collect all <s> node contents using a compact recursive walker.
  const sNodes = [];
  (function walk(node) {
    if (node == null) return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (k === 's') {
          if (Array.isArray(v)) v.forEach(pushS);
          else pushS(v);
        } else {
          walk(v);
        }
      }
    }
  })(jObj);

  function pushS(v) {
    if (v == null) return;
    if (typeof v === 'string' || typeof v === 'number') return sNodes.push(String(v));
    if (typeof v === 'object') {
      if (v['#text'] !== undefined) return sNodes.push(String(v['#text']));
      // fallback: stringify the node to capture its content
      return sNodes.push(JSON.stringify(v));
    }
  }

  if (!Array.isArray(sNodes) || sNodes.length < 2) {
    throw new Error('Could not find second <s> node in XML');
  }

  const rawBase64 = String(sNodes[1]);
  if (debug) console.log('Raw base64 (possibly URL-safe):', rawBase64.slice(0, 60) + (rawBase64.length > 60 ? '...' : ''));

  // Convert URL-safe base64 to standard base64 and pad to length divisible by 4
  let base64 = rawBase64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad !== 0) base64 += '='.repeat(4 - pad);

  let buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch (err) {
    throw new Error('Invalid base64 data');
  }

  // If buffer is gzipped (0x1f 0x8b), gunzip it. Otherwise attempt gunzip then fall back to raw utf8.
  try {
    const isGzip = buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
    if (isGzip) {
      if (debug) console.log('Detected gzip header, decompressing...');
      return zlib.gunzipSync(buffer).toString('utf8');
    }

    // Not obviously gzipped: try gunzip (some data may still be gzipped) then fallback to raw utf8
    try {
      return zlib.gunzipSync(buffer).toString('utf8');
    } catch (e) {
      if (debug) console.log('Not gzipped or decompression failed; returning raw utf8');
      return buffer.toString('utf8');
    }
  } catch (e) {
    throw new Error('Failed to decode GMD string: ' + (e && e.message ? e.message : String(e)));
  }
}

/**
 * Read a .gmd file and return the integer id from the second <i> node.
 * The <i> node contains a plain integer string (not compressed/encoded).
 *
 * @param {string} filePath - Path to the .gmd file
 * @param {{debug?: boolean}} [options]
 * @returns {number} parsed integer id
 */
function getID(filePath, options = {}) {
  const debug = Boolean(options.debug);

  if (!filePath || typeof filePath !== 'string') throw new Error('filePath must be a non-empty string');
  if (!fs.existsSync(filePath)) throw new Error(`File does not exist: ${filePath}`);

  if (debug) console.log(`Reading GMD file for id: ${filePath}`);
  const xmlData = fs.readFileSync(filePath, 'utf8');

  const parser = new XMLParser({ ignoreDeclaration: true, ignoreAttributes: false, textNodeName: '#text' });
  const jObj = parser.parse(xmlData);

  // Collect all <i> node contents using a recursive walker similar to sNodes above.
  const iNodes = [];
  (function walk(node) {
    if (node == null) return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (k === 'i') {
          if (Array.isArray(v)) v.forEach(pushI);
          else pushI(v);
        } else {
          walk(v);
        }
      }
    }
  })(jObj);

  function pushI(v) {
    if (v == null) return;
    if (typeof v === 'string' || typeof v === 'number') return iNodes.push(String(v));
    if (typeof v === 'object') {
      if (v['#text'] !== undefined) return iNodes.push(String(v['#text']));
      return iNodes.push(JSON.stringify(v));
    }
  }

  if (!Array.isArray(iNodes) || iNodes.length < 2) {
    throw new Error('Could not find second <i> node in XML');
  }

  const rawId = String(iNodes[1]).trim();
  if (debug) console.log('Raw id string:', rawId);

  const id = parseInt(rawId, 10);
  if (Number.isNaN(id)) throw new Error('Parsed id is not a valid integer: ' + rawId);
  return id;
}

module.exports = { loadGMDString, getID };
