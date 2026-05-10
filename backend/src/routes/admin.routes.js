const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Usuario, Arrendatario, Arrendador, Propiedad, Arrendamiento, Resena, Direccion, CP, Carrera, UnidadAcademica } = require('../models/associations');

const ARRENDATARIO_DEFAULT_ID = 10;

// ============ ARRENDATARIOS ============

router.get('/arrendatarios', async (req, res) => {
  try {
    const { search } = req.query;
    let whereCondition = { idArrendatario: { [Op.ne]: ARRENDATARIO_DEFAULT_ID } };

    if (search) {
      const usuariosCoincidentes = await Usuario.findAll({
        where: {
          [Op.or]: [
            { usuarioCorreo: { [Op.like]: `%${search}%` } },
            { usuarioCurp: { [Op.like]: `%${search}%` } }
          ]
        },
        attributes: ['idUsuario']
      });
      const usuarioIds = usuariosCoincidentes.map(u => u.idUsuario);
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { arrendatarioBoleta: { [Op.like]: `%${search}%` } },
          { arrendatarioUser: { [Op.like]: `%${search}%` } },
          ...(usuarioIds.length > 0 ? [{ usuario_idUsuario: { [Op.in]: usuarioIds } }] : [])
        ]
      };
    }

    const arrendatarios = await Arrendatario.findAll({
      where: whereCondition,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['idUsuario', 'usuarioNom', 'usuarioApePat', 'usuarioApeMat', 'usuarioCorreo', 'usuarioTel', 'usuarioCurp', 'usuarioFechaNac', 'usuarioFechaRegis']
        },
        {
          model: Carrera,
          as: 'carrera', 
          include: [{ model: UnidadAcademica, as: 'unidadAcademica' }]
        }
      ],
      order: [['idArrendatario', 'DESC']]
    });

    const arrendatariosConRentas = await Promise.all(arrendatarios.map(async (a) => {
      const rentasActivas = await Arrendamiento.count({
        where: { arrendatario_idArrendatario: a.idArrendatario, arrendamientoValArrendador: 0 }
      });
      return { ...a.toJSON(), tieneRentasActivas: rentasActivas > 0 };
    }));

    res.json(arrendatariosConRentas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/arrendatarios/:id', async (req, res) => {
  try {
    const arrendatario = await Arrendatario.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'usuario' },
        { model: Carrera, as: 'carrera', include: [{ model: UnidadAcademica, as: 'unidadAcademica' }] }
      ]
    });
    if (!arrendatario) return res.status(404).json({ error: 'Arrendatario no encontrado' });
    res.json(arrendatario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/arrendatarios/:id', async (req, res) => {
  try {
    const { usuarioData, arrendatarioData } = req.body;
    const arrendatario = await Arrendatario.findByPk(req.params.id);
    if (!arrendatario) return res.status(404).json({ error: 'Arrendatario no encontrado' });

    delete usuarioData.usuarioCorreo;
    if (arrendatario.arrendatarioVerificado === 1) {
      delete usuarioData.usuarioCurp;
      delete arrendatarioData.arrendatarioBoleta;
    }

    await Usuario.update(usuarioData, { where: { idUsuario: arrendatario.usuario_idUsuario } });
    await Arrendatario.update(arrendatarioData, { where: { idArrendatario: req.params.id } });

    res.json({ message: 'Arrendatario actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/arrendatarios/:id', async (req, res) => {
  try {
    const arrendatario = await Arrendatario.findByPk(req.params.id);
    if (!arrendatario) return res.status(404).json({ error: 'Arrendatario no encontrado' });
    if (arrendatario.idArrendatario === ARRENDATARIO_DEFAULT_ID) {
      return res.status(403).json({ error: 'Este usuario del sistema no puede ser eliminado' });
    }

    const rentasActivas = await Arrendamiento.count({
      where: { arrendatario_idArrendatario: req.params.id, arrendamientoValArrendador: 0 }
    });
    if (rentasActivas > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el estudiante porque tiene rentas activas' });
    }

    await Resena.update(
      { arrendatario_idArrendatario: ARRENDATARIO_DEFAULT_ID },
      { where: { arrendatario_idArrendatario: req.params.id } }
    );
    await Arrendamiento.destroy({ where: { arrendatario_idArrendatario: req.params.id } });
    const idUsuarioArrendatario = arrendatario.usuario_idUsuario;
    await arrendatario.destroy();
    await Usuario.destroy({ where: { idUsuario: idUsuarioArrendatario } });

    res.json({ message: 'Arrendatario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/arrendatarios', async (req, res) => {
  const { username, nombres, apellidoPaterno, apellidoMaterno, correo, telefono, curp, fechaNacimiento, carreraId, boleta, password } = req.body;
  try {
    const existeUsuario = await Usuario.findOne({
      where: { [Op.or]: [{ usuarioCorreo: correo }, { usuarioCurp: curp }] }
    });
    if (existeUsuario) {
      if (existeUsuario.usuarioCorreo === correo) return res.status(400).json({ error: 'El correo ya está registrado' });
      if (existeUsuario.usuarioCurp === curp) return res.status(400).json({ error: 'El CURP ya está registrado' });
    }

    const existeUsername = await Arrendatario.findOne({ where: { arrendatarioUser: username } });
    if (existeUsername) return res.status(400).json({ error: 'El username ya está registrado' });

    const existeBoleta = await Arrendatario.findOne({ where: { arrendatarioBoleta: boleta } });
    if (existeBoleta) return res.status(400).json({ error: 'La boleta ya está registrada' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const nuevoUsuario = await Usuario.create({
      usuarioNom: nombres, usuarioApePat: apellidoPaterno, usuarioApeMat: apellidoMaterno || null,
      usuarioCorreo: correo, usuarioTel: telefono, usuarioCurp: curp, usuarioContra: hashedPassword,
      usuarioFechaNac: fechaNacimiento, usuarioFechaRegis: new Date(), usuarioFechaUIS: new Date(),
      usuarioCodigo: Math.floor(10000000 + Math.random() * 90000000).toString(),
      usuarioCorreoVerificado: 1, usuarioCodigoFecha: new Date(),
    });

    const nuevoArrendatario = await Arrendatario.create({
      arrendatarioBoleta: boleta, arrendatarioVerificado: 0, arrendatarioUser: username,
      usuario_idUsuario: nuevoUsuario.idUsuario, carrera_idCarrera: carreraId,
    });

    res.status(201).json({ message: 'Estudiante creado exitosamente', arrendatario: nuevoArrendatario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============ ARRENDADORES ============

router.get('/arrendadores', async (req, res) => {
  try {
    const { search } = req.query;
    let whereCondition = {};

    if (search) {
      const usuariosCoincidentes = await Usuario.findAll({
        where: {
          [Op.or]: [
            { usuarioCorreo: { [Op.like]: `%${search}%` } },
            { usuarioCurp: { [Op.like]: `%${search}%` } }
          ]
        },
        attributes: ['idUsuario']
      });
      const usuarioIds = usuariosCoincidentes.map(u => u.idUsuario);
      whereCondition = {
        [Op.or]: [
          { arrendadorRFC: { [Op.like]: `%${search}%` } },
          ...(usuarioIds.length > 0 ? [{ usuario_idUsuario: { [Op.in]: usuarioIds } }] : [])
        ]
      };
    }

    const arrendadores = await Arrendador.findAll({
      where: whereCondition,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['idUsuario', 'usuarioNom', 'usuarioApePat', 'usuarioApeMat', 'usuarioCorreo', 'usuarioTel', 'usuarioCurp', 'usuarioFechaNac', 'usuarioFechaRegis']
        },
        {
          model: Direccion,
          as: 'direccion',
          include: [{ model: CP, as: 'cp' }]
        }
      ],
      order: [['idArrendador', 'DESC']]
    });

    const arrendadoresConInfo = await Promise.all(arrendadores.map(async (a) => {
      const propiedades = await Propiedad.findAll({
        where: { arrendador_idArrendador: a.idArrendador },
        include: [{
          model: Arrendamiento,
          as: 'arrendamientos',
          where: { arrendamientoValArrendador: 0 },
          required: false
        }]
      });
      const tienePropiedadesConRentas = propiedades.some(p => p.arrendamientos && p.arrendamientos.length > 0);
      return { ...a.toJSON(), tienePropiedadesConRentas };
    }));

    res.json(arrendadoresConInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/arrendadores/:id', async (req, res) => {
  try {
    const arrendador = await Arrendador.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'usuario' },
        {
          model: Direccion,
          as: 'direccion',
          include: [{ model: CP, as: 'cp' }]
        }
      ]
    });
    if (!arrendador) return res.status(404).json({ error: 'Arrendador no encontrado' });
    res.json(arrendador);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/arrendadores/:id', async (req, res) => {
  try {
    const { usuarioData, arrendadorData, direccionData } = req.body;
    const arrendador = await Arrendador.findByPk(req.params.id);
    if (!arrendador) return res.status(404).json({ error: 'Arrendador no encontrado' });

    delete usuarioData.usuarioCorreo;

    await Usuario.update(usuarioData, { where: { idUsuario: arrendador.usuario_idUsuario } });
    await Arrendador.update(arrendadorData, { where: { idArrendador: req.params.id } });

    if (direccionData) {
      let cpRecord = await CP.findOne({ where: { d_codigo: direccionData.cp } });
      if (!cpRecord) {
        cpRecord = await CP.create({
          d_codigo: direccionData.cp, d_asenta: direccionData.colonia,
          D_mnpio: direccionData.municipio, d_estado: direccionData.estado, cpAceptadoSistema: 1
        });
      }
      await Direccion.update({
        direccionCalle: direccionData.calle, direccionNumExt: direccionData.numExt,
        direccionNumInt: direccionData.numInt || null, CP_idCP: cpRecord.idCP
      }, { where: { idDireccion: arrendador.direccion_idDireccion } });
    }

    res.json({ message: 'Arrendador actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/arrendadores/:id', async (req, res) => {
  try {
    const arrendador = await Arrendador.findByPk(req.params.id);
    if (!arrendador) return res.status(404).json({ error: 'Arrendador no encontrado' });

    const propiedades = await Propiedad.findAll({
      where: { arrendador_idArrendador: req.params.id },
      include: [{
        model: Arrendamiento,
        as: 'arrendamientos',
        where: { arrendamientoValArrendador: 0 },
        required: false
      }]
    });

    const tieneRentasActivas = propiedades.some(p => p.arrendamientos && p.arrendamientos.length > 0);
    if (tieneRentasActivas) {
      return res.status(400).json({ error: 'No se puede eliminar el arrendador porque tiene propiedades con rentas activas' });
    }

    const propiedadesIds = propiedades.map(p => p.idPropiedad);
    if (propiedadesIds.length > 0) {
      await Resena.destroy({ where: { propiedad_idPropiedad: propiedadesIds } });
      await Arrendamiento.destroy({ where: { propiedad_idPropiedad: propiedadesIds } });
      await Propiedad.destroy({ where: { arrendador_idArrendador: req.params.id } });
    }

    const idUsuarioArrendador = arrendador.usuario_idUsuario;
    const idDireccionArrendador = arrendador.direccion_idDireccion;
    await arrendador.destroy();
    await Usuario.destroy({ where: { idUsuario: idUsuarioArrendador } });
    if (idDireccionArrendador) {
      await Direccion.destroy({ where: { idDireccion: idDireccionArrendador } });
    }

    res.json({ message: 'Arrendador eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/arrendadores', async (req, res) => {
  const { nombres, apellidoPaterno, apellidoMaterno, correo, telefono, curp, fechaNacimiento, rfc, calle, numExt, numInt, cp, colonia, municipio, estado, password } = req.body;
  try {
    const existeUsuario = await Usuario.findOne({
      where: { [Op.or]: [{ usuarioCorreo: correo }, { usuarioCurp: curp }] }
    });
    if (existeUsuario) {
      if (existeUsuario.usuarioCorreo === correo) return res.status(400).json({ error: 'El correo ya está registrado' });
      if (existeUsuario.usuarioCurp === curp) return res.status(400).json({ error: 'El CURP ya está registrado' });
    }

    const existeRfc = await Arrendador.findOne({ where: { arrendadorRFC: rfc } });
    if (existeRfc) return res.status(400).json({ error: 'El RFC ya está registrado' });

    let cpRecord = await CP.findOne({ where: { d_codigo: cp } });
    if (!cpRecord) {
      cpRecord = await CP.create({ d_codigo: cp, d_asenta: colonia, D_mnpio: municipio, d_estado: estado, cpAceptadoSistema: 1 });
    }

    const nuevaDireccion = await Direccion.create({
      direccionCalle: calle, direccionNumExt: numExt, direccionNumInt: numInt || null, CP_idCP: cpRecord.idCP
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const nuevoUsuario = await Usuario.create({
      usuarioNom: nombres, usuarioApePat: apellidoPaterno, usuarioApeMat: apellidoMaterno || null,
      usuarioCorreo: correo, usuarioTel: telefono, usuarioCurp: curp, usuarioContra: hashedPassword,
      usuarioFechaNac: fechaNacimiento, usuarioFechaRegis: new Date(), usuarioFechaUIS: new Date(),
      usuarioCodigo: Math.floor(10000000 + Math.random() * 90000000).toString(),
      usuarioCorreoVerificado: 1, usuarioCodigoFecha: new Date(),
    });

    const nuevoArrendador = await Arrendador.create({
      arrendadorRFC: rfc, usuario_idUsuario: nuevoUsuario.idUsuario, direccion_idDireccion: nuevaDireccion.idDireccion
    });

    res.status(201).json({ message: 'Arrendador creado exitosamente', arrendador: nuevoArrendador });
  } catch (error) {
    console.error('Error en creación de arrendador:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ PROPIEDADES ============

router.get('/propiedades', async (req, res) => {
  try {
    const { search } = req.query;
    let whereCondition = {};
    if (search) {
      whereCondition = {
        [Op.or]: [
          { propiedadTitulo: { [Op.like]: `%${search}%` } },
          { propiedadDescripcion: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const propiedades = await Propiedad.findAll({
      where: whereCondition,
      include: [
        { model: Direccion, as: 'direccion', include: [{ model: CP, as: 'cp' }] },
        { model: Arrendador, as: 'arrendador', include: [{ model: Usuario, as: 'usuario' }] }  // ← CORREGIDO
      ],
      order: [['idPropiedad', 'DESC']]
    });

    const propiedadesConInfo = await Promise.all(propiedades.map(async (p) => {
      const rentasActivas = await Arrendamiento.count({
        where: { propiedad_idPropiedad: p.idPropiedad, arrendamientoValArrendador: 0 }
      });
      const reseñas = await Resena.count({ where: { propiedad_idPropiedad: p.idPropiedad } });
      return { ...p.toJSON(), rentasActivas, reseñas };
    }));

    res.json(propiedadesConInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/propiedades/:id', async (req, res) => {
  try {
    const propiedad = await Propiedad.findByPk(req.params.id, {
      include: [
        { model: Direccion, as: 'direccion', include: [{ model: CP, as: 'cp' }] },
        { model: Arrendador, as: 'arrendador', include: [{ model: Usuario, as: 'usuario' }] }  // ← CORREGIDO
      ]
    });
    if (!propiedad) return res.status(404).json({ error: 'Propiedad no encontrada' });
    res.json(propiedad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/propiedades/:id', async (req, res) => {
  try {
    const propiedadData = req.body;
    const propiedad = await Propiedad.findByPk(req.params.id);
    if (!propiedad) return res.status(404).json({ error: 'Propiedad no encontrada' });
    await Propiedad.update(propiedadData, { where: { idPropiedad: req.params.id } });
    res.json({ message: 'Propiedad actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/propiedades/:id', async (req, res) => {
  try {
    const propiedad = await Propiedad.findByPk(req.params.id);
    if (!propiedad) return res.status(404).json({ error: 'Propiedad no encontrada' });

    const rentasActivas = await Arrendamiento.count({
      where: { propiedad_idPropiedad: req.params.id, arrendamientoValArrendador: 0 }
    });
    if (rentasActivas > 0) {
      return res.status(400).json({ error: 'No se puede eliminar la propiedad porque tiene rentas activas' });
    }

    await Resena.destroy({ where: { propiedad_idPropiedad: req.params.id } });
    await Arrendamiento.destroy({ where: { propiedad_idPropiedad: req.params.id } });
    await Propiedad.destroy({ where: { idPropiedad: req.params.id } });

    res.json({ message: 'Propiedad eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;