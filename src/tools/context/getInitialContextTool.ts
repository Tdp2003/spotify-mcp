import {z} from 'zod'
import {contextStore} from './store.js'
import {withErrorHandling} from '../../utils/response.js'
import {MCP_INSTRUCTIONS} from './instructions.js'
import {getDefaultSpotifyClient, getSpotifyClientInfo, validateSpotifyConnection, hasValidTokens, startOAuthFlow} from '../../config/spotify.js'

export const GetInitialContextToolParams = z.object({})

type Params = z.infer<typeof GetInitialContextToolParams>

export function hasInitialContext(): boolean {
  return contextStore.hasInitialContext()
}

async function tool(_params: Params) {
  const clientInfo = getSpotifyClientInfo()
  
  if (!clientInfo.configured) {
    throw new Error(`Spotify Authorization Required!

To use this Spotify MCP server, you need to configure the required environment variables:

1. Go to the Spotify Developer Dashboard: https://developer.spotify.com/dashboard/applications
2. Create a new application (or use an existing one)
3. Set the Redirect URI to: http://127.0.0.1:8000/callback
4. Note your Client ID and Client Secret

Then set these environment variables:
- SPOTIFY_CLIENT_ID=your-client-id
- SPOTIFY_CLIENT_SECRET=your-client-secret  
- SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/callback

Once configured, call get_initial_context again to start the authorization flow.`)
  }

  // Check if we have valid tokens
  if (!hasValidTokens()) {
    // Start OAuth flow
    try {
      const authUrl = await startOAuthFlow()
      
      throw new Error(`Spotify Authorization Required!

To use this Spotify MCP server, you need to authorize the application:

1. Open this URL in your browser:
   ${authUrl}

2. Log in to Spotify and authorize the application

3. After authorization, you'll be redirected and the callback will be handled automatically

4. Once complete, call get_initial_context again

The authorization server is now running and waiting for your response.`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('Spotify Authorization Required!')) {
        throw error
      }
      throw new Error(`Failed to start OAuth flow: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Validate connection and get basic user info
  const isConnected = await validateSpotifyConnection()
  if (!isConnected) {
    throw new Error('Failed to connect to Spotify API. Please try running get_initial_context again to refresh tokens.')
  }

  const spotifyClient = getDefaultSpotifyClient()
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
  - Redirect URI: ${clientInfo.redirectUri}
  - Token Source: ${clientInfo.tokensFromStorage ? 'OAuth Flow' : 'Environment Variables'}`

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
