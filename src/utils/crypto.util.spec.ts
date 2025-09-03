import { Test, TestingModule } from '@nestjs/testing';
import { CryptoUtil } from './crypto.util';
import * as crypto from 'crypto';

describe('CryptoUtil', () => {
  let cryptoUtil: CryptoUtil;
  const testEncryptionKey = crypto.randomBytes(32).toString('base64');
  const testRandomString = crypto.randomBytes(16).toString('hex'); // 32-bit string

  beforeEach(async () => {
    // Set up environment variable for testing
    process.env.ENCRYPTION_KEY = testEncryptionKey;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoUtil],
    }).compile();

    cryptoUtil = module.get<CryptoUtil>(CryptoUtil);
  });

  afterEach(() => {
    // Clean up environment variable
    delete process.env.ENCRYPTION_KEY;
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a simple string correctly', () => {
      const originalText = 'Hello, World!';
      
      const encrypted = cryptoUtil.encrypt(originalText);
      const decrypted = cryptoUtil.decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
    });

    it('should encrypt and decrypt a random 32-bit string correctly', () => {
      const originalText = testRandomString;
      
      const encrypted = cryptoUtil.encrypt(originalText);
      const decrypted = cryptoUtil.decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
      expect(encrypted.encrypted).not.toBe(originalText);
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
    });

    it('should encrypt and decrypt empty string', () => {
      const originalText = '';
      
      const encrypted = cryptoUtil.encrypt(originalText);
      const decrypted = cryptoUtil.decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
    });

    it('should encrypt and decrypt special characters', () => {
      const originalText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      const encrypted = cryptoUtil.encrypt(originalText);
      const decrypted = cryptoUtil.decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
    });

    it('should encrypt and decrypt unicode characters', () => {
      const originalText = 'Hello 世界 🌍 مرحبا';
      
      const encrypted = cryptoUtil.encrypt(originalText);
      const decrypted = cryptoUtil.decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
    });

    it('should produce different encrypted outputs for the same input', () => {
      const originalText = testRandomString;
      
      const encrypted1 = cryptoUtil.encrypt(originalText);
      const encrypted2 = cryptoUtil.encrypt(originalText);
      
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.tag).not.toBe(encrypted2.tag);
      
      // But both should decrypt to the same value
      expect(cryptoUtil.decrypt(encrypted1)).toBe(originalText);
      expect(cryptoUtil.decrypt(encrypted2)).toBe(originalText);
    });

    it('should throw error when decrypting with invalid data', () => {
      const invalidData = {
        encrypted: 'invalid',
        iv: 'invalid',
        tag: 'invalid'
      };
      
      expect(() => cryptoUtil.decrypt(invalidData)).toThrow('Decryption failed');
    });

    it('should throw error when ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;
      
      expect(() => cryptoUtil.encrypt(testRandomString)).toThrow();
    });
  });

  describe('simpleEncrypt and simpleDecrypt', () => {
    it('should encrypt and decrypt a simple string correctly', () => {
      const originalText = 'Hello, World!';
      
      const encrypted = cryptoUtil.simpleEncrypt(originalText);
      const decrypted = cryptoUtil.simpleDecrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
      expect(encrypted).toContain(':');
    });

    it('should encrypt and decrypt a random 32-bit string correctly', () => {
      const originalText = testRandomString;
      
      const encrypted = cryptoUtil.simpleEncrypt(originalText);
      const decrypted = cryptoUtil.simpleDecrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
      expect(encrypted).not.toBe(originalText);
      expect(encrypted).toContain(':');
    });

    it('should encrypt and decrypt empty string', () => {
      const originalText = '';
      
      const encrypted = cryptoUtil.simpleEncrypt(originalText);
      const decrypted = cryptoUtil.simpleDecrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
    });

    it('should encrypt and decrypt special characters', () => {
      const originalText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      const encrypted = cryptoUtil.simpleEncrypt(originalText);
      const decrypted = cryptoUtil.simpleDecrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
    });

    it('should produce different encrypted outputs for the same input', () => {
      const originalText = testRandomString;
      
      const encrypted1 = cryptoUtil.simpleEncrypt(originalText);
      const encrypted2 = cryptoUtil.simpleEncrypt(originalText);
      
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to the same value
      expect(cryptoUtil.simpleDecrypt(encrypted1)).toBe(originalText);
      expect(cryptoUtil.simpleDecrypt(encrypted2)).toBe(originalText);
    });

    it('should throw error when decrypting invalid encrypted text', () => {
      const invalidEncryptedText = 'invalid:encrypted:text';
      
      expect(() => cryptoUtil.simpleDecrypt(invalidEncryptedText)).toThrow('Simple decryption failed');
    });

    it('should throw error when decrypting malformed encrypted text', () => {
      const malformedText = 'no-colon-separator';
      
      expect(() => cryptoUtil.simpleDecrypt(malformedText)).toThrow('Simple decryption failed');
    });

    it('should throw error when ENCRYPTION_KEY is not set for simple encryption', () => {
      delete process.env.ENCRYPTION_KEY;
      
      expect(() => cryptoUtil.simpleEncrypt(testRandomString)).toThrow();
    });
  });

  describe('hash', () => {
    it('should create a hash of a string with default algorithm', () => {
      const text = testRandomString;
      const hash = cryptoUtil.hash(text);
      
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA256 produces 64 hex characters
    });

    it('should create a hash of a string with specified algorithm', () => {
      const text = testRandomString;
      const sha1Hash = cryptoUtil.hash(text, 'sha1');
      const sha256Hash = cryptoUtil.hash(text, 'sha256');
      
      expect(sha1Hash).toMatch(/^[a-f0-9]{40}$/); // SHA1 produces 40 hex characters
      expect(sha256Hash).toMatch(/^[a-f0-9]{64}$/); // SHA256 produces 64 hex characters
      expect(sha1Hash).not.toBe(sha256Hash);
    });

    it('should produce the same hash for the same input', () => {
      const text = testRandomString;
      const hash1 = cryptoUtil.hash(text);
      const hash2 = cryptoUtil.hash(text);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const text1 = testRandomString;
      const text2 = testRandomString + 'modified';
      
      const hash1 = cryptoUtil.hash(text1);
      const hash2 = cryptoUtil.hash(text2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = cryptoUtil.hash('');
      
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('hmac', () => {
    const secret = 'test-secret-key';

    it('should create an HMAC hash with default algorithm', () => {
      const text = testRandomString;
      const hmac = cryptoUtil.hmac(text, secret);
      
      expect(hmac).toBeDefined();
      expect(hmac).toMatch(/^[a-f0-9]{64}$/); // SHA256 HMAC produces 64 hex characters
    });

    it('should create an HMAC hash with specified algorithm', () => {
      const text = testRandomString;
      const sha1Hmac = cryptoUtil.hmac(text, secret, 'sha1');
      const sha256Hmac = cryptoUtil.hmac(text, secret, 'sha256');
      
      expect(sha1Hmac).toMatch(/^[a-f0-9]{40}$/); // SHA1 HMAC produces 40 hex characters
      expect(sha256Hmac).toMatch(/^[a-f0-9]{64}$/); // SHA256 HMAC produces 64 hex characters
      expect(sha1Hmac).not.toBe(sha256Hmac);
    });

    it('should produce the same HMAC for the same input and secret', () => {
      const text = testRandomString;
      const hmac1 = cryptoUtil.hmac(text, secret);
      const hmac2 = cryptoUtil.hmac(text, secret);
      
      expect(hmac1).toBe(hmac2);
    });

    it('should produce different HMACs for different secrets', () => {
      const text = testRandomString;
      const secret1 = 'secret1';
      const secret2 = 'secret2';
      
      const hmac1 = cryptoUtil.hmac(text, secret1);
      const hmac2 = cryptoUtil.hmac(text, secret2);
      
      expect(hmac1).not.toBe(hmac2);
    });

    it('should produce different HMACs for different texts', () => {
      const text1 = testRandomString;
      const text2 = testRandomString + 'modified';
      
      const hmac1 = cryptoUtil.hmac(text1, secret);
      const hmac2 = cryptoUtil.hmac(text2, secret);
      
      expect(hmac1).not.toBe(hmac2);
    });

    it('should handle empty string', () => {
      const hmac = cryptoUtil.hmac('', secret);
      
      expect(hmac).toBeDefined();
      expect(hmac).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('randomString', () => {
    it('should generate a random string of default length', () => {
      const randomStr = cryptoUtil.randomString();
      
      expect(randomStr).toBeDefined();
      expect(randomStr).toMatch(/^[a-f0-9]{64}$/); // Default length is 32 bytes = 64 hex characters
    });

    it('should generate a random string of specified length', () => {
      const length = 16;
      const randomStr = cryptoUtil.randomString(length);
      
      expect(randomStr).toBeDefined();
      expect(randomStr).toMatch(/^[a-f0-9]{32}$/); // 16 bytes = 32 hex characters
    });

    it('should generate different strings on each call', () => {
      const randomStr1 = cryptoUtil.randomString();
      const randomStr2 = cryptoUtil.randomString();
      
      expect(randomStr1).not.toBe(randomStr2);
    });

    it('should generate strings of correct length', () => {
      const lengths = [8, 16, 32, 64];
      
      lengths.forEach(length => {
        const randomStr = cryptoUtil.randomString(length);
        expect(randomStr.length).toBe(length * 2); // Each byte = 2 hex characters
      });
    });
  });

  describe('integration tests', () => {
    it('should work with the random 32-bit string across all methods', () => {
      const testString = testRandomString;
      
      // Test main encryption/decryption
      const encrypted = cryptoUtil.encrypt(testString);
      const decrypted = cryptoUtil.decrypt(encrypted);
      expect(decrypted).toBe(testString);
      
      // Test simple encryption/decryption
      const simpleEncrypted = cryptoUtil.simpleEncrypt(testString);
      const simpleDecrypted = cryptoUtil.simpleDecrypt(simpleEncrypted);
      expect(simpleDecrypted).toBe(testString);
      
      // Test hashing
      const hash = cryptoUtil.hash(testString);
      expect(hash).toBeDefined();
      
      // Test HMAC
      const hmac = cryptoUtil.hmac(testString, 'test-secret');
      expect(hmac).toBeDefined();
      
      // Test random string generation
      const randomStr = cryptoUtil.randomString();
      expect(randomStr).toBeDefined();
    });
  });
});
