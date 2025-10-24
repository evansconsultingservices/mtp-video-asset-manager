export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  createdAt: string;
  size?: number;
  format?: string;
  status?: 'processing' | 'ready' | 'failed';
  // Field59-specific data (optional)
  field59?: {
    key: string;
    category: string;
    tags: string[];
    adaptiveStream: string;
    summary: string;
    description: string;
    playlists: string[];
    lastModifiedDate: string;
    owner: string;
  };
}

export interface VideoListResponse {
  videos: Video[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VideoSource {
  type: 'mock' | 'field59';
  enabled: boolean;
}
