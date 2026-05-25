/**
 * Blockhome CA â€” MÃ³dulo criptogrÃ¡fico del portal (Web Crypto API)
 * Gestiona generaciÃ³n de llaves ECDSA P-256, cifrado/descifrado de .key,
 * y firma digital de datos (IEEE P1363, compatible con Node.js verify).
 */

const CA_CRIPTO = (() => {

  // â”€â”€ GeneraciÃ³n de llaves â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function generarParLlaves() {
    return crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );
  }

  async function exportarLlavePublicaSpki(publicKey) {
    const buf = await crypto.subtle.exportKey('spki', publicKey);
    return _bufToBase64(buf);
  }

  async function exportarLlavePrivadaJwk(privateKey) {
    return crypto.subtle.exportKey('jwk', privateKey);
  }

  async function importarLlavePrivadaJwk(jwk) {
    return crypto.subtle.importKey(
      'jwk', jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
  }

  // â”€â”€ Cifrado de .key (AES-256-GCM + PBKDF2-SHA256) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function cifrarLlavePrivada(privateKeyJwk, passphrase) {
    const enc      = new TextEncoder();
    const salt     = crypto.getRandomValues(new Uint8Array(32));
    const iv       = crypto.getRandomValues(new Uint8Array(12));
    const material = await crypto.subtle.importKey(
      'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
    );
    const aesKey   = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: 256 },
      false, ['encrypt']
    );
    const plain   = enc.encode(JSON.stringify(privateKeyJwk));
    const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plain);

    return {
      formato:     'burroomies-ca-key-v1',
      algoritmo:   'AES-256-GCM',
      kdf:         'PBKDF2-SHA256',
      iteraciones: 100_000,
      salt:        _bufToBase64(salt),
      iv:          _bufToBase64(iv),
      datos:       _bufToBase64(cifrado),
    };
  }

  async function descifrarLlavePrivada(keyFileData, passphrase) {
    if (keyFileData.formato !== 'burroomies-ca-key-v1') {
      throw new Error('Formato de archivo .key no reconocido');
    }
    const enc      = new TextEncoder();
    const salt     = _base64ToBuf(keyFileData.salt);
    const iv       = _base64ToBuf(keyFileData.iv);
    const cifrado  = _base64ToBuf(keyFileData.datos);
    const material = await crypto.subtle.importKey(
      'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
    );
    const aesKey   = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: keyFileData.iteraciones || 100_000, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: 256 },
      false, ['decrypt']
    );
    let plain;
    try {
      plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, cifrado);
    } catch {
      throw new Error('ContraseÃ±a incorrecta o archivo .key corrupto');
    }
    return JSON.parse(new TextDecoder().decode(plain));
  }

  // â”€â”€ Firma digital (IEEE P1363 = râ€–s, 64 bytes para P-256) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function firmarDatos(buffer, privateKey) {
    const sig = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      buffer
    );
    return _bufToBase64(sig);
  }

  // â”€â”€ Hash SHA-256 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function computarHashSHA256(buffer) {
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // â”€â”€ Helpers de descarga â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function descargarArchivo(contenido, nombre, tipo = 'application/octet-stream') {
    const blob = contenido instanceof Blob ? contenido : new Blob([contenido], { type: tipo });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  function descargarJSON(obj, nombre) {
    descargarArchivo(JSON.stringify(obj, null, 2), nombre, 'application/json');
  }

  function descargarTexto(texto, nombre) {
    descargarArchivo(texto, nombre, 'text/plain');
  }

  // â”€â”€ Leer archivo como texto â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function leerArchivoComoTexto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function leerArchivoComoArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // â”€â”€ Utilidades internas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function _bufToBase64(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
  }

  function _base64ToBuf(b64) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  }

  // â”€â”€ API pÃºblica â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return {
    generarParLlaves,
    exportarLlavePublicaSpki,
    exportarLlavePrivadaJwk,
    importarLlavePrivadaJwk,
    cifrarLlavePrivada,
    descifrarLlavePrivada,
    firmarDatos,
    computarHashSHA256,
    descargarArchivo,
    descargarJSON,
    descargarTexto,
    leerArchivoComoTexto,
    leerArchivoComoArrayBuffer,
  };
})();
