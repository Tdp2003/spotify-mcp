import {z} from 'zod'
import {getDefaultSpotifyClient} from '../config/spotify.js'

/**
 * Gets the default Spotify client for tools
 * This is a convenience function for tools that need access to the Spotify API
 */
export function getSpotifyToolClient() {
  return getDefaultSpotifyClient()
}

/**
 * Schema for Spotify track URIs
 */
export const SpotifyTrackUriSchema = z
  .string()
  .refine(
    (uri) => uri.startsWith('spotify:track:'),
    {
      message: 'URI must be a valid Spotify track URI starting with "spotify:track:"'
    }
  )
  .describe('Spotify track URI (e.g., "spotify:track:4iV5W9uYEdYUVa79Axb7Rh")')

/**
 * Schema for Spotify playlist IDs
 */
export const SpotifyPlaylistIdSchema = z
  .string()
  .min(1)
  .describe('Spotify playlist ID')

/**
 * Schema for Spotify user IDs
 */
export const SpotifyUserIdSchema = z
  .string()
  .min(1)
  .describe('Spotify user ID')

/**
 * Common pagination schema for Spotify API responses
 */
export const PaginationSchema = z.object({
  limit: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .describe('Number of items to return (1-50, default: 20)'),
  offset: z
    .number()
    .min(0)
    .optional()
    .default(0)
    .describe('Index of the first item to return (default: 0)'),
})

/**
 * Validates an array of Spotify track URIs
 */
export function validateSpotifyTrackUris(uris: string[]): string[] {
  const invalidUris = uris.filter(uri => !uri.startsWith('spotify:track:'))
  if (invalidUris.length > 0) {
    throw new Error(`Invalid track URIs detected. All URIs must start with "spotify:track:". Invalid URIs: ${invalidUris.join(', ')}`)
  }
  return uris
}

/**
 * Formats a duration in milliseconds to MM:SS format
 */
export function formatDuration(durationMs: number): string {
  const minutes = Math.floor(durationMs / 60000)
  const seconds = Math.floor((durationMs % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Checks if a user has permission to modify a playlist
 */
export async function checkPlaylistPermissions(playlistId: string): Promise<{
  isOwner: boolean
  isCollaborative: boolean
  canModify: boolean
}> {
  const spotifyClient = getDefaultSpotifyClient()
  
  const [playlist, currentUser] = await Promise.all([
    spotifyClient.getPlaylist(playlistId),
    spotifyClient.getMe()
  ])
  
  const isOwner = playlist.body.owner.id === currentUser.body.id
  const isCollaborative = playlist.body.collaborative
  const canModify = isOwner || isCollaborative
  
  return {
    isOwner,
    isCollaborative,
    canModify
  }
}
