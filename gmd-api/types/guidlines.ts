type Guideline = {
  timestamp: string | null;
  color_value: string | null;
  color: string;
};

export function parseGuidelineString(str?: string | null): Guideline[] {
  if (!str) return [];

  const parts = str.split('~').filter(Boolean);
  const guidelines: Guideline[] = [];

  for (let i = 0; i < parts.length; i += 2) {
    const timestamp = parts[i] ?? null;
    const color_value = parts[i + 1] ?? null;

    const color = mapColorName(color_value);

    guidelines.push({ timestamp, color_value, color });
  }

  return guidelines;
}

function mapColorName(value: string | null): string {
  if (value === '0') return 'orange';
  if (value === '0.9') return 'yellow';
  if (value === '1' || value === '1.0') return 'green';

  const num = value !== null ? Number(value) : NaN;
  if (!Number.isNaN(num)) {
    if (num < 0.8) return 'transparent';
    return 'orange';
  }

  return 'unknown';
}

export default { parseGuidelineString };
