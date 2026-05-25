/**
 * Rutas de autenticación del portal CA.
 * Prefijo: /api/portal
 */

const express  = require('express');
const router   = express.Router();
const { v4: uuidv4 } = require('uuid');
const { registrar, iniciarSesion, requireAuth } = require('../auth');
const { usuarios, certs }  = require('../db');
const { emitirCertificadoX509, parsearCertificado } = require('../ca');

// ── POST /api/portal/register ──────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body;
    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    if (contrasena.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }
    const usuario = await registrar({ nombre, correo, contrasena });
    req.session.usuario = usuario;
    res.status(201).json({ ok: true, usuario });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── POST /api/portal/login ─────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });
    }
    const usuario = await iniciarSesion(correo, contrasena);
    req.session.usuario = usuario;
    res.json({ ok: true, usuario });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// ── POST /api/portal/logout ────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ── GET /api/portal/sesion ─────────────────────────────────────────────────
router.get('/sesion', (req, res) => {
  if (req.session?.usuario) {
    res.json({ autenticado: true, usuario: req.session.usuario });
  } else {
    res.json({ autenticado: false });
  }
});

// ── POST /api/portal/solicitar-certificado ────────────────────────────────
router.post('/solicitar-certificado', requireAuth, (req, res) => {
  try {
    const usuario = req.session.usuario;
    const { publicKeySpki } = req.body;
    if (!publicKeySpki) return res.status(400).json({ error: 'Falta publicKeySpki' });

    const existente = certs.buscarActivoPorCorreo(usuario.correo);
    if (existente) {
      return res.status(409).json({
        error: 'Ya tienes un certificado activo',
        serialHex: existente.serialHex,
      });
    }

    const serialHex    = uuidv4().replace(/-/g, '');
    const certPEM      = emitirCertificadoX509({
      serialHex,
      nombreCompleto:     usuario.nombre,
      correo:             usuario.correo,
      rol:                usuario.rol || 'usuario',
      publicKeySpkiBase64: publicKeySpki,
    });
    const fechaEmision     = new Date().toISOString();
    const fechaVencimiento = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    certs.insertar({
      serialHex,
      usuarioId:  usuario.id,
      nombre:     usuario.nombre,
      correo:     usuario.correo,
      rol:        usuario.rol || 'usuario',
      publicKeySpki,
      certPEM,
      estado:     'activo',
      fechaEmision,
      fechaVencimiento,
    });

    res.status(201).json({ ok: true, serialHex, certPEM, fechaEmision, fechaVencimiento });
  } catch (err) {
    console.error('[CA Portal] Error emitir cert:', err.message);
    res.status(500).json({ error: 'Error al emitir el certificado' });
  }
});

// ── GET /api/portal/mi-certificado ────────────────────────────────────────
router.get('/mi-certificado', requireAuth, (req, res) => {
  const usuario = req.session.usuario;
  const cert    = certs.buscarActivoPorCorreo(usuario.correo);
  if (!cert) {
    // Buscar también revocados/expirados para mostrar historial
    const todos = certs.listarTodos().filter(c => c.correo === usuario.correo);
    const ultimo = todos.sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision))[0];
    if (ultimo) return res.json(ultimo);
    return res.status(404).json({ error: 'Sin certificado' });
  }
  res.json(cert);
});

module.exports = router;
