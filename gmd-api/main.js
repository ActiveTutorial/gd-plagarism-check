const { loadGMDString } = require('./load');

const { keyMapping } = require('./keys');
const { parseColorString } = require('./colors');
const { parseGuidelineString } = require('./guidlines');
const Enums = require('./enums');

/**
 * Parses a GMD file and returns both Level Start and Object String
 * @param {string} filePath - path to the GMD file
 */
function parseGMD(filePath) {
  const levelString = loadGMDString(filePath);
  console.log('\nLoaded Level String:', levelString);
  return parseLevel(levelString);
}

function parseLevel(str) {
  const index = str.indexOf(';');
  const levelStartPart = index === -1 ? str : str.substring(0, index);
  const objectStringPart = index === -1 ? '' : str.substring(index + 1);

  const levelStart = parseLevelStartString(levelStartPart);
  const objects = parseObjectString(objectStringPart);

  return { levelStart, objects };
}

function parseLevelStartString(levelStartPart) {
  const levelStartObj = parseTokens(levelStartPart);

  console.log('\nParsed Level Start Object:');
  console.dir(levelStartObj, { depth: null });
  return levelStartObj;
}

function parseObjectString(objectString) {
  if (!objectString) return [];
  const objectTokens = objectString.split(';').filter(Boolean);

  const objects = objectTokens.map(objStr => {
    return parseTokens(objStr);
  });

  console.log('\nParsed Objects:');
  console.dir(objects, { depth: null });
  return objects;
}


/**
 * Generic parser that accepts string of tokens
 * and returns an object mapping keys -> parsed values.
 * @param {string} tokenSrt - "key,val,key,val..." ahhh string
 */
function parseTokens(tokenSrt) {
  const tokens = tokenSrt.split(',');
  const obj = {};
  for (let i = 0; i < tokens.length; i += 2) {
    const key = tokens[i];
    const rawValue = tokens[i + 1];
    const mapping = keyMapping[key];
    if (!mapping) {
      // Unknown key, store raw
      obj[key] = rawValue;
      continue;
    }
    const name = mapping.name;

    let value;
    value = parseByType(mapping.type, key, rawValue);
    obj[name] = value;
  }
  return obj;
}


/**
 * Parse a raw value according to the declared type in `keyMapping`.
 * @param {string} type
 * @param {string} key
 * @param {string} rawValue
 */
function parseByType(type, key, rawValue) {
  if (rawValue === undefined) return undefined;

  // If the key maps to an enum (either via Enums map or the type string), use applyEnum
  if (Enums.keyToEnumMap[key] || /\(enum\)$/.test(type)) {
    return applyEnum(key, rawValue);
  }

  if (type === 'Color String') {
    return parseColorString(rawValue);
  }

  if (type === 'Guideline String') {
    return parseGuidelineString(rawValue);
  }

  if (type === 'string (base64)') {
    try {
      return Buffer.from(rawValue, 'base64').toString('utf8');
    } catch (e) {
      return rawValue;
    }
  }

  if (type === 'integer array') {
    if (!rawValue) return [];
    return rawValue.split('.').filter(Boolean).map(v => Number(v));
  }

  if (type === 'bool') {
    return rawValue === '1';
  }

  if (type === 'integer') {
    return Number(rawValue);
  }

  if (type === 'float') {
    return parseFloat(rawValue);
  }

  return rawValue;
}


/**
 * Handle special parsing for particular keys that need non-standard processing.
 * Return the processed value, or undefined when no special handling applies.
 * @param {string} key
 * @param {string} rawValue
 */
function applySpecialTypes(key, rawValue) {
  // color string
  if (key === 'kS38') {
    return parseColorString(rawValue);
  }

  return undefined;
}

/**
 * Apply enumerations for certain keys
 * @param {string} key
 * @param {string|number} rawValue
 */
function applyEnum(key, rawValue) {
  // Determine which enum this key maps to (if any)
  const enumName = Enums.keyToEnumMap[key];
  if (!enumName) return rawValue;

  // Grab the enum object by name
  const enumObj = Enums[enumName];

  if (!enumObj) return rawValue;

  // Speed requires special handling to include actual value
  if (enumName === 'Speed') {
    return enumObj[rawValue] ? { name: enumObj[rawValue].name, actual: enumObj[rawValue].actual } : rawValue;
  }

  return enumObj[rawValue] || rawValue;
}

module.exports = { parseGMD };
