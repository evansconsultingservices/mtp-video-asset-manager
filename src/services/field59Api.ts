import axios from 'axios';

/**
 * Field59 API Service
 * Handles video fetching and creation using Field59's API
 */

// Base URL for API calls - use absolute URL to ensure calls go back to child app's proxy
// even when loaded via Module Federation in parent app
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3004';

export interface Field59Video {
  key: string;
  title: string;
  category: string;
  tags: string[];
  url: string;
  adaptiveStream: string;
  duration: string;
  summary: string;
  description: string;
  thumbnails: {
    full: string;
    small: string;
    medium: string;
  };
  playlists: string[];
  createDate: string;
  lastModifiedDate: string;
  liveDate: string;
  owner: string;
  user: string;
  id: string;
}

export interface Field59Credentials {
  username: string;
  password: string;
}

/**
 * Helper function to extract CDATA content from XML elements
 */
const getCData = (element: Element, tagName: string): string => {
  const node = element.querySelector(tagName);
  if (!node) return '';
  return node.textContent?.replace(/^\[CDATA\[(.*)\]\]$/, '$1') || '';
};

/**
 * Parse Field59 XML response into structured video objects
 */
const parseXMLResponse = (xmlString: string): Field59Video[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  const videoElements = xmlDoc.querySelectorAll('video');
  return Array.from(videoElements).map(videoEl => ({
    key: getCData(videoEl, 'key'),
    title: getCData(videoEl, 'title'),
    category: getCData(videoEl, 'category'),
    tags: Array.from(videoEl.querySelectorAll('tags tag')).map(tag =>
      tag.textContent?.replace(/^\[CDATA\[(.*)\]\]$/, '$1') || ''
    ),
    url: getCData(videoEl, 'url'),
    adaptiveStream: getCData(videoEl, 'adaptive_stream'),
    duration: getCData(videoEl, 'duration'),
    summary: getCData(videoEl, 'summary'),
    description: getCData(videoEl, 'description'),
    thumbnails: {
      full: getCData(videoEl, 'thumb'),
      small: getCData(videoEl, 'thumbSmall'),
      medium: getCData(videoEl, 'thumbMedium')
    },
    playlists: Array.from(videoEl.querySelectorAll('playlists playlist')).map(playlist =>
      playlist.textContent?.replace(/^\[CDATA\[(.*)\]\]$/, '$1') || ''
    ),
    createDate: getCData(videoEl, 'createDate'),
    lastModifiedDate: getCData(videoEl, 'lastModifiedDate'),
    liveDate: getCData(videoEl, 'liveDate'),
    owner: getCData(videoEl, 'owner'),
    user: getCData(videoEl, 'user'),
    id: getCData(videoEl, 'id')
  }));
};

/**
 * Create authorization header for Field59 API
 */
const getAuthHeader = (credentials: Field59Credentials): string => {
  return `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
};

export class Field59ApiService {
  /**
   * Fetch videos from Field59 API
   * @param credentials - Field59 username and password
   * @param limit - Maximum number of videos to fetch (default: 50)
   * @returns Promise resolving to array of Field59 videos
   */
  static async listVideos(
    credentials: Field59Credentials,
    limit: number = 50
  ): Promise<Field59Video[]> {
    try {
      console.log('Fetching videos from Field59 API...');

      const response = await axios.get(`${API_BASE_URL}/v2/search?limit=${limit}`, {
        responseType: 'text',
        headers: {
          'Authorization': getAuthHeader(credentials),
          'Accept': 'application/xml'
        }
      });

      const videos = parseXMLResponse(response.data);
      console.log(`Successfully fetched ${videos.length} videos from Field59`);

      // Log first video's raw data structure
      if (videos.length > 0) {
        console.log('📹 Sample Field59 Video Data (first video):');
        console.log(JSON.stringify(videos[0], null, 2));
      }

      return videos;
    } catch (error) {
      console.error('Error fetching Field59 videos:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Field59 credentials');
        }
        throw new Error(error.response?.data?.message || 'Failed to fetch videos from Field59');
      }
      throw error;
    }
  }

  /**
   * Create a new video in Field59 from a URL
   * @param credentials - Field59 username and password
   * @param videoUrl - URL of the video to upload
   * @param title - Title for the video
   * @returns Promise resolving to the video key
   */
  static async createVideoFromUrl(
    credentials: Field59Credentials,
    videoUrl: string,
    title?: string
  ): Promise<string> {
    try {
      console.log('Creating video in Field59 from URL:', videoUrl);

      // Extract filename from URL if no title provided
      const fileName = videoUrl.split('/').pop()?.split('?')[0] || '';
      const videoTitle = title || fileName.replace(/\.[^/.]+$/, ''); // Remove file extension

      // Create XML payload
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<video>
  <title><![CDATA[${videoTitle}]]></title>
  <url><![CDATA[${videoUrl}]]></url>
</video>`;

      console.log('XML payload:', xml);

      // Send video metadata as URL-encoded form data
      const params = new URLSearchParams();
      params.append('xml', xml);

      const response = await axios.post(`${API_BASE_URL}/v2/video/create`, params, {
        headers: {
          'Authorization': getAuthHeader(credentials),
          'Accept': 'application/xml'
        },
        responseType: 'text'
      });

      // Parse response to get video key
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, 'text/xml');
      const key = xmlDoc.querySelector('key')?.textContent;

      if (!key) {
        throw new Error('Failed to get video key from response');
      }

      console.log('Video created successfully with key:', key);
      return key;
    } catch (error) {
      console.error('Error creating Field59 video:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Field59 credentials');
        }
        throw new Error(error.response?.data?.message || 'Failed to create video in Field59');
      }
      throw error;
    }
  }

  /**
   * Delete a video from Field59
   * @param credentials - Field59 username and password
   * @param videoKey - The unique key of the video to delete
   * @returns Promise resolving when delete is complete
   */
  static async deleteVideo(
    credentials: Field59Credentials,
    videoKey: string
  ): Promise<void> {
    try {
      console.log('Deleting video from Field59:', videoKey);

      await axios.delete(`${API_BASE_URL}/v2/video/${videoKey}`, {
        headers: {
          'Authorization': getAuthHeader(credentials),
          'Accept': 'application/xml'
        }
      });

      console.log('Video deleted successfully');
    } catch (error) {
      console.error('Error deleting Field59 video:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Field59 credentials');
        }
        if (error.response?.status === 404) {
          throw new Error('Video not found');
        }
        throw new Error(error.response?.data?.message || 'Failed to delete video from Field59');
      }
      throw error;
    }
  }

  /**
   * Get details for a specific video
   * @param credentials - Field59 username and password
   * @param videoKey - The unique key of the video
   * @returns Promise resolving to video details
   */
  static async getVideo(
    credentials: Field59Credentials,
    videoKey: string
  ): Promise<Field59Video | null> {
    try {
      console.log('Fetching video details from Field59:', videoKey);

      const response = await axios.get(`${API_BASE_URL}/v2/video/${videoKey}`, {
        responseType: 'text',
        headers: {
          'Authorization': getAuthHeader(credentials),
          'Accept': 'application/xml'
        }
      });

      const videos = parseXMLResponse(response.data);
      return videos.length > 0 ? videos[0] : null;
    } catch (error) {
      console.error('Error fetching Field59 video details:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Field59 credentials');
        }
        if (error.response?.status === 404) {
          return null;
        }
        throw new Error(error.response?.data?.message || 'Failed to fetch video details');
      }
      throw error;
    }
  }

  /**
   * Convert Field59 video to our local Video type
   */
  static convertToLocalVideo(field59Video: Field59Video): any {
    // Parse duration from string (format: "HH:MM:SS" or seconds)
    const parseDuration = (durationStr: string): number | undefined => {
      if (!durationStr) return undefined;

      // If it's already a number
      if (!isNaN(Number(durationStr))) {
        return Number(durationStr);
      }

      // Parse HH:MM:SS format
      const parts = durationStr.split(':').map(Number);
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      }

      return undefined;
    };

    return {
      id: field59Video.key,
      title: field59Video.title,
      url: field59Video.url || field59Video.adaptiveStream,
      thumbnail: field59Video.thumbnails.medium || field59Video.thumbnails.full,
      duration: parseDuration(field59Video.duration),
      createdAt: field59Video.createDate || new Date().toISOString(),
      format: 'mp4',
      status: 'ready' as const,
      // Additional Field59-specific data
      field59: {
        key: field59Video.key,
        category: field59Video.category,
        tags: field59Video.tags,
        adaptiveStream: field59Video.adaptiveStream,
        summary: field59Video.summary,
        description: field59Video.description,
        playlists: field59Video.playlists,
        lastModifiedDate: field59Video.lastModifiedDate,
        owner: field59Video.owner
      }
    };
  }
}
