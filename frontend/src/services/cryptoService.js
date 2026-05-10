// src/services/cryptoService.js
// Web Crypto API - Curva P-256, AES-256-GCM, ECDSA

const ECC_CURVE = { name: 'ECDSA', namedCurve: 'P-256' };
const AES_ALGO = { name: 'AES-GCM', length: 256 };
const IV_LENGTH = 12; // bytes

// ==================== UTILIDADES ====================
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToPem(buffer, label) {
  const b64 = bufferToBase64(buffer);
  const lines = b64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----.*?-----/g, '').replace(/\s/g, '');
  return base64ToBuffer(b64);
}

function getCurrentUserId() {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = 'temp_' + Math.random().toString(36).substr(2, 8);
    localStorage.setItem('userId', userId);
  }
  return userId;
}

// ==================== GENERAR PAR DE CLAVES ====================
export async function generarParClaves() {
  const keyPair = await window.crypto.subtle.generateKey(
    ECC_CURVE,
    true, // extractable
    ['sign', 'verify']
  );
  const publicKeySpki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const publicKeyPem = arrayBufferToPem(publicKeySpki, 'PUBLIC KEY');

  const privateJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
  const userId = getCurrentUserId();
  sessionStorage.setItem(`privKey_${userId}`, JSON.stringify(privateJwk));

  return {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    publicKeyPem
  };
}

export async function getPrivateKey() {
  const userId = getCurrentUserId();
  const stored = sessionStorage.getItem(`privKey_${userId}`);
  if (!stored) throw new Error('No se encontró la clave privada. Inicia sesión nuevamente.');
  const privateJwk = JSON.parse(stored);
  return await window.crypto.subtle.importKey('jwk', privateJwk, ECC_CURVE, false, ['sign']);
}

export async function getPublicKeyFromPem(pem) {
  const spki = pemToArrayBuffer(pem);
  return await window.crypto.subtle.importKey('spki', spki, ECC_CURVE, false, ['verify']);
}

// ==================== DERIVAR CLAVE AES (ECDH) ====================
export async function derivarClaveAES(privateKey, peerPublicKeyPem) {
  const peerSpki = pemToArrayBuffer(peerPublicKeyPem);
  const peerPublicKey = await window.crypto.subtle.importKey('spki', peerSpki, ECC_CURVE, false, []);
  const sharedSecret = await window.crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicKey },
    privateKey,
    256
  );
  return await window.crypto.subtle.importKey('raw', sharedSecret, AES_ALGO, false, ['encrypt', 'decrypt']);
}

// ==================== CIFRADO / DESCIFRADO AES-256-GCM ====================
export async function cifrarAES(textoPlano, aesKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(textoPlano);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    aesKey,
    encoded
  );
  const ciphertext = encrypted.slice(0, encrypted.byteLength - 16);
  const authTag = encrypted.slice(encrypted.byteLength - 16);
  return {
    iv: bufferToBase64(iv),
    authTag: bufferToBase64(authTag),
    contenido: bufferToBase64(ciphertext)
  };
}

export async function descifrarAES(contenidoBase64, ivBase64, authTagBase64, aesKey) {
  const iv = base64ToBuffer(ivBase64);
  const authTag = base64ToBuffer(authTagBase64);
  const ciphertext = base64ToBuffer(contenidoBase64);
  const encrypted = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
  encrypted.set(new Uint8Array(ciphertext), 0);
  encrypted.set(new Uint8Array(authTag), ciphertext.byteLength);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    aesKey,
    encrypted
  );
  return new TextDecoder().decode(decrypted);
}

// ==================== FIRMAS ECDSA ====================
export async function firmarECDSA(textoPlano, privateKey) {
  const encoded = new TextEncoder().encode(textoPlano);
  const signature = await window.crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    encoded
  );
  return bufferToBase64(signature);
}

export async function verificarFirma(textoPlano, firmaBase64, publicKeyPem) {
  const publicKey = await getPublicKeyFromPem(publicKeyPem);
  const encoded = new TextEncoder().encode(textoPlano);
  const signature = base64ToBuffer(firmaBase64);
  return await window.crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    signature,
    encoded
  );
}

// ==================== HASH ====================
export async function hashSHA256(texto) {
  const encoded = new TextEncoder().encode(texto);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==================== LIMPIAR CLAVES ====================
export function limpiarClavesPrivadas() {
  const userId = localStorage.getItem('userId');
  if (userId) sessionStorage.removeItem(`privKey_${userId}`);
}