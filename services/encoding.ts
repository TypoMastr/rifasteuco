// Helper functions to convert between ArrayBuffer and Base64
// This is necessary for storing binary data from WebAuthn API in localStorage.

/**
 * Converts an ArrayBuffer to a Base64-encoded string.
 * The URL-safe variant is used to avoid issues with '+' and '/' characters.
 */
export const bufferToBase64 = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * Converts a Base64-encoded string (URL-safe variant) back to an ArrayBuffer.
 */
export const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Converts a string to an ArrayBuffer.
 */
export const stringToBuffer = (str: string): ArrayBuffer => {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
};

/**
 * Converts an ArrayBuffer to a string.
 */
export const bufferToString = (buffer: ArrayBuffer): string => {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
};
