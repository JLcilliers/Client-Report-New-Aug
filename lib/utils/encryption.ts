import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'E7Vz9q7lBxgXHxAEz8v97Q4PelAoND1I'

export function encrypt(text: string): string {
  try {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()
  } catch (error) {
    throw new Error('Failed to encrypt data')
  }
}

export function decrypt(encryptedText: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    throw new Error('Failed to decrypt data')
  }
}

export function hashToken(token: string): string {
  return CryptoJS.SHA256(token).toString()
}

export function generateSecureToken(): string {
  return CryptoJS.lib.WordArray.random(32).toString()
}