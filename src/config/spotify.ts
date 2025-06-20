import SpotifyWebApi from 'spotify-web-api-node'
import { env } from './env.js'


/**
* Spotify API client instance
*/
let spotifyClient: SpotifyWebApi | null = null


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


 // Set access token if available
 if (env.data.SPOTIFY_API_TOKEN) {
   spotifyClient.setAccessToken(env.data.SPOTIFY_API_TOKEN)
 }


 // Set refresh token if available
 if (env.data.SPOTIFY_REFRESH_TOKEN) {
   spotifyClient.setRefreshToken(env.data.SPOTIFY_REFRESH_TOKEN)
 }


 return spotifyClient
}


/**
* Refreshes the Spotify access token using the refresh token.
* This should be called when API calls return 401 Unauthorized errors.
*/
export async function refreshSpotifyToken(): Promise<void> {
 const client = getDefaultSpotifyClient()
  if (!env.success || !env.data.SPOTIFY_REFRESH_TOKEN) {
   throw new Error('Refresh token not available')
 }


 try {
   const data = await client.refreshAccessToken()
   client.setAccessToken(data.body.access_token)
  
   // Update refresh token if a new one is provided
   if (data.body.refresh_token) {
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


 return {
   configured: true,
   hasClientId: !!env.data.SPOTIFY_CLIENT_ID,
   hasClientSecret: !!env.data.SPOTIFY_CLIENT_SECRET,
   hasAccessToken: !!env.data.SPOTIFY_API_TOKEN,
   hasRefreshToken: !!env.data.SPOTIFY_REFRESH_TOKEN,
   redirectUri: env.data.SPOTIFY_REDIRECT_URI,
 }
}

