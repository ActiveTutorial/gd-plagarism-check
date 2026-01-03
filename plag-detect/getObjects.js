const { parseGMD } = require('../gmd-api/main');
const { solidObjects, hazardObjects, otherObjects } = require('./objectTypes');

function classifyObjectId(id) {
  if (solidObjects.has(id)) return 'solid';
  if (hazardObjects.has(id)) return 'hazard';
  if (otherObjects.has(id)) return 'other';
  return 'none';
}

/**
 * Parse a GMD file and return simplified object list: { type, x, y }
 * @param {string} gmdFile - path to .gmd file
 * @return {Array<{type: string, x: number, y: number}>}
 */
function getObjects(gmdFile) {
  const result = parseGMD(gmdFile, { objectsOnly: true, keys: ['Object ID', 'X Position', 'Y Position'] });
  const objects = result.objects || [];

  return objects.map(obj => {
    const id = Number(obj['Object ID']);
    const x = parseFloat(obj['X Position']);
    const y = parseFloat(obj['Y Position']);
    return {
      type: classifyObjectId(Number.isNaN(id) ? -1 : id),
      x: Number.isNaN(x) ? 0.0 : x,
      y: Number.isNaN(y) ? 0.0 : y
    };
  });
}

module.exports = { getObjects };
