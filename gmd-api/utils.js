function parseValue(val) {
  if (val === '1') return true;
  if (val === '0') return false;
  if (!isNaN(val)) return Number(val);
  return val;
}

module.exports = { parseValue };
