
// Simple encryption utility for API keys
// Note: This is basic obfuscation, not military-grade encryption
// For production, consider using a proper encryption service

const ENCRYPTION_KEY = 'studyflow-api-key-encryption-2024';

export const encryptApiKey = (apiKey: string): string => {
  try {
    // Simple XOR encryption with base64 encoding
    let encrypted = '';
    for (let i = 0; i < apiKey.length; i++) {
      const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      const encryptedChar = apiKey.charCodeAt(i) ^ keyChar;
      encrypted += String.fromCharCode(encryptedChar);
    }
    return btoa(encrypted);
  } catch (error) {
    console.error('Encryption error:', error);
    return apiKey; // Fallback to plain text if encryption fails
  }
};

export const decryptApiKey = (encryptedApiKey: string): string => {
  try {
    // Decrypt XOR encrypted base64 string
    const encrypted = atob(encryptedApiKey);
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      const decryptedChar = encrypted.charCodeAt(i) ^ keyChar;
      decrypted += String.fromCharCode(decryptedChar);
    }
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedApiKey; // Fallback to returning the input if decryption fails
  }
};

// Check if a string appears to be encrypted
export const isEncrypted = (value: string): boolean => {
  try {
    // Check if it's valid base64 and different from original
    const decoded = atob(value);
    return decoded !== value && value.length > 20;
  } catch {
    return false;
  }
};
