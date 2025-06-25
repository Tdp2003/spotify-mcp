import {z} from 'zod'
import {createSuccessResponse, withErrorHandling} from '../../utils/response.js'
import {getDefaultSpotifyClient} from '../../config/spotify.js'

interface SearchResults {
  tracks?: {
    items: unknown[]
    pagination: {
      total: number
      limit: number
      offset: number
      next: string | null
      previous: string | null
    }
  }
  artists?: {
    items: unknown[]
    pagination: {
      total: number
      limit: number
      offset: number
      next: string | null
      previous: string | null
    }
  }
  albums?: {
    items: unknown[]
    pagination: {
      total: number
      limit: number
      offset: number
      next: string | null
      previous: string | null
    }
  }
  playlists?: {
    items: unknown[]
    pagination: {
      total: number
      limit: number
      offset: number
      next: string | null
      previous: string | null
    }
  }
  shows?: {
    items: unknown[]
    pagination: {
      total: number
      limit: number
      offset: number
      next: string | null
      previous: string | null
    }
  }
  episodes?: {
    items: unknown[]
    pagination: {
      total: number
      limit: number
      offset: number
      next: string | null
      previous: string | null
    }
  }
}

export const SearchToolParams = z.object({
  q: z
    .string()
    .min(1)
    .describe('Search query string. You can use field filters like artist:, album:, track:, year:, genre:, etc.'),
  type: z
    .array(z.enum(['album', 'artist', 'playlist', 'track', 'show', 'episode']))
    .min(1)
    .describe('Array of item types to search for'),
  market: z
    .string()
    .length(2)
    .optional()
    .describe('ISO 3166-1 alpha-2 country code to filter results (e.g., "US", "GB")'),
  limit: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .describe('Number of results to return per type (1-50, default: 20)'),
  offset: z
    .number()
    .min(0)
    .optional()
    .default(0)
    .describe('Index of the first result to return (default: 0)'),
  include_external: z
    .enum(['audio'])
    .optional()
    .describe('Include externally hosted audio content'),
})

type Params = z.infer<typeof SearchToolParams>

async function tool(params: Params) {
  const spotifyClient = getDefaultSpotifyClient()

  const options = {
    limit: params.limit,
    offset: params.offset,
    ...(params.market && { market: params.market }),
    ...(params.include_external && { include_external: params.include_external }),
  }

  const searchResponse = await spotifyClient.search(params.q, params.type, options)

  const results: SearchResults = {}

  // Process each search type
  if (params.type.includes('track') && searchResponse.body.tracks) {
    results.tracks = {
      items: searchResponse.body.tracks.items.map((track: SpotifyApi.TrackObjectFull) => ({
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
        },
        duration_ms: track.duration_ms,
        explicit: track.explicit,
        external_urls: track.external_urls,
        popularity: track.popularity,
        preview_url: track.preview_url,
        uri: track.uri,
      })),
      pagination: {
        total: searchResponse.body.tracks.total,
        limit: searchResponse.body.tracks.limit,
        offset: searchResponse.body.tracks.offset,
        next: searchResponse.body.tracks.next,
        previous: searchResponse.body.tracks.previous,
      },
    }
  }

  if (params.type.includes('artist') && searchResponse.body.artists) {
    results.artists = {
      items: searchResponse.body.artists.items.map((artist: SpotifyApi.ArtistObjectFull) => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity,
        external_urls: artist.external_urls,
        images: artist.images,
        followers: artist.followers,
        uri: artist.uri,
      })),
      pagination: {
        total: searchResponse.body.artists.total,
        limit: searchResponse.body.artists.limit,
        offset: searchResponse.body.artists.offset,
        next: searchResponse.body.artists.next,
        previous: searchResponse.body.artists.previous,
      },
    }
  }

  if (params.type.includes('album') && searchResponse.body.albums) {
    results.albums = {
      items: searchResponse.body.albums.items.map((album: SpotifyApi.AlbumObjectSimplified) => ({
        id: album.id,
        name: album.name,
        album_type: album.album_type,
        artists: album.artists.map((artist: SpotifyApi.ArtistObjectSimplified) => ({
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
      })),
      pagination: {
        total: searchResponse.body.albums.total,
        limit: searchResponse.body.albums.limit,
        offset: searchResponse.body.albums.offset,
        next: searchResponse.body.albums.next,
        previous: searchResponse.body.albums.previous,
      },
    }
  }

  if (params.type.includes('playlist') && searchResponse.body.playlists) {
    results.playlists = {
      items: searchResponse.body.playlists.items.map((playlist: SpotifyApi.PlaylistObjectSimplified) => ({
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
        },
        uri: playlist.uri,
      })),
      pagination: {
        total: searchResponse.body.playlists.total,
        limit: searchResponse.body.playlists.limit,
        offset: searchResponse.body.playlists.offset,
        next: searchResponse.body.playlists.next,
        previous: searchResponse.body.playlists.previous,
      },
    }
  }

  if (params.type.includes('show') && searchResponse.body.shows) {
    results.shows = {
      items: searchResponse.body.shows.items.map((show: SpotifyApi.ShowObjectSimplified) => ({
        id: show.id,
        name: show.name,
        description: show.description,
        explicit: show.explicit,
        external_urls: show.external_urls,
        images: show.images,
        languages: show.languages,
        media_type: show.media_type,
        publisher: show.publisher,
        total_episodes: show.total_episodes,
        uri: show.uri,
      })),
      pagination: {
        total: searchResponse.body.shows.total,
        limit: searchResponse.body.shows.limit,
        offset: searchResponse.body.shows.offset,
        next: searchResponse.body.shows.next,
        previous: searchResponse.body.shows.previous,
      },
    }
  }

  if (params.type.includes('episode') && searchResponse.body.episodes) {
    results.episodes = {
      items: searchResponse.body.episodes.items.map((episode: SpotifyApi.EpisodeObjectSimplified) => ({
        id: episode.id,
        name: episode.name,
        description: episode.description,
        duration_ms: episode.duration_ms,
        explicit: episode.explicit,
        external_urls: episode.external_urls,
        images: episode.images,
        language: episode.language,
        languages: episode.languages,
        release_date: episode.release_date,
        release_date_precision: episode.release_date_precision,
        uri: episode.uri,
      })),
      pagination: {
        total: searchResponse.body.episodes.total,
        limit: searchResponse.body.episodes.limit,
        offset: searchResponse.body.episodes.offset,
        next: searchResponse.body.episodes.next,
        previous: searchResponse.body.episodes.previous,
      },
    }
  }

  const totalResults = Object.values(results).reduce((sum: number, typeResult: { items?: unknown[] }) => {
    return sum + (typeResult.items?.length || 0)
  }, 0)

  return createSuccessResponse(
    `Found ${totalResults} results across ${Object.keys(results).length} categories`,
    {
      query: params.q,
      types: params.type,
      results,
    }
  )
}

export const searchTool = withErrorHandling(tool, 'Error performing search') 