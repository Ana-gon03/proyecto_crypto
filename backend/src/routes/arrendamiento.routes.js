const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { Arrendamiento, Arrendatario, Usuario, Propiedad, Direccion, CP, Arrendador } = require('../models/associations');
const { Op } = require('sequelize');

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
    const AZUL       = '#1a3a5c';
    const AZUL_MED   = '#2e6da4';
    const GRIS       = '#555555';
    const NEGRO      = '#1e1e1e';
    const ML         = 50;
    const MR         = 545;
    const ANCHO      = MR - ML;

    const doc = new PDFDocument({ size: 'A4', margin: ML, bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=contrato_arrendamiento_${id}.pdf`);
    doc.pipe(res);

    // ── HELPERS ──────────────────────────────────────────────────────────────
    const seccion = (num, titulo) => {
      doc.moveDown(0.4);
      const y = doc.y;
      doc.save().rect(ML - 8, y - 3, ANCHO + 16, 18).fill(AZUL).restore();
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff')
         .text(`${num}. ${titulo}`, ML, y + 1, { width: ANCHO });
      doc.fillColor(NEGRO);
      doc.moveDown(0.55);
    };

    const fila = (etiqueta, valor) => {
      const y = doc.y;
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GRIS)
         .text(etiqueta + ':', ML, y, { width: 145, continued: false });
      doc.fontSize(8.5).font('Helvetica').fillColor(NEGRO)
         .text(String(valor || '—'), ML + 150, y, { width: ANCHO - 150 });
      doc.moveDown(0.2);
    };

    // ── ENCABEZADO ───────────────────────────────────────────────────────────
    doc.save().rect(0, 0, 595, 72).fill(AZUL).restore();
    doc.save().rect(0, 72, 595, 4).fill(AZUL_MED).restore();

    doc.fontSize(17).font('Helvetica-Bold').fillColor('#ffffff')
       .text('CONTRATO DE ARRENDAMIENTO', ML, 16, { align: 'center', width: ANCHO });
    doc.fontSize(8.5).font('Helvetica').fillColor('#a8c8e8')
       .text('Burroomies  ·  Plataforma de Arrendamiento para Estudiantes del IPN', ML, 44, { align: 'center', width: ANCHO });

    doc.fillColor(NEGRO);
    doc.moveDown(2.6);

    // Badge número de contrato
    const numContrato = `ARR-${String(id).padStart(4, '0')}`;
    const yBadge = doc.y;
    doc.save().roundedRect(ML, yBadge, 150, 20, 4).fill(AZUL_MED).restore();
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
       .text(`N.° Contrato: ${numContrato}`, ML + 7, yBadge + 5, { width: 136 });
    doc.fontSize(8).font('Helvetica').fillColor(GRIS)
       .text(`Generado: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}`, ML + 160, yBadge + 6, { width: ANCHO - 160 });
    doc.fillColor(NEGRO);
    doc.moveDown(1.6);

    // ── 1. DATOS DEL CONTRATO ────────────────────────────────────────────────
    seccion('1', 'DATOS DEL CONTRATO');
    const fechaInicio = new Date(arrendamiento.arrendamientoFechaInicio);
    const diasEnRenta = Math.floor((new Date() - fechaInicio) / (1000 * 60 * 60 * 24));
    const mesesEnRenta = Math.floor(diasEnRenta / 30);
    const diasRest = diasEnRenta % 30;
    const tiempoRenta = mesesEnRenta > 0
      ? `${mesesEnRenta} mes(es)${diasRest > 0 ? ` y ${diasRest} día(s)` : ''}`
      : `${diasEnRenta} día(s)`;
    fila('Número de contrato', numContrato);
    fila('Fecha de inicio', fechaInicio.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }));
    fila('Tiempo en renta', `${tiempoRenta} (${diasEnRenta} días)`);
    const tipoPrecio = propiedad.propiedadPrecioPor === 'Propiedad' ? ' (Propiedad completa)' :
                      propiedad.propiedadPrecioPor === 'Persona' ? ' (Por persona)' :
                      propiedad.propiedadPrecioPor === 'Habitación' ? ' (Por Habitación)' : '';
    fila('Renta mensual', `$${arrendamiento.arrendamientoRenta} MXN${tipoPrecio}`);
    fila('Descripción', arrendamiento.arrendamientoDescrip || 'Sin descripción adicional');

    // ── 2. DATOS DEL ARRENDADOR ──────────────────────────────────────────────
    seccion('2', 'DATOS DEL ARRENDADOR');
    const nomArrendador = `${arrendador.usuario.usuarioNom} ${arrendador.usuario.usuarioApePat} ${arrendador.usuario.usuarioApeMat || ''}`.trim();
    fila('Nombre completo', nomArrendador);
    fila('Correo electrónico', arrendador.usuario.usuarioCorreo);
    fila('Teléfono', arrendador.usuario.usuarioTel);
    fila('RFC', arrendador.arrendadorRFC);

    // ── 3. DATOS DEL ARRENDATARIO ────────────────────────────────────────────
    seccion('3', 'DATOS DEL ARRENDATARIO');
    const at = arrendamiento.arrendatario.usuario;
    const nomArrendatario = `${at.usuarioNom} ${at.usuarioApePat} ${at.usuarioApeMat || ''}`.trim();
    fila('Nombre completo', nomArrendatario);
    fila('Correo electrónico', at.usuarioCorreo);
    fila('Teléfono', at.usuarioTel);
    fila('Username', arrendamiento.arrendatario.arrendatarioUser);

    // ── 4. DATOS DE LA PROPIEDAD ─────────────────────────────────────────────
    seccion('4', 'DATOS DE LA PROPIEDAD');
    const dir = propiedad.direccion;
    let direccionCompleta = 'No disponible';
    if (dir) {
      direccionCompleta = `${dir.direccionCalle} #${dir.direccionNumExt}`;
      if (dir.direccionNumInt) direccionCompleta += ` Int. ${dir.direccionNumInt}`;
      if (dir.cp) direccionCompleta += `, Col. ${dir.cp.d_asenta}, ${dir.cp.D_mnpio}, ${dir.cp.d_estado}, CP ${dir.cp.d_codigo}`;
    }
    fila('Título', propiedad.propiedadTitulo);
    fila('Tipo de inmueble', propiedad.propiedadTipo);
    fila('Dirección', direccionCompleta);
    fila('Lugares totales', propiedad.propiedadLugares);

    // ── 5. CLÁUSULAS ─────────────────────────────────────────────────────────
    seccion('5', 'CLÁUSULAS DEL CONTRATO');

    const clausulas = [
      {
        titulo: 'PRIMERA. — OBJETO DEL CONTRATO',
        texto: 'El ARRENDADOR cede en arrendamiento al ARRENDATARIO el inmueble descrito en la Sección 4, para uso exclusivo como vivienda estudiantil. Queda estrictamente prohibido cualquier otro uso sin autorización previa y por escrito del ARRENDADOR.'
      },
      {
        titulo: 'SEGUNDA. — DURACIÓN',
        texto: 'El presente contrato tendrá una duración indefinida a partir de la fecha de inicio establecida en la plataforma Burroomies. Cualquiera de las partes podrá darlo por terminado, requiriéndose la confirmación de ambas partes para su finalización definitiva.'
      },
      {
        titulo: 'TERCERA. — RENTA Y FORMA DE PAGO',
        texto: `La renta mensual acordada es de $${arrendamiento.arrendamientoRenta} MXN. El pago deberá realizarse de forma puntual conforme a los términos acordados entre las partes. Burroomies no interviene en las transacciones económicas entre arrendador y arrendatario.`
      },
      {
        titulo: 'CUARTA. — DEPÓSITO EN GARANTÍA',
        texto: 'Las partes podrán acordar un depósito en garantía equivalente a uno o más meses de renta, el cual será devuelto al ARRENDATARIO al término del contrato, descontando los daños comprobados al inmueble si los hubiere.'
      },
      {
        titulo: 'QUINTA. — USO DEL INMUEBLE',
        texto: 'El ARRENDATARIO se obliga a utilizar el inmueble únicamente como vivienda habitual para fines académicos. Queda prohibido subarrendar, ceder o traspasar, total o parcialmente, el uso del inmueble sin autorización expresa y por escrito del ARRENDADOR.'
      },
      {
        titulo: 'SEXTA. — CONSERVACIÓN Y MANTENIMIENTO',
        texto: 'El ARRENDATARIO se obliga a conservar el inmueble en buen estado, realizando las reparaciones menores derivadas del uso cotidiano. Las reparaciones estructurales o de mayor envergadura serán responsabilidad del ARRENDADOR y deberán atenderse en un plazo razonable.'
      },
      {
        titulo: 'SÉPTIMA. — SERVICIOS E INSTALACIONES',
        texto: 'Los servicios básicos incluidos en el arrendamiento (agua, luz, gas, internet, entre otros) serán los expresamente pactados entre las partes al momento de celebrar este contrato. Cualquier servicio no acordado será cubierto directamente por el ARRENDATARIO.'
      },
      {
        titulo: 'OCTAVA. — VISITAS Y CONVIVENCIA',
        texto: 'El ARRENDATARIO podrá recibir visitas en el inmueble siempre que no afecten la tranquilidad de los demás ocupantes ni del vecindario. Las visitas nocturnas prolongadas deberán ser acordadas con el ARRENDADOR, respetando en todo momento el reglamento interno del inmueble si lo hubiere.'
      },
      {
        titulo: 'NOVENA. — MODIFICACIONES AL INMUEBLE',
        texto: 'El ARRENDATARIO no podrá realizar modificaciones, remodelaciones ni obras de ningún tipo en el inmueble sin contar con el consentimiento previo y por escrito del ARRENDADOR. Las mejoras realizadas sin autorización quedarán en beneficio del inmueble sin derecho a reembolso.'
      },
      {
        titulo: 'DÉCIMA. — ACCESO DEL ARRENDADOR',
        texto: 'El ARRENDADOR podrá acceder al inmueble para realizar inspecciones o reparaciones, notificando al ARRENDATARIO con al menos 24 horas de anticipación, salvo en casos de emergencia que pongan en riesgo la integridad del inmueble o de sus ocupantes.'
      },
      {
        titulo: 'DÉCIMA PRIMERA. — TERMINACIÓN ANTICIPADA',
        texto: 'Cualquiera de las partes podrá solicitar la terminación anticipada del contrato mediante la plataforma Burroomies, con un aviso mínimo de 15 días naturales. La terminación se formalizará una vez que ambas partes la confirmen en la plataforma.'
      },
      {
        titulo: 'DÉCIMA SEGUNDA. — RESPONSABILIDAD',
        texto: 'El ARRENDATARIO será responsable de los daños causados al inmueble por negligencia, mal uso o descuido. El ARRENDADOR garantizará que el inmueble se encuentre en condiciones habitables al inicio del contrato y durante toda su vigencia.'
      }
    ];

    clausulas.forEach(clausula => {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(AZUL_MED)
         .text(clausula.titulo, ML, doc.y, { width: ANCHO });
      doc.moveDown(0.12);
      doc.fontSize(8).font('Helvetica').fillColor(NEGRO)
         .text(clausula.texto, ML, doc.y, { align: 'justify', width: ANCHO });
      doc.moveDown(0.3);
    });

    // ── FIRMAS ───────────────────────────────────────────────────────────────
    if (doc.y > 600) doc.addPage();
    doc.moveDown(0.5);

    seccion('6', 'FIRMAS DE CONFORMIDAD');

    doc.moveDown(0.3);
    doc.fontSize(8.5).font('Helvetica').fillColor(GRIS)
       .text(
         `Leído y aceptado por ambas partes en la Ciudad de México, a los ${new Date().getDate()} días del mes de ${new Date().toLocaleDateString('es-MX', { month: 'long' })} de ${new Date().getFullYear()}.`,
         ML, doc.y, { align: 'justify', width: ANCHO }
       );

    doc.moveDown(2.5); // espacio para firmar a mano

    const mitad = ML + ANCHO / 2;
    const anchoFirma = (ANCHO / 2) - 20;

    // Línea arrendador
    doc.save().moveTo(ML, doc.y).lineTo(ML + anchoFirma, doc.y).strokeColor('#aaaaaa').lineWidth(0.8).stroke().restore();
    // Línea arrendatario
    doc.save().moveTo(mitad + 10, doc.y).lineTo(mitad + 10 + anchoFirma, doc.y).strokeColor('#aaaaaa').lineWidth(0.8).stroke().restore();

    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica-Bold').fillColor(NEGRO)
       .text('EL ARRENDADOR', ML, doc.y, { width: anchoFirma, align: 'center' });
    doc.fontSize(9).font('Helvetica-Bold').fillColor(NEGRO)
       .text('EL ARRENDATARIO', mitad + 10, doc.y - doc.currentLineHeight(), { width: anchoFirma, align: 'center' });

    doc.moveDown(0.2);

    doc.fontSize(8).font('Helvetica').fillColor(GRIS)
       .text(nomArrendador, ML, doc.y, { width: anchoFirma, align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor(GRIS)
       .text(nomArrendatario, mitad + 10, doc.y - doc.currentLineHeight(), { width: anchoFirma, align: 'center' });

    doc.moveDown(1.5); // espacio para huella / sello

    // Línea testigo (centrada)
    const anchoTestigo = 180;
    const xTestigo = ML + (ANCHO / 2) - (anchoTestigo / 2);
    doc.save().moveTo(xTestigo, doc.y).lineTo(xTestigo + anchoTestigo, doc.y).strokeColor('#aaaaaa').lineWidth(0.8).stroke().restore();
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(NEGRO)
       .text('TESTIGO', xTestigo, doc.y, { width: anchoTestigo, align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(8).font('Helvetica').fillColor(GRIS)
       .text('Nombre y firma del testigo', xTestigo, doc.y, { width: anchoTestigo, align: 'center' });

    // ── AVISO LEGAL ──────────────────────────────────────────────────────────
    doc.moveDown(1);
    doc.save().moveTo(ML, doc.y).lineTo(MR, doc.y).strokeColor('#cccccc').lineWidth(0.8).stroke().restore();
    doc.moveDown(0.4);

    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(AZUL)
       .text('AVISO IMPORTANTE:', ML, doc.y, { align: 'center', width: ANCHO });
    doc.moveDown(0.25);
    doc.fontSize(7.5).font('Helvetica-Oblique').fillColor(GRIS)
       .text(
         'Este documento es generado automáticamente por la plataforma Burroomies y tiene carácter meramente INFORMATIVO. ' +
         'NO constituye un documento legal vinculante ni reemplaza un contrato formal de arrendamiento ante las autoridades competentes. ' +
         'Burroomies no se hace responsable de las negociaciones, acuerdos o disputas que surjan entre las partes. ' +
         'Se recomienda a ambas partes consultar con un profesional legal para la formalización de su relación contractual.',
         ML, doc.y, { align: 'justify', width: ANCHO }
       );

    doc.moveDown(0.4);
    doc.fontSize(7).font('Helvetica').fillColor('#888888')
       .text(
         `Documento generado el ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')} - Burroomies © ${new Date().getFullYear()}`,
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
      resenaDescrip,
      resenaSentimiento 
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
      resenaSentimiento: resenaSentimiento || null,
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
              model: require('../models/associations').Servicio, // ← nuevo
              as: 'servicios',                                   // ← nuevo
              attributes: ['idServicio', 'servicioCategoria'],   // ← nuevo
              required: false                                    // ← nuevo
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