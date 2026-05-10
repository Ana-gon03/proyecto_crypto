const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Usuario, Arrendatario, Arrendador, Carrera, CP, Direccion, Administrador } = require('../models/associations');
const sequelize = Usuario.sequelize;
const { Op } = require('sequelize');
const { enviarCodigoVerificacion, reenviarCodigoVerificacion } = require('../config/email');
const upload = require('../middlewares/upload');
const { extraerQRDePDF, validarConstancia, validarCURPDocumento } = require('../services/pdfco.service');

// Validar si ya existe un campo (username, correo, curp, boleta)
router.post('/validar-campo', async (req, res) => {
  const { campo, valor } = req.body;
  try {
    let existe = false;
    if (campo === 'username') {
      const arrendatario = await Arrendatario.findOne({ where: { arrendatarioUser: valor } });
      existe = !!arrendatario;
    } else if (campo === 'correo') {
      const usuario = await Usuario.findOne({ where: { usuarioCorreo: valor } });
      existe = !!usuario;
    } else if (campo === 'curp') {
      const usuario = await Usuario.findOne({ where: { usuarioCurp: valor } });
      existe = !!usuario;
    } else if (campo === 'boleta') {
      const arrendatario = await Arrendatario.findOne({ where: { arrendatarioBoleta: valor } });
      existe = !!arrendatario;
    } else if (campo === 'rfc') {
      const arrendador = await Arrendador.findOne({ where: { arrendadorRFC: valor } });
      existe = !!arrendador;
    }
    res.json({ existe });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar estudiante CON o SIN constancia
router.post('/registro-estudiante', upload.single('constancia'), async (req, res) => {
  const {
    username, nombres, apellidoPaterno, apellidoMaterno, correo, telefono,
    curp, fechaNacimiento, carreraId, boleta, password, postergarVerificacion
  } = req.body;
  const constanciaFile = req.file;
  const postergar = postergarVerificacion === 'true';
  try {
    const usuarioExistente = await Usuario.findOne({
      where: { [Op.or]: [{ usuarioCorreo: correo }, { usuarioCurp: curp }] }
    });
    if (usuarioExistente) {
      if (usuarioExistente.usuarioCorreo === correo) return res.status(400).json({ error: 'El correo ya está registrado' });
      if (usuarioExistente.usuarioCurp === curp) return res.status(400).json({ error: 'El CURP ya está registrado' });
    }
    const usernameExistente = await Arrendatario.findOne({ where: { arrendatarioUser: username } });
    if (usernameExistente) return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
    const boletaExistente = await Arrendatario.findOne({ where: { arrendatarioBoleta: boleta } });
    if (boletaExistente) return res.status(400).json({ error: 'La boleta ya está registrada' });

    let verificado = false;
    let fechaVerificacion = null;
    let erroresValidacion = [];
    if (constanciaFile && !postergar) {
      const qrData = await extraerQRDePDF(constanciaFile.buffer, 'constancia');
      if (!qrData) return res.status(400).json({ error: 'No se pudo leer el QR de la constancia.' });
      erroresValidacion = validarConstancia({ nombres, apellidoPaterno, apellidoMaterno, curp, boleta }, qrData);
      if (erroresValidacion.length > 0) return res.status(400).json({ error: 'Los datos del documento no coinciden con el formulario', detalles: erroresValidacion });
      verificado = true;
      fechaVerificacion = new Date();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const nuevoUsuario = await Usuario.create({
      usuarioNom: nombres, usuarioApePat: apellidoPaterno, usuarioApeMat: apellidoMaterno || null,
      usuarioCorreo: correo, usuarioTel: telefono, usuarioCurp: curp, usuarioContra: hashedPassword,
      usuarioFechaNac: fechaNacimiento, usuarioFechaRegis: new Date(), usuarioFechaUIS: new Date(),
      usuarioCodigo: Math.floor(10000000 + Math.random() * 90000000).toString(),
      usuarioCorreoVerificado: 0, usuarioCodigoFecha: new Date(),
    });
    const nuevoArrendatario = await Arrendatario.create({
      arrendatarioBoleta: boleta, arrendatarioVerificado: verificado ? 1 : 0,
      arrendatarioFechaVerificación: fechaVerificacion, arrendatarioUser: username,
      usuario_idUsuario: nuevoUsuario.idUsuario, carrera_idCarrera: carreraId,
    });
    await enviarCodigoVerificacion(correo, nuevoUsuario.usuarioCodigo, nombres);
    const fechaExpiracion = new Date();
    fechaExpiracion.setMonth(fechaExpiracion.getMonth() + 2);
    res.status(201).json({
      message: verificado ? 'Estudiante registrado y verificado exitosamente' : 'Estudiante registrado. Debes verificar tu identidad en los próximos 2 meses',
      usuarioId: nuevoUsuario.idUsuario, arrendatarioId: nuevoArrendatario.idArrendatario,
      requiereVerificacion: !verificado, fechaExpiracion
    });
  } catch (error) {
    console.error('Error en registro estudiante:', error);
    res.status(500).json({ error: 'Error al registrar el estudiante' });
  }
});

// Registrar arrendador
router.post('/registro-arrendador', upload.single('documentoCURP'), async (req, res) => {
  const { nombres, apellidoPaterno, apellidoMaterno, correo, telefono, curp, fechaNacimiento, rfc, calle, numExt, numInt, cp, colonia, municipio, estado, password } = req.body;
  const curpFile = req.file;
  if (!curpFile) return res.status(400).json({ error: 'Es obligatorio subir el documento CURP (PDF)' });
  try {
    const usuarioExistente = await Usuario.findOne({ where: { [Op.or]: [{ usuarioCorreo: correo }, { usuarioCurp: curp }] } });
    if (usuarioExistente) {
      if (usuarioExistente.usuarioCorreo === correo) return res.status(400).json({ error: 'El correo ya está registrado' });
      if (usuarioExistente.usuarioCurp === curp) return res.status(400).json({ error: 'El CURP ya está registrado' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error al verificar los datos' });
  }
  try {
    const qrData = await extraerQRDePDF(curpFile.buffer, 'curp');
    const erroresValidacion = validarCURPDocumento({ curp, fechaNacimiento }, qrData);
    if (erroresValidacion.length > 0) return res.status(400).json({ error: 'El documento CURP no coincide con los datos ingresados', detalles: erroresValidacion });
  } catch (error) {
    return res.status(400).json({ error: 'No se pudo procesar el documento CURP.' });
  }
  const t = await sequelize.transaction();
  try {
    let cpRecord = await CP.findOne({ where: { d_codigo: cp }, transaction: t });
    if (!cpRecord) cpRecord = await CP.create({ d_codigo: cp, d_asenta: colonia, D_mnpio: municipio, d_estado: estado, cpAceptadoSistema: 1 }, { transaction: t });
    const nuevaDireccion = await Direccion.create({ direccionCalle: calle, direccionNumExt: numExt, direccionNumInt: numInt || null, CP_idCP: cpRecord.idCP }, { transaction: t });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const nuevoUsuario = await Usuario.create({
      usuarioNom: nombres, usuarioApePat: apellidoPaterno, usuarioApeMat: apellidoMaterno || null,
      usuarioCorreo: correo, usuarioTel: telefono, usuarioCurp: curp, usuarioContra: hashedPassword,
      usuarioFechaNac: fechaNacimiento, usuarioFechaRegis: new Date(), usuarioFechaUIS: null,
      usuarioCodigo: Math.floor(10000000 + Math.random() * 90000000).toString(),
      usuarioCorreoVerificado: 0, usuarioCodigoFecha: new Date(),
    }, { transaction: t });
    const nuevoArrendador = await Arrendador.create({ arrendadorRFC: rfc, usuario_idUsuario: nuevoUsuario.idUsuario, direccion_idDireccion: nuevaDireccion.idDireccion }, { transaction: t });
    await t.commit();
    await enviarCodigoVerificacion(correo, nuevoUsuario.usuarioCodigo, nombres);
    res.status(201).json({ message: 'Arrendador registrado exitosamente', usuarioId: nuevoUsuario.idUsuario, arrendadorId: nuevoArrendador.idArrendador, rol: 'arrendador' });
  } catch (error) {
    await t.rollback();
    console.error('Error en registro arrendador:', error);
    res.status(500).json({ error: 'Error al registrar el arrendador. Intenta de nuevo.' });
  }
});

// Reenviar código de verificación
router.post('/reenviar-codigo', async (req, res) => {
  const { correo } = req.body;
  try {
    const usuario = await Usuario.findOne({ where: { usuarioCorreo: correo } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (usuario.usuarioCorreoVerificado === 1) return res.status(400).json({ error: 'El correo ya está verificado' });
    const nuevoCodigo = Math.floor(10000000 + Math.random() * 90000000).toString();
    await usuario.update({ usuarioCodigo: nuevoCodigo, usuarioCodigoFecha: new Date() });
    await reenviarCodigoVerificacion(correo, nuevoCodigo, usuario.usuarioNom);
    res.json({ message: 'Código reenviado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al reenviar el código' });
  }
});

// Verificar código (registro)
router.post('/verificar-codigo', async (req, res) => {
  const { correo, codigo } = req.body;
  try {
    const usuario = await Usuario.findOne({ where: { usuarioCorreo: correo } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (usuario.usuarioCorreoVerificado === 1) return res.status(400).json({ error: 'El correo ya está verificado' });
    const horasTranscurridas = (new Date() - new Date(usuario.usuarioCodigoFecha)) / (1000 * 60 * 60);
    if (usuario.usuarioCodigo !== codigo) return res.status(400).json({ error: 'Código incorrecto' });
    if (horasTranscurridas > 24) return res.status(400).json({ error: 'El código ha expirado' });
    await usuario.update({ usuarioCorreoVerificado: 1, usuarioCodigo: null, usuarioCodigoFecha: null });
    res.json({ message: 'Correo verificado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar el código' });
  }
});

// Actualizar correo
router.post('/actualizar-correo', async (req, res) => {
  const { correoAnterior, nuevoCorreo } = req.body;
  try {
    const existeCorreo = await Usuario.findOne({ where: { usuarioCorreo: nuevoCorreo } });
    if (existeCorreo) return res.status(400).json({ error: 'El nuevo correo ya está registrado' });
    const usuario = await Usuario.findOne({ where: { usuarioCorreo: correoAnterior } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    const nuevoCodigo = Math.floor(10000000 + Math.random() * 90000000).toString();
    await usuario.update({ usuarioCorreo: nuevoCorreo, usuarioCodigo: nuevoCodigo, usuarioCodigoFecha: new Date(), usuarioCorreoVerificado: 0 });
    res.json({ message: 'Correo actualizado. Se ha enviado un nuevo código' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el correo' });
  }
});

// ============ LOGIN ADMINISTRADOR ============
router.post('/login-admin', async (req, res) => {
  const { adminUser, adminContra } = req.body;
  
  console.log('📥 Intento de login admin:', { adminUser });
  
  try {
    const admin = await Administrador.findOne({
      where: { adminUser: adminUser }
    });
    
    if (!admin) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    // Comparar contraseña con bcrypt
    const passwordValida = await bcrypt.compare(adminContra, admin.adminContra);
    console.log('Contraseña ingresada:', adminContra)
    console.log('Hash en BD:', admin.adminContra)
    console.log('LENGTH hash:', admin.adminContra.length)
    console.log('¿Válida?', passwordValida)

    if (!passwordValida) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    // Actualizar fecha de último inicio de sesión
    await admin.update({
      adminFechaInicioSesion: new Date()
    });
    
    console.log('✅ Login admin exitoso para:', adminUser);
    
    res.json({
      message: 'Login exitoso',
      adminId: admin.idAdmin,
      adminUser: admin.adminUser
    });
    
  } catch (error) {
    console.error('❌ Error en login admin:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// ============ LOGIN USUARIO (ARRENDATARIO/ARRENDADOR) ============
// ============ LOGIN USUARIO (ARRENDATARIO/ARRENDADOR) ============
router.post('/login-usuario', async (req, res) => {
  const { correo, password } = req.body;
  
  try {
    // 1. Buscar usuario por correo
    const usuario = await Usuario.findOne({
      where: { usuarioCorreo: correo }
    });
    
    if (!usuario) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }
    
    // 2. Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.usuarioContra);
    
    if (!passwordValida) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }
    
    // 3. Verificar si es ARRENDADOR
    const arrendador = await Arrendador.findOne({
      where: { usuario_idUsuario: usuario.idUsuario }
    });
    
    if (arrendador) {
      return res.json({
        userId: usuario.idUsuario,
        rol: 'arrendador',
        correo: usuario.usuarioCorreo,
        correoVerificado: usuario.usuarioCorreoVerificado === 1,  // ← Correo verificado
        arrendadorId: arrendador.idArrendador
      });
    }
    
    // 4. Verificar si es ARRENDATARIO
    const arrendatario = await Arrendatario.findOne({
      where: { usuario_idUsuario: usuario.idUsuario }
    });
    
    if (arrendatario) {
      return res.json({
        userId: usuario.idUsuario,
        rol: 'arrendatario',
        correo: usuario.usuarioCorreo,
        correoVerificado: usuario.usuarioCorreoVerificado === 1,           // ← Correo verificado
        arrendatarioId: arrendatario.idArrendatario,
        fechaRegistro: usuario.usuarioFechaRegis,                           // ← Para calcular 60 días
        arrendatarioVerificado: arrendatario.arrendatarioVerificado === 1  // ← Identidad verificada
      });
    }
    
    // 5. No tiene rol asignado
    return res.status(403).json({ error: 'Usuario no tiene un rol asignado' });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// ============ VERIFICAR CORREO POST-LOGIN ============
router.post('/verificar-correo-login', async (req, res) => {
  const { correo, codigo } = req.body;
  try {
    const usuario = await Usuario.findOne({ where: { usuarioCorreo: correo } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (usuario.usuarioCorreoVerificado === 1) return res.status(400).json({ error: 'El correo ya está verificado' });
    const horasTranscurridas = (new Date() - new Date(usuario.usuarioCodigoFecha)) / (1000 * 60 * 60);
    if (usuario.usuarioCodigo !== codigo) return res.status(400).json({ error: 'Código incorrecto' });
    if (horasTranscurridas > 24) return res.status(400).json({ error: 'El código ha expirado' });
    await usuario.update({ usuarioCorreoVerificado: 1, usuarioCodigo: null, usuarioCodigoFecha: null });

    let arrendatarioVerificado = null;
    const arrendatario = await Arrendatario.findOne({ where: { usuario_idUsuario: usuario.idUsuario } });
    if (arrendatario) arrendatarioVerificado = arrendatario.arrendatarioVerificado;

    res.json({
      message: 'Correo verificado exitosamente',
      userId: usuario.idUsuario,
      correoVerificado: 1,
      arrendatarioVerificado,
      fechaRegistro: usuario.usuarioFechaRegis
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar el código' });
  }
});

// ============ VERIFICAR EXPIRACIÓN DE CUENTA (60 DÍAS) ============
router.post('/verificar-expiracion', async (req, res) => {
  const { userId } = req.body;
  try {
    const usuario = await Usuario.findByPk(userId);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const arrendatario = await Arrendatario.findOne({ where: { usuario_idUsuario: userId } });
    if (!arrendatario) return res.status(400).json({ error: 'El usuario no es arrendatario' });

    if (arrendatario.arrendatarioVerificado === 1) {
      return res.json({ expirado: false, message: 'Usuario verificado', arrendatarioVerificado: 1 });
    }

    const diasTranscurridos = Math.floor((new Date() - new Date(usuario.usuarioFechaRegis)) / (1000 * 60 * 60 * 24));

    if (diasTranscurridos > 60) {
      const { Arrendamiento, Resena } = require('../models/associations');
      
      // 1. Borrar reseñas
      await Resena.destroy({
        where: { arrendatario_idArrendatario: arrendatario.idArrendatario }
      });
      // 2. Borrar arrendamientos
      await Arrendamiento.destroy({
        where: { arrendatario_idArrendatario: arrendatario.idArrendatario }
      });
      // 3. Borrar arrendatario
      await arrendatario.destroy();
      // 4. Borrar usuario
      await usuario.destroy();
      return res.json({
        expirado: true,
        eliminado: true,
        message: 'Tu cuenta ha sido eliminada por no verificar tu identidad en el plazo de 60 días. Debes registrarte nuevamente.',
        diasTranscurridos
      });
    }

    res.json({
      expirado: false,
      message: 'Cuenta activa',
      arrendatarioVerificado: 0,
      diasTranscurridos,
      diasRestantes: 60 - diasTranscurridos
    });
  } catch (error) {
    console.error('Error verificar-expiracion:', error) 
    res.status(500).json({ error: 'Error al verificar la cuenta' });
  }
});

// ============ OBTENER PERFIL ARRENDADOR ============
router.get('/perfil-arrendador/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;

    const arrendador = await Arrendador.findOne({
      where: { usuario_idUsuario: idUsuario },
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: [
            'idUsuario', 'usuarioNom', 'usuarioApePat', 'usuarioApeMat',
            'usuarioCorreo', 'usuarioTel', 'usuarioCurp', 'usuarioFechaNac'
          ]
        },
        {
          model: Direccion,
          as: 'direccion',
          include: [
            {
              model: CP,
              as: 'cp',
              attributes: ['d_codigo', 'd_asenta', 'D_mnpio', 'd_estado']
            }
          ]
        }
      ],
      attributes: ['idArrendador', 'arrendadorRFC']
    });

    if (!arrendador) {
      return res.status(404).json({ error: 'Arrendador no encontrado' });
    }

    res.json(arrendador);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// ============ ACTUALIZAR PERFIL ARRENDADOR ============
router.put('/perfil-arrendador/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;
    const {
      usuarioNom, usuarioApePat, usuarioApeMat,
      usuarioTel, direccionCalle, direccionNumExt,
      direccionNumInt, cp
    } = req.body;

    const arrendador = await Arrendador.findOne({
      where: { usuario_idUsuario: idUsuario },
      include: [
        { model: Usuario, as: 'usuario' },
        { model: Direccion, as: 'direccion' }
      ]
    });

    if (!arrendador) {
      return res.status(404).json({ error: 'Arrendador no encontrado' });
    }

    // Actualizar usuario
    await arrendador.usuario.update({
      usuarioNom: usuarioNom || arrendador.usuario.usuarioNom,
      usuarioApePat: usuarioApePat || arrendador.usuario.usuarioApePat,
      usuarioApeMat: usuarioApeMat !== undefined ? usuarioApeMat : arrendador.usuario.usuarioApeMat,
      usuarioTel: usuarioTel || arrendador.usuario.usuarioTel
    });

    // Buscar o actualizar CP
    if (cp) {
      let cpRecord = await CP.findOne({ where: { d_codigo: cp } });
      if (cpRecord) {
        await arrendador.direccion.update({
          CP_idCP: cpRecord.idCP
        });
      }
    }

    // Actualizar dirección
    await arrendador.direccion.update({
      direccionCalle: direccionCalle || arrendador.direccion.direccionCalle,
      direccionNumExt: direccionNumExt || arrendador.direccion.direccionNumExt,
      direccionNumInt: direccionNumInt !== undefined ? direccionNumInt : arrendador.direccion.direccionNumInt
    });

    // Recargar datos actualizados
    const perfilActualizado = await Arrendador.findOne({
      where: { usuario_idUsuario: idUsuario },
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: [
            'idUsuario', 'usuarioNom', 'usuarioApePat', 'usuarioApeMat',
            'usuarioCorreo', 'usuarioTel', 'usuarioCurp', 'usuarioFechaNac'
          ]
        },
        {
          model: Direccion,
          as: 'direccion',
          include: [
            {
              model: CP,
              as: 'cp',
              attributes: ['d_codigo', 'd_asenta', 'D_mnpio', 'd_estado']
            }
          ]
        }
      ],
      attributes: ['idArrendador', 'arrendadorRFC']
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

// ============ VERIFICAR IDENTIDAD POST-REGISTRO ============
router.post('/verificar-identidad', upload.single('constancia'), async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId requerido' });
  if (!req.file) return res.status(400).json({ error: 'Debes subir tu constancia en PDF' });

  try {
    const usuario = await Usuario.findByPk(userId);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const arrendatario = await Arrendatario.findOne({ where: { usuario_idUsuario: userId } });
    if (!arrendatario) return res.status(400).json({ error: 'No es arrendatario' });

    if (arrendatario.arrendatarioVerificado === 1) {
      return res.status(400).json({ error: 'Tu identidad ya está verificada' });
    }

    // Extraer y validar QR igual que en el registro
    const qrData = await extraerQRDePDF(req.file.buffer, 'constancia');
    if (!qrData) return res.status(400).json({ error: 'No se pudo leer el QR de la constancia.' });

    const errores = validarConstancia({
      nombres: usuario.usuarioNom,
      apellidoPaterno: usuario.usuarioApePat,
      apellidoMaterno: usuario.usuarioApeMat,
      curp: usuario.usuarioCurp,
      boleta: arrendatario.arrendatarioBoleta
    }, qrData);

    if (errores.length > 0) {
      return res.status(400).json({
        error: 'Los datos del documento no coinciden con tu registro',
        detalles: errores
      });
    }

    // Marcar como verificado
    await arrendatario.update({
      arrendatarioVerificado: 1,
      arrendatarioFechaVerificación: new Date()
    });

    res.json({ message: 'Identidad verificada exitosamente', verificado: true });

  } catch (error) {
    console.error('Error al verificar identidad:', error);
    res.status(500).json({ error: 'Error al procesar la verificación' });
  }
});

module.exports = router;