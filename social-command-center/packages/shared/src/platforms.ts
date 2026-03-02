export type PlatformId = 'facebook' | 'instagram' | 'linkedin' | 'x' | 'tiktok' | 'youtube';

export type PostFormat =
  | 'text'
  | 'image'
  | 'video'
  | 'link'
  | 'story'
  | 'reel'
  | 'carousel'
  | 'article'
  | 'document'
  | 'thread'
  | 'short'
  | 'community';

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  accent?: string;
  maxChars: number;
  formats: PostFormat[];
  label: string;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'f',
    color: '#1877F2',
    bg: 'rgba(24,119,242,0.08)',
    border: 'rgba(24,119,242,0.25)',
    maxChars: 63206,
    formats: ['text', 'image', 'video', 'link', 'story', 'reel'],
    label: 'Post / Story / Reel',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '\u{1F4F8}',
    color: '#E4405F',
    bg: 'rgba(228,64,95,0.08)',
    border: 'rgba(228,64,95,0.25)',
    maxChars: 2200,
    formats: ['image', 'video', 'story', 'reel', 'carousel'],
    label: 'Post / Story / Reel',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'in',
    color: '#0A66C2',
    bg: 'rgba(10,102,194,0.08)',
    border: 'rgba(10,102,194,0.25)',
    maxChars: 3000,
    formats: ['text', 'image', 'video', 'article', 'document'],
    label: 'Post / Article',
  },
  {
    id: 'x',
    name: 'X',
    icon: '\u{1D54F}',
    color: '#e7e9ea',
    bg: 'rgba(231,233,234,0.06)',
    border: 'rgba(231,233,234,0.2)',
    accent: '#e7e9ea',
    maxChars: 280,
    formats: ['text', 'image', 'video', 'thread'],
    label: 'Post / Thread',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '\u266A',
    color: '#010101',
    bg: 'rgba(1,1,1,0.06)',
    border: 'rgba(254,44,85,0.3)',
    accent: '#FE2C55',
    maxChars: 2200,
    formats: ['video', 'image', 'story'],
    label: 'Video / Story',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '\u25B6',
    color: '#FF0000',
    bg: 'rgba(255,0,0,0.07)',
    border: 'rgba(255,0,0,0.25)',
    maxChars: 5000,
    formats: ['video', 'short', 'community'],
    label: 'Video / Short / Community',
  },
];

export const SCHEDULE_OPTIONS = ['Now', '1h', '3h', '6h', '12h', 'Tomorrow 9AM', 'Custom'] as const;
export type ScheduleOption = (typeof SCHEDULE_OPTIONS)[number];
