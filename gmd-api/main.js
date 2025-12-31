const { loadGMDString } = require('./load');

const { keyNames } = require('./keys');
const { parseColorString } = require('./colors');
const { parseValue } = require('./utils');
const { Gamemode, Speed, Easing, PulseMode, PulseTargetType, TouchToggleMode, InstantCountComparison, keyToEnumMap } = require('./enums');

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
  const tokens = levelStartPart.split(',');
  const levelStartObj = {};

  for (let i = 0; i < tokens.length; i += 2) {
    const key = tokens[i];
    const rawValue = tokens[i + 1];
    const name = keyNames[key] || key;

    let value = applySpecialTypes(key, rawValue);
    if (value === undefined) {
      value = applyEnum(key, rawValue);
      if (value === rawValue) value = parseValue(rawValue);
    }

    levelStartObj[name] = value;
  }

  console.log('\nParsed Level Start Object:');
  console.dir(levelStartObj, { depth: null });
  return levelStartObj;
}

function parseObjectString(objectString) {
  if (!objectString) return [];
  const objectTokens = objectString.split(';').filter(Boolean);

  const objects = objectTokens.map(objStr => {
    const tokens = objStr.split(',');
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
  });

  console.log('\nParsed Objects:');
  console.dir(objects, { depth: null });
  return objects;
}

/**
 * Apply enumerations for certain keys
 */
/**
 * Handle special parsing for particular keys that need non-standard processing.
 * Return the processed value, or undefined when no special handling applies.
 */
function applySpecialTypes(key, rawValue) {
  // color string
  if (key === 'kS38') {
    return parseColorString(rawValue);
  }

  return undefined;
}

function applyEnum(key, rawValue) {
  // Determine which enum this key maps to (if any)
  const enumName = keyToEnumMap[key];
  if (!enumName) return rawValue;

  // Grab the enum object by name
  const enumObj = {
    Gamemode,
    Speed,
    Easing,
    PulseMode,
    PulseTargetType,
    TouchToggleMode,
    InstantCountComparison,
  }[enumName];

  if (!enumObj) return rawValue;

  // Speed requires special handling to include actual value
  if (enumName === 'Speed') {
    return enumObj[rawValue] ? { name: enumObj[rawValue].name, actual: enumObj[rawValue].actual } : rawValue;
  }

  return enumObj[rawValue] || rawValue;
}

module.exports = { parseGMD };
