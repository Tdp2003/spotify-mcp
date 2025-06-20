import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {getDefaultSpotifyClient} from '../../config/spotify.js'

export const GetUserPlaylistsToolParams = z.object({
  limit: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .describe('Number of playlists to return (1-50, default: 20)'),
  offset: z
    .number()
    .min(0)
    .optional()
    .default(0)
    .describe('Index of the first playlist to return (default: 0)'),
  userId: z
    .string()
    .optional()
    .describe('User ID to get playlists for. If not provided, gets current user\'s playlists'),
})

type Params = z.infer<typeof GetUserPlaylistsToolParams>

async function tool(params: Params) {
  const spotifyClient = getDefaultSpotifyClient()
  
  const options = {
    limit: params.limit,
    offset: params.offset,
  }

  let playlistsResponse
  
  if (params.userId) {
    // Get specific user's playlists
    playlistsResponse = await spotifyClient.getUserPlaylists(params.userId, options)
  } else {
    // Get current user's playlists
    playlistsResponse = await spotifyClient.getUserPlaylists(options)
  }

  const playlists = playlistsResponse.body.items.map(playlist => ({
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    public: playlist.public,
    collaborative: playlist.collaborative,
    tracks: {
      total: playlist.tracks.total,
      href: playlist.tracks.href,
    },
    images: playlist.images,
    owner: {
      id: playlist.owner.id,
      display_name: playlist.owner.display_name,
    },
    external_urls: playlist.external_urls,
    snapshot_id: playlist.snapshot_id,
  }))

  return createSuccessResponse(
    `Retrieved ${playlists.length} playlists`,
    {
      playlists,
      pagination: {
        total: playlistsResponse.body.total,
        limit: playlistsResponse.body.limit,
        offset: playlistsResponse.body.offset,
        next: playlistsResponse.body.next,
        previous: playlistsResponse.body.previous,
      },
    }
  )
}

export const getUserPlaylistsTool = withErrorHandling(tool, 'Error getting user playlists') 