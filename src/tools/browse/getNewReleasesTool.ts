import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {getDefaultSpotifyClient} from '../../config/spotify.js'

export const GetNewReleasesToolParams = z.object({
  limit: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .describe('Number of albums to return (1-50, default: 20)'),
  offset: z
    .number()
    .min(0)
    .optional()
    .default(0)
    .describe('Index of the first album to return (default: 0)'),
  country: z
    .string()
    .length(2)
    .optional()
    .describe('ISO 3166-1 alpha-2 country code to filter releases (e.g., "US", "GB")'),
})

type Params = z.infer<typeof GetNewReleasesToolParams>

async function tool(params: Params) {
  const spotifyClient = getDefaultSpotifyClient()

  const options = {
    limit: params.limit,
    offset: params.offset,
    ...(params.country && { country: params.country }),
  }

  const newReleasesResponse = await spotifyClient.getNewReleases(options)

  const albums = newReleasesResponse.body.albums.items.map(album => ({
    id: album.id,
    name: album.name,
    album_type: album.album_type,
    artists: album.artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      external_urls: artist.external_urls,
    })),
    external_urls: album.external_urls,
    images: album.images,
    release_date: album.release_date,
    release_date_precision: album.release_date_precision,
    total_tracks: album.total_tracks,
    uri: album.uri,
  }))

  return createSuccessResponse(
    `Retrieved ${albums.length} new releases`,
    {
      albums,
      pagination: {
        total: newReleasesResponse.body.albums.total,
        limit: newReleasesResponse.body.albums.limit,
        offset: newReleasesResponse.body.albums.offset,
        next: newReleasesResponse.body.albums.next,
        previous: newReleasesResponse.body.albums.previous,
      },
    }
  )
}

export const getNewReleasesTool = withErrorHandling(tool, 'Error getting new releases') 