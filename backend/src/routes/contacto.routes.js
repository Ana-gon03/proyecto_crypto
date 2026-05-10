const express = require('express');
const router = express.Router();
const { enviarCorreoContacto } = require('../config/email');

// Enviar mensaje de contacto desde FAQ
router.post('/contacto', async (req, res) => {
  const { nombre, email, mensaje } = req.body;

  try {
    const enviado = await enviarCorreoContacto(nombre, email, mensaje);
    
    if (enviado) {
      res.json({ message: 'Mensaje enviado correctamente' });
    } else {
      res.status(500).json({ error: 'Error al enviar el mensaje' });
    }
  } catch (error) {
    console.error('Error en contacto:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

module.exports = router;