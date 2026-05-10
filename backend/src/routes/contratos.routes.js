'use strict';
const express = require('express');
const router  = express.Router();
const ecdhMiddleware = require('../middlewares/ECDHMiddleware');
const {
  crearContrato,
  firmarArrendador,
  verificarYAceptar,
  obtenerContrato,
  obtenerContratoPorArrendamiento,
} = require('../controllers/ContratosCtrl');

// GET /contratos/arrendamiento/:idArrendamiento — debe ir antes de /:id
router.get('/arrendamiento/:idArrendamiento', obtenerContratoPorArrendamiento);

// POST /contratos/crear — aplica middleware ECDH para verificar transporte
router.post('/crear', ecdhMiddleware, crearContrato);

// POST /contratos/firmar-arrendador
router.post('/firmar-arrendador', firmarArrendador);

// POST /contratos/verificar-y-aceptar
router.post('/verificar-y-aceptar', verificarYAceptar);

// GET /contratos/:id
router.get('/:id', obtenerContrato);

module.exports = router;
