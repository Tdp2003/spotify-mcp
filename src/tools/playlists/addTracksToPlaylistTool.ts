import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {getDefaultSpotifyClient} from '../../config/spotify.js'

export const AddTracksToPlaylistToolParams = z.object({
  playlistId: z
    .string()
    .describe('ID of the playlist to add tracks to'),
  uris: z
    .array(z.string())
    .min(1)
    .max(100)
    .describe('Array of Spotify URIs for tracks to add (max 100 per request). Use track URIs like "spotify:track:4iV5W9uYEdYUVa79Axb7Rh"'),
  position: z
    .number()
    .min(0)
    .optional()
    .describe('Position to insert tracks at. If not provided, tracks are added to the end of the playlist'),
})

type Params = z.infer<typeof AddTracksToPlaylistToolParams>

async function tool(params: Params) {
  const spotifyClient = getDefaultSpotifyClient()
  
  if (params.uris.length === 0) {
    throw new Error('No track URIs provided')
  }
  
  // Validate that all URIs are properly formatted
  const invalidUris = params.uris.filter(uri => !uri.startsWith('spotify:track:'))
  if (invalidUris.length > 0) {
    throw new Error(`Invalid track URIs detected. All URIs must start with "spotify:track:". Invalid URIs: ${invalidUris.join(', ')}`)
  }

  // Get current playlist info for validation
  const currentPlaylist = await spotifyClient.getPlaylist(params.playlistId)
  
  // Check if we have permission to modify this playlist
  const currentUser = await spotifyClient.getMe()
  const isOwner = currentPlaylist.body.owner.id === currentUser.body.id
  const isCollaborative = currentPlaylist.body.collaborative
  
  if (!isOwner && !isCollaborative) {
    throw new Error('You do not have permission to modify this playlist. You must be the owner or the playlist must be collaborative.')
  }

  // Add tracks to playlist using the correct method signature
  let response
  if (params.position !== undefined) {
    // Pass position as third parameter when specified
    response = await spotifyClient.addTracksToPlaylist(params.playlistId, params.uris, { position: params.position })
  } else {
    // When no position specified, only pass playlist ID and URIs
    response = await spotifyClient.addTracksToPlaylist(params.playlistId, params.uris)
  }
  
  // Get updated playlist info
  const updatedPlaylist = await spotifyClient.getPlaylist(params.playlistId)
  
  return createSuccessResponse(
    `Successfully added ${params.uris.length} track${params.uris.length > 1 ? 's' : ''} to playlist "${currentPlaylist.body.name}"`,
    {
      snapshot_id: response.body.snapshot_id,
      playlist: {
        id: updatedPlaylist.body.id,
        name: updatedPlaylist.body.name,
        tracks_total: updatedPlaylist.body.tracks.total,
      },
      added_tracks: {
        count: params.uris.length,
        uris: params.uris,
        position: params.position,
      },
      success: true,
    }
  )
}

export const addTracksToPlaylistTool = withErrorHandling(tool, 'Error adding tracks to playlist') 