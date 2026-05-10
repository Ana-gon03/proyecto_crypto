'use strict';
// ContratosCtrl.js
// Gestiona el ciclo de vida de contratos cifrados vinculados a arrendamientos.
// Reglas inquebrantables:
//   - El servidor nunca recibe texto plano del PDF.
//   - Las claves privadas nunca llegan al servidor.
//   - Solo curva P-256 para ECDH y ECDSA.

const {
  Contrato,
  Arrendamiento,
  Arrendatario,
  Arrendador,
  Usuario,
  Propiedad,
} = require('../models/associations');
const { verificarFirmaECDSA } = require('../services/ECDSAVerifier');
const { calcularSHA256 }      = require('../services/SHA256Service');

// ─────────────────────────────────────────────────────────────────────────────
// POST /contratos/crear
// Recibe: PDF cifrado (base64), hash SHA-256 y firma ECDSA del arrendador.
// Crea un registro en la tabla contrato con estado 'firmado'.
// ─────────────────────────────────────────────────────────────────────────────
const crearContrato = async (req, res) => {
  try {
    const {
      arrendamiento_idArrendamiento,
      contratoCifradoB64,     // base64 del blob AES-GCM (IV+ciphertext)
      contratoHashDocumento,  // sha-256 hex del PDF original
      contratoFirmaArrendador // firma ECDSA del arrendador en base64
    } = req.body;

    if (!arrendamiento_idArrendamiento || !contratoCifradoB64 || !contratoHashDocumento || !contratoFirmaArrendador) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Verifica que el arrendamiento exista
    const arrendamiento = await Arrendamiento.findByPk(arrendamiento_idArrendamiento, {
      include: [{ model: Propiedad, as: 'propiedad' }]
    });
    if (!arrendamiento) {
      return res.status(404).json({ error: 'Arrendamiento no encontrado' });
    }

    // Verifica que el usuario solicitante sea el arrendador del arrendamiento
    const arrendadorId = req.headers['x-arrendador-id'];
    if (arrendadorId) {
      const propiedad = arrendamiento.propiedad;
      if (propiedad && String(propiedad.arrendador_idArrendador) !== String(arrendadorId)) {
        return res.status(403).json({ error: 'No tienes permiso para crear este contrato' });
      }
    }

    // Obtiene la clave pública ECDSA del arrendador para verificar la firma
    const userId = req.headers['x-user-id'];
    if (userId) {
      const usuarioArrendador = await Usuario.findByPk(parseInt(userId));
      if (usuarioArrendador && usuarioArrendador.ecdsaPublicKey) {
        const firmaValida = await verificarFirmaECDSA(
          usuarioArrendador.ecdsaPublicKey,
          contratoFirmaArrendador,
          contratoHashDocumento
        );
        if (!firmaValida) {
          return res.status(400).json({ error: 'La firma ECDSA del arrendador no es válida' });
        }
      }
    }

    // Comprueba que no exista ya un contrato para este arrendamiento
    const contratoExistente = await Contrato.findOne({
      where: { arrendamiento_idArrendamiento }
    });
    if (contratoExistente) {
      return res.status(409).json({ error: 'Ya existe un contrato para este arrendamiento' });
    }

    // Convierte base64 → Buffer para almacenar como LONGBLOB
    const contratoCifradoBuffer = Buffer.from(contratoCifradoB64, 'base64');

    // Verifica que el hash que reporta el cliente sea coherente
    const hashCalculado = calcularSHA256(contratoCifradoBuffer);
    // Nota: el hash enviado es del PDF ORIGINAL (no del cifrado), por eso no comparamos aquí.
    // Solo validamos que sea una cadena hex de 64 chars.
    if (!/^[0-9a-f]{64}$/i.test(contratoHashDocumento)) {
      return res.status(400).json({ error: 'El hash del documento no tiene formato SHA-256 válido' });
    }

    const nuevoContrato = await Contrato.create({
      arrendamiento_idArrendamiento,
      contratoCifrado:        contratoCifradoBuffer,
      contratoHashDocumento,
      contratoFirmaArrendador,
      contratoFirmaArrendatario: null,
      contratoEstado:         'firmado',
      contratoFechaCreacion:  new Date(),
    });

    res.status(201).json({
      message:    'Contrato creado y firmado por el arrendador',
      idContrato: nuevoContrato.idContrato,
      estado:     nuevoContrato.contratoEstado,
    });
  } catch (error) {
    console.error('Error al crear contrato:', error);
    res.status(500).json({ error: 'Error al crear contrato', details: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /contratos/firmar-arrendador
// Guarda (o actualiza) la firma ECDSA del arrendador; estado → 'firmado'.
// Útil si se desea re-firmar sin subir un nuevo PDF.
// ─────────────────────────────────────────────────────────────────────────────
const firmarArrendador = async (req, res) => {
  try {
    const { idContrato, contratoFirmaArrendador } = req.body;

    if (!idContrato || !contratoFirmaArrendador) {
      return res.status(400).json({ error: 'Faltan idContrato o contratoFirmaArrendador' });
    }

    const contrato = await Contrato.findByPk(idContrato);
    if (!contrato) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    if (contrato.contratoEstado === 'aceptado') {
      return res.status(409).json({ error: 'El contrato ya fue aceptado y no puede modificarse' });
    }

    // Verifica la firma contra el hash almacenado
    const userId = req.headers['x-user-id'];
    if (userId) {
      const usuario = await Usuario.findByPk(parseInt(userId));
      if (usuario && usuario.ecdsaPublicKey) {
        const firmaValida = await verificarFirmaECDSA(
          usuario.ecdsaPublicKey,
          contratoFirmaArrendador,
          contrato.contratoHashDocumento
        );
        if (!firmaValida) {
          return res.status(400).json({ error: 'La firma ECDSA del arrendador no es válida' });
        }
      }
    }

    await contrato.update({
      contratoFirmaArrendador,
      contratoEstado: 'firmado',
    });

    res.json({
      message: 'Firma del arrendador registrada',
      estado:  'firmado',
    });
  } catch (error) {
    console.error('Error al firmar (arrendador):', error);
    res.status(500).json({ error: 'Error al registrar firma', details: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /contratos/verificar-y-aceptar
// El arrendatario:
//   1. Verifica la firma ECDSA del arrendador (servidor la re-verifica aquí).
//   2. Guarda su propia firma ECDSA.
//   3. Estado → 'aceptado'.
// ─────────────────────────────────────────────────────────────────────────────
const verificarYAceptar = async (req, res) => {
  try {
    const { idContrato, contratoFirmaArrendatario } = req.body;

    if (!idContrato || !contratoFirmaArrendatario) {
      return res.status(400).json({ error: 'Faltan idContrato o contratoFirmaArrendatario' });
    }

    const contrato = await Contrato.findByPk(idContrato, {
      include: [{
        model: Arrendamiento,
        as: 'arrendamiento',
        include: [{
          model: Arrendatario,
          as: 'arrendatario',
          include: [{ model: Usuario, as: 'usuario' }]
        }]
      }]
    });

    if (!contrato) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    if (contrato.contratoEstado !== 'firmado') {
      return res.status(409).json({
        error: `El contrato no está en estado 'firmado' (estado actual: ${contrato.contratoEstado})`
      });
    }

    // Re-verifica la firma del arrendador antes de que el arrendatario acepte
    if (contrato.contratoFirmaArrendador && contrato.contratoHashDocumento) {
      const arrendamiento = contrato.arrendamiento;
      if (arrendamiento) {
        const propiedad = await Propiedad.findByPk(arrendamiento.propiedad_idPropiedad);
        if (propiedad) {
          const arrendadorRec = await Arrendador.findByPk(propiedad.arrendador_idArrendador, {
            include: [{ model: Usuario, as: 'usuario' }]
          });
          if (arrendadorRec && arrendadorRec.usuario.ecdsaPublicKey) {
            const firmaArrendadorValida = await verificarFirmaECDSA(
              arrendadorRec.usuario.ecdsaPublicKey,
              contrato.contratoFirmaArrendador,
              contrato.contratoHashDocumento
            );
            if (!firmaArrendadorValida) {
              return res.status(400).json({ error: 'La firma del arrendador no pudo verificarse' });
            }
          }
        }
      }
    }

    // Verifica la firma del arrendatario
    const userId = req.headers['x-user-id'];
    if (userId) {
      const usuarioArrendatario = await Usuario.findByPk(parseInt(userId));
      if (usuarioArrendatario && usuarioArrendatario.ecdsaPublicKey) {
        const firmaArrendatarioValida = await verificarFirmaECDSA(
          usuarioArrendatario.ecdsaPublicKey,
          contratoFirmaArrendatario,
          contrato.contratoHashDocumento
        );
        if (!firmaArrendatarioValida) {
          return res.status(400).json({ error: 'Tu firma ECDSA no es válida' });
        }
      }
    }

    await contrato.update({
      contratoFirmaArrendatario,
      contratoEstado: 'aceptado',
    });

    res.json({
      message: 'Contrato aceptado y firmado por ambas partes',
      estado:  'aceptado',
    });
  } catch (error) {
    console.error('Error al verificar y aceptar contrato:', error);
    res.status(500).json({ error: 'Error al aceptar contrato', details: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /contratos/:id
// Devuelve el contrato cifrado + firmas + estado + claves públicas ECDH
// de ambas partes para que el cliente pueda derivar el shared_secret.
// ─────────────────────────────────────────────────────────────────────────────
const obtenerContrato = async (req, res) => {
  try {
    const { id } = req.params;

    const contrato = await Contrato.findByPk(id, {
      include: [{
        model: Arrendamiento,
        as: 'arrendamiento',
        include: [
          {
            model: Arrendatario,
            as: 'arrendatario',
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['idUsuario', 'usuarioNom', 'usuarioApePat', 'ecdhPublicKey', 'ecdsaPublicKey', 'clavesGeneradas']
            }]
          },
          {
            model: Propiedad,
            as: 'propiedad',
          }
        ]
      }]
    });

    if (!contrato) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    // Obtiene la clave pública ECDH del arrendador
    const propiedad = contrato.arrendamiento?.propiedad;
    let arrendadorInfo = null;
    if (propiedad) {
      const arrendador = await Arrendador.findByPk(propiedad.arrendador_idArrendador, {
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['idUsuario', 'usuarioNom', 'usuarioApePat', 'ecdhPublicKey', 'ecdsaPublicKey', 'clavesGeneradas']
        }]
      });
      if (arrendador) {
        arrendadorInfo = {
          idArrendador:     arrendador.idArrendador,
          ecdhPublicKey:    arrendador.usuario.ecdhPublicKey,
          ecdsaPublicKey:   arrendador.usuario.ecdsaPublicKey,
          clavesGeneradas:  arrendador.usuario.clavesGeneradas,
          nombre: `${arrendador.usuario.usuarioNom} ${arrendador.usuario.usuarioApePat}`,
        };
      }
    }

    // contratoCifrado viene como Buffer de MySQL; lo serializamos en base64
    const cifradoB64 = contrato.contratoCifrado
      ? Buffer.from(contrato.contratoCifrado).toString('base64')
      : null;

    res.json({
      idContrato:               contrato.idContrato,
      arrendamiento_idArrendamiento: contrato.arrendamiento_idArrendamiento,
      contratoCifradoB64:       cifradoB64,
      contratoHashDocumento:    contrato.contratoHashDocumento,
      contratoFirmaArrendador:  contrato.contratoFirmaArrendador,
      contratoFirmaArrendatario:contrato.contratoFirmaArrendatario,
      contratoEstado:           contrato.contratoEstado,
      contratoFechaCreacion:    contrato.contratoFechaCreacion,
      arrendador:               arrendadorInfo,
      arrendatario: contrato.arrendamiento?.arrendatario
        ? {
            idArrendatario:  contrato.arrendamiento.arrendatario.idArrendatario,
            ecdhPublicKey:   contrato.arrendamiento.arrendatario.usuario.ecdhPublicKey,
            ecdsaPublicKey:  contrato.arrendamiento.arrendatario.usuario.ecdsaPublicKey,
            clavesGeneradas: contrato.arrendamiento.arrendatario.usuario.clavesGeneradas,
            nombre: `${contrato.arrendamiento.arrendatario.usuario.usuarioNom} ${contrato.arrendamiento.arrendatario.usuario.usuarioApePat}`,
          }
        : null,
    });
  } catch (error) {
    console.error('Error al obtener contrato:', error);
    res.status(500).json({ error: 'Error al obtener contrato', details: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /contratos/arrendamiento/:idArrendamiento
// Devuelve el contrato asociado a un arrendamiento (si existe).
// ─────────────────────────────────────────────────────────────────────────────
const obtenerContratoPorArrendamiento = async (req, res) => {
  try {
    const { idArrendamiento } = req.params;

    const contrato = await Contrato.findOne({
      where: { arrendamiento_idArrendamiento: idArrendamiento },
      attributes: ['idContrato', 'contratoEstado', 'contratoHashDocumento', 'contratoFechaCreacion',
                   'contratoFirmaArrendador', 'contratoFirmaArrendatario']
    });

    if (!contrato) {
      return res.status(404).json({ error: 'No hay contrato para este arrendamiento' });
    }

    res.json(contrato);
  } catch (error) {
    console.error('Error al obtener contrato por arrendamiento:', error);
    res.status(500).json({ error: 'Error al obtener contrato', details: error.message });
  }
};

module.exports = {
  crearContrato,
  firmarArrendador,
  verificarYAceptar,
  obtenerContrato,
  obtenerContratoPorArrendamiento,
};
