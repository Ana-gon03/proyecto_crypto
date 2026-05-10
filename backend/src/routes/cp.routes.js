const express = require('express');
const router = express.Router();
const { CP } = require('../models/associations');
const { Op } = require('sequelize');

// Buscar CP por código postal
router.get('/buscar/:cp', async (req, res) => {
  try {
    const cp = req.params.cp;
    
    const resultados = await CP.findAll({
      where: {
        d_codigo: {
          [Op.like]: `${cp}%`
        }
      },
      limit: 20,
      order: [['d_asenta', 'ASC']]
    });
    
    res.json(resultados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener direcciones completas por CP exacto
router.get('/direcciones/:cp', async (req, res) => {
  try {
    const cp = req.params.cp;
    
    const direcciones = await CP.findAll({
      where: {
        d_codigo: cp
      },
      order: [['d_asenta', 'ASC']]
    });
    
    res.json(direcciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;