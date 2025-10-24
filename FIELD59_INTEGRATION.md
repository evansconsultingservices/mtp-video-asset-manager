# Field59 API Integration

This document explains the Field59 API integration in the Video Asset Manager.

## Overview

The Video Asset Manager now supports fetching videos from Field59's API, uploading videos to Field59, and managing Field59 videos directly from the UI.

## Features

### 1. **Dual Data Source Support**
- **Mock Data**: Local mock videos for development and testing
- **Field59**: Real videos from your Field59 account

### 2. **Field59 Operations**
- **List Videos**: Fetch up to 50 videos from Field59
- **Create Videos**: Upload videos to Field59 by URL
- **Delete Videos**: Remove videos from Field59
- **Get Video Details**: Fetch detailed information about specific videos

### 3. **UI Integration**
- **Source Toggle**: Switch between Mock Data and Field59
- **Settings Dialog**: Configure Field59 credentials
- **Upload Button**: Upload mock videos to Field59 (shown only when viewing mock data)

## Setup

### 1. Configure Field59 Credentials

Create a `.env` file in the `child_apps/video-asset-manager/` directory:

```bash
# Field59 API Credentials
REACT_APP_FIELD59_USERNAME=your_field59_username
REACT_APP_FIELD59_PASSWORD=your_field59_password

# Enable Field59 integration
REACT_APP_FIELD59_ENABLED=true
```

**Note**: Never commit the `.env` file to version control. Use `.env.example` as a template.

### 2. Restart the Application

After creating the `.env` file, restart the dev server:

```bash
cd child_apps/video-asset-manager
npm start
```

## Usage

### Switching Data Sources

1. Click the **"Mock Data"** or **"Field59"** button in the top-right header
2. The button color changes to indicate the active source:
   - **Blue (filled)**: Field59 is active
   - **Gray (outline)**: Mock Data is active

### Configuring Credentials

1. Click the **Settings** button (gear icon) in the top-right header
2. Enter your Field59 username and password
3. Click **Save**

If you switch to Field59 mode without credentials, you'll see an error message prompting you to configure them.

### Uploading Videos to Field59

When viewing **Mock Data**:

1. Each video card shows an **"Upload to Field59"** button
2. Click the button to upload that video to your Field59 account
3. The button shows a spinner while uploading
4. A success message displays the Field59 video key upon completion

**Note**: The upload button is only visible when viewing mock data, since Field59 videos are already in Field59.

### Deleting Videos

- When viewing **Mock Data**: Deletes from local mock data
- When viewing **Field59**: Deletes from your Field59 account (requires confirmation)

## API Reference

### Field59ApiService

Located in `src/services/field59Api.ts`

#### `listVideos(credentials, limit)`
Fetches videos from Field59 API.

```typescript
const videos = await Field59ApiService.listVideos(
  { username: 'user', password: 'pass' },
  50 // limit
);
```

#### `createVideoFromUrl(credentials, videoUrl, title?)`
Creates a video in Field59 from a URL.

```typescript
const key = await Field59ApiService.createVideoFromUrl(
  { username: 'user', password: 'pass' },
  'https://example.com/video.mp4',
  'My Video Title'
);
```

#### `deleteVideo(credentials, videoKey)`
Deletes a video from Field59.

```typescript
await Field59ApiService.deleteVideo(
  { username: 'user', password: 'pass' },
  'video-key-123'
);
```

#### `getVideo(credentials, videoKey)`
Gets details for a specific video.

```typescript
const video = await Field59ApiService.getVideo(
  { username: 'user', password: 'pass' },
  'video-key-123'
);
```

#### `convertToLocalVideo(field59Video)`
Converts a Field59 video object to the local Video type.

```typescript
const localVideo = Field59ApiService.convertToLocalVideo(field59Video);
```

## Field59 Video Data Structure

Field59 videos include additional metadata stored in the `field59` property:

```typescript
{
  id: string;                    // Field59 key
  title: string;
  url: string;                   // Video URL or adaptive stream URL
  thumbnail: string;             // Medium or full thumbnail
  duration: number;              // Duration in seconds
  createdAt: string;             // ISO date string
  format: 'mp4';
  status: 'ready';
  field59: {
    key: string;                 // Unique Field59 identifier
    category: string;            // Video category
    tags: string[];              // Video tags
    adaptiveStream: string;      // HLS/DASH stream URL
    summary: string;             // Short summary
    description: string;         // Full description
    playlists: string[];         // Associated playlists
    lastModifiedDate: string;    // Last modification date
    owner: string;               // Video owner
  }
}
```

## Proxy Configuration

The app proxies Field59 API requests through the dev server to avoid CORS issues.

**`craco.config.js`:**
```javascript
devServer: {
  proxy: {
    '/v2': {
      target: 'https://api.field59.com',
      changeOrigin: true,
      secure: true,
      logLevel: 'debug'
    }
  }
}
```

**API Endpoints:**
- `GET /v2/search?limit=50` - List videos
- `POST /v2/video/create` - Create video
- `DELETE /v2/video/{key}` - Delete video
- `GET /v2/video/{key}` - Get video details

## Authentication

Field59 uses **HTTP Basic Authentication** with Base64-encoded credentials:

```typescript
const authHeader = `Basic ${btoa(`${username}:${password}`)}`;
```

Headers sent with each request:
```
Authorization: Basic <base64-credentials>
Accept: application/xml
```

## XML Response Parsing

Field59 API returns XML responses. The service uses the browser's `DOMParser` to parse them:

```typescript
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(response.data, 'text/xml');
const videos = xmlDoc.querySelectorAll('video');
```

CDATA content is extracted and cleaned:
```typescript
const getCData = (element, tagName) => {
  const node = element.querySelector(tagName);
  return node?.textContent?.replace(/^\[CDATA\[(.*)\]\]$/, '$1') || '';
};
```

## Error Handling

The service provides clear error messages:

- **401 Unauthorized**: Invalid Field59 credentials
- **404 Not Found**: Video doesn't exist
- **Network errors**: Generic failure messages

```typescript
try {
  const videos = await Field59ApiService.listVideos(credentials);
} catch (error) {
  if (error.message === 'Invalid Field59 credentials') {
    // Show login prompt
  } else {
    // Show generic error
  }
}
```

## Troubleshooting

### "Invalid Field59 credentials" error
- Verify username and password in Settings
- Check that credentials are correct in your Field59 account
- Ensure environment variables are set correctly

### Videos not loading
- Check browser console for errors
- Verify the dev server is running on port 3004
- Ensure the proxy configuration is correct
- Check that Field59 API is accessible

### Proxy errors
- Check `craco.config.js` proxy configuration
- Verify `/v2` endpoints are being proxied
- Check dev server logs for proxy errors

### Upload failures
- Ensure video URL is publicly accessible
- Check video format is supported by Field59
- Verify you have permission to create videos in Field59

## Development

### Adding New Field59 Features

1. **Add method to Field59ApiService**:
```typescript
static async newFeature(credentials: Field59Credentials, param: string): Promise<Result> {
  const response = await axios.get(`/v2/new-endpoint`, {
    headers: { 'Authorization': getAuthHeader(credentials) }
  });
  return parseResponse(response.data);
}
```

2. **Update UI in App.tsx**:
```typescript
const handleNewFeature = async () => {
  try {
    const result = await Field59ApiService.newFeature(field59Credentials, 'param');
    // Handle result
  } catch (error) {
    // Handle error
  }
};
```

3. **Add UI controls**:
```tsx
<Button onClick={handleNewFeature}>
  <Icon className="h-4 w-4 mr-1" />
  New Feature
</Button>
```

### Testing

Create Playwright tests for Field59 integration:

```typescript
test('field59 integration', async ({ page }) => {
  await page.goto('http://localhost:3004');

  // Switch to Field59 mode
  await page.click('button:has-text("Mock Data")');

  // Configure credentials
  await page.click('button:has-text("Settings")');
  await page.fill('#username', 'testuser');
  await page.fill('#password', 'testpass');
  await page.click('button:has-text("Save")');

  // Verify videos load
  await page.waitForSelector('.border.rounded-lg');
});
```

## Security Notes

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive data
3. **Credentials are stored in component state** - they don't persist across sessions
4. **HTTPS is enforced** for Field59 API calls
5. **Basic Auth credentials** are Base64-encoded (not encrypted)

## Production Deployment

For production:

1. **Set environment variables** in your hosting platform (Vercel, etc.)
2. **Update proxy configuration** to use production API endpoints
3. **Consider using a backend** to store credentials securely
4. **Implement OAuth** or token-based auth instead of Basic Auth
5. **Add rate limiting** to prevent API abuse
6. **Monitor API usage** and costs

## Related Files

- **Field59 API Service**: `src/services/field59Api.ts`
- **Video Types**: `src/types/video.ts`
- **Main Component**: `src/App.tsx`
- **Proxy Config**: `craco.config.js`
- **Environment Template**: `.env.example`

## Support

For issues or questions:
1. Check the browser console for errors
2. Review Field59 API documentation: https://api.field59.com
3. Check proxy logs in the dev server output
4. Test with Playwright to verify UI functionality

## Future Enhancements

Potential improvements:
- [ ] Pagination for large video lists
- [ ] Bulk upload/delete operations
- [ ] Video metadata editing
- [ ] Playlist management
- [ ] Analytics and usage stats
- [ ] Video search and filtering
- [ ] Thumbnail generation
- [ ] Video transcoding status
- [ ] WebSocket updates for real-time changes
- [ ] Offline mode with local caching
