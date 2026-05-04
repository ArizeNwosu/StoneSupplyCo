require('dotenv').config({ path: '.env.test' });
const { encrypt, decrypt } = require('../lib/crypto');

describe('crypto', () => {
  test('round-trip encrypt/decrypt returns original plaintext', () => {
    const token = 'EAABsbCS1iHgBO...longMetaToken';
    expect(decrypt(encrypt(token))).toBe(token);
  });

  test('encrypt produces different ciphertext each call due to random IV', () => {
    const token = 'same-token';
    expect(encrypt(token)).not.toBe(encrypt(token));
  });

  test('decrypt throws when ciphertext is tampered', () => {
    const ciphertext = encrypt('my-token');
    const parts = ciphertext.split(':');
    parts[2] = parts[2].slice(0, -4) + 'ffff';
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  test('decrypt throws on invalid format', () => {
    expect(() => decrypt('not:valid')).toThrow();
    expect(() => decrypt('too:few')).toThrow();
  });

  test('throws on missing TOKEN_ENCRYPTION_KEY', () => {
    const saved = process.env.TOKEN_ENCRYPTION_KEY;
    delete process.env.TOKEN_ENCRYPTION_KEY;
    expect(() => encrypt('anything')).toThrow('TOKEN_ENCRYPTION_KEY');
    process.env.TOKEN_ENCRYPTION_KEY = saved;
  });
});
