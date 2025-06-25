# Spotify MCP Server

> Connect your Spotify account to AI tools and automate your music experience with the Model Context Protocol (MCP).

The **Spotify MCP Server** implements the [Model Context Protocol](https://modelcontextprotocol.ai) to bridge your Spotify account with AI-powered tools like Cursor, Claude, VS Code, and more. It enables AI models to search, analyze, and manage your Spotify music library, playlists, and playback through natural language instructions.

---

## ✨ Key Features

- **Music Search & Discovery**: Find tracks, albums, artists, playlists, shows, and episodes
- **Playlist Management**: View, create, update, reorder, and manage playlists
- **User Library Access**: Access and modify your saved tracks, albums, and shows
- **Personalized Recommendations**: Get music suggestions based on your taste
- **Audio Analysis**: Retrieve audio features (danceability, energy, tempo, etc.) for tracks
- **Playback Control**: (Premium only) Play, pause, skip, and control playback devices
- **User Insights**: View your top tracks, artists, and listening history
- **Queue Management**: Add tracks to your queue and view upcoming songs
- **Device Management**: Transfer playback between devices

---

## 🚀 Quickstart Guide

### Prerequisites

- A Spotify account (Premium required for playback control)
- Spotify API credentials (see below)
- Node.js 18 or newer

### 1. Obtain Spotify API Credentials

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications)
2. Create a new application
3. Note your **Client ID** and **Client Secret**
4. Set the **Redirect URI** to: `http://127.0.0.1:8000/callback`

### 2. Set Environment Variables

Create a `.env` file in your project root with the following:

```
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/callback
```

**Note**: You no longer need to manually obtain access tokens! The server will handle the OAuth flow automatically.

### 3. Install and Run the Server

Install dependencies:

```bash
npm install
```

Build the server:

```bash
npm run build
```

Start the server:

```bash
npm start
```

### 4. Connect from Your AI Tool

Add the following to your MCP-compatible application's configuration (example for Cursor):

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

### 5. Complete Authorization

1. Call the `get_initial_context` tool in your AI application
2. If not already authorized, you'll receive an authorization URL
3. Open the URL in your browser and log in to Spotify
4. Authorize the application - you'll be redirected automatically
5. Call `get_initial_context` again to confirm the connection

---

## 🛠️ Available Tools

> **Note:** Always call `get_initial_context` first to initialize your Spotify connection before using any other tools.

### Context & Setup
- **get_initial_context** – Initializes your Spotify connection and provides usage instructions.

### Playlist Operations
- **get_user_playlists** – Retrieve your playlists (with metadata, pagination, etc.)
- **create_playlist** – Create a new playlist (name, description, privacy, collaborative)
- **update_playlist_details** – Update playlist name, description, privacy, or collaborative status
- **add_tracks_to_playlist** – Add tracks to a playlist (batch up to 100, specify position)
- **remove_tracks_from_playlist** – Remove tracks from a playlist (by URI and/or position)
- **reorder_playlist_tracks** – Move tracks within a playlist

### Music Search & Discovery
- **search** – Find tracks, albums, artists, playlists, shows, and episodes
- **browse** – Discover featured playlists, new releases, and categories
- **recommendations** – Get personalized track recommendations

### User Library & Insights
- **get_saved_tracks** – View your saved tracks
- **get_saved_albums** – View your saved albums
- **get_recently_played** – View your listening history
- **get_top_tracks** – View your top tracks
- **get_top_artists** – View your top artists

### Playback Control (Premium)
- **get_current_playback** – Get current playing track and device info
- **playback_control** – Play, pause, skip, control volume
- **queue_management** – Add tracks to queue, view upcoming tracks
- **device_management** – Transfer playback between devices

### Audio Analysis
- **get_audio_features** – Retrieve audio features for tracks (danceability, energy, tempo, etc.)

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
