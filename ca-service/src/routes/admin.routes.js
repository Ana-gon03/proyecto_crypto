/**
 * Rutas del panel administrador de la CA.
 * Prefijo: /api/admin
 */

const express = require('express');
const router  = express.Router();
const { certs, usuarios } = require('../db');
const { requireAdmin }    = require('../auth');
const { getCAPublicKeyPEM, getCACertificatePEM, parsearCertificado, verificarFirmaCA } = require('../ca');

// ── GET /api/admin/certificados ────────────────────────────────────────────
router.get('/certificados', requireAdmin, (req, res) => {
  const todos = certs.listarTodos().map(({ certPEM, publicKeySpki, ...meta }) => meta);
  res.json(todos);
});

// ── GET /api/admin/ca-info ─────────────────────────────────────────────────
router.get('/ca-info', requireAdmin, (req, res) => {
  res.json({
    nombre:         'Burroomies CA',
    algoritmo:      'ECDSA P-256 / SHA-256withECDSA',
    publicKeyPEM:   getCAPublicKeyPEM(),
    certificadoCA:  getCACertificatePEM(),
    totalEmitidos:  certs.listarTodos().length,
    activos:        certs.listarTodos().filter(c => c.estado === 'activo').length,
  });
});

// ── PUT /api/admin/certificados/:serialHex/revocar ─────────────────────────
router.put('/certificados/:serialHex/revocar', requireAdmin, (req, res) => {
  const reg = certs.buscarPorSerial(req.params.serialHex);
  if (!reg) return res.status(404).json({ error: 'Certificado no encontrado' });
  if (reg.estado !== 'activo') return res.status(400).json({ error: `Ya está ${reg.estado}` });
  certs.actualizarEstado(req.params.serialHex, 'revocado');
  res.json({ ok: true });
});

// ── GET /api/admin/verificar-pem ──────────────────────────────────────────
router.post('/verificar-pem', requireAdmin, (req, res) => {
  try {
    const { certPEM } = req.body;
    const parsed   = parsearCertificado(certPEM);
    const autentico = verificarFirmaCA(certPEM);
    res.json({ ...parsed, firmaCAValida: autentico });
  } catch {
    res.status(400).json({ error: 'PEM inválido' });
  }
});

module.exports = router;
