# Spotify MCP Server

> Connect your Spotify account to AI tools and automate your music experience with the Model Context Protocol (MCP).

The **Spotify MCP Server** implements the [Model Context Protocol](https://modelcontextprotocol.ai) to bridge your Spotify account with AI-powered tools like Cursor, Claude, VS Code, and more. It enables AI models to search, analyze, and manage your Spotify music library, playlists, and playback through natural language instructions.

---

## ✨ Key Features

- **🎵 Music Search & Discovery**: Find tracks, albums, artists, playlists, shows, and episodes
- **📝 Playlist Management**: View, create, update, reorder, and manage playlists
- **📚 User Library Access**: Access and modify your saved tracks, albums, and shows
- **🎯 Personalized Recommendations**: Get music suggestions based on your taste
- **📊 Audio Analysis**: Retrieve audio features (danceability, energy, tempo, etc.) for tracks
- **🎧 Playback Control**: (Premium only) Play, pause, skip, and control playback devices
- **📈 User Insights**: View your top tracks, artists, and listening history
- **🔄 Queue Management**: Add tracks to your queue and view upcoming songs
- **📱 Device Management**: Transfer playback between devices

---

## 🚀 Quickstart Guide

### Prerequisites

- A Spotify account (Premium required for playback control)
- Spotify API credentials (see below)
- Node.js 18 or newer

### Step 1: Get Spotify API Credentials

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications)
2. Create a new application
3. Note your **Client ID** and **Client Secret**
4. Set the **Redirect URI** to: `http://127.0.0.1:8000/callback`

### Step 2: Set Environment Variables

Create a `.env` file in your project root:

```env
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/callback
```

**Note**: You no longer need to manually obtain access tokens! The server will handle the OAuth flow automatically.

### Step 3: Install and Run

```bash
# Install dependencies
npm install

# Build the server
npm run build

# Start the server
npm start
```

### Step 4: Connect from Your AI Tool

Add this configuration to your MCP-compatible application (example for Cursor):

```json
{
  "mcpServers": {
    "spotify": {
      "command": "npx",
      "args": ["-y", "@tdp2003/spotify-mcp@latest"],
      "env": {
        "SPOTIFY_CLIENT_ID": "your-client-id",
        "SPOTIFY_CLIENT_SECRET": "your-client-secret",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:8000/callback"
      }
    }
  }
}
```

### Step 5: Complete Authorization

1. Call the `get_initial_context` tool in your AI application
2. If not already authorized, you'll receive an authorization URL
3. Open the URL in your browser and log in to Spotify
4. Authorize the application - you'll be redirected automatically
5. Call `get_initial_context` again to confirm the connection

---

## 🛠️ Available Tools

> **⚠️ Important**: Always call `get_initial_context` first to initialize your Spotify connection before using any other tools.

### 🔧 Context & Setup

#### `get_initial_context`
**Required first step** - Initializes your Spotify connection and provides usage instructions. This tool must be called before any other operations.

**What it does:**
- Validates your Spotify API credentials
- Initiates OAuth flow if needed
- Retrieves your user profile and account information
- Provides connection status and available features
- Returns usage instructions for the AI assistant

---

### 📝 Playlist Operations

#### `get_user_playlists`
Retrieve playlists for the current user or a specific user.

**Parameters:**
- `limit` (optional): Number of playlists to return (1-50, default: 20)
- `offset` (optional): Index of the first playlist to return (default: 0)
- `userId` (optional): User ID to get playlists for (defaults to current user)

**Returns:** Playlist metadata including name, description, track count, privacy settings, and owner information.

#### `create_playlist`
Create a new playlist with customizable settings.

**Parameters:**
- `name` (required): Playlist name
- `description` (optional): Playlist description
- `public` (optional): Whether playlist is public (default: false)
- `collaborative` (optional): Whether playlist is collaborative (default: false)
- `userId` (optional): User ID to create playlist for (defaults to current user)

**Returns:** Created playlist details including Spotify URI and ID.

#### `update_playlist_details`
Update playlist metadata including name, description, privacy settings, and collaborative status.

**Parameters:**
- `playlistId` (required): Spotify playlist ID
- `name` (optional): New playlist name
- `description` (optional): New playlist description
- `public` (optional): New public/private setting
- `collaborative` (optional): New collaborative setting

**Returns:** Updated playlist details with change summary.

#### `add_tracks_to_playlist`
Add tracks to a playlist with precise position control.

**Parameters:**
- `playlistId` (required): Spotify playlist ID
- `uris` (required): Array of Spotify track URIs (max 100)
- `position` (optional): Position to insert tracks (defaults to end)

**Returns:** Confirmation with snapshot ID and updated track count.

#### `remove_tracks_from_playlist`
Remove tracks from a playlist with precision control.

**Parameters:**
- `playlistId` (required): Spotify playlist ID
- `tracks` (required): Array of track objects with URIs and optional positions
- `snapshot_id` (optional): Playlist snapshot ID for concurrency safety

**Returns:** Confirmation with snapshot ID and removal details.

#### `reorder_playlist_tracks`
Reorder tracks within a playlist by moving a range of tracks to a new position.

**Parameters:**
- `playlistId` (required): Spotify playlist ID
- `range_start` (required): Starting position of tracks to move
- `range_length` (required): Number of tracks to move
- `insert_before` (required): Position to move tracks to
- `snapshot_id` (optional): Playlist snapshot ID for concurrency safety

**Returns:** Confirmation with snapshot ID and reorder details.

---

### 🔍 Music Search & Discovery

#### `search`
Search Spotify's catalog for albums, artists, tracks, playlists, shows, and episodes.

**Parameters:**
- `query` (required): Search query string
- `type` (optional): Content type filter (track, album, artist, playlist, show, episode)
- `limit` (optional): Number of results (1-50, default: 20)
- `offset` (optional): Result offset (default: 0)
- `market` (optional): Country code for market-specific results

**Returns:** Detailed metadata for each result type with pagination information.

#### `get_new_releases`
Get new album releases available on Spotify.

**Parameters:**
- `limit` (optional): Number of releases (1-50, default: 20)
- `offset` (optional): Result offset (default: 0)
- `country` (optional): Country code for regional releases

**Returns:** Recently released albums with artist information, release dates, and metadata.

#### `get_featured_playlists`
Get featured playlists from Spotify's editorial team.

**Parameters:**
- `limit` (optional): Number of playlists (1-50, default: 20)
- `offset` (optional): Result offset (default: 0)
- `country` (optional): Country code for regional content
- `locale` (optional): Language/locale for descriptions

**Returns:** Curated playlists prominently featured on Spotify with descriptions and metadata.

---

### 👤 User Library & Insights

#### `get_user_top_items`
Get the current user's top artists or tracks based on calculated affinity.

**Parameters:**
- `type` (required): Item type ('artists' or 'tracks')
- `time_range` (optional): Time range ('short_term' ~4 weeks, 'medium_term' ~6 months, 'long_term' ~1 year)
- `limit` (optional): Number of items (1-50, default: 20)
- `offset` (optional): Result offset (default: 0)

**Returns:** User's top items with popularity scores and metadata.

---

### 🎧 Playback Control (Premium Only)

*Note: These tools require a Spotify Premium account*

#### `get_current_playback`
Get current playing track and device information.

**Returns:** Current playback state including track, device, and queue information.

#### `playback_control`
Control playback (play, pause, skip, volume).

**Parameters:**
- `action` (required): Playback action (play, pause, next, previous, volume)
- `device_id` (optional): Target device ID
- `volume_percent` (optional): Volume level (0-100, for volume action)

**Returns:** Confirmation of playback action.

#### `queue_management`
Add tracks to queue and view upcoming tracks.

**Parameters:**
- `action` (required): Queue action ('add' or 'get')
- `uris` (optional): Track URIs to add (for 'add' action)
- `device_id` (optional): Target device ID

**Returns:** Queue information or confirmation of track addition.

#### `device_management`
Transfer playback between devices.

**Parameters:**
- `device_id` (required): Target device ID
- `play` (optional): Whether to start playback on transfer (default: false)

**Returns:** Confirmation of device transfer.

---

### 📊 Audio Analysis

#### `get_audio_features`
Retrieve audio features for tracks.

**Parameters:**
- `track_ids` (required): Array of Spotify track IDs

**Returns:** Audio features including:
- **Danceability**: How suitable for dancing (0.0-1.0)
- **Energy**: Intensity and power (0.0-1.0)
- **Speechiness**: Presence of spoken words (0.0-1.0)
- **Acousticness**: Whether track is acoustic (0.0-1.0)
- **Instrumentalness**: Whether track has no vocals (0.0-1.0)
- **Liveness**: Presence of audience (0.0-1.0)
- **Valence**: Musical positivity/happiness (0.0-1.0)
- **Tempo**: Speed in beats per minute (BPM)

---

## ⚙️ Environment Variables

| Variable                | Description                                 | Required |
|-------------------------|---------------------------------------------|----------|
| SPOTIFY_CLIENT_ID       | Spotify client ID                           | ✅       |
| SPOTIFY_CLIENT_SECRET   | Spotify client secret                       | ✅       |
| SPOTIFY_REDIRECT_URI    | Spotify redirect URI (use http://127.0.0.1:8000/callback) | ✅       |
| SPOTIFY_API_TOKEN       | Spotify access token (obtained via OAuth)   | ❌*      |
| SPOTIFY_REFRESH_TOKEN   | Spotify refresh token (obtained via OAuth)  | ❌*      |
| MAX_TOOL_TOKEN_OUTPUT   | Max token output for tool responses (default 50000) | ❌       |

*These tokens are automatically obtained through the OAuth flow when you first use the server.

---

## 👥 User Roles

- **developer**: Full access to all tools and features
- **editor**: Restricted to content-focused tools (no admin features)

Set the role in your MCP client configuration if supported.

---

## 📦 Node.js Environment Setup

If you use a Node version manager (`nvm`, `mise`, `fnm`, etc.), you may need to create symlinks so MCP servers can access Node.js:

```bash
sudo ln -sf "$(which node)" /usr/local/bin/node && sudo ln -sf "$(which npx)" /usr/local/bin/npx
```

Update these symlinks if you change Node versions. Remove them with:

```bash
sudo rm /usr/local/bin/node /usr/local/bin/npx
```

---

## 💻 Development

Install dependencies:

```bash
npm install
```

Build and run in development mode:

```bash
npm run dev
```

Build the server:

```bash
npm run build
```

Run the built server:

```bash
npm start
```

---

## 🧑‍💻 Debugging

You can use the MCP inspector for debugging:

```bash
npx @modelcontextprotocol/inspector -e SPOTIFY_CLIENT_ID=... -e SPOTIFY_CLIENT_SECRET=... -e SPOTIFY_REDIRECT_URI=... -e SPOTIFY_API_TOKEN=... -e SPOTIFY_REFRESH_TOKEN=... node path/to/build/index.js
```

This provides a web interface for inspecting and testing the available tools.

---

## OAuth Flow

The OAuth flow has been improved with the following security and usability enhancements:

### Security Improvements
- **State validation**: Uses cryptographically secure random state parameters to prevent CSRF attacks
- **Redirect URI validation**: Ensures redirect URI uses localhost/127.0.0.1 for automatic token exchange
- **Proper error handling**: Comprehensive error handling for all OAuth failure scenarios

### Usability Improvements
- **Automatic browser opening**: Automatically opens the authorization URL in your default browser
- **Better user feedback**: Clear error messages and status updates throughout the process
- **Graceful server shutdown**: Properly closes the OAuth callback server after completion

### Using the OAuth Helper

The `oauth-helper.js` script provides a standalone way to obtain Spotify tokens:

```bash
node src/utils/oauth-helper.js
```

This will:
1. Validate your environment configuration
2. Start a local callback server
3. Automatically open your browser to the Spotify authorization page
4. Handle the callback and exchange the code for tokens
5. Display the tokens for you to add to your `.env` file

### Environment Variables

Make sure your redirect URI is configured correctly:

```env
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/callback
```

The redirect URI **must** use `localhost` or `127.0.0.1` for the automatic token exchange to work properly.

---

## License

MIT
