// cryptoUtils.js
// Todas las operaciones criptográficas del módulo de contratos.
// Usa exclusivamente window.crypto.subtle con curva P-256 (prime256v1).
// Las claves privadas NUNCA salen del navegador.

const subtle = window.crypto.subtle;

// ─── Constantes de localStorage (solo claves PÚBLICAS) ───────────────────────
export const LS_ECDH_PUB  = 'burroomies_ecdh_pub';
export const LS_ECDSA_PUB = 'burroomies_ecdsa_pub';

// ─── Generación de pares de claves ────────────────────────────────────────────

/** Genera un par de claves ECDH P-256. */
export const generarParECDH = () =>
  subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

/** Genera un par de claves ECDSA P-256. */
export const generarParECDSA = () =>
  subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

// ─── Exportación de claves ────────────────────────────────────────────────────

/** Exporta clave pública (ECDH o ECDSA) como base64 en formato raw (65 bytes). */
export const exportarClavePublicaBase64 = async (publicKey) => {
  const raw = await subtle.exportKey('raw', publicKey);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
};

/** Exporta clave privada como objeto JWK para guardar en localStorage. */
export const exportarClavePrivadaJWK = (privateKey) =>
  subtle.exportKey('jwk', privateKey);

// ─── Importación de claves ────────────────────────────────────────────────────

/** Importa clave pública ECDH desde base64 (raw). */
export const importarClavePublicaECDH = async (base64) => {
  const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return subtle.importKey(
    'raw',
    buffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
};

/** Importa clave pública ECDSA desde base64 (raw). */
export const importarClavePublicaECDSA = async (base64) => {
  const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return subtle.importKey(
    'raw',
    buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify']
  );
};

/** Importa clave privada ECDH desde JWK (objeto o string JSON). */
export const importarClavePrivadaECDHJWK = (jwk) => {
  const jwkObj = typeof jwk === 'string' ? JSON.parse(jwk) : jwk;
  return subtle.importKey(
    'jwk',
    jwkObj,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
};

/** Importa clave privada ECDSA desde JWK (objeto o string JSON). */
export const importarClavePrivadaECDSAJWK = (jwk) => {
  const jwkObj = typeof jwk === 'string' ? JSON.parse(jwk) : jwk;
  return subtle.importKey(
    'jwk',
    jwkObj,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign']
  );
};

// ─── ECDH: derivación de secreto compartido ───────────────────────────────────

/**
 * Deriva 256 bits de secreto compartido entre:
 *   - miClavePrivadaECDH (CryptoKey, privada)
 *   - suClavePublicaECDH (CryptoKey, pública de la otra parte)
 * @returns {Promise<ArrayBuffer>} 32 bytes
 */
export const derivarSecretoCompartido = (miClavePrivadaECDH, suClavePublicaECDH) =>
  subtle.deriveBits(
    { name: 'ECDH', public: suClavePublicaECDH },
    miClavePrivadaECDH,
    256
  );

/**
 * Deriva una clave AES-GCM 256 a partir de los bits ECDH usando HKDF.
 * @param {ArrayBuffer} sharedBits  32 bytes de deriveBits
 * @returns {Promise<CryptoKey>}
 */
export const derivarClaveAESDeSecreto = async (sharedBits) => {
  const hkdfKey = await subtle.importKey(
    'raw',
    sharedBits,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );
  return subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32),
      info: new TextEncoder().encode('burroomies-contract-key'),
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// ─── AES-GCM ──────────────────────────────────────────────────────────────────

/**
 * Cifra datos con AES-GCM 256.
 * @param {CryptoKey}             aesKey    Clave derivada con derivarClaveAESDeSecreto
 * @param {ArrayBuffer|Uint8Array} data     Datos a cifrar (bytes del PDF)
 * @returns {Promise<Uint8Array>}           [IV 12 bytes | ciphertext+tag]
 */
export const cifrarAESGCM = async (aesKey, data) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    aesKey,
    data
  );
  const resultado = new Uint8Array(12 + ciphertext.byteLength);
  resultado.set(iv, 0);
  resultado.set(new Uint8Array(ciphertext), 12);
  return resultado;
};

/**
 * Descifra un blob AES-GCM.
 * @param {CryptoKey}   aesKey         Clave derivada con derivarClaveAESDeSecreto
 * @param {Uint8Array}  encryptedData  [IV 12 bytes | ciphertext+tag]
 * @returns {Promise<ArrayBuffer>}     Datos originales
 */
export const descifrarAESGCM = async (aesKey, encryptedData) => {
  const iv         = encryptedData.slice(0, 12);
  const ciphertext = encryptedData.slice(12);
  return subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    aesKey,
    ciphertext
  );
};

// ─── SHA-256 ──────────────────────────────────────────────────────────────────

/**
 * Calcula el hash SHA-256 de un ArrayBuffer y devuelve string hexadecimal.
 * @param {ArrayBuffer} data
 * @returns {Promise<string>} 64 caracteres hex
 */
export const calcularSHA256 = async (data) => {
  const hashBuffer = await subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// ─── ECDSA: firma y verificación ──────────────────────────────────────────────

/**
 * Firma el hash SHA-256 (string hex) con la clave privada ECDSA.
 * @param {CryptoKey} ecdsaPrivKey   Clave privada ECDSA P-256
 * @param {string}    hashHex        64 chars hex del hash SHA-256
 * @returns {Promise<string>}        Firma en base64 (IEEE P1363, 64 bytes)
 */
export const firmarECDSA = async (ecdsaPrivKey, hashHex) => {
  const dataBuffer = new TextEncoder().encode(hashHex);
  const sigBuffer  = await subtle.sign(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    ecdsaPrivKey,
    dataBuffer
  );
  return btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));
};

/**
 * Verifica una firma ECDSA.
 * @param {string} publicKeyB64  Clave pública raw en base64
 * @param {string} signatureB64  Firma en base64
 * @param {string} hashHex       Hash SHA-256 hex que se firmó
 * @returns {Promise<boolean>}
 */
export const verificarECDSA = async (publicKeyB64, signatureB64, hashHex) => {
  try {
    const pubKey = await importarClavePublicaECDSA(publicKeyB64);
    const sigBuffer  = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
    const dataBuffer = new TextEncoder().encode(hashHex);
    return subtle.verify(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      pubKey,
      sigBuffer,
      dataBuffer
    );
  } catch {
    return false;
  }
};

// ─── Archivo de claves privadas ───────────────────────────────────────────────

/**
 * Descarga las claves privadas ECDH y ECDSA como archivo JSON en el dispositivo.
 * El usuario debe guardar este archivo en un lugar seguro.
 * @param {CryptoKey} ecdhPrivKey
 * @param {CryptoKey} ecdsaPrivKey
 * @param {string|number} userId
 */
export const descargarClavePrivada = async (ecdhPrivKey, ecdsaPrivKey, userId) => {
  const [ecdhJWK, ecdsaJWK] = await Promise.all([
    exportarClavePrivadaJWK(ecdhPrivKey),
    exportarClavePrivadaJWK(ecdsaPrivKey),
  ]);

  const contenido = JSON.stringify({
    v: 1,
    app: 'burroomies',
    usuario: userId,
    ecdhPriv:  ecdhJWK,
    ecdsaPriv: ecdsaJWK,
  }, null, 2);

  const blob = new Blob([contenido], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `burroomies_claves_${userId}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Lee un archivo de claves e importa las CryptoKey correspondientes.
 * @param {File} archivo
 * @returns {Promise<{ ecdhPrivKey: CryptoKey, ecdsaPrivKey: CryptoKey }>}
 */
export const cargarClavePrivadaDesdeArchivo = (archivo) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const datos = JSON.parse(e.target.result);
        if (datos.v !== 1 || datos.app !== 'burroomies') {
          throw new Error('El archivo no es un archivo de claves Burroomies válido');
        }
        const [ecdhPrivKey, ecdsaPrivKey] = await Promise.all([
          importarClavePrivadaECDHJWK(datos.ecdhPriv),
          importarClavePrivadaECDSAJWK(datos.ecdsaPriv),
        ]);
        resolve({ ecdhPrivKey, ecdsaPrivKey, usuario: datos.usuario });
      } catch (err) {
        reject(new Error('Archivo de claves inválido: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsText(archivo);
  });

// ─── Helper de localStorage ───────────────────────────────────────────────────

/** Devuelve true si el usuario ya generó sus claves (las públicas están en localStorage). */
export const tieneClavesGeneradas = () =>
  !!localStorage.getItem(LS_ECDH_PUB) && !!localStorage.getItem(LS_ECDSA_PUB);
