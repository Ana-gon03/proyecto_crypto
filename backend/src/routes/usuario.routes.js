const express = require('express');
const router = express.Router();
const { Usuario, Arrendatario, Carrera } = require('../models/associations');
const { Op } = require('sequelize');

// Buscar arrendatario por username o correo (VERSIÓN CORREGIDA)
router.get('/buscar-arrendatario', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 3) {
      return res.status(400).json({ error: 'Busca al menos 3 caracteres' });
    }

    const usuarios = await Usuario.findAll({
      where: {
        [Op.or]: [
          { usuarioCorreo: { [Op.like]: `%${q}%` } }
        ]
      },
      attributes: ['idUsuario', 'usuarioNom', 'usuarioApePat', 'usuarioApeMat', 'usuarioCorreo']
    });

    const arrendatariosPorUsername = await Arrendatario.findAll({
      where: {
        arrendatarioUser: { [Op.like]: `%${q}%` }
      },
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['idUsuario', 'usuarioNom', 'usuarioApePat', 'usuarioApeMat', 'usuarioCorreo']
        }
      ],
      attributes: ['idArrendatario', 'arrendatarioBoleta', 'arrendatarioUser', 'arrendatarioVerificado'],
      limit: 10
    });

    // Combinar resultados (evitar duplicados por ID)
    const resultadosMap = new Map();
    
    arrendatariosPorUsername.forEach(a => {
      resultadosMap.set(a.idArrendatario, a);
    });

    // Buscar arrendatarios por los IDs de usuarios encontrados
    const usuarioIds = usuarios.map(u => u.idUsuario);
    if (usuarioIds.length > 0) {
      const arrendatariosPorCorreo = await Arrendatario.findAll({
        where: {
          usuario_idUsuario: { [Op.in]: usuarioIds }
        },
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['idUsuario', 'usuarioNom', 'usuarioApePat', 'usuarioApeMat', 'usuarioCorreo']
          }
        ],
        attributes: ['idArrendatario', 'arrendatarioBoleta', 'arrendatarioUser', 'arrendatarioVerificado'] 
      });
      
      arrendatariosPorCorreo.forEach(a => {
        resultadosMap.set(a.idArrendatario, a);
      });
    }

    const resultados = Array.from(resultadosMap.values()).slice(0, 10);
    res.json(resultados);
    
  } catch (error) {
    console.error('Error al buscar arrendatario:', error);
    res.status(500).json({ error: 'Error al buscar arrendatario' });
  }
});

// =====================================================
// OBTENER PERFIL ARRENDATARIO
// =====================================================
router.get('/perfil-arrendatario', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const arrendatarioId = req.headers['x-arrendatario-id'];

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const arrendatario = await Arrendatario.findByPk(parseInt(arrendatarioId), {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: { exclude: ['usuarioContra'] }
        },
        {
          model: Carrera,
          as: 'carrera',
          attributes: ['carreraNombre']
        }
      ]
    });

    if (!arrendatario) {
      return res.status(404).json({ error: 'Arrendatario no encontrado' });
    }

    res.json(arrendatario);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// =====================================================
// ACTUALIZAR PERFIL ARRENDATARIO
// =====================================================
router.put('/actualizar-perfil-arrendatario', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const arrendatarioId = req.headers['x-arrendatario-id'];
    
    const { usuarioNom, usuarioApePat, usuarioApeMat, usuarioTel, arrendatarioUser } = req.body;

    if (!userId || !arrendatarioId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Verificar username único si se cambió
    if (arrendatarioUser) {
      const usernameExistente = await Arrendatario.findOne({
        where: { 
          arrendatarioUser: arrendatarioUser,
          idArrendatario: { [require('sequelize').Op.ne]: parseInt(arrendatarioId) }
        }
      });
      
      if (usernameExistente) {
        return res.status(400).json({ error: 'El username ya está en uso' });
      }
    }

    // Actualizar usuario
    await Usuario.update({
      usuarioNom: usuarioNom,
      usuarioApePat: usuarioApePat,
      usuarioApeMat: usuarioApeMat,
      usuarioTel: usuarioTel
    }, {
      where: { idUsuario: parseInt(userId) }
    });

    // Actualizar arrendatario
    if (arrendatarioUser) {
      await Arrendatario.update({
        arrendatarioUser: arrendatarioUser
      }, {
        where: { idArrendatario: parseInt(arrendatarioId) }
      });
    }

    // Recargar datos actualizados
    const perfilActualizado = await Arrendatario.findByPk(parseInt(arrendatarioId), {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: { exclude: ['usuarioContra'] }
        },
        {
          model: Carrera,
          as: 'carrera',
          attributes: ['carreraNombre']
        }
      ]
    });

    res.json({ 
      message: 'Perfil actualizado exitosamente',
      perfil: perfilActualizado
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// =====================================================
// ELIMINAR CUENTA ARRENDATARIO
// =====================================================
router.delete('/eliminar-cuenta-arrendatario', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const arrendatarioId = req.headers['x-arrendatario-id'];

    if (!userId || !arrendatarioId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const idArrendatario = parseInt(arrendatarioId);
    
    // Importar modelos necesarios
    const { Resena, Arrendamiento } = require('../models/associations');

    // ✅ VERIFICAR SI TIENE ARRENDAMIENTO ACTIVO (no eliminado)
    const arrendamientoActivo = await Arrendamiento.findOne({
      where: { 
        arrendatario_idArrendatario: idArrendatario
      }
    });

    if (arrendamientoActivo) {
      return res.status(400).json({ 
        error: 'No puedes eliminar tu cuenta porque tienes un arrendamiento activo. Debes finalizarlo primero.' 
      });
    }

    // 1. Transferir reseñas al arrendatario anónimo (id = 10)
    await Resena.update(
      { arrendatario_idArrendatario: 10 },
      { where: { arrendatario_idArrendatario: idArrendatario } }
    );

    // 2. Eliminar arrendatario
    const arrendatario = await Arrendatario.findByPk(idArrendatario);
    if (arrendatario) {
      await arrendatario.destroy();
    }

    // 3. Eliminar usuario
    const usuario = await Usuario.findByPk(parseInt(userId));
    if (usuario) {
      await usuario.destroy();
    }

    res.json({ 
      message: 'Cuenta eliminada exitosamente. Tus reseñas se han conservado de forma anónima.' 
    });

  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ error: 'Error al eliminar cuenta' });
  }
});

// =====================================================
// ELIMINAR CUENTA ARRENDADOR
// =====================================================
router.delete('/eliminar-cuenta-arrendador', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const arrendadorId = req.headers['x-arrendador-id'];

    if (!userId || !arrendadorId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const idArrendador = parseInt(arrendadorId);
    const idUsuario = parseInt(userId);
    
    const { 
      Propiedad, 
      Arrendamiento, 
      Resena, 
      Fotos, 
      ServicioHasPropiedad, 
      Direccion,
      Arrendador
    } = require('../models/associations');

    // 1. Verificar arrendamientos activos
    const arrendamientosActivos = await Arrendamiento.count({
      include: [
        {
          model: Propiedad,
          as: 'propiedad',
          where: { arrendador_idArrendador: idArrendador },
          required: true
        }
      ]
    });

    if (arrendamientosActivos > 0) {
      return res.status(400).json({ 
        error: 'No puedes eliminar tu cuenta porque tienes arrendamientos activos.' 
      });
    }

    // 2. Obtener propiedades
    const propiedades = await Propiedad.findAll({
      where: { arrendador_idArrendador: idArrendador },
      attributes: ['idPropiedad', 'direccion_idDireccion']
    });

    const idsPropiedades = propiedades.map(p => p.idPropiedad);
    const idsDirecciones = propiedades.map(p => p.direccion_idDireccion);

    // 3. Eliminar dependencias de propiedades
    if (idsPropiedades.length > 0) {
      await ServicioHasPropiedad.destroy({
        where: { propiedad_idPropiedad: idsPropiedades }
      });

      await Fotos.destroy({
        where: { propiedad_idPropiedad: idsPropiedades }
      });

      await Resena.destroy({
        where: { propiedad_idPropiedad: idsPropiedades }
      });

      await Arrendamiento.destroy({
        where: { propiedad_idPropiedad: idsPropiedades }
      });
    }

    // 4. Eliminar propiedades
    await Propiedad.destroy({
      where: { arrendador_idArrendador: idArrendador }
    });

    // 5. Eliminar arrendador
    await Arrendador.destroy({
      where: { idArrendador: idArrendador }
    });

    // 6. Eliminar direcciones
    if (idsDirecciones.length > 0) {
      await Direccion.destroy({
        where: { idDireccion: idsDirecciones }
      });
    }

    // 7. Eliminar usuario
    await Usuario.destroy({
      where: { idUsuario: idUsuario }
    });

    res.json({ 
      message: 'Cuenta eliminada exitosamente.' 
    });

  } catch (error) {
    console.error('Error al eliminar cuenta arrendador:', error);
    res.status(500).json({ 
      error: 'Error al eliminar cuenta', 
      details: error.message 
    });
  }
});

// =====================================================
// OBTENER CLAVES PÚBLICAS DE UN USUARIO
// GET /usuarios/:id/claves-publicas
// Solo devuelve claves públicas — información no sensible.
// =====================================================
router.get('/:id/claves-publicas', async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(parseInt(id), {
      attributes: ['idUsuario', 'ecdhPublicKey', 'ecdsaPublicKey', 'clavesGeneradas']
    });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({
      idUsuario:       usuario.idUsuario,
      ecdhPublicKey:   usuario.ecdhPublicKey,
      ecdsaPublicKey:  usuario.ecdsaPublicKey,
      clavesGeneradas: usuario.clavesGeneradas,
    });
  } catch (error) {
    console.error('Error al obtener claves públicas:', error);
    res.status(500).json({ error: 'Error al obtener claves públicas' });
  }
});

// =====================================================
// GUARDAR CLAVES PÚBLICAS ECDH / ECDSA DEL USUARIO
// PATCH /usuarios/:id/claves
// Solo recibe claves PÚBLICAS — las privadas nunca salen del cliente.
// =====================================================
router.patch('/:id/claves', async (req, res) => {
  try {
    const { id } = req.params;
    const { ecdhPublicKey, ecdsaPublicKey } = req.body;

    if (!ecdhPublicKey || !ecdsaPublicKey) {
      return res.status(400).json({ error: 'Se requieren ecdhPublicKey y ecdsaPublicKey' });
    }

    const usuario = await Usuario.findByPk(parseInt(id));
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await usuario.update({
      ecdhPublicKey,
      ecdsaPublicKey,
      clavesGeneradas: 1,
    });

    res.json({ message: 'Claves públicas guardadas correctamente', clavesGeneradas: 1 });
  } catch (error) {
    console.error('Error al guardar claves:', error);
    res.status(500).json({ error: 'Error al guardar claves', details: error.message });
  }
});

module.exports = router;