import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {getDefaultSpotifyClient} from '../../config/spotify.js'

export const CreatePlaylistToolParams = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .describe('Name of the playlist (1-100 characters)'),
  description: z
    .string()
    .max(300)
    .optional()
    .describe('Description of the playlist (max 300 characters)'),
  public: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether the playlist should be public (default: true)'),
  collaborative: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether the playlist should be collaborative (default: false)'),
  userId: z
    .string()
    .optional()
    .describe('User ID to create playlist for. If not provided, creates for current user'),
})

type Params = z.infer<typeof CreatePlaylistToolParams>

async function tool(params: Params) {
  const spotifyClient = getDefaultSpotifyClient()
  
  let userId = params.userId
  
  // If no userId provided, get current user's ID
  if (!userId) {
    const userResponse = await spotifyClient.getMe()
    userId = userResponse.body.id
  }

  const playlistOptions = {
    name: params.name,
    public: params.public,
    collaborative: params.collaborative,
    description: params.description,
  }

  const createdPlaylist = await spotifyClient.createPlaylist(userId, playlistOptions)
  
  const playlist = {
    id: createdPlaylist.body.id,
    name: createdPlaylist.body.name,
    description: createdPlaylist.body.description,
    public: createdPlaylist.body.public,
    collaborative: createdPlaylist.body.collaborative,
    followers: createdPlaylist.body.followers?.total || 0,
    tracks: {
      total: createdPlaylist.body.tracks.total,
      href: createdPlaylist.body.tracks.href,
    },
    images: createdPlaylist.body.images,
    owner: {
      id: createdPlaylist.body.owner.id,
      display_name: createdPlaylist.body.owner.display_name,
    },
    external_urls: createdPlaylist.body.external_urls,
    snapshot_id: createdPlaylist.body.snapshot_id,
    uri: createdPlaylist.body.uri,
  }

  return createSuccessResponse(
    `Playlist "${params.name}" created successfully`,
    {
      playlist,
      success: true,
    }
  )
}

export const createPlaylistTool = withErrorHandling(tool, 'Error creating playlist') 