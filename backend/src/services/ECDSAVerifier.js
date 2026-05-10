'use strict';
// Verifica firmas ECDSA P-256 usando la clave pública (raw base64) del usuario
// almacenada en la tabla usuario.ecdsaPublicKey.
//
// La firma y el dato firmado deben estar en el mismo formato que produce
// window.crypto.subtle.sign en el cliente (IEEE P1363, 64 bytes para P-256).
// El dato firmado es el hash SHA-256 del PDF original codificado como UTF-8.

const { webcrypto } = require('crypto');
const subtle = webcrypto.subtle;

/**
 * @param {string} publicKeyB64  Clave pública ECDSA raw en base64
 * @param {string} signatureB64  Firma ECDSA en base64 (IEEE P1363)
 * @param {string} hashHex       Hash SHA-256 del PDF en hexadecimal (64 chars)
 * @returns {Promise<boolean>}
 */
const verificarFirmaECDSA = async (publicKeyB64, signatureB64, hashHex) => {
  const pubKeyBuffer = Buffer.from(publicKeyB64, 'base64');

  const publicKey = await subtle.importKey(
    'raw',
    pubKeyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify']
  );

  // El cliente firma la representación UTF-8 del hash hex
  const dataBuffer   = Buffer.from(hashHex, 'utf8');
  const sigBuffer    = Buffer.from(signatureB64, 'base64');

  return subtle.verify(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    publicKey,
    sigBuffer,
    dataBuffer
  );
};

module.exports = { verificarFirmaECDSA };
