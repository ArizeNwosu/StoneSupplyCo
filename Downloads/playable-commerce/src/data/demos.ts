// src/data/demos.ts
import type { GameSpec } from '../types';

export const splitflaskSpec: GameSpec = {
  experience: {
    name: 'Stop the Pour',
    goal: 'lead_capture',
    surface: 'popup',
  },
  branding: {
    primaryColor: '#FF6B35',
    backgroundColor: '#1A1A2E',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
    fontStyle: 'display',
    tone: 'playful',
  },
  intro: {
    headline: 'TRY YOUR LUCK',
    body: 'Stop the pour at exactly 50% to win a free Splitflask.',
    cta: 'START POURING',
  },
  mechanic: {
    primitive: 'precision_stop',
    skin: 'pour_drink',
    config: {
      vessel_shape: 'flask',
      targetValue: 50,
      unit: '%',
      maxValue: 100,
      speed: 'medium',
    },
  },
  result: {
    headline: 'SO CLOSE.',
    body: "You didn't nail it. But you still get 15% off your order.",
    delayMs: 1000,
    type: 'near_miss',
  },
  reward: {
    type: 'percentage_off',
    value: '15',
    message: '15% off your order — use code SPLITLUCK at checkout.',
  },
  conversion: {
    provider: 'klaviyo',
    winnerFormId: '',
    standardFormId: '',
  },
};

export const cyberbackpackSpec: GameSpec = {
  experience: {
    name: 'Crack the Lock',
    goal: 'lead_capture',
    surface: 'popup',
  },
  branding: {
    primaryColor: '#E51B23',
    backgroundColor: '#080808',
    textColor: '#00FF41',
    accentColor: '#E51B23',
    fontStyle: 'mono',
    tone: 'cybersecurity',
  },
  intro: {
    headline: 'BREAK INTO THE BACKPACK',
    body: 'Think you can crack our TSA combination lock?',
    cta: 'START MISSION',
  },
  mechanic: {
    primitive: 'multi_dial',
    skin: 'combination_lock',
    config: {
      digits: 3,
      solution: [3, 7, 1],
    },
  },
  result: {
    headline: 'ACCESS DENIED',
    body: "You didn't crack the lock. But you did unlock FREE SHIPPING.",
    delayMs: 1200,
    type: 'deny',
  },
  reward: {
    type: 'free_shipping',
    message: 'Free shipping on your order — no code needed.',
  },
  conversion: {
    provider: 'klaviyo',
    winnerFormId: '',
    standardFormId: '',
  },
};
