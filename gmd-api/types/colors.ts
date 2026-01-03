import { parseValue } from '../utils';

type ColorClass = 'CopyColor' | 'PlayerColor' | 'BaseColor';
type Color = { [key: string]: any } & { _class?: ColorClass };

export function parseColorString(str?: string | null): Color[] {
  if (!str) return [];
  const colorTokens = str.split('|'); // channels separated by |
  return colorTokens.map((token) => {
    const parts = token.split('_'); // key-value pairs separated by _
    const color: Color = {};

    for (let i = 0; i < parts.length; i += 2) {
      const key = parts[i];
      const value = parts[i + 1];
      color[key] = parseValue(value);
    }

    // Determine class
    if (color.copy_channel_id && color.copy_channel_id !== 0) {
      color._class = 'CopyColor';
    } else if (color.player_color && color.player_color !== 0) {
      color._class = 'PlayerColor';
    } else {
      color._class = 'BaseColor';
    }

    return color;
  });
}

export default { parseColorString };
