/**
 * Generates a random string of specified length for use in OAuth state parameters
 * @param length The length of the random string to generate
 * @returns A random string containing letters and numbers
 */
export function generateRandomString(length: number): string {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  
  return result
} 