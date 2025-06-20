#!/usr/bin/env node
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import {registerAllTools} from './tools/register.js'
import {env} from './config/env.js'
import {VERSION} from './config/version.js'

const MCP_SERVER_NAME = '@tdp2003/spotify-mcp'

async function initializeServer() {
  if (!env.success) {
    throw new Error('Environment variables are not properly configured')
  }

  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: VERSION,
  })

  registerAllTools(server)

  return server
}

async function main() {
  try {
    const server = await initializeServer()
    const transport = new StdioServerTransport()
    await server.connect(transport)
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()
