const crypto = require('crypto');

const ECC_CURVE = 'prime256v1';
const AES_ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;

function generarParClaves() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: ECC_CURVE,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { privateKeyPem: privateKey, publicKeyPem: publicKey };
}

function derivarClaveAES(privateKeyPem, peerPublicKeyPem) {
  const privateKey = crypto.createPrivateKey({ key: privateKeyPem, format: 'pem', type: 'pkcs8' });
  const peerPublicKey = crypto.createPublicKey({ key: peerPublicKeyPem, format: 'pem', type: 'spki' });
  const sharedSecret = crypto.diffieHellman({ privateKey, publicKey: peerPublicKey });
  return crypto.createHash('sha256').update(sharedSecret).digest();
}

function cifrarAES(textoPlano, claveAES) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(AES_ALGO, claveAES, iv);
  const cifrado = Buffer.concat([cipher.update(textoPlano, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    contenido: cifrado.toString('base64')
  };
}

function descifrarAES(contenidoBase64, ivBase64, authTagBase64, claveAES) {
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const contenido = Buffer.from(contenidoBase64, 'base64');
  const decipher = crypto.createDecipheriv(AES_ALGO, claveAES, iv);
  decipher.setAuthTag(authTag);
  const textoPlano = Buffer.concat([decipher.update(contenido), decipher.final()]);
  return textoPlano.toString('utf8');
}

function firmarECDSA(datos, privateKeyPem) {
  const privateKey = crypto.createPrivateKey({ key: privateKeyPem, format: 'pem', type: 'pkcs8' });
  const sign = crypto.createSign('SHA256');
  sign.update(datos);
  sign.end();
  return sign.sign(privateKey, 'der').toString('base64');
}

function verificarFirma(datos, firmaBase64, publicKeyPem) {
  const publicKey = crypto.createPublicKey({ key: publicKeyPem, format: 'pem', type: 'spki' });
  const verify = crypto.createVerify('SHA256');
  verify.update(datos);
  verify.end();
  return verify.verify(publicKey, Buffer.from(firmaBase64, 'base64'));
}

function hashSHA256(texto) {
  return crypto.createHash('sha256').update(texto).digest('hex');
}

module.exports = {
  generarParClaves,
  derivarClaveAES,
  cifrarAES,
  descifrarAES,
  firmarECDSA,
  verificarFirma,
  hashSHA256
};