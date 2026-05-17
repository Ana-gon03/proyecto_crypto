const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { Arrendamiento, Arrendatario, Usuario, Propiedad, Direccion, CP, Arrendador } = require('../models/associations');
const { Op } = require('sequelize');
const { analizarSentimiento } = require('../utils/sentimiento');

// =====================================================
// RUTAS ESPECÍFICAS PRIMERO
// =====================================================

router.get('/arrendador/:idArrendador', async (req, res) => {
  try {
    const { idArrendador } = req.params;
    const arrendamientos = await Arrendamiento.findAll({
      include: [
        {
          model: Propiedad,
          as: 'propiedad',
          attributes: ['idPropiedad', 'propiedadTitulo', 'propiedadTipo', 'propiedadLugares', 'propiedadPrecio', 'propiedadPrecioPor'],
          include: [
            {
              model: Direccion,
              as: 'direccion',
              attributes: ['direccionCalle', 'direccionNumExt', 'direccionNumInt'],
              include: [{ model: CP, as: 'cp', attributes: ['d_codigo', 'd_asenta', 'D_mnpio', 'd_estado'] }]
            }
          ]
        },
        {
          model: Arrendatario,
          as: 'arrendatario',
          attributes: ['idArrendatario', 'arrendatarioBoleta', 'arrendatarioUser'],
          include: [{ model: Usuario, as: 'usuario', attributes: ['idUsuario', 'usuarioNom', 'usuarioApePat', 'usuarioApeMat', 'usuarioCorreo', 'usuarioTel'] }]
        }
      ],
      where: { '$propiedad.arrendador_idArrendador$': idArrendador }
    });
    res.json(arrendamientos);
  } catch (error) {
    console.error('Error al obtener arrendamientos:', error);
    res.status(500).json({ error: 'Error al obtener arrendamientos' });
  }
});

// =====================================================
// PDF DE ARRENDAMIENTO
// =====================================================

router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;

    const arrendamiento = await Arrendamiento.findByPk(id, {
      include: [
        {
          model: Propiedad,
          as: 'propiedad',
          include: [{ model: Direccion, as: 'direccion', include: [{ model: CP, as: 'cp' }] }]
        },
        {
          model: Arrendatario,
          as: 'arrendatario',
          include: [{ model: Usuario, as: 'usuario' }]
        }
      ]
    });

    if (!arrendamiento) return res.status(404).json({ error: 'Arrendamiento no encontrado' });

    const propiedad = arrendamiento.propiedad;
    const arrendador = await Arrendador.findByPk(propiedad.arrendador_idArrendador, {
      include: [{ model: Usuario, as: 'usuario' }]
    });

    // ── CONSTANTES ───────────────────────────────────────────────────────────
    const NEGRO   = '#000000';
    const GRIS    = '#555555';
    const ML      = 65;   // margen izquierdo
    const MR      = 530;  // margen derecho
    const ANCHO   = MR - ML;
    const IND     = ML + 18; // sangría para párrafos

    const doc = new PDFDocument({ size: 'A4', margin: ML, bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=contrato_arrendamiento_${id}.pdf`);
    doc.pipe(res);

    // ── HELPERS ──────────────────────────────────────────────────────────────

    // Separador de línea delgada
    const separador = () => {
      doc.save().moveTo(ML, doc.y).lineTo(MR, doc.y).strokeColor('#aaaaaa').lineWidth(0.5).stroke().restore();
      doc.moveDown(0.4);
    };

    // Título de sección (centrado, subrayado)
    const tituloSeccion = (texto) => {
      doc.moveDown(0.6);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(NEGRO)
         .text(texto, ML, doc.y, { align: 'center', width: ANCHO, underline: true });
      doc.moveDown(0.5);
    };

    // Fila de datos (etiqueta: valor en una sola línea)
    const fila = (etiqueta, valor) => {
      const y = doc.y;
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(NEGRO)
         .text(etiqueta + ':', ML, y, { width: 155, continued: false });
      doc.fontSize(8.5).font('Helvetica').fillColor(NEGRO)
         .text(String(valor || '—'), ML + 160, y, { width: ANCHO - 160 });
      doc.moveDown(0.18);
    };

    // Párrafo con sangría y justificado
    const parrafo = (texto, opciones = {}) => {
      doc.fontSize(9).font('Helvetica').fillColor(NEGRO)
         .text(texto, IND, doc.y, { align: 'justify', width: ANCHO - (IND - ML), ...opciones });
      doc.moveDown(0.35);
    };

    // Cláusula con título en negrita seguido del texto en la misma línea lógica
    const clausula = (titulo, texto) => {
      if (doc.y > 680) doc.addPage();
      doc.moveDown(0.25);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(NEGRO)
         .text(titulo + ' ', ML, doc.y, { continued: true, width: ANCHO });
      doc.fontSize(9).font('Helvetica').fillColor(NEGRO)
         .text(texto, { align: 'justify', width: ANCHO });
      doc.moveDown(0.3);
    };

    // ── ENCABEZADO ───────────────────────────────────────────────────────────
    const numContrato = `ARR-${String(id).padStart(4, '0')}`;
    const fechaGen = new Date();
    const fechaGenStr = fechaGen.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

    // Número de contrato y fecha (esquina superior)
    doc.fontSize(7.5).font('Helvetica').fillColor(GRIS)
       .text(`N.° ${numContrato}`, ML, 55, { width: ANCHO / 2 })
    doc.fontSize(7.5).font('Helvetica').fillColor(GRIS)
       .text(`Generado: ${fechaGenStr}`, ML + ANCHO / 2, 55, { width: ANCHO / 2, align: 'right' });

    // Línea superior
    doc.save().moveTo(ML, 68).lineTo(MR, 68).strokeColor('#000000').lineWidth(1).stroke().restore();

    // Título principal
    doc.moveDown(0.2);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(NEGRO)
       .text('CONTRATO DE ARRENDAMIENTO', ML, 76, { align: 'center', width: ANCHO });

    doc.fontSize(8).font('Helvetica').fillColor(GRIS)
       .text('Plataforma Blockhoom  –  Vivienda estudiantil IPN', ML, 98, { align: 'center', width: ANCHO });

    // Línea inferior del encabezado
    doc.save().moveTo(ML, 114).lineTo(MR, 114).strokeColor('#000000').lineWidth(1).stroke().restore();
    doc.y = 122;

    // ── PÁRRAFO INTRODUCTORIO ────────────────────────────────────────────────
    const at          = arrendamiento.arrendatario.usuario;
    const nomArrendador   = `${arrendador.usuario.usuarioNom} ${arrendador.usuario.usuarioApePat} ${arrendador.usuario.usuarioApeMat || ''}`.trim();
    const nomArrendatario = `${at.usuarioNom} ${at.usuarioApePat} ${at.usuarioApeMat || ''}`.trim();

    doc.moveDown(0.4);
    doc.fontSize(9).font('Helvetica').fillColor(NEGRO).text(
      'Contrato de arrendamiento que celebran, por una parte, en su carácter de ',
      ML, doc.y, { continued: true, align: 'justify', width: ANCHO }
    );
    doc.font('Helvetica-Bold').text('ARRENDADOR', { continued: true });
    doc.font('Helvetica').text(`, el C. ${nomArrendador}; y por otra parte, en su carácter de `, { continued: true });
    doc.font('Helvetica-Bold').text('ARRENDATARIO', { continued: true });
    doc.font('Helvetica').text(
      `, el C. ${nomArrendatario}; ambos de conformidad con las siguientes declaraciones y cláusulas:`,
      { align: 'justify' }
    );
    doc.moveDown(0.5);

    // ── DECLARACIONES ────────────────────────────────────────────────────────
    tituloSeccion('DECLARACIONES');

    const fechaInicio = new Date(arrendamiento.arrendamientoFechaInicio);
    const diasEnRenta = Math.floor((new Date() - fechaInicio) / (1000 * 60 * 60 * 24));
    const mesesEnRenta = Math.floor(diasEnRenta / 30);
    const diasRest = diasEnRenta % 30;
    const tiempoRenta = mesesEnRenta > 0
      ? `${mesesEnRenta} mes(es)${diasRest > 0 ? ` y ${diasRest} día(s)` : ''}`
      : `${diasEnRenta} día(s)`;
    const tipoPrecio = propiedad.propiedadPrecioPor === 'Propiedad' ? ' (propiedad completa)' :
                       propiedad.propiedadPrecioPor === 'Persona'   ? ' (por persona)'          :
                       propiedad.propiedadPrecioPor === 'Habitación' ? ' (por habitación)'       : '';
    const dir = propiedad.direccion;
    let direccionCompleta = 'No disponible';
    if (dir) {
      direccionCompleta = `${dir.direccionCalle} #${dir.direccionNumExt}`;
      if (dir.direccionNumInt) direccionCompleta += ` Int. ${dir.direccionNumInt}`;
      if (dir.cp) direccionCompleta += `, Col. ${dir.cp.d_asenta}, ${dir.cp.D_mnpio}, ${dir.cp.d_estado}, C.P. ${dir.cp.d_codigo}`;
    }

    // Declaración I — Arrendador
    const yDecI = doc.y;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(NEGRO)
       .text('I.', ML, yDecI, { width: 16, lineBreak: false });
    doc.fontSize(9).font('Helvetica').fillColor(NEGRO)
       .text(
         `Declara el ARRENDADOR ser mayor de edad, con correo: ${arrendador.usuario.usuarioCorreo || '—'}, ` +
         `con RFC: ${arrendador.arrendadorRFC || '—'}, y manifiesta ser propietario o legítimo poseedor del inmueble ubicado en ${direccionCompleta}.`,
         ML + 20, yDecI, { align: 'justify', width: ANCHO - 20 }
       );
    doc.moveDown(0.4);

    // Declaración II — Arrendatario
    const yDecII = doc.y;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(NEGRO)
       .text('II.', ML, yDecII, { width: 16, lineBreak: false });
    doc.fontSize(9).font('Helvetica').fillColor(NEGRO)
       .text(
         `Declara el ARRENDATARIO ser mayor de edad, estudiante del Instituto Politécnico Nacional, con número de boleta: ${arrendamiento.arrendatario.arrendatarioBoleta || '—'} ` +
         `y correo institucional: ${at.usuarioCorreo || '—'}. Declara tener capacidad legal para contratar y obligarse en los términos del presente instrumento.`,
         ML + 20, yDecII, { align: 'justify', width: ANCHO - 20 }
       );
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica').fillColor(NEGRO)
       .text('Expuesto lo anterior, las partes se obligan conforme a las siguientes:', ML, doc.y, { align: 'justify', width: ANCHO });
    doc.moveDown(0.5);

    // ── CLÁUSULAS ────────────────────────────────────────────────────────────
    tituloSeccion('CLÁUSULAS');

    clausula('PRIMERA.–', `El ${doc.font ? '' : ''}ARRENDADOR cede en arrendamiento al ARRENDATARIO el inmueble ubicado en ${direccionCompleta}, denominado "${propiedad.propiedadTitulo}", para uso exclusivo como vivienda estudiantil. Queda estrictamente prohibido cualquier otro uso sin autorización previa y por escrito del ARRENDADOR.`);

    clausula('SEGUNDA.–', `La duración del presente contrato es indefinida a partir del ${fechaInicio.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}, fecha registrada en la plataforma Blockhoom. A la fecha de generación de este documento, el tiempo transcurrido en renta es de ${tiempoRenta}. Cualquiera de las partes podrá darlo por terminado requiriéndose la confirmación de ambas partes en la plataforma.`);

    clausula('TERCERA.–', `El ARRENDATARIO se obliga a pagar al ARRENDADOR, o a quien sus derechos represente, la cantidad de $${arrendamiento.arrendamientoRenta} MXN mensuales${tipoPrecio} como renta del inmueble arrendado. El pago deberá realizarse conforme a los términos acordados entre las partes. Blockhoom no interviene en las transacciones económicas entre arrendador y arrendatario.`);

    clausula('CUARTA.–', `Las partes podrán acordar un depósito en garantía equivalente a uno o más meses de renta, el cual será devuelto al ARRENDATARIO al término del contrato, descontando los daños comprobados al inmueble si los hubiere, conforme a lo que establezca la legislación aplicable.`);

    clausula('QUINTA.–', `El ARRENDATARIO se obliga a utilizar el inmueble únicamente como vivienda habitual para fines académicos. Queda prohibido subarrendar, ceder o traspasar, total o parcialmente, el uso del inmueble sin autorización expresa y por escrito del ARRENDADOR.`);

    clausula('SEXTA.–', `El ARRENDATARIO se obliga a conservar el inmueble en buen estado, realizando las reparaciones menores derivadas del uso cotidiano. Las reparaciones estructurales o de mayor envergadura serán responsabilidad del ARRENDADOR y deberán atenderse en un plazo razonable tras ser notificado.`);

    clausula('SÉPTIMA.–', `Los servicios básicos incluidos en el arrendamiento serán los expresamente pactados entre las partes al momento de celebrar este contrato. Cualquier servicio no acordado será cubierto directamente por el ARRENDATARIO, quien no podrá reclamar reembolso alguno al ARRENDADOR por dichos conceptos.`);

    clausula('OCTAVA.–', `El ARRENDATARIO podrá recibir visitas en el inmueble siempre que no afecten la tranquilidad de los demás ocupantes ni del vecindario. Las visitas deberán respetar en todo momento el reglamento interno del inmueble si lo hubiere y los ordenamientos aplicables.`);

    clausula('NOVENA.–', `El ARRENDATARIO no podrá realizar modificaciones, remodelaciones ni obras de ningún tipo en el inmueble sin contar con el consentimiento previo y por escrito del ARRENDADOR. Las mejoras realizadas sin autorización quedarán en beneficio del inmueble sin derecho a reembolso alguno.`);

    clausula('DÉCIMA.–', `El ARRENDADOR podrá acceder al inmueble para realizar inspecciones o reparaciones, notificando al ARRENDATARIO con al menos 24 horas de anticipación, salvo en casos de emergencia que pongan en riesgo la integridad del inmueble o de sus ocupantes.`);

    clausula('DÉCIMA PRIMERA.–', `Cualquiera de las partes podrá solicitar la terminación anticipada del contrato mediante la plataforma Blockhoom, con un aviso mínimo de 15 días naturales. La terminación se formalizará una vez que ambas partes la confirmen en la plataforma y el ARRENDATARIO haya desocupado totalmente el inmueble.`);

    clausula('DÉCIMA SEGUNDA.–', `El ARRENDATARIO será responsable de los daños causados al inmueble por negligencia, mal uso o descuido. El ARRENDADOR garantizará que el inmueble se encuentre en condiciones habitables al inicio del contrato y las mantendrá durante toda la vigencia del mismo.`);

    // Notas adicionales
    if (arrendamiento.arrendamientoDescrip) {
      doc.moveDown(0.25);
      if (doc.y > 680) doc.addPage();
      doc.fontSize(9).font('Helvetica-Bold').fillColor(NEGRO)
         .text('NOTAS ADICIONALES.–', ML, doc.y, { continued: true });
      doc.font('Helvetica').text(` ${arrendamiento.arrendamientoDescrip}`, { align: 'justify', width: ANCHO });
      doc.moveDown(0.3);
    }

    // ── FIRMAS ───────────────────────────────────────────────────────────────
    if (doc.y > 580) doc.addPage();
    tituloSeccion('FIRMAS DE CONFORMIDAD');

    doc.fontSize(9).font('Helvetica').fillColor(NEGRO)
       .text(
         `Leído y aceptado en la Ciudad de México, a los ${fechaGen.getDate()} días del mes de ` +
         `${fechaGen.toLocaleDateString('es-MX', { month: 'long' })} del año ${fechaGen.getFullYear()}.`,
         ML, doc.y, { align: 'justify', width: ANCHO }
       );

    doc.moveDown(3.5);

    const mitad      = ML + ANCHO / 2;
    const anchoFirma = (ANCHO / 2) - 15;

    // Líneas de firma
    doc.save().moveTo(ML, doc.y).lineTo(ML + anchoFirma, doc.y).strokeColor('#000000').lineWidth(0.7).stroke().restore();
    doc.save().moveTo(mitad + 8, doc.y).lineTo(mitad + 8 + anchoFirma, doc.y).strokeColor('#000000').lineWidth(0.7).stroke().restore();
    doc.moveDown(0.3);

    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(NEGRO)
       .text('EL ARRENDADOR', ML, doc.y, { width: anchoFirma, align: 'center' });
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(NEGRO)
       .text('EL ARRENDATARIO', mitad + 8, doc.y - doc.currentLineHeight(), { width: anchoFirma, align: 'center' });
    doc.moveDown(0.25);

    doc.fontSize(8).font('Helvetica').fillColor(GRIS)
       .text(nomArrendador, ML, doc.y, { width: anchoFirma, align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor(GRIS)
       .text(nomArrendatario, mitad + 8, doc.y - doc.currentLineHeight(), { width: anchoFirma, align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor(GRIS)
       .text(`RFC: ${arrendador.arrendadorRFC || '—'}`, ML, doc.y, { width: anchoFirma, align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor(GRIS)
       .text(`Boleta: ${arrendamiento.arrendatario.arrendatarioBoleta || '—'}`, mitad + 8, doc.y - doc.currentLineHeight(), { width: anchoFirma, align: 'center' });

    doc.moveDown(1);

    // ── PIE DE PÁGINA ────────────────────────────────────────────────────────
    doc.moveDown(1.2);
    doc.save().moveTo(ML, doc.y).lineTo(MR, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke().restore();
    doc.moveDown(0.35);
    doc.fontSize(7).font('Helvetica').fillColor('#aaaaaa')
       .text(
         `Blockhoom © ${fechaGen.getFullYear()} — Documento generado el ${fechaGenStr}`,
         ML, doc.y, { align: 'center', width: ANCHO }
       );

    doc.end();

  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ error: 'Error al generar el PDF', details: error.message });
  }
});


// =====================================================
// OBTENER MI ARRENDAMIENTO (ESTUDIANTE LOGUEADO)
// =====================================================
router.get('/mi-arrendamiento', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const arrendatarioIdHeader = req.headers['x-arrendatario-id'];

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    let idArrendatario = arrendatarioIdHeader ? parseInt(arrendatarioIdHeader) : null;

    if (!idArrendatario) {
      const arrendatario = await Arrendatario.findOne({
        where: { usuario_idUsuario: parseInt(userId) }
      });
      
      if (!arrendatario) {
        return res.status(404).json({ error: 'Arrendatario no encontrado' });
      }
      
      idArrendatario = arrendatario.idArrendatario;
    }

    const arrendamiento = await Arrendamiento.findOne({
    where: { arrendatario_idArrendatario: idArrendatario },
    include: [
      {
        model: Propiedad,
        as: 'propiedad',
        include: [
          {
            model: require('../models/associations').Fotos,
            as: 'fotos',
            attributes: ['idFotos', 'fotosURL'],
            limit: 1,
            required: false  // ← Agregar esto
          },
          {
            model: Arrendador,  // ← ESTO FALTA
            as: 'arrendador',
            include: [
              {
                model: Usuario,
                as: 'usuario',
                attributes: ['usuarioNom', 'usuarioApePat', 'usuarioApeMat', 'usuarioCorreo', 'usuarioTel']
              }
            ]
          },
          {
            model: Direccion,
            as: 'direccion',
            include: [
              { model: CP, as: 'cp', attributes: ['d_codigo', 'd_asenta', 'D_mnpio', 'd_estado'] }
            ]
          }
        ]
      }
    ],
    order: [['arrendamientoFechaInicio', 'DESC']]
  });

    if (!arrendamiento) {
      return res.status(404).json({ error: 'No tienes arrendamiento activo' });
    }

    res.json(arrendamiento);
  } catch (error) {
    console.error('Error al obtener mi arrendamiento:', error);
    res.status(500).json({ error: 'Error al obtener arrendamiento', details: error.message });
  }
});

// =====================================================
// FINALIZAR ARRENDAMIENTO (ESTUDIANTE)
// =====================================================
router.put('/:id/finalizar-estudiante', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      resenaCalGen, 
      resenaCalSerBasic, 
      resenaCalSerComEnt, 
      resenaCalSerAdicio, 
      resenaDescrip
    } = req.body;

    const arrendamiento = await Arrendamiento.findByPk(id, {
      include: [
        { model: Propiedad, as: 'propiedad' },
        { model: Arrendatario, as: 'arrendatario' }
      ]
    });

    if (!arrendamiento) {
      return res.status(404).json({ error: 'Arrendamiento no encontrado' });
    }

    // Crear la reseña
    const Resena = require('../models/associations').Resena;
        // Calcular duración en meses desde la fecha de inicio
    const fechaInicio = new Date(arrendamiento.arrendamientoFechaInicio)
    const fechaHoy = new Date()
    const mesesRenta = Math.floor(
      (fechaHoy - fechaInicio) / (1000 * 60 * 60 * 24 * 30)
    )

    await Resena.create({
      resenaCalGen: resenaCalGen || 0,
      resenaCalSerBasic: resenaCalSerBasic || null,
      resenaCalSerComEnt: resenaCalSerComEnt || null,
      resenaCalSerAdicio: resenaCalSerAdicio || null,
      resenaDescrip: resenaDescrip || '',
      resenaSentimiento: (resenaDescrip && resenaDescrip !== 'Sin comentarios') ? analizarSentimiento(resenaDescrip) : null,
      resenaDuracionRenta: mesesRenta,  // ← agregar esto
      resenaFechaCreacion: new Date(),
      propiedad_idPropiedad: arrendamiento.propiedad_idPropiedad,
      arrendatario_idArrendatario: arrendamiento.arrendatario_idArrendatario
    })

    // Marcar que el estudiante finalizó
    await arrendamiento.update({ arrendamientoValEstudiante: 1 });

    // Si el arrendador ya finalizó, eliminar arrendamiento
    if (arrendamiento.arrendamientoValArrendador === 1) {
      await arrendamiento.destroy();
      return res.json({ 
        message: 'Arrendamiento finalizado y eliminado exitosamente', 
        eliminado: true,
        esperando: false
      });
    }

    res.json({ 
      message: 'Has finalizado tu arrendamiento. Esperando confirmación del arrendador.', 
      eliminado: false,
      esperando: true
    });

  } catch (error) {
    console.error('Error al finalizar arrendamiento (estudiante):', error);
    res.status(500).json({ error: 'Error al finalizar arrendamiento', details: error.message });
  }
});

// =====================================================
// RUTA GENÉRICA POR ID
// =====================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const arrendamiento = await Arrendamiento.findByPk(id, {
      include: [
        {
          model: Propiedad,
          as: 'propiedad',
          attributes: ['idPropiedad', 'propiedadTitulo', 'propiedadTipo', 'propiedadLugares', 'propiedadPrecio'],
          include: [
            {
              model: require('../models/associations').Servicio, 
              as: 'servicios',                                   
              attributes: ['idServicio', 'servicioNombre', 'servicioCategoria'],   
              required: false                                    
            },
            {
              model: Direccion,
              as: 'direccion',
              attributes: ['direccionCalle', 'direccionNumExt', 'direccionNumInt'],
              include: [{ model: CP, as: 'cp', attributes: ['d_codigo', 'd_asenta', 'D_mnpio', 'd_estado'] }]
            }
          ]
        },
        {
          model: Arrendatario,
          as: 'arrendatario',
          attributes: ['idArrendatario', 'arrendatarioBoleta', 'arrendatarioUser'],
          include: [{ model: Usuario, as: 'usuario', attributes: ['idUsuario', 'usuarioNom', 'usuarioApePat', 'usuarioApeMat', 'usuarioCorreo', 'usuarioTel'] }]
        }
      ]
    });
    if (!arrendamiento) return res.status(404).json({ error: 'Arrendamiento no encontrado' });
    res.json(arrendamiento);
  } catch (error) {
    console.error('Error al obtener arrendamiento:', error);
    res.status(500).json({ error: 'Error al obtener arrendamiento' });
  }
});

// =====================================================
// CREAR ARRENDAMIENTO
// =====================================================

router.post('/', async (req, res) => {
  try {
    const { arrendamientoFechaInicio, arrendamientoRenta, arrendamientoDescrip, arrendatario_idArrendatario, propiedad_idPropiedad } = req.body;

    const arrendamientoExistente = await Arrendamiento.findOne({
      where: { arrendatario_idArrendatario, arrendamientoValArrendador: 0 }
    });
    if (arrendamientoExistente) {
      return res.status(400).json({ error: 'El arrendatario ya tiene un arrendamiento activo. No puede estar ligado a más de un arrendamiento al mismo tiempo.' });
    }

    if (arrendamientoFechaInicio) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaInicio = new Date(arrendamientoFechaInicio + 'T00:00:00');
      fechaInicio.setHours(0, 0, 0, 0);
      if (fechaInicio < hoy) {
        return res.status(400).json({ error: 'La fecha de inicio no puede ser una fecha pasada' });
      }
    }

    const propiedad = await Propiedad.findByPk(propiedad_idPropiedad);
    if (!propiedad) return res.status(404).json({ error: 'Propiedad no encontrada' });

    const arrendamientosActivos = await Arrendamiento.count({
      where: { propiedad_idPropiedad }
    });
    if (arrendamientosActivos >= propiedad.propiedadLugares) {
      return res.status(400).json({ error: `La propiedad no tiene lugares disponibles. Lugares: ${propiedad.propiedadLugares}, Ocupados: ${arrendamientosActivos}` });
    }

    const nuevoArrendamiento = await Arrendamiento.create({
      arrendamientoFechaInicio: arrendamientoFechaInicio || new Date(),
      arrendamientoRenta,
      arrendamientoDescrip,
      arrendamientoValEstudiante: 0,
      arrendamientoValArrendador: 0,
      arrendatario_idArrendatario,
      propiedad_idPropiedad
    });

    res.status(201).json({ message: 'Arrendamiento creado exitosamente', arrendamiento: nuevoArrendamiento });
  } catch (error) {
    console.error('Error al crear arrendamiento:', error);
    res.status(500).json({ error: 'Error al crear arrendamiento' });
  }
});

// =====================================================
// FINALIZAR ARRENDAMIENTO
// =====================================================

router.put('/:id/finalizar', async (req, res) => {
  try {
    const { id } = req.params;
    const arrendamiento = await Arrendamiento.findByPk(id);
    if (!arrendamiento) return res.status(404).json({ error: 'Arrendamiento no encontrado' });

    await arrendamiento.update({ arrendamientoValArrendador: 1 });

    if (arrendamiento.arrendamientoValEstudiante === 1) {
      await arrendamiento.destroy();
      return res.json({ message: 'Arrendamiento finalizado y eliminado exitosamente', eliminado: true });
    }

    res.json({ message: 'Has finalizado el arrendamiento. Esperando confirmación del estudiante.', eliminado: false });
  } catch (error) {
    console.error('Error al finalizar arrendamiento:', error);
    res.status(500).json({ error: 'Error al finalizar arrendamiento' });
  }
});

module.exports = router;