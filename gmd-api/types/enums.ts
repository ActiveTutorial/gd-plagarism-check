export const Gamemode: Record<number, string> = {
  0: 'Cube',
  1: 'Ship',
  2: 'Ball',
  3: 'UFO',
  4: 'Wave',
  5: 'Robot',
  6: 'Spider',
  7: 'Swing',
};

export const Speed: Record<number, { name: string; actual: number }> = {
  0: { name: '1x', actual: 251.16 },
  1: { name: '0.5x', actual: 311.58 },
  2: { name: '2x', actual: 387.42 },
  3: { name: '3x', actual: 468.0 },
  4: { name: '4x', actual: 576.0 },
};

export const Easing: Record<number, string> = {
  0: 'None',
  1: 'Ease In Out',
  2: 'Ease In',
  3: 'Ease Out',
  4: 'Elastic In Out',
  5: 'Elastic In',
  6: 'Elastic Out',
  7: 'Bounce In Out',
  8: 'Bounce In',
  9: 'Bounce Out',
  10: 'Exponential In Out',
  11: 'Exponential In',
  12: 'Exponential Out',
  13: 'Sine In Out',
  14: 'Sine In',
  15: 'Sine Out',
  16: 'Back In Out',
  17: 'Back In',
  18: 'Back Out',
};

export const PulseMode: Record<number, string> = {
  0: 'Color',
  1: 'HSV',
};

export const PulseTargetType: Record<number, string> = {
  0: 'Channel',
  1: 'Group',
};

export const TouchToggleMode: Record<number, string> = {
  0: 'None',
  1: 'Toggle On',
  2: 'Toggle Off',
};

export const InstantCountComparison: Record<number, string> = {
  0: 'Equals',
  1: 'Larger',
  2: 'Smaller',
};

// Map GMD keys to the enum name they should use.
export const keyToEnumMap: Record<string, string> = {
  // Level start keys
  kA2: 'Gamemode',
  kA4: 'Speed',
  // Object keys
  '30': 'Easing',
  '48': 'PulseMode',
  '52': 'PulseTargetType',
  '82': 'TouchToggleMode',
  '88': 'InstantCountComparison',
};

const Enums = {
  Gamemode,
  Speed,
  Easing,
  PulseMode,
  PulseTargetType,
  TouchToggleMode,
  InstantCountComparison,
  keyToEnumMap,
};

export default Enums;
