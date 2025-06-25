import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {getNewReleasesTool, GetNewReleasesToolParams} from './getNewReleasesTool.js'
import {getFeaturedPlaylistsTool, GetFeaturedPlaylistsToolParams} from './getFeaturedPlaylistsTool.js'
import {searchTool, SearchToolParams} from './searchTool.js'

export function registerBrowseTools(server: McpServer) {
  server.tool(
    'get_new_releases',
    'Get new album releases available on Spotify. Returns paginated list of recently released albums with artist information, release dates, and metadata. Supports country filtering for regional releases.',
    GetNewReleasesToolParams.shape,
    getNewReleasesTool,
  )

  server.tool(
    'get_featured_playlists',
    'Get featured playlists from Spotify\'s editorial team. Returns curated playlists prominently featured on Spotify with descriptions and metadata. Supports country and locale filtering for regional content.',
    GetFeaturedPlaylistsToolParams.shape,
    getFeaturedPlaylistsTool,
  )

  server.tool(
    'search',
    'Search Spotify\'s catalog for albums, artists, tracks, playlists, shows, and episodes. Supports comprehensive search across all content types with advanced filtering options and pagination. Returns detailed metadata for each result type.',
    SearchToolParams.shape,
    searchTool,
  )
} 