const { loadGMDString } = require('./load');

const { keyMapping } = require('./keys');
const { parseByType } = require('./types');

/**
 * Parses a GMD file and returns both Level Start and Object String
 * @param {string} filePath - path to the GMD file
 */
/**
 * parseGMD
 * @param {string} filePath - path to the GMD file
 * @param {Object} [options]
 * @param {boolean} [options.objectsOnly=false] - when true, skip parsing the level start portion
 * @param {string[]} [options.keys] - when provided, only these parsed property names will be kept
 *
 * Note: `keys` refers to the final property names (the `mapping.name` values);
 * for unknown keys (no mapping) the raw key string is used for comparison.
 */
function parseGMD(filePath, options = {}) {
  const levelString = loadGMDString(filePath);
  const parsed = parseLevel(levelString, options);
  // Return the raw level string along with parsed parts. Logging is the caller's responsibility.
  return { levelString, ...parsed };
}

function parseLevel(str, options = {}) {
  const index = str.indexOf(';');
  const levelStartPart = index === -1 ? str : str.substring(0, index);
  const objectStringPart = index === -1 ? '' : str.substring(index + 1);

  // If objectsOnly is true, don't parse the level start portion.
  const levelStart = options.objectsOnly ? {} : parseLevelStartString(levelStartPart, options);
  const objects = parseObjectString(objectStringPart, options);

  return { levelStart, objects };
}

function parseLevelStartString(levelStartPart, options = {}) {
  const levelStartObj = parseTokens(levelStartPart, options);
  return levelStartObj;
}

function parseObjectString(objectString, options = {}) {
  if (!objectString) return [];
  const objectTokens = objectString.split(';').filter(Boolean);

  const objects = objectTokens.map(objStr => {
    return parseTokens(objStr, options);
  });
  return objects;
}


/**
 * Generic parser that accepts string of tokens
 * and returns an object mapping keys -> parsed values.
 * @param {string} tokenSrt - "key,val,key,val..." ahhh string
 */
/**
 * Generic parser that accepts string of tokens
 * and returns an object mapping keys -> parsed values.
 * @param {string} tokenSrt - "key,val,key,val..."
 * @param {Object} [options]
 * @param {string[]} [options.keys] - when provided, only these property names will be kept
 */
function parseTokens(tokenSrt, options = {}) {
  if (!tokenSrt) return {};
  const tokens = tokenSrt.split(',');
  const obj = {};
  const allowed = options.keys ? new Set(options.keys) : null;
  for (let i = 0; i < tokens.length; i += 2) {
    const key = tokens[i];
    const rawValue = tokens[i + 1];
    const mapping = keyMapping[key];
    const name = mapping ? mapping.name : key;

    // If keys filter is provided, only keep allowed names
    if (allowed && !allowed.has(name)) {
      continue;
    }

    let value;
    if (mapping) {
      value = parseByType(mapping.type, key, rawValue);
    } else {
      // Unknown key, store raw value
      value = rawValue;
    }
    obj[name] = value;
  }
  return obj;
}

module.exports = { parseGMD };
