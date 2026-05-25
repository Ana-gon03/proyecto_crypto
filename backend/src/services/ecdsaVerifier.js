/**
 * Verificación de firmas ECDSA generadas por WebCrypto (navegador).
 * WebCrypto produce firmas en formato IEEE P1363 (64 bytes: r||s).
 * Node.js crypto usa DER por defecto, por eso se indica dsaEncoding.
 */

const crypto = require('crypto');

/**
 * Verifica una firma ECDSA de usuario generada en el navegador.
 * @param {Buffer} pdfBuffer           Bytes del PDF original
 * @param {string} firmaBase64         Firma en base64 (IEEE P1363, de WebCrypto)
 * @param {string} publicKeySpkiBase64 Llave pública en base64 (formato SPKI)
 * @returns {boolean}
 */
function verificarFirmaUsuario(pdfBuffer, firmaBase64, publicKeySpkiBase64) {
  try {
    const publicKey = crypto.createPublicKey({
      key:    Buffer.from(publicKeySpkiBase64, 'base64'),
      format: 'der',
      type:   'spki',
    });

    return crypto.verify(
      'SHA256',
      pdfBuffer,
      { key: publicKey, dsaEncoding: 'ieee-p1363' },
      Buffer.from(firmaBase64, 'base64')
    );
  } catch {
    return false;
  }
}

/**
 * Calcula el hash SHA-256 de un buffer y lo retorna como hex.
 * @param {Buffer} buffer
 * @returns {string} Hash hex de 64 caracteres
 */
function computarHashPDF(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = { verificarFirmaUsuario, computarHashPDF };
