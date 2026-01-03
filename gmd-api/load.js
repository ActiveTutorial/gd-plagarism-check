const fs = require('fs');
const zlib = require('zlib');

/**
 * Find the value node that appears immediately after a specific <k>key</k>.
 *
 * @param {string} xmlData
 * @param {string} keyName
 * @param {string} valueTag
 * @returns {string}
 */
function findValueAfterKey(xmlData, keyName, valueTag) {
  const regex = new RegExp(
    `<k>\\s*${keyName}\\s*</k>\\s*<${valueTag}>([\\s\\S]*?)</${valueTag}>`,
    'i'
  );

  const match = xmlData.match(regex);
  if (!match) {
    throw new Error(`Could not find <${valueTag}> immediately after <k>${keyName}</k>`);
  }

  return match[1];
}

/**
 * Read a .gmd file and return the decoded level string from the <s> node
 * immediately after <k>k4</k>.
 *
 * @param {string} filePath
 * @param {{debug?: boolean}} [options]
 * @returns {string}
 */
function loadGMDString(filePath, options = {}) {
  const debug = Boolean(options.debug);

  if (!filePath || typeof filePath !== 'string') throw new Error('filePath must be a non-empty string');
  if (!fs.existsSync(filePath)) throw new Error(`File does not exist: ${filePath}`);

  if (debug) console.log(`Reading GMD file: ${filePath}`);
  const xmlData = fs.readFileSync(filePath, 'utf8');

  const rawBase64 = findValueAfterKey(xmlData, 'k4', 's');

  if (debug) {
    console.log(
      'Raw base64 (possibly URL-safe):',
      rawBase64.slice(0, 60) + (rawBase64.length > 60 ? '...' : '')
    );
  }

  let base64 = rawBase64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad !== 0) base64 += '='.repeat(4 - pad);

  let buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    throw new Error('Invalid base64 data');
  }

  try {
    const isGzip = buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;

    if (isGzip) {
      if (debug) console.log('Detected gzip header, decompressing...');
      return zlib.gunzipSync(buffer).toString('utf8');
    }

    try {
      return zlib.gunzipSync(buffer).toString('utf8');
    } catch {
      if (debug) console.log('Not gzipped; returning raw utf8');
      return buffer.toString('utf8');
    }
  } catch (e) {
    throw new Error('Failed to decode GMD string: ' + (e && e.message ? e.message : String(e)));
  }
}

/**
 * Read a .gmd file and return the integer id from the <i> node
 * immediately after <k>k1</k>.
 *
 * @param {string} filePath
 * @param {{debug?: boolean}} [options]
 * @returns {number}
 */
function getID(filePath, options = {}) {
  const debug = Boolean(options.debug);

  if (!filePath || typeof filePath !== 'string') throw new Error('filePath must be a non-empty string');
  if (!fs.existsSync(filePath)) throw new Error(`File does not exist: ${filePath}`);

  if (debug) console.log(`Reading GMD file for id: ${filePath}`);
  const xmlData = fs.readFileSync(filePath, 'utf8');

  const rawId = findValueAfterKey(xmlData, 'k1', 'i').trim();
  if (debug) console.log('Raw id string:', rawId);

  const id = parseInt(rawId, 10);
  if (Number.isNaN(id)) throw new Error('Parsed id is not a valid integer: ' + rawId);

  return id;
}

module.exports = { loadGMDString, getID };
