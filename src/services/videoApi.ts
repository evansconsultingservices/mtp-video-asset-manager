import { Video, VideoListResponse } from '../types/video';

// Mock data - no backend needed
const MOCK_VIDEOS: Video[] = [
  {
    id: '1',
    title: 'Product Demo Video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://placehold.co/320x180/4338ca/ffffff?text=Product+Demo',
    duration: 125,
    size: 15728640,
    format: 'mp4',
    status: 'ready',
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: '2',
    title: 'Customer Testimonial',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://placehold.co/320x180/059669/ffffff?text=Testimonial',
    duration: 240,
    size: 31457280,
    format: 'mp4',
    status: 'ready',
    createdAt: new Date('2024-02-20').toISOString()
  },
  {
    id: '3',
    title: 'Training Module 1',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://placehold.co/320x180/dc2626/ffffff?text=Training',
    duration: 180,
    size: 22020096,
    format: 'mp4',
    status: 'ready',
    createdAt: new Date('2024-03-10').toISOString()
  },
  {
    id: '4',
    title: 'Marketing Campaign Video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://placehold.co/320x180/7c3aed/ffffff?text=Marketing',
    duration: 95,
    size: 11534336,
    format: 'mp4',
    status: 'processing',
    createdAt: new Date('2024-04-01').toISOString()
  },
  {
    id: '5',
    title: 'Event Highlights 2024',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail: 'https://placehold.co/320x180/ea580c/ffffff?text=Event+2024',
    duration: 320,
    size: 41943040,
    format: 'mp4',
    status: 'ready',
    createdAt: new Date('2024-04-15').toISOString()
  }
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class VideoApiService {
  static async listVideos(page: number = 1, pageSize: number = 20): Promise<VideoListResponse> {
    // Simulate network delay
    await delay(500);

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      videos: MOCK_VIDEOS.slice(start, end),
      total: MOCK_VIDEOS.length,
      page,
      pageSize
    };
  }

  static async getVideo(id: string): Promise<Video> {
    await delay(300);

    const video = MOCK_VIDEOS.find(v => v.id === id);
    if (!video) {
      throw new Error('Video not found');
    }
    return video;
  }

  static async deleteVideo(id: string): Promise<void> {
    await delay(500);

    const index = MOCK_VIDEOS.findIndex(v => v.id === id);
    if (index === -1) {
      throw new Error('Video not found');
    }
    // Remove from mock data
    MOCK_VIDEOS.splice(index, 1);
  }
}
