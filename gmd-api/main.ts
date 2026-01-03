import { loadGMDString } from './load';
import { keyMapping } from './keys';
import { parseByType } from './types';

export function parseGMD(filePath: string, options: { objectsOnly?: boolean; keys?: string[] } = {}) {
  const levelString = loadGMDString(filePath);
  const parsed = parseLevel(levelString, options);
  // Return the raw level string along with parsed parts. Logging is the caller's responsibility.
  return { levelString, ...parsed };
}

export function parseLevel(str: string, options: { objectsOnly?: boolean; keys?: string[] } = {}) {
  const index = str.indexOf(';');
  const levelStartPart = index === -1 ? str : str.substring(0, index);
  const objectStringPart = index === -1 ? '' : str.substring(index + 1);

  // If objectsOnly is true, don't parse the level start portion.
  const levelStart = options.objectsOnly ? {} : parseLevelStartString(levelStartPart, options);
  const objects = parseObjectString(objectStringPart, options);

  return { levelStart, objects };
}

export function parseLevelStartString(levelStartPart: string, options: { keys?: string[] } = {}) {
  const levelStartObj = parseTokens(levelStartPart, options);
  return levelStartObj;
}

export function parseObjectString(objectString: string, options: { keys?: string[] } = {}) {
  if (!objectString) return [];
  const objectTokens = objectString.split(';').filter(Boolean);

  const objects = objectTokens.map((objStr) => {
    return parseTokens(objStr, options);
  });
  return objects;
}

/**
 * Generic parser that accepts string of tokens
 * and returns an object mapping keys -> parsed values.
 * @param {string} tokenSrt - "key,val,key,val..."
 * @param {Object} [options]
 * @param {string[]} [options.keys] - when provided, only these property names will be kept
 */
export function parseTokens(tokenSrt: string, options: { keys?: string[] } = {}) {
  if (!tokenSrt) return {};
  const tokens = tokenSrt.split(',');
  const obj: Record<string, any> = {};
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

    let value: any;
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

export default { parseGMD };
