import { parseValue } from '../utils';

type Guideline = {
  timestamp: number | boolean | string | null;
  color_value: number | boolean | string | null;
  color: string;
};

/**
 * Parse a guideline string formatted as:
 *  "{timestamp}~{color_value}~{timestamp}~{color_value}~..."
 *
 * Returns an array of objects: { timestamp, color_value, color }
 */
export function parseGuidelineString(str?: string | null): Guideline[] {
  if (!str) return [];

  // split on ~ and group into pairs [timestamp, color_value]
  const parts = str.split('~').filter(Boolean);
  const guidelines: Guideline[] = [];

  for (let i = 0; i < parts.length; i += 2) {
    const tsRaw = parts[i];
    const colorRaw = parts[i + 1];

    const timestamp = parseValue(tsRaw);
    const color_value = parseValue(colorRaw);

    // Determine human-friendly color per spec.
    const color = mapColorName(color_value);

    guidelines.push({ timestamp, color_value, color });
  }

  return guidelines;
}

function mapColorName(value: any): string {
  // Preserve exact supported values first
  if (value === 0) return 'orange';
  if (value === 0.9) return 'yellow';
  if (value === 1 || value === 1.0) return 'green';

  // Unexpected / edge behavior described in spec:
  // - values < 0.8 => transparent
  // - value == 0.8 => orange
  // - values > 0.8 (that are not 0.9 or 1) => orange
  if (typeof value === 'number') {
    if (value < 0.8) return 'transparent';
    return 'orange';
  }

  // fallback
  return 'unknown';
}

export default { parseGuidelineString };
