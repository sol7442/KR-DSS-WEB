
/**
 * Calculates the SHA-256 hash of a string.
 * @param str The input string.
 * @returns A promise that resolves to the hex-encoded SHA-256 hash.
 */
export const calculateSha256 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};
