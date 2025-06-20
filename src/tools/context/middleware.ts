import {contextStore} from './store.js'

export function enforceInitialContextMiddleware(toolName: string) {
  if (toolName === 'get_initial_context') return

  if (!contextStore.hasInitialContext()) {
    throw new Error(
      'Spotify initial context has not been retrieved. Please call get_initial_context tool first to initialize your Spotify connection get usage instructions.',
    )
  }
}
