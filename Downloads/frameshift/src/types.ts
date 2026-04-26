export interface Video {
  id: string;
  title: string;
  duration: number;
  sceneCount: number;
  thumbnail: string;
  uploadDate: string;
  status: 'processing' | 'ready' | 'failed';
  fileUrl?: string;
  serverId?: string;
  progress?: number;
}

export type ClipType = 'hook' | 'drone' | 'tutorial' | 'interview' | 'b-roll' | 'reveal';

export interface Clip {
  id: string;
  videoId: string;
  type: ClipType;
  duration: number;
  thumbnail: string;
  visualQuality: 'high' | 'medium' | 'low';
  tags: string[];
  startTime?: number;
  endTime?: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  structure: string[];
}

export interface Variant {
  id: string;
  templateId: string;
  clips: string[];
  status: 'generating' | 'review' | 'approved' | 'rejected' | 'scheduled';
  thumbnail: string;
  createdAt: string;
  scheduledFor?: string;
  compositionUrl?: string;
}

export interface Download {
  id: string;
  variantId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  downloadedAt: string;
}
