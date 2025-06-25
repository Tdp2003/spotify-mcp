import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {getUserTopItemsTool, GetUserTopItemsToolParams} from './getUserTopItemsTool.js'

export function registerPersonalizationTools(server: McpServer) {
  server.tool(
    'get_user_top_items',
    'Get the current user\'s top artists or tracks based on calculated affinity. Supports different time ranges (short_term ~4 weeks, medium_term ~6 months, long_term ~1 year) and pagination for comprehensive results.',
    GetUserTopItemsToolParams.shape,
    getUserTopItemsTool,
  )
} 