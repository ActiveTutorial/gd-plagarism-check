import { parseGMD } from '../gmd-api/main';
import { solidObjects, hazardObjects, otherObjects } from './objectTypes';

function classifyObjectId(id: number): 'solid' | 'hazard' | 'other' | 'none' {
  if (solidObjects.has(id)) return 'solid';
  if (hazardObjects.has(id)) return 'hazard';
  if (otherObjects.has(id)) return 'other';
  return 'none';
}

export type SimpleObject = { type: string; x: number; y: number };

/**
 * Parse a GMD file and return simplified object list: { type, x, y }
 * @param {string} gmdFile - path to .gmd file
 * @return {Array<{type: string, x: number, y: number}>}
 */
export function getObjects(gmdFile: string): SimpleObject[] {
  const result = parseGMD(gmdFile, { objectsOnly: true, keys: ['Object ID', 'X Position', 'Y Position'] }) as any;
  const objects = result.objects || [];

  return objects.map((obj: any) => {
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

export default { getObjects };
