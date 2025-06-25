import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {getDefaultSpotifyClient} from '../../config/spotify.js'

export const GetUserTopItemsToolParams = z.object({
  type: z
    .enum(['artists', 'tracks'])
    .describe('The type of entity to return. Valid values: "artists" or "tracks"'),
  time_range: z
    .enum(['long_term', 'medium_term', 'short_term'])
    .optional()
    .default('medium_term')
    .describe('Over what time frame the affinities are computed. Valid values: "long_term" (~1 year), "medium_term" (~6 months), "short_term" (~4 weeks). Default: "medium_term"'),
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

type Params = z.infer<typeof GetUserTopItemsToolParams>

async function tool(params: Params) {
  const spotifyClient = getDefaultSpotifyClient()

  const options = {
    limit: params.limit,
    offset: params.offset,
    time_range: params.time_range,
  }

  let processedItems: Array<Record<string, unknown>>
  let paginationData: {
    total: number
    limit: number
    offset: number
    next: string | null
    previous: string | null
  }

  if (params.type === 'artists') {
    const responseData = await spotifyClient.getMyTopArtists(options)
    processedItems = responseData.body.items.map((artist: SpotifyApi.ArtistObjectFull) => ({
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
      popularity: artist.popularity,
      external_urls: artist.external_urls,
      images: artist.images,
      followers: artist.followers,
      uri: artist.uri,
      type: artist.type,
    }))
    paginationData = {
      total: responseData.body.total,
      limit: responseData.body.limit,
      offset: responseData.body.offset,
      next: responseData.body.next,
      previous: responseData.body.previous,
    }
  } else {
    const responseData = await spotifyClient.getMyTopTracks(options)
    processedItems = responseData.body.items.map((track: SpotifyApi.TrackObjectFull) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist: SpotifyApi.ArtistObjectSimplified) => ({
        id: artist.id,
        name: artist.name,
        external_urls: artist.external_urls,
      })),
      album: {
        id: track.album.id,
        name: track.album.name,
        images: track.album.images,
        artists: track.album.artists.map((artist: SpotifyApi.ArtistObjectSimplified) => ({
          id: artist.id,
          name: artist.name,
          external_urls: artist.external_urls,
        })),
      },
      duration_ms: track.duration_ms,
      explicit: track.explicit,
      external_urls: track.external_urls,
      popularity: track.popularity,
      preview_url: track.preview_url,
      uri: track.uri,
      type: track.type,
    }))
    paginationData = {
      total: responseData.body.total,
      limit: responseData.body.limit,
      offset: responseData.body.offset,
      next: responseData.body.next,
      previous: responseData.body.previous,
    }
  }

  return createSuccessResponse(
    `Retrieved ${processedItems.length} top ${params.type} for time range: ${params.time_range}`,
    {
      [params.type]: processedItems,
      pagination: paginationData,
      time_range: params.time_range,
      type: params.type,
    }
  )
}

export const getUserTopItemsTool = withErrorHandling(tool, 'Error getting user top items') 