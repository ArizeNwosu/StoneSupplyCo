import { CyberlockConfig } from './types';

const DEFAULTS: CyberlockConfig = {
  delay: 5,
  showOnce: true,
  homeOnly: true,
  visitorsOnly: true,
  currentPage: 'index',
  isLoggedIn: false,
  winCombo: ['3', '1', '4'],
  timerSeconds: 10,
  headingLine1: 'BREAK INTO',
  headingLine2: 'THE BACKPACK',
  challengeText: 'Think you can crack our TSA combination lock?',
  winRewardText: 'FREE SHIPPING!',
  loseRewardText: 'FREE SHIPPING!',
  ctaStart: 'START MISSION',
  ctaClaim: 'CLAIM FREE SHIPPING',
  klaviyoFormId: '',
};

export function getConfig(): CyberlockConfig {
  return { ...DEFAULTS, ...(window.CYBERLOCK_CONFIG ?? {}) };
}
