/**
 * Generates a short ID with the format: XXXX-1234
 * Four characters followed by four numbers separated by a hyphen
 * @returns The generated short ID
 */
export function generateShortId(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  
  // Generate 4 random characters
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  // Add hyphen
  result += '-';
  
  // Generate 4 random numbers
  for (let i = 0; i < 4; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return result;
}