import { generateKeyPairSync, randomUUID } from 'crypto';

export interface GeneratedRealmKey {
  kid: string;
  algorithm: 'RS256';
  keyType: 'RSA';
  publicKey: string;
  privateKey: string;
}

/**
 * Generates an RSA-2048 key pair (PEM encoded) for signing/verifying a realm's
 * JWTs, Keycloak-style. The private key must be stored securely and never
 * exposed via the API; the public key is what verifiers (e.g. JWKS consumers)
 * are allowed to read.
 */
export function generateRealmKeyPair(): GeneratedRealmKey {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return {
    kid: randomUUID(),
    algorithm: 'RS256',
    keyType: 'RSA',
    publicKey,
    privateKey,
  };
}
