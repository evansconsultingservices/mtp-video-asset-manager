import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
import { Video, Loader2, Search, Play, Settings } from 'lucide-react';
import { Field59ApiService, Field59Credentials } from './services/field59Api';
import { Video as VideoType } from './types/video';

function App() {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<VideoType | null>(null);

  // Field59 integration state
  const [field59Credentials, setField59Credentials] = useState<Field59Credentials>({
    username: process.env.REACT_APP_FIELD59_USERNAME || '',
    password: process.env.REACT_APP_FIELD59_PASSWORD || ''
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch from Field59 API
      if (!field59Credentials.username || !field59Credentials.password) {
        setError('Please configure Field59 credentials in Field59 Settings');
        setLoading(false);
        return;
      }

      const field59Videos = await Field59ApiService.listVideos(field59Credentials, 50);
      const convertedVideos = field59Videos.map(v => Field59ApiService.convertToLocalVideo(v));

      // Log converted video data structure
      if (convertedVideos.length > 0) {
        console.log('🎬 Converted Video Data (first video for UI):');
        console.log(JSON.stringify(convertedVideos[0], null, 2));
      }

      setVideos(convertedVideos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load videos from Field59. Please check your credentials.';
      setError(errorMessage);
      console.error('Failed to load videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this video from Field59?')) {
      return;
    }

    try {
      // Delete from Field59
      await Field59ApiService.deleteVideo(field59Credentials, id);
      // Optimistic update using functional setState
      setVideos(currentVideos => currentVideos.filter(v => v.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete video from Field59. Please try again.';
      alert(errorMessage);
    }
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Video className="h-10 w-10 text-primary" />
              Video Asset Manager
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage and organize your video assets
            </p>
          </div>
          <div className="flex gap-2">
            {/* Settings Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Field59 Settings
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Video List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Videos ({filteredVideos.length})
              </CardTitle>
              <CardDescription>
                Your video library
              </CardDescription>
            </div>
            <Button onClick={fetchVideos} variant="outline" size="sm">
              <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-20 w-32 bg-muted rounded animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-[250px] bg-muted rounded animate-pulse" />
                      <div className="h-4 w-[200px] bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No videos found</p>
                {searchQuery && (
                  <p className="text-sm mt-2">
                    Try adjusting your search terms
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onDelete={handleDelete}
                    onPlay={setPlayingVideo}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Video Player Modal */}
      <Dialog open={!!playingVideo} onOpenChange={() => setPlayingVideo(null)}>
        <DialogContent className="!max-w-[600px] w-full">
          <DialogHeader>
            <DialogTitle>{playingVideo?.title}</DialogTitle>
            <DialogDescription>
              {playingVideo?.format?.toUpperCase()} • Created {playingVideo && new Date(playingVideo.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-md overflow-hidden">
            {playingVideo?.url && (
              <video
                src={playingVideo.url}
                controls
                autoPlay
                className="w-full h-full"
                onError={(e) => {
                  console.error('Video playback error:', e);
                }}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Field59 Settings</DialogTitle>
            <DialogDescription>
              Configure your Field59 API credentials to access videos from Field59
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={field59Credentials.username}
                onChange={(e) => setField59Credentials({ ...field59Credentials, username: e.target.value })}
                placeholder="Enter Field59 username"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={field59Credentials.password}
                onChange={(e) => setField59Credentials({ ...field59Credentials, password: e.target.value })}
                placeholder="Enter Field59 password"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowSettings(false);
                fetchVideos();
              }}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface VideoCardProps {
  video: VideoType;
  onDelete: (id: string) => void;
  onPlay: (video: VideoType) => void;
}

function VideoCard({ video, onDelete, onPlay }: VideoCardProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          {/* Thumbnail */}
          <div className="relative w-32 aspect-video bg-muted rounded-md overflow-hidden flex-shrink-0">
            {video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Play className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            {video.status && (
              <Badge
                variant={video.status === 'ready' ? 'default' : 'secondary'}
                className="absolute bottom-1 right-1 text-xs"
              >
                {video.status}
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">
              {video.title}
            </h4>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              {video.duration && (
                <span>Duration: {formatDuration(video.duration)}</span>
              )}
              {video.size && (
                <span>Size: {formatFileSize(video.size)}</span>
              )}
              {video.format && (
                <Badge variant="outline">{video.format.toUpperCase()}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Created: {new Date(video.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPlay(video)}
          >
            <Play className="h-4 w-4 mr-1" />
            Play
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
