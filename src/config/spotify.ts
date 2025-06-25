import SpotifyWebApi from 'spotify-web-api-node'
import { env } from './env.js'
import express, { Request, Response } from 'express'
import { Server } from 'http'
import { generateRandomString } from '../utils/random.js'
import open from 'open'

/**
 * Spotify API client instance
 */
let spotifyClient: SpotifyWebApi | null = null

/**
 * In-memory token storage for OAuth flow
 */
let tokenStorage: {
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
} = {}

/**
 * OAuth callback server
 */
let oauthServer: Server | null = null

/**
 * Creates and configures a default Spotify client.
 * This function initializes the Spotify Web API client with credentials from environment variables.
 */
export function getDefaultSpotifyClient(): SpotifyWebApi {
  if (!env.success) {
    throw new Error('Environment variables are not properly configured')
  }

  // Return existing client if already initialized
  if (spotifyClient) {
    return spotifyClient
  }

  // Create new Spotify client with configuration
  spotifyClient = new SpotifyWebApi({
    clientId: env.data.SPOTIFY_CLIENT_ID,
    clientSecret: env.data.SPOTIFY_CLIENT_SECRET,
    redirectUri: env.data.SPOTIFY_REDIRECT_URI,
  })

  // Set access token from env or storage
  const accessToken = env.data.SPOTIFY_API_TOKEN || tokenStorage.accessToken
  if (accessToken) {
    spotifyClient.setAccessToken(accessToken)
  }

  // Set refresh token from env or storage
  const refreshToken = env.data.SPOTIFY_REFRESH_TOKEN || tokenStorage.refreshToken
  if (refreshToken) {
    spotifyClient.setRefreshToken(refreshToken)
  }

  return spotifyClient
}

/**
 * Starts OAuth callback server and returns authorization URL
 */
export async function startOAuthFlow(): Promise<string> {
  if (!env.success) {
    throw new Error('Environment variables are not properly configured')
  }

  // Validate redirect URI
  const redirectUri = new URL(env.data.SPOTIFY_REDIRECT_URI)
  if (
    redirectUri.hostname !== 'localhost' &&
    redirectUri.hostname !== '127.0.0.1'
  ) {
    console.error(
      'Error: Redirect URI must use localhost for automatic token exchange',
    )
    console.error(
      'Please update your environment variables with a localhost redirect URI',
    )
    console.error('Example: http://127.0.0.1:8000/callback')
    throw new Error('Invalid redirect URI: must use localhost')
  }
  
  // Generate state for security
  const state = generateRandomString(16)
  
  // Define required scopes
  const scopes = [
    'user-read-private',
    'user-read-email', 
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-private',
    'playlist-modify-public',
    'user-library-read',
    'user-library-modify',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-recently-played',
    'user-top-read',
    'user-follow-read',
    'user-follow-modify',
    'streaming',
    'app-remote-control'
  ]

  // Create authorization URL with state
  const authParams = new URLSearchParams({
    client_id: env.data.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: env.data.SPOTIFY_REDIRECT_URI,
    scope: scopes.join(' '),
    state: state,
    show_dialog: 'true',
  })

  const authorizationUrl = `https://accounts.spotify.com/authorize?${authParams.toString()}`

  // Start callback server if not already running
  if (!oauthServer) {
    await startCallbackServer(state)
  }

  // Automatically open browser
  try {
    await open(authorizationUrl)
    console.log('Opening browser for authorization...')
  } catch {
    console.log(
      'Failed to open browser automatically. Please visit this URL to authorize:',
    )
    console.log(authorizationUrl)
  }

  return authorizationUrl
}

/**
 * Starts the OAuth callback server
 */
function startCallbackServer(expectedState: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!env.success) {
      reject(new Error('Environment variables not configured'))
      return
    }

    const app = express()
    const redirectUri = new URL(env.data.SPOTIFY_REDIRECT_URI)
    const port = parseInt(redirectUri.port) || 8000
    const callbackPath = redirectUri.pathname || '/callback'

    app.get(callbackPath, async (req: Request, res: Response) => {
      const code = req.query.code as string
      const returnedState = req.query.state as string
      const error = req.query.error as string

      res.writeHead(200, { 'Content-Type': 'text/html' })

      if (error) {
        console.error(`Authorization error: ${error}`)
        res.end(
          '<html><body><h1>Authentication Failed</h1><p>Please close this window and try again.</p></body></html>',
        )
        if (oauthServer) {
          oauthServer.close()
          oauthServer = null
        }
        reject(new Error(`Authorization failed: ${error}`))
        return
      }

      if (returnedState !== expectedState) {
        console.error('State mismatch error')
        res.end(
          '<html><body><h1>Authentication Failed</h1><p>State verification failed. Please close this window and try again.</p></body></html>',
        )
        if (oauthServer) {
          oauthServer.close()
          oauthServer = null
        }
        reject(new Error('State mismatch'))
        return
      }

      if (!code) {
        console.error('No authorization code received')
        res.end(
          '<html><body><h1>Authentication Failed</h1><p>No authorization code received. Please close this window and try again.</p></body></html>',
        )
        if (oauthServer) {
          oauthServer.close()
          oauthServer = null
        }
        reject(new Error('No authorization code received'))
        return
      }

      try {
        const tokens = await exchangeCodeForToken(code)
        
        // Store tokens
        tokenStorage.accessToken = tokens.access_token
        tokenStorage.refreshToken = tokens.refresh_token
        tokenStorage.expiresAt = Date.now() + (tokens.expires_in * 1000)

        // Update client with new tokens
        const client = getDefaultSpotifyClient()
        client.setAccessToken(tokenStorage.accessToken)
        if (tokenStorage.refreshToken) {
          client.setRefreshToken(tokenStorage.refreshToken)
        }

        res.end(
          '<html><body><h1>Authentication Successful!</h1><p>You can now close this window and return to the application.</p></body></html>',
        )
        console.log(
          'Authentication successful! Access token has been saved.',
        )

        // Stop the server
        if (oauthServer) {
          oauthServer.close()
          oauthServer = null
        }
        resolve()
      } catch (error) {
        console.error('Token exchange error:', error)
        res.end(
          '<html><body><h1>Authentication Failed</h1><p>Failed to exchange authorization code for tokens. Please close this window and try again.</p></body></html>',
        )
        if (oauthServer) {
          oauthServer.close()
          oauthServer = null
        }
        reject(error)
      }
    })

    // Handle 404 for other paths
    app.use((_req, res) => {
      res.writeHead(404)
      res.end()
    })

    oauthServer = app.listen(port, '127.0.0.1', () => {
      console.log(
        `Listening for Spotify authentication callback on port ${port}`,
      )
      resolve()
    })

    oauthServer.on('error', (error) => {
      console.error(`Server error: ${error.message}`)
      reject(error)
    })
  })
}

/**
 * Exchanges authorization code for access and refresh tokens
 */
async function exchangeCodeForToken(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const client = getDefaultSpotifyClient()
  const data = await client.authorizationCodeGrant(code)
  
  return {
    access_token: data.body.access_token,
    refresh_token: data.body.refresh_token,
    expires_in: data.body.expires_in
  }
}

/**
 * Checks if we have valid tokens (from env or storage)
 */
export function hasValidTokens(): boolean {
  if (!env.success) return false
  
  const hasEnvTokens = !!(env.data.SPOTIFY_API_TOKEN && env.data.SPOTIFY_REFRESH_TOKEN)
  const hasStorageTokens = !!(tokenStorage.accessToken && tokenStorage.refreshToken)
  const isNotExpired = !tokenStorage.expiresAt || tokenStorage.expiresAt > Date.now()
  
  return hasEnvTokens || (hasStorageTokens && isNotExpired)
}

/**
 * Refreshes the Spotify access token using the refresh token.
 * This should be called when API calls return 401 Unauthorized errors.
 */
export async function refreshSpotifyToken(): Promise<void> {
  const client = getDefaultSpotifyClient()
  
  const refreshToken = (env.success ? env.data.SPOTIFY_REFRESH_TOKEN : undefined) || tokenStorage.refreshToken
  if (!refreshToken) {
    throw new Error('Refresh token not available')
  }

  try {
    const data = await client.refreshAccessToken()
    const newAccessToken = data.body.access_token
    
    // Update storage and client
    tokenStorage.accessToken = newAccessToken
    tokenStorage.expiresAt = Date.now() + (data.body.expires_in * 1000)
    client.setAccessToken(newAccessToken)
    
    // Update refresh token if a new one is provided
    if (data.body.refresh_token) {
      tokenStorage.refreshToken = data.body.refresh_token
      client.setRefreshToken(data.body.refresh_token)
    }
    
    console.log('Successfully refreshed Spotify access token')
  } catch (error) {
    console.error('Failed to refresh Spotify access token:', error)
    throw error
  }
}

/**
 * Validates that the Spotify client can make authenticated requests.
 * This function attempts to get the current user's profile as a test.
 */
export async function validateSpotifyConnection(): Promise<boolean> {
  try {
    const client = getDefaultSpotifyClient()
    await client.getMe()
    return true
  } catch (error) {
    console.error('Spotify connection validation failed:', error)
    
    // Try to refresh token if we get an auth error
    if (error instanceof Error && error.message.includes('401')) {
      try {
        await refreshSpotifyToken()
        const client = getDefaultSpotifyClient()
        await client.getMe()
        return true
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
      }
    }
    
    return false
  }
}

/**
 * Gets the current Spotify client configuration info (without exposing sensitive data)
 */
export function getSpotifyClientInfo() {
  if (!env.success) {
    return { configured: false, error: 'Environment variables not configured' }
  }

  const hasEnvTokens = !!(env.data.SPOTIFY_API_TOKEN && env.data.SPOTIFY_REFRESH_TOKEN)
  const hasStorageTokens = !!(tokenStorage.accessToken && tokenStorage.refreshToken)

  return {
    configured: true,
    hasClientId: !!env.data.SPOTIFY_CLIENT_ID,
    hasClientSecret: !!env.data.SPOTIFY_CLIENT_SECRET,
    hasAccessToken: hasEnvTokens || !!tokenStorage.accessToken,
    hasRefreshToken: hasEnvTokens || !!tokenStorage.refreshToken,
    redirectUri: env.data.SPOTIFY_REDIRECT_URI,
    tokensFromStorage: hasStorageTokens && !hasEnvTokens
  }
}
