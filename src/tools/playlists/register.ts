import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {getUserPlaylistsTool, GetUserPlaylistsToolParams} from './getUserPlaylistsTool.js'
import {createPlaylistTool, CreatePlaylistToolParams} from './createPlaylistTool.js'
import {updatePlaylistDetailsTool, UpdatePlaylistDetailsToolParams} from './updatePlaylistDetailsTool.js'
import {addTracksToPlaylistTool, AddTracksToPlaylistToolParams} from './addTracksToPlaylistTool.js'
import {removeTracksFromPlaylistTool, RemoveTracksFromPlaylistToolParams} from './removeTracksFromPlaylistTool.js'
import {reorderPlaylistTracksTool, ReorderPlaylistTracksToolParams} from './reorderPlaylistTracksTool.js'

export function registerPlaylistsTools(server: McpServer) {
  server.tool(
    'get_user_playlists',
    'Retrieve playlists for the current user or a specific user. Supports pagination for efficient loading of large playlist collections. Returns playlist metadata including name, description, track count, and privacy settings.',
    GetUserPlaylistsToolParams.shape,
    getUserPlaylistsTool,
  )

  server.tool(
    'create_playlist',
    'Create a new playlist with customizable settings. Allows setting name, description, privacy (public/private), and collaborative options. Returns the created playlist details including Spotify URI and ID.',
    CreatePlaylistToolParams.shape,
    createPlaylistTool,
  )

  server.tool(
    'update_playlist_details',
    'Update playlist metadata including name, description, privacy settings, and collaborative status. Only updates the fields you specify, leaving others unchanged. Requires playlist ownership or collaborative permissions.',
    UpdatePlaylistDetailsToolParams.shape,
    updatePlaylistDetailsTool,  
  )

  server.tool(
    'add_tracks_to_playlist',
    'Add tracks to a playlist with precise position control. Supports batch adding up to 100 tracks per request for optimal performance. Validates permissions and track URIs before adding. Can insert tracks at specific positions or append to end.',
    AddTracksToPlaylistToolParams.shape,
    addTracksToPlaylistTool,
  )

  server.tool(
    'remove_tracks_from_playlist',
    'Remove tracks from a playlist with precision control. Can remove all instances of a track or specific occurrences by position. Supports batch removal and uses snapshot IDs for concurrency safety. Validates permissions before removal.',
    RemoveTracksFromPlaylistToolParams.shape,
    removeTracksFromPlaylistTool,
  )

  server.tool(
    'reorder_playlist_tracks',
    'Reorder tracks within a playlist by moving a range of tracks to a new position. Provides validation to prevent invalid moves and includes no-op detection for efficiency. Uses snapshot IDs for safe concurrent modifications.',
    ReorderPlaylistTracksToolParams.shape,
    reorderPlaylistTracksTool,
  )
} 