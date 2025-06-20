import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {getDefaultSpotifyClient} from '../../config/spotify.js'

export const RemoveTracksFromPlaylistToolParams = z.object({
  playlistId: z
    .string()
    .describe('ID of the playlist to remove tracks from'),
  tracks: z
    .array(
      z.object({
        uri: z
          .string()
          .describe('Spotify URI of the track to remove (e.g., "spotify:track:4iV5W9uYEdYUVa79Axb7Rh")'),
        positions: z
          .array(z.number().min(0))
          .optional()
          .describe('Array of positions to remove the track from. If not provided, all instances of the track will be removed'),
      })
    )
    .min(1)
    .max(100)
    .describe('Array of tracks to remove with optional specific positions'),
  snapshot_id: z
    .string()
    .optional()
    .describe('Playlist snapshot ID to ensure the playlist hasn\'t changed. Recommended for precision'),
})

type Params = z.infer<typeof RemoveTracksFromPlaylistToolParams>

async function tool(params: Params) {
  const spotifyClient = getDefaultSpotifyClient()
  
  // Get current playlist info for validation
  const currentPlaylist = await spotifyClient.getPlaylist(params.playlistId)
  
  // Check if we have permission to modify this playlist
  const currentUser = await spotifyClient.getMe()
  const isOwner = currentPlaylist.body.owner.id === currentUser.body.id
  const isCollaborative = currentPlaylist.body.collaborative
  
  if (!isOwner && !isCollaborative) {
    throw new Error('You do not have permission to modify this playlist. You must be the owner or the playlist must be collaborative.')
  }

  // Validate track URIs
  const invalidUris = params.tracks
    .map(track => track.uri)
    .filter(uri => !uri.startsWith('spotify:track:'))
    
  if (invalidUris.length > 0) {
    throw new Error(`Invalid track URIs detected. All URIs must start with "spotify:track:". Invalid URIs: ${invalidUris.join(', ')}`)
  }

  // Build the remove options
  const removeOptions: any = {
    tracks: params.tracks.map(track => ({
      uri: track.uri,
      ...(track.positions && track.positions.length > 0 ? { positions: track.positions } : {})
    }))
  }

  // Add snapshot_id if provided for precision
  if (params.snapshot_id) {
    removeOptions.snapshot_id = params.snapshot_id
  }

  // Remove tracks from playlist
  const response = await spotifyClient.removeTracksFromPlaylist(params.playlistId, removeOptions.tracks, {
    snapshot_id: params.snapshot_id
  })
  
  // Get updated playlist info
  const updatedPlaylist = await spotifyClient.getPlaylist(params.playlistId)
  
  // Calculate how many track instances were removed
  const totalRemovals = params.tracks.reduce((total, track) => {
    if (track.positions && track.positions.length > 0) {
      return total + track.positions.length
    }
    return total + 1 // If no positions specified, assume removing all instances (at least 1)
  }, 0)

  return createSuccessResponse(
    `Successfully removed ${totalRemovals} track instance${totalRemovals > 1 ? 's' : ''} from playlist "${currentPlaylist.body.name}"`,
    {
      snapshot_id: response.body.snapshot_id,
      playlist: {
        id: updatedPlaylist.body.id,
        name: updatedPlaylist.body.name,
        tracks_total: updatedPlaylist.body.tracks.total,
      },
      removed_tracks: {
        count: totalRemovals,
        tracks: params.tracks,
      },
      success: true,
    }
  )
}

export const removeTracksFromPlaylistTool = withErrorHandling(tool, 'Error removing tracks from playlist') 