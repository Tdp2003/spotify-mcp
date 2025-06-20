import {z} from 'zod'
import {contextStore} from './store.js'
import {withErrorHandling} from '../../utils/response.js'
import {MCP_INSTRUCTIONS} from './instructions.js'
import {getDefaultSpotifyClient, getSpotifyClientInfo, validateSpotifyConnection} from '../../config/spotify.js'

export const GetInitialContextToolParams = z.object({})

type Params = z.infer<typeof GetInitialContextToolParams>

export function hasInitialContext(): boolean {
  return contextStore.hasInitialContext()
}

async function tool(_params: Params) {
  const spotifyClient = getDefaultSpotifyClient()
  const clientInfo = getSpotifyClientInfo()
  
  if (!clientInfo.configured) {
    throw new Error('Spotify client is not properly configured. Please ensure all required environment variables are set.')
  }

  // Validate connection and get basic user info
  const isConnected = await validateSpotifyConnection()
  if (!isConnected) {
    throw new Error('Failed to connect to Spotify API. Please check your credentials and tokens.')
  }

  let userInfo = ''
  let availableMarkets = ''
  
  try {
    // Get current user info for context
    const me = await spotifyClient.getMe()
    userInfo = `Current Spotify User:
  - Display Name: ${me.body.display_name || 'Not available'}
  - User ID: ${me.body.id}
  - Country: ${me.body.country || 'Not specified'}
  - Subscription: ${me.body.product || 'Not specified'}
  - Followers: ${me.body.followers?.total || 0}`

    // Get available markets (for performance, limit to first 10)
    const markets = await spotifyClient.getAvailableGenreSeeds()
    availableMarkets = `Available Genre Seeds (sample): ${markets.body.genres.slice(0, 10).join(', ')}`
  } catch (error) {
    console.warn('Could not fetch additional user context:', error)
    userInfo = 'User information not available'
    availableMarkets = 'Market information not available'
  }

  const configInfo = `Current Spotify Configuration:
  - Client ID: ${clientInfo.hasClientId ? 'Configured' : 'Missing'}
  - Client Secret: ${clientInfo.hasClientSecret ? 'Configured' : 'Missing'}
  - Access Token: ${clientInfo.hasAccessToken ? 'Configured' : 'Missing'}
  - Refresh Token: ${clientInfo.hasRefreshToken ? 'Configured' : 'Missing'}
  - Redirect URI: ${clientInfo.redirectUri}`

  const todaysDate = new Date().toLocaleDateString('en-US')

  const message = `${MCP_INSTRUCTIONS}

This is the initial context for your Spotify integration:

<context>
  ${configInfo}

  ${userInfo}

  ${availableMarkets}

  Available Spotify API Features:
  - Search for tracks, albums, artists, playlists, shows, and episodes
  - Get detailed information about music entities
  - Access user's library, playlists, and saved content
  - Retrieve audio features and analysis
  - Browse featured playlists and new releases
  - Get recommendations based on seeds
  - Access user's recently played tracks
  - Manage user's playback (if Premium)
  - Follow/unfollow artists and users
  - Create and modify playlists
</context>

<todaysDate>${todaysDate}</todaysDate>`

  contextStore.setInitialContextLoaded()

  return {
    content: [
      {
        type: 'text' as const,
        text: message,
      },
    ],
  }
}

export const getInitialContextTool = withErrorHandling(tool, 'Error getting initial Spotify context')
