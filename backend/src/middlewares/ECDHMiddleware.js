'use strict';
// Genera un par de claves ECDH efímeras del servidor (P-256).
// Deriva el shared_secret con la clave pública ECDH del cliente.
// Guarda la clave pública efímera en sesion_ecdh y la adjunta al request.
//
// Uso: aplica este middleware en rutas que reciban PDF cifrado.
// El cliente debe enviar su clave pública ECDH raw-base64 en el header:
//   x-ecdh-public-key: <base64>
//   x-user-id: <idUsuario>

const { webcrypto } = require('crypto');
const subtle = webcrypto.subtle;

let SesionECDH;
const getSesionECDH = () => {
  if (!SesionECDH) {
    SesionECDH = require('../models/associations').SesionECDH;
  }
  return SesionECDH;
};

const ecdhMiddleware = async (req, res, next) => {
  const clientPublicKeyB64 = req.headers['x-ecdh-public-key'];
  const userId = req.headers['x-user-id'];

  if (!clientPublicKeyB64 || !userId) {
    return next();
  }

  try {
    // Genera par efímero del servidor (P-256)
    const serverPar = await subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );

    // Exporta la clave pública efímera como base64
    const serverPubRaw = await subtle.exportKey('raw', serverPar.publicKey);
    const serverPubB64 = Buffer.from(serverPubRaw).toString('base64');

    // Importa la clave pública ECDH del cliente
    const clientPubBuffer = Buffer.from(clientPublicKeyB64, 'base64');
    const clientPublicKey = await subtle.importKey(
      'raw',
      clientPubBuffer,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    // Deriva bits compartidos (256 bits = 32 bytes)
    const sharedBits = await subtle.deriveBits(
      { name: 'ECDH', public: clientPublicKey },
      serverPar.privateKey,
      256
    );

    // Deriva clave AES-GCM 256 usando HKDF sobre los bits compartidos
    const hkdfKey = await subtle.importKey(
      'raw',
      sharedBits,
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );

    const aesKey = await subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(32),
        info: new TextEncoder().encode('burroomies-transport-key'),
      },
      hkdfKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const aesKeyRaw = await subtle.exportKey('raw', aesKey);

    // Persiste la clave pública efímera del servidor
    await getSesionECDH().create({
      usuario_idUsuario: parseInt(userId),
      publicKeyEfimera: serverPubB64,
      fechaCreacion: new Date(),
    });

    // Adjunta al request para uso en el controlador
    req.ecdhServerPublicKey = serverPubB64;
    req.ecdhSharedSecret    = Buffer.from(aesKeyRaw);
    req.ecdhAesKey          = aesKey;

    // Devuelve la clave pública efímera al cliente por header
    res.setHeader('x-server-ecdh-public-key', serverPubB64);
  } catch (err) {
    console.error('ECDHMiddleware error:', err.message);
    // No bloquea la solicitud si ECDH falla; el controlador decide si es requerido
  }

  next();
};

module.exports = ecdhMiddleware;
