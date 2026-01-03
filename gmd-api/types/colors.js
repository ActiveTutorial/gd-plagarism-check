const { parseValue } = require('../utils');

function parseColorString(str) {
  if (!str) return [];
  const colorTokens = str.split('|'); // channels separated by |
  return colorTokens.map(token => {
    const parts = token.split('_'); // key-value pairs separated by _
    const color = {};

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

module.exports = { parseColorString };
