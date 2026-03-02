export interface ApiResponse<T> {
  data: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiError {
  error: string;
  code: string;
  statusCode: number;
  details?: Record<string, string[]>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface AiEnhanceRequest {
  content: string;
  tone: string;
  platforms: string[];
}

export interface AiEnhanceResponse {
  enhanced: string;
  hashtags: string[];
  platformTips: Record<string, string>;
}

export interface AiThreadRequest {
  content: string;
  maxTweets?: number;
}

export interface AiThreadResponse {
  tweets: string[];
  totalCharacters: number;
}

export interface AiVariantsRequest {
  content: string;
  platforms: string[];
  count?: number;
}

export interface AiVariantsResponse {
  variants: Array<{
    content: string;
    angle: string;
    reasoning: string;
  }>;
}
