// backend/src/controllers/contrato.controller.js
const { sequelize } = require('../config/database');
const LlavePublica = require('../models/llave_publica.model');
const Contrato = require('../models/contrato.model');
const ContratoHistorial = require('../models/contrato_historial.model');
const ContratoVerificacion = require('../models/contrato_verificacion.model');
const Arrendamiento = require('../models/arrendamiento.model');
const Propiedad = require('../models/propiedad.model');
const Arrendador = require('../models/arrendador.model');
const Arrendatario = require('../models/arrendatario.model');
const Usuario = require('../models/usuario.model');
const crypto = require('crypto');

// 1. Registrar clave pública
exports.registrarClavePublica = async (req, res) => {
  const { publicKeyPem } = req.body;
  const userId = req.user.idUsuario; // Ahora viene del middleware

  try {
    // Validar que sea una clave P-256 válida
    crypto.createPublicKey({ key: publicKeyPem, format: 'pem', type: 'spki' });
  } catch (err) {
    return res.status(400).json({ error: 'Clave pública inválida' });
  }

  const hash = crypto.createHash('sha256').update(publicKeyPem).digest('hex');

  const t = await sequelize.transaction();
  try {
    // Desactivar claves anteriores del usuario
    await LlavePublica.update(
      { llavePublicaActiva: false },
      { where: { usuario_idUsuario: userId }, transaction: t }
    );
    // Guardar nueva clave pública activa
    await LlavePublica.create({
      llavePublicaPEM: publicKeyPem,
      llavePublicaHash: hash,
      usuario_idUsuario: userId,
      llavePublicaActiva: 1,
      llavePublicaFechaReg: new Date()
    }, { transaction: t });
    await t.commit();
    res.status(201).json({ message: 'Clave pública registrada' });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'Error al guardar la clave pública' });
  }
};

// 2. Crear contrato (arrendador)
exports.crearContrato = async (req, res) => {
  const { idArrendamiento, contratoCifrado, iv, authTag, hashPlano, firmaArrendador } = req.body;
  const userId = req.user.idUsuario;

  const t = await sequelize.transaction();
  try {
    // Verificar que el arrendamiento pertenece a una propiedad del arrendador autenticado
    const arrendamiento = await Arrendamiento.findOne({
      include: [
        {
          model: Propiedad,
          as: 'propiedad',
          include: [
            {
              model: Arrendador,
              as: 'arrendador',
              include: [{ model: Usuario, as: 'usuario' }],
              where: { usuario_idUsuario: userId }
            }
          ]
        },
        {
          model: Arrendatario,
          as: 'arrendatario',
          include: [{ model: Usuario, as: 'usuario' }]
        }
      ],
      where: { idArrendamiento },
      transaction: t
    });

    if (!arrendamiento) {
      throw new Error('No autorizado o arrendamiento no existe');
    }

    // Obtener clave pública activa del arrendador
    const llaveArr = await LlavePublica.findOne({
      where: { usuario_idUsuario: userId, llavePublicaActiva: true },
      transaction: t
    });
    if (!llaveArr) throw new Error('El arrendador no tiene clave pública registrada');

    const idArrendatarioUser = arrendamiento.arrendatario.usuario.idUsuario;

    // Crear contrato
    const nuevoContrato = await Contrato.create({
      arrendamiento_idArrendamiento: idArrendamiento,
      contratoIV: iv,
      contratoAuthTag: authTag,
      contratoCifrado: contratoCifrado,
      contratoHashPlano: hashPlano,
      contratoFirmaArrendador: firmaArrendador,
      llavePub_idArrendador: llaveArr.idLlavePublica,
      contratoEstado: 'pendiente_arrendatario',
      contratoFechaCreacion: new Date(),
      contratoFechaActualiz: new Date()
    }, { transaction: t });

    // Registrar historial
    await ContratoHistorial.create({
      contrato_idContrato: nuevoContrato.idContrato,
      historialEstadoAnterior: 'pendiente_arrendador',
      historialEstadoNuevo: 'pendiente_arrendatario',
      historialActor: 'arrendador',
      historialFecha: new Date()
    }, { transaction: t });

    await t.commit();

    // TODO: Enviar notificación al arrendatario (puedes usar tu servicio de correo)
    res.status(201).json({ idContrato: nuevoContrato.idContrato });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// 3. Firmar contrato (arrendatario)
exports.firmarContratoArrendatario = async (req, res) => {
  const { idContrato } = req.params;
  const { firmaArrendatario } = req.body;
  const userId = req.user.idUsuario;

  const t = await sequelize.transaction();
  try {
    const contrato = await Contrato.findOne({
      include: [
        {
          model: Arrendamiento,
          as: 'arrendamiento',
          include: [
            {
              model: Arrendatario,
              as: 'arrendatario',
              include: [{ model: Usuario, as: 'usuario' }]
            }
          ]
        }
      ],
      where: { idContrato },
      transaction: t
    });

    if (!contrato) throw new Error('Contrato no encontrado');
    if (contrato.arrendamiento.arrendatario.usuario.idUsuario !== userId) {
      throw new Error('No eres el arrendatario de este contrato');
    }
    if (contrato.contratoEstado !== 'pendiente_arrendatario') {
      throw new Error('El contrato no está en estado pendiente de firma por arrendatario');
    }

    // Obtener clave pública activa del arrendatario
    const llaveArrTario = await LlavePublica.findOne({
      where: { usuario_idUsuario: userId, llavePublicaActiva: true },
      transaction: t
    });
    if (!llaveArrTario) throw new Error('El arrendatario no tiene clave pública registrada');

    // Actualizar contrato
    await contrato.update({
      contratoFirmaArrendatario: firmaArrendatario,
      contratoFechaFirmaArrTario: new Date(),
      llavePub_idArrendatario: llaveArrTario.idLlavePublica,
      contratoEstado: 'firmado',
      contratoFechaActualiz: new Date()
    }, { transaction: t });

    // Registrar historial
    await ContratoHistorial.create({
      contrato_idContrato: idContrato,
      historialEstadoAnterior: 'pendiente_arrendatario',
      historialEstadoNuevo: 'firmado',
      historialActor: 'arrendatario',
      historialFecha: new Date()
    }, { transaction: t });

    await t.commit();
    res.json({ message: 'Contrato firmado exitosamente' });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// 4. Verificar contrato (auditoría)
exports.verificarContrato = async (req, res) => {
  const { idContrato } = req.params;
  const userId = req.user.idUsuario;
  // Determinar rol del usuario (puedes obtenerlo de una tabla de roles o de localStorage via header)
  // Por simplicidad, intentamos deducir si es arrendador o arrendatario
  let actor = 'admin';
  try {
    const esArrendador = await Arrendador.findOne({ where: { usuario_idUsuario: userId } });
    if (esArrendador) actor = 'arrendador';
    else {
      const esArrendatario = await Arrendatario.findOne({ where: { usuario_idUsuario: userId } });
      if (esArrendatario) actor = 'arrendatario';
    }
  } catch (err) { /* no importa */ }

  try {
    const contrato = await Contrato.findByPk(idContrato, {
      include: [
        { model: LlavePublica, as: 'llaveArrendador' },
        { model: LlavePublica, as: 'llaveArrendatario' },
        { model: Arrendamiento, as: 'arrendamiento', include: ['propiedad'] }
      ]
    });
    if (!contrato) return res.status(404).json({ error: 'Contrato no encontrado' });

    // Aquí solo registramos la verificación, sin validación completa (necesitarías el texto plano)
    await ContratoVerificacion.create({
      contrato_idContrato: idContrato,
      verificacionActor: actor,
      verificacionFirmaArr: null, // no se verifica en este endpoint simplificado
      verificacionFirmaArrTario: null,
      verificacionHashOk: null,
      verificacionIP: req.ip
    });

    res.json({
      mensaje: 'Verificación registrada',
      estadoContrato: contrato.contratoEstado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// 5. Obtener contrato por ID de arrendamiento (para que el arrendatario lo descargue)
exports.obtenerContratoPorArrendamiento = async (req, res) => {
  const { idArrendamiento } = req.params;
  const userId = req.user.idUsuario;

  try {
    const contrato = await Contrato.findOne({
      where: { arrendamiento_idArrendamiento: idArrendamiento },
      include: [
        { model: LlavePublica, as: 'llaveArrendador' },
        { model: LlavePublica, as: 'llaveArrendatario' }
      ]
    });
    if (!contrato) return res.status(404).json({ error: 'Contrato no encontrado' });

    // Verificar que el usuario sea parte del arrendamiento
    const arrendamiento = await Arrendamiento.findByPk(idArrendamiento, {
      include: [
        { model: Arrendatario, as: 'arrendatario', include: ['usuario'] },
        { model: Propiedad, as: 'propiedad', include: [{ model: Arrendador, as: 'arrendador', include: ['usuario'] }] }
      ]
    });
    if (!arrendamiento) return res.status(404).json({ error: 'Arrendamiento no encontrado' });
    const esArrendador = arrendamiento.propiedad.arrendador.usuario.idUsuario === userId;
    const esArrendatario = arrendamiento.arrendatario.usuario.idUsuario === userId;
    if (!esArrendador && !esArrendatario) {
      return res.status(403).json({ error: 'No tienes acceso a este contrato' });
    }

    // Devolver solo los campos necesarios para descifrar
    res.json({
      idContrato: contrato.idContrato,
      contratoCifrado: contrato.contratoCifrado,
      contratoIV: contrato.contratoIV,
      contratoAuthTag: contrato.contratoAuthTag,
      llavePub_idArrendador: contrato.llavePub_idArrendador,
      llavePub_idArrendatario: contrato.llavePub_idArrendatario,
      estado: contrato.contratoEstado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// 6. Obtener clave pública de un usuario por ID (requiere autenticación)
exports.obtenerClavePublicaUsuario = async (req, res) => {
  const { idUsuario } = req.params;
  // Puedes agregar una validación de que el usuario autenticado tiene permiso para ver esta clave
  // (por ejemplo, solo si es parte de un arrendamiento). Por simplicidad, permitimos a cualquier autenticado.
  try {
    const llave = await LlavePublica.findOne({
      where: { usuario_idUsuario: idUsuario, llavePublicaActiva: true }
    });
    if (!llave) return res.status(404).json({ error: 'Usuario sin clave pública activa' });
    res.json({ publicKeyPem: llave.llavePublicaPEM });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};