'use strict';
// Descifra un blob AES-GCM usando el shared_secret derivado vía ECDH.
// Formato del blob cifrado: [IV 12 bytes | ciphertext+tag]
// Este servicio se usa para operaciones donde el servidor necesita
// verificar integridad, nunca para exponer texto plano al exterior.

const { webcrypto } = require('crypto');
const subtle = webcrypto.subtle;

/**
 * @param {Buffer} encryptedBuffer  Buffer con IV (12 bytes) + ciphertext
 * @param {Buffer} sharedSecretRaw  32 bytes de clave AES-GCM derivada por ECDH
 * @returns {Promise<Buffer>}        Datos descifrados
 */
const descifrarAESGCM = async (encryptedBuffer, sharedSecretRaw) => {
  const aesKey = await subtle.importKey(
    'raw',
    sharedSecretRaw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const iv         = encryptedBuffer.slice(0, 12);
  const ciphertext = encryptedBuffer.slice(12);

  const plainBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    aesKey,
    ciphertext
  );

  return Buffer.from(plainBuffer);
};

module.exports = { descifrarAESGCM };
