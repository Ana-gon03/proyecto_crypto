const express = require('express');
const router = express.Router();
const { UnidadAcademica, Carrera } = require('../models/associations');

// Obtener todas las unidades académicas
router.get('/unidades-academicas', async (req, res) => {
  try {
    const unidades = await UnidadAcademica.findAll({
      order: [['unidadAcademicaNombre', 'ASC']]
    });
    res.json(unidades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener carreras por unidad académica
router.get('/carreras/:idUnidadAcademica', async (req, res) => {
  try {
    const carreras = await Carrera.findAll({
      where: { idUnidadAcademica: req.params.idUnidadAcademica },
      order: [['carreraNombre', 'ASC']]
    });
    res.json(carreras);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todas las carreras (sin filtro)
router.get('/carreras', async (req, res) => {
  try {
    const carreras = await Carrera.findAll({
      include: [{ model: UnidadAcademica, as: 'unidadAcademica' }],
      order: [['carreraNombre', 'ASC']]
    });
    res.json(carreras);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;