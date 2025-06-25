#!/usr/bin/env node

import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';
import open from 'open';

// Load environment variables
dotenv.config();

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI = 'http://127.0.0.1:8000/callback'
} = process.env;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error('❌ Missing required environment variables:');
  console.error('   SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are required');
  console.error('   Please set them in your .env file');
  process.exit(1);
}

// Validate redirect URI
const redirectUri = new URL(SPOTIFY_REDIRECT_URI);
if (
  redirectUri.hostname !== 'localhost' &&
  redirectUri.hostname !== '127.0.0.1'
) {
  console.error('❌ Error: Redirect URI must use localhost for automatic token exchange');
  console.error('   Please update your SPOTIFY_REDIRECT_URI with a localhost redirect URI');
  console.error('   Example: http://127.0.0.1:8000/callback');
  process.exit(1);
}

const port = redirectUri.port || '8000';
const callbackPath = redirectUri.pathname || '/callback';

// Generate state for security
function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

const state = generateRandomString(16);

// Create Spotify client
const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
  redirectUri: SPOTIFY_REDIRECT_URI,
});

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
];

// Create authorization URL with state
const authParams = new URLSearchParams({
  client_id: SPOTIFY_CLIENT_ID,
  response_type: 'code',
  redirect_uri: SPOTIFY_REDIRECT_URI,
  scope: scopes.join(' '),
  state: state,
  show_dialog: 'true',
});

const authorizationUrl = `https://accounts.spotify.com/authorize?${authParams.toString()}`;

// Create Express app
const app = express();

app.get(callbackPath, async (req, res) => {
  const code = req.query.code;
  const returnedState = req.query.state;
  const error = req.query.error;

  res.writeHead(200, { 'Content-Type': 'text/html' });

  if (error) {
    console.error(`❌ Authorization error: ${error}`);
    res.end(
      '<html><body><h1>❌ Authentication Failed</h1><p>Please close this window and try again.</p></body></html>'
    );
    server.close();
    process.exit(1);
  }

  if (returnedState !== state) {
    console.error('❌ State mismatch error');
    res.end(
      '<html><body><h1>❌ Authentication Failed</h1><p>State verification failed. Please close this window and try again.</p></body></html>'
    );
    server.close();
    process.exit(1);
  }

  if (!code) {
    console.error('❌ No authorization code received');
    res.end(
      '<html><body><h1>❌ Authentication Failed</h1><p>No authorization code received. Please close this window and try again.</p></body></html>'
    );
    server.close();
    process.exit(1);
  }

  try {
    console.log('🔄 Exchanging authorization code for tokens...');
    const data = await spotifyApi.authorizationCodeGrant(code);
    
    const { access_token, refresh_token, expires_in } = data.body;

    console.log('\n✅ Successfully obtained tokens!');
    console.log('📋 Add these to your .env file:\n');
    console.log(`SPOTIFY_API_TOKEN=${access_token}`);
    console.log(`SPOTIFY_REFRESH_TOKEN=${refresh_token}`);
    console.log(`\n⏰ Token expires in: ${expires_in} seconds`);

    res.end(`
      <html>
        <body>
          <h1>✅ Authentication Successful!</h1>
          <p>Your Spotify tokens have been generated successfully!</p>
          <h3>📋 Add these to your .env file:</h3>
          <textarea readonly style="width: 100%; height: 100px; font-family: monospace; padding: 10px; margin: 10px 0;">SPOTIFY_API_TOKEN=${access_token}
SPOTIFY_REFRESH_TOKEN=${refresh_token}</textarea>
          <p><strong>⏰ Token expires in:</strong> ${expires_in} seconds</p>
          <p>✨ You can now close this window and use the Spotify MCP server!</p>
          <script>
            // Auto-close after 5 seconds
            setTimeout(() => {
              window.close();
            }, 5000);
          </script>
        </body>
      </html>
    `);

    // Auto-shutdown server after successful auth
    setTimeout(() => {
      console.log('\n🔄 Shutting down OAuth server...');
      console.log('✨ Authorization complete! You can now use the Spotify MCP server.');
      server.close();
      process.exit(0);
    }, 3000);

  } catch (error) {
    console.error('❌ Error exchanging code for tokens:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.end(`
      <html>
        <body>
          <h1>❌ Authentication Failed</h1>
          <p>Failed to exchange authorization code for tokens:</p>
          <pre>${errorMessage}</pre>
          <p><a href="javascript:window.close()">Close Window</a></p>
        </body>
      </html>
    `);
    server.close();
    process.exit(1);
  }
});

// Handle 404 for other paths
app.use((_req, res) => {
  res.writeHead(404);
  res.end();
});

// Start server
const server = app.listen(port, '127.0.0.1', () => {
  console.log('🚀 Spotify OAuth Helper Started');
  console.log('================================');
  console.log(`📡 Callback server running at: http://127.0.0.1:${port}`);
  console.log(`🔗 Authorization URL:`);
  console.log(`   ${authorizationUrl}`);
  console.log('');
  console.log('📋 Instructions:');
  console.log('1. The authorization URL will open automatically in your browser');
  console.log('2. Log in to Spotify and authorize the application');
  console.log('3. You\'ll be redirected back automatically');
  console.log('4. Copy the tokens to your .env file');
  console.log('5. Use the Spotify MCP server!');
  console.log('');
  console.log('⏳ Opening browser and waiting for authorization...');
  console.log('   (Press Ctrl+C to cancel)');

  // Automatically open browser
  open(authorizationUrl).catch(() => {
    console.log('\n💡 Failed to open browser automatically. Please visit the URL above.');
  });
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`💡 Port ${port} is already in use. Try stopping any existing servers.`);
  }
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down OAuth server...');
  server.close(() => {
    console.log('👋 Server stopped');
    process.exit(0);
  });
}); 