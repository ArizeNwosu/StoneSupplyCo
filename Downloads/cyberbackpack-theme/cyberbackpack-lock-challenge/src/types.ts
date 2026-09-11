export type GameState =
  | 'intro'
  | 'playing'
  | 'checking'
  | 'granted'
  | 'denied'
  | 'reward';

export interface CyberlockConfig {
  delay: number;
  showOnce: boolean;
  homeOnly: boolean;
  visitorsOnly: boolean;
  currentPage: string;
  isLoggedIn: boolean;
  winCombo: [string, string, string];
  timerSeconds: number;
  headingLine1: string;
  headingLine2: string;
  challengeText: string;
  winRewardText: string;
  loseRewardText: string;
  ctaStart: string;
  ctaClaim: string;
  klaviyoFormId: string;
}

declare global {
  interface Window {
    _klOnsite?: any[];
    CYBERLOCK_CONFIG?: Partial<CyberlockConfig>;
  }
}
