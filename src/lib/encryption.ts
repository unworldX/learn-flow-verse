
// Simple encryption/decryption utility for text messages
const ENCRYPTION_KEY = 'student-library-key'; // In production, this should be user-specific and more secure

export const encryptText = async (text: string): Promise<string> => {
  try {
    // Simple base64 encoding for demo purposes
    // In production, use proper encryption like AES
    return btoa(unescape(encodeURIComponent(text)));
  } catch (error) {
    console.error('Encryption failed:', error);
    return text;
  }
};

export const decryptText = async (encryptedText: string): Promise<string> => {
  try {
    // Simple base64 decoding for demo purposes
    return decodeURIComponent(escape(atob(encryptedText)));
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText;
  }
};
