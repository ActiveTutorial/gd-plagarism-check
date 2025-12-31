// gmd-api/enums.js

const Gamemode = {
  0: 'Cube',
  1: 'Ship',
  2: 'Ball',
  3: 'UFO',
  4: 'Wave',
  5: 'Robot',
  6: 'Spider',
  7: 'Swing',
};

const Speed = {
  0: { name: '1x', actual: 251.16 },
  1: { name: '0.5x', actual: 311.58 },
  2: { name: '2x', actual: 387.42 },
  3: { name: '3x', actual: 468.00 },
  4: { name: '4x', actual: 576.00 },
};

const Easing = {
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

const PulseMode = {
  0: 'Color',
  1: 'HSV',
};

const PulseTargetType = {
  0: 'Channel',
  1: 'Group',
};

const TouchToggleMode = {
  0: 'None',
  1: 'Toggle On',
  2: 'Toggle Off',
};

const InstantCountComparison = {
  0: 'Equals',
  1: 'Larger',
  2: 'Smaller',
};

module.exports = {
  Gamemode,
  Speed,
  Easing,
  PulseMode,
  PulseTargetType,
  TouchToggleMode,
  InstantCountComparison,
};
