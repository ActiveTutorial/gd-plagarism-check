const { loadGMDString } = require('./load');

const { keyNames } = require('./keys');
const { parseColorString } = require('./colors');
const { parseValue } = require('./utils');
const Enums = require('./enums');

/**
 * Parses a GMD file and returns both Level Start and Object String
 * @param {string} filePath - path to the GMD file
 */
function parseGMD(filePath) {
  const levelString = loadGMDString(filePath);
  return parseLevel(levelString);
}

function parseLevel(str) {
  const [levelStartPart, objectStringPart] = str.split(';', 2);

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
    const name = keyNames[key] || key;

    let value = applySpecialTypes(key, rawValue);
    if (value === undefined) {
      value = applyEnum(key, rawValue);
      if (value === rawValue) value = parseValue(rawValue);
    }

    obj[name] = value;
  }
  return obj;
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
