import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {getDefaultSpotifyClient} from '../../config/spotify.js'

export const UpdatePlaylistDetailsToolParams = z.object({
  playlistId: z
    .string()
    .describe('ID of the playlist to update'),
  name: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe('New name for the playlist (1-100 characters)'),
  description: z
    .string()
    .max(300)
    .optional()
    .describe('New description for the playlist (max 300 characters)'),
  public: z
    .boolean()
    .optional()
    .describe('Whether the playlist should be public'),
  collaborative: z
    .boolean()
    .optional()
    .describe('Whether the playlist should be collaborative'),
})

type Params = z.infer<typeof UpdatePlaylistDetailsToolParams>

async function tool(params: Params) {
  const spotifyClient = getDefaultSpotifyClient()
  
  // First, get the current playlist details
  const currentPlaylist = await spotifyClient.getPlaylist(params.playlistId)
  
  // Build the update options with only the fields that were provided
  const updateOptions: any = {}
  
  if (params.name !== undefined) {
    updateOptions.name = params.name
  }
  
  if (params.description !== undefined) {
    updateOptions.description = params.description
  }
  
  if (params.public !== undefined) {
    updateOptions.public = params.public
  }
  
  if (params.collaborative !== undefined) {
    updateOptions.collaborative = params.collaborative
  }

  // If no updates were provided, return an error
  if (Object.keys(updateOptions).length === 0) {
    throw new Error('At least one field (name, description, public, or collaborative) must be provided for update')
  }

  // Update the playlist
  await spotifyClient.changePlaylistDetails(params.playlistId, updateOptions)
  
  // Get the updated playlist details
  const updatedPlaylist = await spotifyClient.getPlaylist(params.playlistId)
  
  const playlist = {
    id: updatedPlaylist.body.id,
    name: updatedPlaylist.body.name,
    description: updatedPlaylist.body.description,
    public: updatedPlaylist.body.public,
    collaborative: updatedPlaylist.body.collaborative,
    followers: updatedPlaylist.body.followers?.total || 0,
    tracks: {
      total: updatedPlaylist.body.tracks.total,
      href: updatedPlaylist.body.tracks.href,
    },
    images: updatedPlaylist.body.images,
    owner: {
      id: updatedPlaylist.body.owner.id,
      display_name: updatedPlaylist.body.owner.display_name,
    },
    external_urls: updatedPlaylist.body.external_urls,
    snapshot_id: updatedPlaylist.body.snapshot_id,
    uri: updatedPlaylist.body.uri,
  }

  // Create a summary of what was changed
  const changes = []
  if (params.name !== undefined) changes.push(`name to "${params.name}"`)
  if (params.description !== undefined) changes.push(`description to "${params.description}"`)
  if (params.public !== undefined) changes.push(`visibility to ${params.public ? 'public' : 'private'}`)
  if (params.collaborative !== undefined) changes.push(`collaboration to ${params.collaborative ? 'enabled' : 'disabled'}`)

  return createSuccessResponse(
    `Playlist updated successfully. Changed: ${changes.join(', ')}`,
    {
      playlist,
      changes: updateOptions,
      success: true,
    }
  )
}

export const updatePlaylistDetailsTool = withErrorHandling(tool, 'Error updating playlist details') 