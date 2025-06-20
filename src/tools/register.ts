import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import type {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js'
import {enforceInitialContextMiddleware} from './context/middleware.js'
import {registerContextTools} from './context/register.js'
import {registerPlaylistsTools} from './playlists/register.js'
import type {ServerNotification, ServerRequest} from '@modelcontextprotocol/sdk/types.js'

// Define a generic type for functions
type AnyFunction = (...args: any[]) => any

function createContextCheckingServer(server: McpServer): McpServer {
  const originalTool = server.tool
  return new Proxy(server, {
    get(target, prop) {
      if (prop === 'tool') {
        return function (this: any, ...args: any[]) {
          const [name, description, schema, annotations, handler] = args

          const wrappedHandler = async (
            args: any,
            extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
          ) => {
            enforceInitialContextMiddleware(name)
            return handler(args, extra)
          }

          return originalTool.call(this, name, description, schema, annotations, wrappedHandler)
        }
      }
      return (target as any)[prop]
    },
  })
}

/**
 * Register all Spotify tools for the MCP server
 */
function registerSpotifyTools(server: McpServer) {
  const wrappedServer = createContextCheckingServer(server)

  registerContextTools(wrappedServer)
  registerPlaylistsTools(wrappedServer)
}

export function registerAllTools(server: McpServer) {
  registerSpotifyTools(server)
}
