
export enum ContentPillar {
  AWARD_WINNING = 'Award-Winning Stunts',
  ALMOST_DIED = 'Almost Didn\'t Survive',
  BREAKDOWN = 'Stunt Breakdown',
  SPOTLIGHT = 'Performer Spotlight',
  FAMOUS_IP = 'Famous Movie Stunt',
  FAN_VOTING = 'Fan Voting Days'
}

export interface StuntPost {
  day: number;
  title: string;
  pillar: ContentPillar;
  status: 'scheduled' | 'draft' | 'posted';
  platform: ('Instagram' | 'TikTok')[];
  description?: string;
}

export interface AIGenerationResult {
  igCaption: string;
  tiktokHook: string;
  trivia: string;
}

export interface ArchiveClip {
  id: number;
  title: string;
  film: string;
  year: number;
  performer: string;
  pillar: ContentPillar;
  platform: ('Instagram' | 'TikTok')[];
  status: 'available' | 'scheduled' | 'posted';
  tags: string[];
  description: string;
}
