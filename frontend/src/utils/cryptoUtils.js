/**
 * Utilidades criptográficas del frontend usando Web Crypto API.
 * Curva: ECDSA P-256 (prime256v1) — compatible con Node.js crypto.
 *
 * Notas de interoperabilidad:
 *  - Las firmas ECDSA de WebCrypto usan formato IEEE P1363 (r||s, 64 bytes).
 *  - Node.js verifica con { dsaEncoding: 'ieee-p1363' }.
 *  - La llave pública se exporta como SPKI (SubjectPublicKeyInfo) en base64.
 *  - La llave privada NUNCA se almacena; se usa solo en memoria durante la firma.
 */

const ALGORITMO = { name: 'ECDSA', namedCurve: 'P-256' };
const HASH_SIGN = { name: 'ECDSA', hash: { name: 'SHA-256' } };

// ── Generación de llaves ───────────────────────────────────────────────────

export async function generarParLlaves() {
  return crypto.subtle.generateKey(ALGORITMO, true, ['sign', 'verify']);
}

// ── Exportación ───────────────────────────────────────────────────────────

export async function exportarLlavePublicaSpki(publicKey) {
  const spkiBuffer = await crypto.subtle.exportKey('spki', publicKey);
  return btoa(String.fromCharCode(...new Uint8Array(spkiBuffer)));
}

export async function exportarLlavePrivadaJwk(privateKey) {
  return crypto.subtle.exportKey('jwk', privateKey);
}

export async function exportarLlavePublicaJwk(publicKey) {
  return crypto.subtle.exportKey('jwk', publicKey);
}

// ── Importación ───────────────────────────────────────────────────────────

export async function importarLlavePrivadaJwk(jwk) {
  return crypto.subtle.importKey('jwk', jwk, ALGORITMO, false, ['sign']);
}

export async function importarLlavePublicaJwk(jwk) {
  return crypto.subtle.importKey('jwk', jwk, ALGORITMO, true, ['verify']);
}

// ── Firma y verificación ──────────────────────────────────────────────────

/**
 * Firma un ArrayBuffer con la llave privada ECDSA.
 * Retorna la firma como string base64 (IEEE P1363).
 */
export async function firmarDatos(privateKey, arrayBuffer) {
  const firma = await crypto.subtle.sign(HASH_SIGN, privateKey, arrayBuffer);
  return btoa(String.fromCharCode(...new Uint8Array(firma)));
}

/**
 * Calcula SHA-256 de un ArrayBuffer y lo retorna como string hexadecimal.
 */
export async function computarHashSHA256(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Descarga de archivos ──────────────────────────────────────────────────

export function descargarJSON(objeto, nombreArchivo) {
  const blob = new Blob([JSON.stringify(objeto, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Lee un archivo JSON subido por el usuario y retorna su contenido como objeto.
 */
export function leerArchivoJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => {
      try { resolve(JSON.parse(e.target.result)); }
      catch { reject(new Error('El archivo no es un JSON válido')); }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
}

// ── Cifrado/descifrado de archivo .key (AES-256-GCM + PBKDF2-SHA256) ────────

/**
 * Cifra la llave privada JWK con una contraseña.
 * Produce el objeto JSON que se descarga como .key
 */
export async function cifrarLlavePrivada(privateKeyJwk, passphrase) {
  const enc      = new TextEncoder();
  const salt     = crypto.getRandomValues(new Uint8Array(32));
  const iv       = crypto.getRandomValues(new Uint8Array(12));
  const material = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  const aesKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false, ['encrypt']
  );
  const plain   = enc.encode(JSON.stringify(privateKeyJwk));
  const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plain);
  const b64     = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  return {
    formato:     'burroomies-ca-key-v1',
    algoritmo:   'AES-256-GCM',
    kdf:         'PBKDF2-SHA256',
    iteraciones: 100_000,
    salt:        b64(salt),
    iv:          b64(iv),
    datos:       b64(cifrado),
  };
}

/**
 * Descifra un archivo .key usando la contraseña.
 * Retorna el JWK de la llave privada o lanza error si la contraseña es incorrecta.
 */
export async function descifrarLlavePrivada(keyFileData, passphrase) {
  if (keyFileData.formato !== 'burroomies-ca-key-v1') {
    throw new Error('Formato de archivo .key no reconocido');
  }
  const enc    = new TextEncoder();
  const b64buf = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const salt   = b64buf(keyFileData.salt);
  const iv     = b64buf(keyFileData.iv);
  const cifrado = b64buf(keyFileData.datos);

  const material = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  const aesKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: keyFileData.iteraciones || 100_000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false, ['decrypt']
  );
  let plain;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, cifrado);
  } catch {
    throw new Error('Contraseña incorrecta o archivo .key corrupto');
  }
  return JSON.parse(new TextDecoder().decode(plain));
}

/**
 * Lee un archivo .key (JSON cifrado) y lo retorna como objeto.
 */
export async function leerArchivoKey(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => {
      try { resolve(JSON.parse(e.target.result)); }
      catch { reject(new Error('El archivo .key no es un JSON válido')); }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo .key'));
    reader.readAsText(file);
  });
}

/**
 * Lee el texto de un archivo .cer y lo retorna como string PEM.
 */
export function leerArchivoCer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Error al leer el archivo .cer'));
    reader.readAsText(file);
  });
}

/**
 * Descarga texto (como .cer PEM) al disco del usuario.
 */
export function descargarTexto(texto, nombreArchivo) {
  const blob = new Blob([texto], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: nombreArchivo });
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}
