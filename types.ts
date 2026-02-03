
export enum CreatorType {
  YOUTUBER = 'YOUTUBER',
  STREAMER = 'STREAMER'
}

export interface Offer {
  id: string;
  name: string; // Internal name or Creator Name
  title: string; // Video/Stream Title
  imageUrl: string; // The wide banner image
  avatarUrl?: string; // Creator avatar
  budget: string; // e.g. "500k ₽"
  cpm: string; // e.g. "200 ₽"
  type: CreatorType;
  glowColor: 'blue' | 'gold'; // For the side glow effect

  // Details View Fields
  description?: string;
  requirements?: string[];
  platformIcons?: string[]; // 'instagram', 'tiktok', 'youtube'
  daysLeft?: number;
  paidOutPercentage?: number; // 0 to 100 for the scale
  language?: string;
  payType?: string; // 'Per view'
  assetsLink?: string;
}

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  link: string;
}

export type ViewType = 'home' | 'offers' | 'earnings' | 'offer-details' | 'terms' | 'privacy' | 'referral';

export interface EarningsClip {
  id: string;
  title: string;
  views: string;
  earned: string;
  imageUrl: string;
  date: string;
}

// Updated Types for Clips Page & AI
export interface MyCampaign {
  id: string; // matches Offer.id
  channelName: string;
  avatarUrl: string;
  episode: string;
  earned: string;
  views: string;
  daysLeft: number;
  paidOut: number;
  rate: string;
  description: string;
  assetsLink: string;
}

export interface AIAnalysis {
  score: number; // 0-100
  category: string; // e.g., 'Funny', 'Epic', 'Fail', 'Gaming'
  verdict: 'accepted' | 'rejected' | 'pending';
  rejectionReason?: string;
  comment?: string;
}

export interface AccountVideo {
  id: string;
  accountId: string; // Link to SocialAccount
  campaignId?: string; // Link to Campaign
  title: string;
  thumbnailUrl: string;
  views: string;
  status: 'published' | 'processing' | 'rejected';
  date: string;
  aiData?: AIAnalysis;
  videoUrl?: string;
  verificationCode?: string;
  isVerified?: boolean;
}

export interface SocialAccount {
  id: string;
  name: string;
  platform: 'youtube' | 'tiktok' | 'instagram';
  avatarUrl?: string;
  isConnected: boolean;
  clipsCount?: number;
  totalEarned?: string;
}
