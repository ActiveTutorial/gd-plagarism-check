const fs = require('fs');
const { execSync } = require('child_process');
const zlib = require('zlib');

const { keyNames } = require('./keys');
const { parseColorString } = require('./colors');
const { parseValue } = require('./utils');
const { Gamemode, Speed, Easing, PulseMode, PulseTargetType, TouchToggleMode, InstantCountComparison } = require('./enums');

/**
 * Parses a GMD file and returns both Level Start and Object String
 * @param {string} filePath - path to the GMD file
 */
function parseGMD(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`File does not exist: ${filePath}`);

  console.log(`Reading GMD file: ${filePath}`);
  const xmlData = fs.readFileSync(filePath, 'utf8');

  console.log('Extracting second <s> node from XML...');
  const base64Gzip = execSync(`xmllint --xpath 'string(//s[2])' -`, { input: xmlData }).toString();

  return parseLevel(base64Gzip);
}

function parseLevel(base64Str) {
  const standardBase64 = base64Str.replace(/_/g, '/').replace(/-/g, '+');
  let buffer = Buffer.from(standardBase64, 'base64');

  try {
    buffer = zlib.gunzipSync(buffer);
  } catch (e) {
    console.log('Not gzipped, using raw buffer.');
  }

  const str = buffer.toString('utf8');
  const [levelStartPart, objectStringPart] = str.split(';', 2);

  const levelStart = parseLevelStart(levelStartPart);
  const objects = parseObjectString(objectStringPart);

  return { levelStart, objects };
}

function parseLevelStart(levelStartPart) {
  const tokens = levelStartPart.split(',');
  const levelStartObj = {};

  for (let i = 0; i < tokens.length; i += 2) {
    const key = tokens[i];
    const rawValue = tokens[i + 1];
    const name = keyNames[key] || key;

    let value;
    if (key === 'kS38') {
      value = parseColorString(rawValue);
    } else {
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
      const name = keyNames[key] || key; // <-- now includes object string keys

      let value;
      if (key === '7' || key === '8' || key === '9') {
        value = parseValue(rawValue);
      } else {
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
function applyEnum(key, rawValue) {
  switch (key) {
    case 'kA2': return Gamemode[rawValue] || rawValue;
    case 'kA4': return Speed[rawValue] ? { name: Speed[rawValue].name, actual: Speed[rawValue].actual } : rawValue;
    case '30': return Easing[rawValue] || rawValue;
    case '48': return PulseMode[rawValue] || rawValue;
    case '52': return PulseTargetType[rawValue] || rawValue;
    case '82': return TouchToggleMode[rawValue] || rawValue;
    case '88': return InstantCountComparison[rawValue] || rawValue;
    default: return rawValue;
  }
}

module.exports = { parseGMD };
