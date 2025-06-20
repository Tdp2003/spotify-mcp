import dotenv from 'dotenv'
import {z} from 'zod'
dotenv.config()

const EnvSchema = z.object({
  SPOTIFY_API_TOKEN: z.string().optional().describe('Spotify API token'),
  SPOTIFY_CLIENT_ID: z.string().describe('Spotify client ID'),
  SPOTIFY_CLIENT_SECRET: z.string().describe('Spotify client secret'),
  SPOTIFY_REDIRECT_URI: z.string().describe('Spotify redirect URI'),
  SPOTIFY_REFRESH_TOKEN: z.string().optional().describe('Spotify refresh token'),

  MAX_TOOL_TOKEN_OUTPUT: z.coerce
    .number()
    .optional()
    .default(50000)
    .describe('Maximum tool token output'),
})

export const env = EnvSchema.safeParse(process.env)

if (!env.success) {
  console.error('Invalid environment variables', env.error.format())
  process.exit(1)
}
