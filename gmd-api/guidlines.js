const { parseValue } = require('./utils');

/**
 * Parse a guideline string formatted as:
 *  "{timestamp}~{color_value}~{timestamp}~{color_value}~..."
 *
 * Returns an array of objects: { timestamp, color_value, color }
 */
function parseGuidelineString(str) {
  if (!str) return [];

  // split on ~ and group into pairs [timestamp, color_value]
  const parts = str.split('~').filter(Boolean);
  const guidelines = [];

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

function mapColorName(value) {
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

module.exports = { parseGuidelineString };
