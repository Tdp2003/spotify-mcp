import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {getDefaultSpotifyClient} from '../../config/spotify.js'

export const GetFeaturedPlaylistsToolParams = z.object({
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
  country: z
    .string()
    .length(2)
    .optional()
    .describe('ISO 3166-1 alpha-2 country code to filter playlists (e.g., "US", "GB")'),
  locale: z
    .string()
    .optional()
    .describe('Locale code for playlist descriptions (e.g., "en_US", "sv_SE")'),
  timestamp: z
    .string()
    .optional()
    .describe('ISO 8601 timestamp to get playlists at specific time (e.g., "2014-10-23T09:00:00")'),
})

type Params = z.infer<typeof GetFeaturedPlaylistsToolParams>

async function tool(params: Params) {
  const spotifyClient = getDefaultSpotifyClient()

  const options = {
    limit: params.limit,
    offset: params.offset,
    ...(params.country && { country: params.country }),
    ...(params.locale && { locale: params.locale }),
    ...(params.timestamp && { timestamp: params.timestamp }),
  }

  const featuredPlaylistsResponse = await spotifyClient.getFeaturedPlaylists(options)

  const playlists = featuredPlaylistsResponse.body.playlists.items.map(playlist => ({
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    collaborative: playlist.collaborative,
    public: playlist.public,
    external_urls: playlist.external_urls,
    images: playlist.images,
    owner: {
      id: playlist.owner.id,
      display_name: playlist.owner.display_name,
      external_urls: playlist.owner.external_urls,
    },
    tracks: {
      total: playlist.tracks.total,
      href: playlist.tracks.href,
    },
    snapshot_id: playlist.snapshot_id,
    uri: playlist.uri,
  }))

  return createSuccessResponse(
    `Retrieved ${playlists.length} featured playlists`,
    {
      message: featuredPlaylistsResponse.body.message,
      playlists,
      pagination: {
        total: featuredPlaylistsResponse.body.playlists.total,
        limit: featuredPlaylistsResponse.body.playlists.limit,
        offset: featuredPlaylistsResponse.body.playlists.offset,
        next: featuredPlaylistsResponse.body.playlists.next,
        previous: featuredPlaylistsResponse.body.playlists.previous,
      },
    }
  )
}

export const getFeaturedPlaylistsTool = withErrorHandling(tool, 'Error getting featured playlists') 