import Enums from './types/enums';
import { parseColorString } from './types/colors';
import { parseGuidelineString } from './types/guidlines';

/**
 * Apply enumerations for certain keys
 * @param {string} key
 * @param {string|number} rawValue
 */
export function applyEnum(key: string, rawValue: any): any {
  // Determine which enum this key maps to (if any)
  const enumName = (Enums as any).keyToEnumMap[key];
  if (!enumName) return rawValue;

  // Grab the enum object by name
  const enumObj = (Enums as any)[enumName];

  if (!enumObj) return rawValue;

  // Speed requires special handling to include actual value
  if (enumName === 'Speed') {
    return enumObj[rawValue] ? { name: enumObj[rawValue].name, actual: enumObj[rawValue].actual } : rawValue;
  }

  return enumObj[rawValue] || rawValue;
}

/**
 * Parse a raw value according to the declared type in `keyMapping`.
 * @param {string} type
 * @param {string} key
 * @param {string} rawValue
 */
export function parseByType(type: string, key: string, rawValue: any): any {
  if (rawValue === undefined) return undefined;

  // If the key maps to an enum (either via Enums map or the type string), use applyEnum
  if ((Enums as any).keyToEnumMap[key] || /\(enum\)$/.test(type)) {
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
    return rawValue.split('.').filter(Boolean).map((v: string) => Number(v));
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

export default { parseByType, applyEnum };
