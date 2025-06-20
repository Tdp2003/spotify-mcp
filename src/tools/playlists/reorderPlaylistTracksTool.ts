import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {getDefaultSpotifyClient} from '../../config/spotify.js'

export const ReorderPlaylistTracksToolParams = z.object({
  playlistId: z
    .string()
    .describe('ID of the playlist to reorder tracks in'),
  range_start: z
    .number()
    .min(0)
    .describe('Position of the first track to be reordered (0-based index)'),
  range_length: z
    .number()
    .min(1)
    .optional()
    .default(1)
    .describe('Number of tracks to move (default: 1)'),
  insert_before: z
    .number()
    .min(0)
    .describe('Position where the tracks should be inserted (0-based index)'),
  snapshot_id: z
    .string()
    .optional()
    .describe('Playlist snapshot ID to ensure the playlist hasn\'t changed. Recommended for precision'),
})

type Params = z.infer<typeof ReorderPlaylistTracksToolParams>

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

  // Validate range parameters
  const totalTracks = currentPlaylist.body.tracks.total
  
  if (params.range_start >= totalTracks) {
    throw new Error(`range_start (${params.range_start}) cannot be greater than or equal to the total number of tracks (${totalTracks})`)
  }
  
  if (params.range_start + params.range_length > totalTracks) {
    throw new Error(`range_start + range_length (${params.range_start + params.range_length}) cannot exceed the total number of tracks (${totalTracks})`)
  }
  
  if (params.insert_before > totalTracks) {
    throw new Error(`insert_before (${params.insert_before}) cannot be greater than the total number of tracks (${totalTracks})`)
  }

  // Check if the move would actually change anything
  const moveStart = params.range_start
  const moveEnd = params.range_start + params.range_length - 1
  
  if (params.insert_before >= moveStart && params.insert_before <= moveEnd + 1) {
    return createSuccessResponse(
      'No reordering needed - tracks are already in the target position',
      {
        playlist: {
          id: currentPlaylist.body.id,
          name: currentPlaylist.body.name,
          tracks_total: currentPlaylist.body.tracks.total,
        },
        reorder_details: {
          range_start: params.range_start,
          range_length: params.range_length,
          insert_before: params.insert_before,
          no_change: true,
        },
        success: true,
      }
    )
  }

  // Reorder tracks in the playlist
  const response = await spotifyClient.reorderTracksInPlaylist(
    params.playlistId, 
    params.range_start, 
    params.insert_before, 
    {
      range_length: params.range_length,
      ...(params.snapshot_id && { snapshot_id: params.snapshot_id })
    }
  )
  
  // Get updated playlist info
  const updatedPlaylist = await spotifyClient.getPlaylist(params.playlistId)
  
  return createSuccessResponse(
    `Successfully reordered ${params.range_length} track${params.range_length > 1 ? 's' : ''} in playlist "${currentPlaylist.body.name}"`,
    {
      snapshot_id: response.body.snapshot_id,
      playlist: {
        id: updatedPlaylist.body.id,
        name: updatedPlaylist.body.name,
        tracks_total: updatedPlaylist.body.tracks.total,
      },
      reorder_details: {
        range_start: params.range_start,
        range_length: params.range_length,
        insert_before: params.insert_before,
        tracks_moved: params.range_length,
      },
      success: true,
    }
  )
}

export const reorderPlaylistTracksTool = withErrorHandling(tool, 'Error reordering playlist tracks') 