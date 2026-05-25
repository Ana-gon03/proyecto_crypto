/**
 * Rutas de gestión de certificados X.509.
 * Prefijo: /api/ca
 */

const express  = require('express');
const router   = express.Router();
const { v4: uuidv4 } = require('uuid');
const {
  emitirCertificadoX509,
  parsearCertificado,
  verificarFirmaCA,
  getCAPublicKeyPEM,
  getCACertificatePEM,
} = require('../ca');
const { certs } = require('../db');
const { requireAuth } = require('../auth');

// ── Middleware: token secreto para llamadas del backend principal ───────────
function autorizarBackend(req, res, next) {
  const secret = req.headers['x-ca-secret'];
  if (process.env.CA_API_SECRET && secret !== process.env.CA_API_SECRET) {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }
  next();
}

// ── GET /api/ca/info ───────────────────────────────────────────────────────
router.get('/info', (req, res) => {
  res.json({
    nombre:        'Blockhome CA',
    organizacion:  'Blockhome',
    algoritmo:     'ECDSA P-256 / SHA-256withECDSA',
    publicKeyPEM:  getCAPublicKeyPEM(),
    certificadoCA: getCACertificatePEM(),
  });
});

// ── POST /api/ca/certificados/emitir (llamado por backend o portal) ────────
// Body: { usuarioId, nombre, correo, rol, publicKeySpki }
router.post('/certificados/emitir', autorizarBackend, (req, res) => {
  try {
    const { usuarioId, nombre, correo, rol, publicKeySpki } = req.body;
    if (!usuarioId || !nombre || !correo || !rol || !publicKeySpki) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Verificar que no tenga ya un certificado activo
    const existente = certs.buscarActivoPorUsuario(usuarioId);
    if (existente) {
      return res.status(409).json({
        error: 'El usuario ya tiene un certificado activo',
        serialHex: existente.serialHex,
      });
    }

    const serialHex     = uuidv4().replace(/-/g, '');
    const certPEM       = emitirCertificadoX509({ serialHex, nombreCompleto: nombre, correo, rol, publicKeySpkiBase64: publicKeySpki });
    const parsed        = parsearCertificado(certPEM);
    const fechaEmision  = new Date().toISOString();
    const fechaVenc     = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const registro = {
      serialHex,
      usuarioId,
      nombre,
      correo,
      rol,
      publicKeySpki,
      certPEM,
      estado:       'activo',
      fechaEmision,
      fechaVencimiento: fechaVenc,
    };
    certs.insertar(registro);

    res.status(201).json({
      message:      'Certificado X.509 emitido exitosamente',
      serialHex,
      certPEM,
      fechaEmision,
      fechaVencimiento: fechaVenc,
    });
  } catch (err) {
    console.error('[CA] Error al emitir certificado:', err.message);
    res.status(500).json({ error: 'Error interno al emitir el certificado' });
  }
});

// ── GET /api/ca/certificados/:serialHex ───────────────────────────────────
router.get('/certificados/:serialHex', (req, res) => {
  const reg = certs.buscarPorSerial(req.params.serialHex);
  if (!reg) return res.status(404).json({ error: 'Certificado no encontrado' });
  const { certPEM, ...meta } = reg;
  res.json({ ...meta, certPEM });
});

// ── GET /api/ca/certificados/:serialHex/descargar ─────────────────────────
// Descarga el certificado como archivo .cer (PEM)
router.get('/certificados/:serialHex/descargar', (req, res) => {
  const reg = certs.buscarPorSerial(req.params.serialHex);
  if (!reg || reg.estado !== 'activo') return res.status(404).json({ error: 'Certificado no disponible' });
  res.setHeader('Content-Type', 'application/x-pem-file');
  res.setHeader('Content-Disposition', `attachment; filename="${reg.nombre.replace(/\s+/g, '_')}.cer"`);
  res.send(reg.certPEM);
});

// ── POST /api/ca/certificados/:serialHex/validar ──────────────────────────
router.post('/certificados/:serialHex/validar', autorizarBackend, (req, res) => {
  const reg = certs.buscarPorSerial(req.params.serialHex);
  if (!reg) return res.json({ valido: false, motivo: 'No encontrado' });
  if (reg.estado !== 'activo') return res.json({ valido: false, motivo: `Certificado ${reg.estado}` });

  // Verificar vigencia
  if (new Date() > new Date(reg.fechaVencimiento)) {
    certs.actualizarEstado(reg.serialHex, 'expirado');
    return res.json({ valido: false, motivo: 'Certificado expirado' });
  }

  // Verificar firma de la CA sobre el certificado
  const autentico = verificarFirmaCA(reg.certPEM);
  if (!autentico) return res.json({ valido: false, motivo: 'Firma de CA inválida' });

  res.json({
    valido:     true,
    nombre:     reg.nombre,
    correo:     reg.correo,
    rol:        reg.rol,
    publicKeySpki: reg.publicKeySpki,
    fechaEmision:  reg.fechaEmision,
    fechaVencimiento: reg.fechaVencimiento,
  });
});

// ── POST /api/ca/certificados/validar-pem ─────────────────────────────────
// Valida un certificado dado en PEM (para cuando el usuario sube el .cer)
router.post('/certificados/validar-pem', (req, res) => {
  try {
    const { certPEM } = req.body;
    if (!certPEM) return res.status(400).json({ error: 'Falta certPEM' });

    const parsed     = parsearCertificado(certPEM);
    const reg        = certs.buscarPorSerial(parsed.serialHex);
    if (!reg) return res.json({ valido: false, motivo: 'Certificado no emitido por esta CA' });
    if (reg.estado !== 'activo') return res.json({ valido: false, motivo: `Certificado ${reg.estado}` });

    const autentico = verificarFirmaCA(certPEM);
    if (!autentico) return res.json({ valido: false, motivo: 'Firma CA inválida' });

    res.json({
      valido:     true,
      serialHex:  parsed.serialHex,
      nombre:     reg.nombre,
      correo:     reg.correo,
      rol:        reg.rol,
      publicKeySpki: reg.publicKeySpki,
      subject:    parsed.subject,
      issuer:     parsed.issuer,
      notBefore:  parsed.notBefore,
      notAfter:   parsed.notAfter,
    });
  } catch (err) {
    res.status(400).json({ valido: false, motivo: 'Certificado malformado o inválido' });
  }
});

// ── PUT /api/ca/certificados/:serialHex/revocar ───────────────────────────
router.put('/certificados/:serialHex/revocar', autorizarBackend, (req, res) => {
  const reg = certs.buscarPorSerial(req.params.serialHex);
  if (!reg) return res.status(404).json({ error: 'No encontrado' });
  if (reg.estado !== 'activo') return res.status(400).json({ error: `Ya está ${reg.estado}` });
  certs.actualizarEstado(req.params.serialHex, 'revocado');
  res.json({ message: 'Certificado revocado', serialHex: req.params.serialHex });
});

// ── GET /api/ca/certificados/usuario/:usuarioId ───────────────────────────
router.get('/certificados/usuario/:usuarioId', autorizarBackend, (req, res) => {
  const reg = certs.buscarActivoPorUsuario(parseInt(req.params.usuarioId));
  if (!reg) return res.status(404).json({ error: 'Sin certificado activo' });
  const { certPEM, ...meta } = reg;
  res.json({ ...meta, certPEM });
});

module.exports = router;
