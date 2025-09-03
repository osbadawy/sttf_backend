import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoUtil {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16; // 128 bits


  /**
   * Encrypts a string using AES-256-GCM
   * @param text The text to encrypt
   * @returns An object containing the encrypted data, IV, and auth tag
   */
  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    try {
      const key = process.env.ENCRYPTION_KEY!;
      const keyBuffer = Buffer.from(key, 'base64');
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);
      cipher.setAAD(Buffer.from('additional-data', 'utf8'));

      let encrypted = cipher.update(text, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('base64'),
        tag: tag.toString('base64')
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypts a string using AES-256-GCM
   * @param encryptedData Object containing encrypted data, IV, and auth tag
   * @returns The decrypted text
   */
  decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const key = process.env.ENCRYPTION_KEY!;
    try {
      const keyBuffer = Buffer.from(key, 'base64');
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const tag = Buffer.from(encryptedData.tag, 'base64');
      
      const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, iv);
      decipher.setAAD(Buffer.from('additional-data', 'utf8'));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypts a string with a simple method (for less sensitive data)
   * @param text The text to encrypt
   * @returns Base64 encoded encrypted string
   */
  simpleEncrypt(text: string): string {
    const secretKey = process.env.ENCRYPTION_KEY!;
    try {
      const key = crypto.scryptSync(secretKey, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      return iv.toString('base64') + ':' + encrypted;
    } catch (error) {
      throw new Error(`Simple encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypts a string encrypted with simpleEncrypt
   * @param encryptedText The encrypted text (base64 encoded with IV)
   * @returns The decrypted text
   */
  simpleDecrypt(encryptedText: string): string {
    const secretKey = process.env.ENCRYPTION_KEY!;
    try {
      const [ivBase64, encrypted] = encryptedText.split(':');
      const key = crypto.scryptSync(secretKey, 'salt', 32);
      const iv = Buffer.from(ivBase64, 'base64');
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Simple decryption failed: ${error.message}`);
    }
  }

  /**
   * Creates a hash of the input string
   * @param text The text to hash
   * @param algorithm The hash algorithm (default: sha256)
   * @returns The hashed string
   */
  hash(text: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(text).digest('hex');
  }

  /**
   * Creates a HMAC hash of the input string
   * @param text The text to hash
   * @param secret The secret key for HMAC
   * @param algorithm The hash algorithm (default: sha256)
   * @returns The HMAC hash
   */
  hmac(text: string, secret: string, algorithm: string = 'sha256'): string {
    return crypto.createHmac(algorithm, secret).update(text).digest('hex');
  }

  /**
   * Generates a random string of specified length
   * @param length The length of the random string
   * @returns A random string
   */
  randomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
