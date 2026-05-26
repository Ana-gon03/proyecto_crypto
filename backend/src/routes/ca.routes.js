/**
 * Rutas del backend para interacción con la CA.
 * Prefijo: /api/ca
 * Actúa como proxy entre el frontend y el servicio CA independiente.
 */

const express  = require('express');
const router   = express.Router();
const caClient = require('../services/caClient');
const { Usuario } = require('../models/associations');

// ── POST /api/ca/solicitar-certificado ────────────────────────────────────
// El usuario envía su llave pública ECDSA y solicita un certificado a la CA.
// Body: { publicKeySpki } — llave pública en base64 formato SPKI
router.post('/solicitar-certificado', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'No autorizado' });

    const { publicKeySpki } = req.body;
    if (!publicKeySpki) return res.status(400).json({ error: 'Falta la llave pública ECDSA' });

    const usuario = await Usuario.findByPk(userId);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (usuario.certificadoSerial) {
      return res.status(409).json({
        error: 'Ya tienes un certificado activo',
        serial: usuario.certificadoSerial,
      });
    }

    const nombreCompleto = [usuario.usuarioNom, usuario.usuarioApePat, usuario.usuarioApeMat]
      .filter(Boolean).join(' ');

    // Determinar rol del usuario
    const { Arrendador, Arrendatario } = require('../models/associations');
    const arrendador  = await Arrendador.findOne({ where: { usuario_idUsuario: userId } });
    const rol         = arrendador ? 'arrendador' : 'arrendatario';

    const resultado = await caClient.emitirCertificado({
      usuarioId:     parseInt(userId),
      nombreCompleto,
      correo:        usuario.usuarioCorreo,
      rol,
      publicKeySpki,
    });

    // Guardar llave pública y serial en el registro del usuario
    await usuario.update({
      ecdsaPublicKey:    publicKeySpki,
      clavesGeneradas:   1,
      certificadoSerial: resultado.serialHex,
    });

    res.status(201).json({
      message:         'Certificado digital emitido exitosamente',
      serialHex:       resultado.serialHex,
      certPEM:         resultado.certPEM,
      fechaEmision:    resultado.fechaEmision,
      fechaVencimiento: resultado.fechaVencimiento,
    });
  } catch (err) {
    if (err.response?.status === 409) {
      return res.status(409).json({ error: err.response.data.error });
    }
    console.error('[CA Route] Error al solicitar certificado:', err.message);
    res.status(500).json({ error: 'Error al comunicarse con la Entidad Certificadora' });
  }
});

// ── GET /api/ca/mi-certificado ─────────────────────────────────────────────
router.get('/mi-certificado', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'No autorizado' });

    const usuario = await Usuario.findByPk(userId);
    if (!usuario?.certificadoSerial) {
      return res.status(404).json({ error: 'No tienes un certificado registrado' });
    }

    const cert = await caClient.obtenerCertificado(usuario.certificadoSerial);
    res.json(cert);
  } catch (err) {
    console.error('[CA Route] Error al obtener certificado:', err.message);
    res.status(500).json({ error: 'Error al obtener el certificado' });
  }
});

// ── POST /api/ca/validar/:serial ──────────────────────────────────────────
router.post('/validar/:serial', async (req, res) => {
  try {
    const resultado = await caClient.validarCertificado(req.params.serial);
    res.json(resultado);
  } catch (err) {
    console.error('[CA Route] Error al validar certificado:', err.message);
    res.status(500).json({ error: 'Error al validar el certificado' });
  }
});

// ── POST /api/ca/registrar-certificado ───────────────────────────────────
// El usuario sube su .cer (PEM) obtenido del portal CA.
// El backend lo valida con la CA y guarda serial + publicKey en su perfil.
router.post('/registrar-certificado', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'No autorizado' });

    const { certPEM } = req.body;
    if (!certPEM) return res.status(400).json({ error: 'Falta certPEM' });

    // Validar con la CA que es auténtico
    const axios = require('axios');
    const CA_URL    = process.env.CA_SERVICE_URL || 'http://localhost:5001';
    const r = await axios.post(`${CA_URL}/api/ca/certificados/validar-pem`, { certPEM });
    const validacion = r.data;
    if (!validacion.valido) {
      return res.status(400).json({ error: `Certificado inválido: ${validacion.motivo}` });
    }

    const usuario = await Usuario.findByPk(userId);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (validacion.correo && validacion.correo !== usuario.usuarioCorreo) {
      return res.status(403).json({ error: 'El certificado no pertenece a tu cuenta. Verifica que estás subiendo tu propio archivo .cer.' });
    }

    await usuario.update({
      ecdsaPublicKey:    validacion.publicKeySpki,
      clavesGeneradas:   1,
      certificadoSerial: validacion.serialHex,
    });

    res.json({
      message:   'Certificado registrado exitosamente',
      serialHex: validacion.serialHex,
      nombre:    validacion.nombre,
      correo:    validacion.correo,
    });
  } catch (err) {
    if (err.response?.data?.motivo) {
      return res.status(400).json({ error: err.response.data.motivo });
    }
    console.error('[CA Route] Error al registrar certificado:', err.message);
    res.status(500).json({ error: 'Error al validar el certificado con la CA' });
  }
});

// ── GET /api/ca/info ──────────────────────────────────────────────────────
router.get('/info', async (req, res) => {
  try {
    const info = await caClient.getCAInfo();
    res.json(info);
  } catch (err) {
    res.status(503).json({ error: 'La CA no está disponible' });
  }
});

module.exports = router;
