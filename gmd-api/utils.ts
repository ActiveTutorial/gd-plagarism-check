export function parseValue(val: string): any {
  if (val === '1') return true;
  if (val === '0') return false;
  if (!isNaN((val as any))) return Number(val as any);
  return val;
}

export default { parseValue };
