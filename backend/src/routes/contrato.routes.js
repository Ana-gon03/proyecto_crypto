// backend/src/routes/contrato.routes.js
const express = require('express');
const router = express.Router();
const contratoController = require('../controllers/contrato.controller');
const authMiddleware = require('../middlewares/auth');

// Todas las rutas requieren autenticación (userId en headers)
router.use(authMiddleware);

// Registrar clave pública del usuario autenticado
router.post('/clave-publica', contratoController.registrarClavePublica);

// Crear nuevo contrato (solo arrendador)
router.post('/contratos', contratoController.crearContrato);

// Firmar contrato (arrendatario)
router.post('/contratos/:idContrato/firmar', contratoController.firmarContratoArrendatario);

// Verificar contrato (cualquiera)
router.get('/contratos/:idContrato/verificar', contratoController.verificarContrato);

// Obtener contrato por ID de arrendamiento (para que el arrendatario lo descargue)
router.get('/contratos/arrendamiento/:idArrendamiento', contratoController.obtenerContratoPorArrendamiento);

// Obtener clave pública de un usuario (requiere autenticación)
router.get('/usuarios/:idUsuario/clave-publica', contratoController.obtenerClavePublicaUsuario);

module.exports = router;