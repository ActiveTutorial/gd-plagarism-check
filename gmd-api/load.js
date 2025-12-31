const fs = require('fs');
const zlib = require('zlib');
const { XMLParser } = require('fast-xml-parser');

/**
 * Reads a .gmd file and extracts the second <s> node, which contains the level string,
 * decodes from base64, gunzips the result and returns the
 * decompressed UTF-8 level string.
 * @param {string} filePath
 */
function loadGMDString(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`File does not exist: ${filePath}`);

  console.log(`Reading GMD file: ${filePath}`);
  const xmlData = fs.readFileSync(filePath, 'utf8');

  console.log('Parsing XML and extracting second <s> node...');
  const parser = new XMLParser({ ignoreDeclaration: true, ignoreAttributes: false, textNodeName: '#text' });
  const jObj = parser.parse(xmlData);

  // Recursively collect text content of all <s> nodes regardless of nesting
  function collectS(node, out = []) {
    if (node == null) return out;
    if (typeof node === 'string' || typeof node === 'number') return out;
    if (Array.isArray(node)) {
      for (const item of node) collectS(item, out);
      return out;
    }

    for (const key of Object.keys(node)) {
      if (key === 's') {
        const val = node[key];
        if (Array.isArray(val)) {
          for (const v of val) {
            if (v && typeof v === 'object' && v['#text'] !== undefined) out.push(String(v['#text']));
            else if (typeof v === 'string') out.push(v);
            else out.push(JSON.stringify(v));
          }
        } else {
          const v = val;
          if (v && typeof v === 'object' && v['#text'] !== undefined) out.push(String(v['#text']));
          else if (typeof v === 'string') out.push(v);
          else out.push(JSON.stringify(v));
        }
      } else {
        collectS(node[key], out);
      }
    }

    return out;
  }

  const sNodes = collectS(jObj);
  if (!Array.isArray(sNodes) || sNodes.length < 2) {
    throw new Error('Could not find second <s> node in XML');
  }

  const rawBase64 = sNodes[1];

  // Convert URL-safe base64 to standard base64
  const standardBase64 = String(rawBase64).replace(/_/g, '/').replace(/-/g, '+');
  const buffer = Buffer.from(standardBase64, 'base64');

  // Try to gunzip
  try {
    const decompressed = zlib.gunzipSync(buffer);
    return decompressed.toString('utf8');
  } catch (e) {
    throw new Error('Failed to decompress or decode GMD string', { cause: e });
  }
}

module.exports = { loadGMDString };
