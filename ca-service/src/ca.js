/**
 * Módulo criptográfico de la Entidad Certificadora.
 * Usa jsrsasign para generar certificados X.509 v3 reales con ECDSA P-256.
 * La llave privada de la CA se almacena en keys/ (git-ignorado).
 */

const rs   = require('jsrsasign');
const fs   = require('fs');
const path = require('path');

const KEYS_DIR  = process.env.KEYS_DIR || path.join(__dirname, '..', 'keys');
const CA_PRV    = path.join(KEYS_DIR, 'ca-private.pem');
const CA_PUB    = path.join(KEYS_DIR, 'ca-public.pem');
const CA_CERT   = path.join(KEYS_DIR, 'ca-cert.pem');

let caPrvKeyPEM = null;
let caPubKeyPEM = null;
let caCertPEM   = null;

// ── Formatear fecha para ASN.1 GeneralizedTime ─────────────────────────────
function fmtFecha(d) {
  const p = n => n.toString().padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth()+1)}${p(d.getUTCDate())}` +
         `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

// ── Inicializar la CA ──────────────────────────────────────────────────────
function inicializarCA() {
  if (!fs.existsSync(KEYS_DIR)) fs.mkdirSync(KEYS_DIR, { recursive: true });

  if (fs.existsSync(CA_PRV) && fs.existsSync(CA_PUB) && fs.existsSync(CA_CERT)) {
    caPrvKeyPEM = fs.readFileSync(CA_PRV, 'utf8');
    caPubKeyPEM = fs.readFileSync(CA_PUB, 'utf8');
    caCertPEM   = fs.readFileSync(CA_CERT, 'utf8');
    console.log('[CA] Llaves cargadas desde disco.');
    return;
  }

  // Generar par de llaves ECDSA P-256 para la CA
  const keypair    = rs.KEYUTIL.generateKeypair('EC', 'secp256r1');
  caPrvKeyPEM      = rs.KEYUTIL.getPEM(keypair.prvKeyObj, 'PKCS8PRV');
  caPubKeyPEM      = rs.KEYUTIL.getPEM(keypair.pubKeyObj);

  // Autofirmar el certificado raíz de la CA (self-signed)
  const ahora  = new Date();
  const vence  = new Date(ahora.getTime() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 años

  const certCA = new rs.KJUR.asn1.x509.Certificate({
    version:   3,
    serial:    { hex: '01' },
    issuer:    { str: '/CN=Blockhome CA/O=Blockhome/C=MX' },
    notbefore: { str: fmtFecha(ahora) },
    notafter:  { str: fmtFecha(vence) },
    subject:   { str: '/CN=Blockhome CA/O=Blockhome/C=MX' },
    sbjpubkey: caPubKeyPEM,
    ext: [
      { extname: 'basicConstraints', cA: true, critical: true },
      { extname: 'keyUsage', critical: true, names: ['keyCertSign', 'cRLSign'] },
    ],
    cakey:  caPrvKeyPEM,
    sigalg: 'SHA256withECDSA',
  });
  caCertPEM = certCA.getPEM();

  fs.writeFileSync(CA_PRV,  caPrvKeyPEM, { mode: 0o600 });
  fs.writeFileSync(CA_PUB,  caPubKeyPEM);
  fs.writeFileSync(CA_CERT, caCertPEM);
  console.log('[CA] Nuevo par de llaves y certificado raíz generados.');
}

// ── Emitir certificado X.509 para un usuario ───────────────────────────────
/**
 * @param {string} serialHex      Serial único en hex (UUID sin guiones)
 * @param {string} nombreCompleto Nombre del titular
 * @param {string} correo         Correo electrónico
 * @param {string} rol            'arrendador' | 'arrendatario'
 * @param {string} publicKeySpkiBase64  Llave pública del usuario en SPKI base64
 * @returns {string} Certificado X.509 en formato PEM
 */
function emitirCertificadoX509({ serialHex, nombreCompleto, correo, rol, publicKeySpkiBase64 }) {
  // Construir PEM de la llave pública del usuario
  const spkiLines  = publicKeySpkiBase64.match(/.{1,64}/g).join('\n');
  const pubKeyPEM  = `-----BEGIN PUBLIC KEY-----\n${spkiLines}\n-----END PUBLIC KEY-----`;

  const ahora  = new Date();
  const vence  = new Date(ahora.getTime() + 365 * 24 * 60 * 60 * 1000);

  // Sanitizar CN (evitar caracteres problemáticos en ASN.1)
  const cnSafe = nombreCompleto.replace(/[/,=]/g, ' ').trim();

  const cert = new rs.KJUR.asn1.x509.Certificate({
    version:   3,
    serial:    { hex: serialHex },
    issuer:    { str: '/CN=Blockhome CA/O=Blockhome/C=MX' },
    notbefore: { str: fmtFecha(ahora) },
    notafter:  { str: fmtFecha(vence) },
    subject:   { str: `/CN=${cnSafe}/OU=${rol}/O=Blockhome/C=MX` },
    sbjpubkey: pubKeyPEM,
    ext: [
      { extname: 'basicConstraints', cA: false, critical: true },
      { extname: 'keyUsage', critical: true, names: ['digitalSignature', 'nonRepudiation'] },
      { extname: 'subjectAltName', array: [{ rfc822: correo }] },
    ],
    cakey:  caPrvKeyPEM,
    sigalg: 'SHA256withECDSA',
  });

  return cert.getPEM();
}

// ── Parsear y verificar un certificado X.509 ──────────────────────────────
function parsearCertificado(certPEM) {
  const cert = new rs.X509();
  cert.readCertPEM(certPEM);
  const pubKeyPEM = rs.KEYUTIL.getPEM(cert.getPublicKey());
  // Extraer SPKI base64 limpio
  const spkiBase64 = pubKeyPEM
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s+/g, '');

  return {
    serialHex:    cert.getSerialNumberHex(),
    subject:      cert.getSubjectString(),
    issuer:       cert.getIssuerString(),
    notBefore:    cert.getNotBefore(),
    notAfter:     cert.getNotAfter(),
    publicKeyPEM: pubKeyPEM,
    publicKeySpkiBase64: spkiBase64,
  };
}

function verificarFirmaCA(certPEM) {
  try {
    const cert   = new rs.X509();
    cert.readCertPEM(certPEM);
    const caKey  = rs.KEYUTIL.getKey(caPubKeyPEM);
    return cert.verifySignature(caKey);
  } catch { return false; }
}

function getCAPublicKeyPEM()  { return caPubKeyPEM; }
function getCACertificatePEM() { return caCertPEM; }

module.exports = {
  inicializarCA,
  emitirCertificadoX509,
  parsearCertificado,
  verificarFirmaCA,
  getCAPublicKeyPEM,
  getCACertificatePEM,
};
