interface SpotifyInitialContext {
  hasGlobalContext: boolean
  contextLoadedAt?: Date
  spotifyConnectionValidated: boolean
 }
 
 
 class SpotifyContextStore {
  private context: SpotifyInitialContext = {
    hasGlobalContext: false,
    spotifyConnectionValidated: false,
  }
 
 
  setInitialContextLoaded(): void {
    this.context.hasGlobalContext = true
    this.context.contextLoadedAt = new Date()
    this.context.spotifyConnectionValidated = true
  }
 
 
  hasInitialContext(): boolean {
    return this.context.hasGlobalContext
  }
 
 
  isSpotifyConnectionValidated(): boolean {
    return this.context.spotifyConnectionValidated
  }
 
 
  getContextLoadedAt(): Date | undefined {
    return this.context.contextLoadedAt
  }
 
 
  resetInitialContext(): void {
    this.context = {
      hasGlobalContext: false,
      spotifyConnectionValidated: false,
    }
  }
 }
 
 
 export const contextStore = new SpotifyContextStore() 