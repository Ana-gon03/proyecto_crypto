/**
 * Rutas de contratos digitales con firma ECDSA.
 * Prefijo: /api/contratos-digitales
 *
 * Flujo de firma:
 *   1. POST /:idArrendamiento/iniciar  → genera PDF, guarda bytes y hash
 *   2. GET  /:idArrendamiento/pdf      → descarga PDF para revisión/firma
 *   3. POST /:idArrendamiento/firmar-arrendador   → recibe firma ECDSA del arrendador
 *   4. POST /:idArrendamiento/firmar-arrendatario → recibe firma ECDSA del arrendatario
 *   5. GET  /:idArrendamiento          → estado actual del contrato
 *   6. POST /:idArrendamiento/verificar → verificación criptográfica completa
 */

const express  = require('express');
const router   = express.Router();
const PDFDocument = require('pdfkit');
const { ContratoDigital, Arrendamiento, Arrendatario, Arrendador, Propiedad, Direccion, CP, Usuario } = require('../models/associations');
const { verificarFirmaUsuario, computarHashPDF } = require('../services/ecdsaVerifier');
const caClient = require('../services/caClient');

// ── Helper: generar buffer PDF (misma lógica que arrendamiento.routes.js) ──
async function generarPDFBuffer(arrendamiento) {
  return new Promise(async (resolve, reject) => {
    try {
      const propiedad = arrendamiento.propiedad;
      const arrendador = await Arrendador.findByPk(propiedad.arrendador_idArrendador, {
        include: [{ model: Usuario, as: 'usuario' }]
      });
      const at = arrendamiento.arrendatario.usuario;

      const NEGRO = '#000000', GRIS = '#555555', ML = 65, MR = 530, ANCHO = MR - ML, IND = ML + 18;
      const chunks = [];
      const doc = new PDFDocument({ size: 'A4', margin: ML, bufferPages: true });
      doc.on('data', c => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const tituloSeccion = (txt) => {
        doc.moveDown(0.6);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(NEGRO)
           .text(txt, ML, doc.y, { align: 'center', width: ANCHO, underline: true });
        doc.moveDown(0.5);
      };
      const clausula = (titulo, texto) => {
        if (doc.y > 680) doc.addPage();
        doc.moveDown(0.25);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(NEGRO)
           .text(titulo + ' ', ML, doc.y, { continued: true, width: ANCHO });
        doc.fontSize(9).font('Helvetica').fillColor(NEGRO)
           .text(texto, { align: 'justify', width: ANCHO });
        doc.moveDown(0.3);
      };

      const numContrato = `ARR-${String(arrendamiento.idArrendamiento).padStart(4, '0')}`;
      const fechaGen    = new Date();
      const fechaGenStr = fechaGen.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

      doc.fontSize(7.5).font('Helvetica').fillColor(GRIS).text(`N.° ${numContrato}`, ML, 55, { width: ANCHO / 2 });
      doc.fontSize(7.5).font('Helvetica').fillColor(GRIS).text(`Generado: ${fechaGenStr}`, ML + ANCHO / 2, 55, { width: ANCHO / 2, align: 'right' });
      doc.save().moveTo(ML, 68).lineTo(MR, 68).strokeColor('#000000').lineWidth(1).stroke().restore();
      doc.fontSize(14).font('Helvetica-Bold').fillColor(NEGRO).text('CONTRATO DE ARRENDAMIENTO', ML, 76, { align: 'center', width: ANCHO });
      doc.fontSize(8).font('Helvetica').fillColor(GRIS).text('Plataforma Blockhoom  –  Vivienda estudiantil IPN', ML, 98, { align: 'center', width: ANCHO });
      doc.save().moveTo(ML, 114).lineTo(MR, 114).strokeColor('#000000').lineWidth(1).stroke().restore();
      doc.y = 122;

      const nomArrendador   = `${arrendador.usuario.usuarioNom} ${arrendador.usuario.usuarioApePat} ${arrendador.usuario.usuarioApeMat || ''}`.trim();
      const nomArrendatario = `${at.usuarioNom} ${at.usuarioApePat} ${at.usuarioApeMat || ''}`.trim();

      doc.moveDown(0.4);
      doc.fontSize(9).font('Helvetica').fillColor(NEGRO)
         .text('Contrato de arrendamiento que celebran: ', ML, doc.y, { continued: true, align: 'justify', width: ANCHO });
      doc.font('Helvetica-Bold').text(`ARRENDADOR: ${nomArrendador}`, { continued: true });
      doc.font('Helvetica').text(` y ARRENDATARIO: ${nomArrendatario}.`, { align: 'justify' });
      doc.moveDown(0.5);

      tituloSeccion('CLÁUSULAS');

      const dir = propiedad.direccion;
      let direccionCompleta = 'No disponible';
      if (dir) {
        direccionCompleta = `${dir.direccionCalle} #${dir.direccionNumExt}`;
        if (dir.direccionNumInt) direccionCompleta += ` Int. ${dir.direccionNumInt}`;
        if (dir.cp) direccionCompleta += `, Col. ${dir.cp.d_asenta}, ${dir.cp.D_mnpio}, ${dir.cp.d_estado}`;
      }

      const fechaInicio = new Date(arrendamiento.arrendamientoFechaInicio);
      clausula('PRIMERA.–', `El ARRENDADOR cede en arrendamiento el inmueble ubicado en ${direccionCompleta}, denominado "${propiedad.propiedadTitulo}", para uso exclusivo como vivienda estudiantil.`);
      clausula('SEGUNDA.–', `La duración del contrato es indefinida a partir del ${fechaInicio.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}.`);
      clausula('TERCERA.–', `El ARRENDATARIO pagará $${arrendamiento.arrendamientoRenta} MXN mensuales como renta.`);
      clausula('CUARTA.–', `El ARRENDATARIO se obliga a utilizar el inmueble únicamente como vivienda habitual para fines académicos.`);
      clausula('QUINTA.–', `Queda prohibido subarrendar o traspasar el uso del inmueble sin autorización escrita del ARRENDADOR.`);

      if (doc.y > 580) doc.addPage();
      tituloSeccion('FIRMAS DIGITALES DE CONFORMIDAD');
      doc.fontSize(9).font('Helvetica').fillColor(NEGRO)
         .text('Las firmas digitales de este contrato son generadas mediante criptografía de curva elíptica ECDSA P-256, certificadas por la Entidad Certificadora Blockhome CA. Cada firma es matemáticamente verificable y garantiza la autenticidad e integridad del documento.',
           ML, doc.y, { align: 'justify', width: ANCHO });
      doc.moveDown(1);

      const mitad = ML + ANCHO / 2, anchoFirma = (ANCHO / 2) - 15;
      doc.save().moveTo(ML, doc.y).lineTo(ML + anchoFirma, doc.y).strokeColor('#000000').lineWidth(0.7).stroke().restore();
      doc.save().moveTo(mitad + 8, doc.y).lineTo(mitad + 8 + anchoFirma, doc.y).strokeColor('#000000').lineWidth(0.7).stroke().restore();
      doc.moveDown(0.3);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(NEGRO).text('EL ARRENDADOR', ML, doc.y, { width: anchoFirma, align: 'center' });
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(NEGRO).text('EL ARRENDATARIO', mitad + 8, doc.y - doc.currentLineHeight(), { width: anchoFirma, align: 'center' });
      doc.moveDown(0.25);
      doc.fontSize(8).font('Helvetica').fillColor(GRIS).text(nomArrendador, ML, doc.y, { width: anchoFirma, align: 'center' });
      doc.fontSize(8).font('Helvetica').fillColor(GRIS).text(nomArrendatario, mitad + 8, doc.y - doc.currentLineHeight(), { width: anchoFirma, align: 'center' });

      doc.moveDown(1.5);
      doc.save().moveTo(ML, doc.y).lineTo(MR, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke().restore();
      doc.moveDown(0.35);
      doc.fontSize(7).font('Helvetica').fillColor('#aaaaaa')
         .text(`Blockhoom © ${fechaGen.getFullYear()} — Documento generado: ${fechaGenStr}`, ML, doc.y, { align: 'center', width: ANCHO });

      doc.end();
    } catch (err) { reject(err); }
  });
}

// ── POST /:idArrendamiento/iniciar ─────────────────────────────────────────
// Genera el PDF, calcula su hash SHA-256, guarda todo en BD.
router.post('/:idArrendamiento/iniciar', async (req, res) => {
  try {
    const { idArrendamiento } = req.params;
    const userId = req.headers['x-user-id'];

    const existente = await ContratoDigital.findOne({ where: { arrendamiento_idArrendamiento: idArrendamiento } });
    if (existente) {
      return res.status(409).json({ error: 'El contrato digital ya fue iniciado', estado: existente.estadoFirma });
    }

    const arrendamiento = await Arrendamiento.findByPk(idArrendamiento, {
      include: [
        { model: Propiedad, as: 'propiedad', include: [{ model: Direccion, as: 'direccion', include: [{ model: CP, as: 'cp' }] }] },
        { model: Arrendatario, as: 'arrendatario', include: [{ model: Usuario, as: 'usuario' }] }
      ]
    });
    if (!arrendamiento) return res.status(404).json({ error: 'Arrendamiento no encontrado' });

    const pdfBuffer = await generarPDFBuffer(arrendamiento);
    const pdfHash   = computarHashPDF(pdfBuffer);

    await ContratoDigital.create({
      arrendamiento_idArrendamiento: idArrendamiento,
      pdfBytes:    pdfBuffer,
      pdfHash,
      estadoFirma: 'pendiente_arrendador',
      fechaCreacion: new Date(),
    });

    res.status(201).json({
      message:  'Contrato digital iniciado. El arrendador debe firmarlo primero.',
      pdfHash,
      estado:   'pendiente_arrendador',
    });
  } catch (err) {
    console.error('[Contratos] Error al iniciar:', err);
    res.status(500).json({ error: 'Error al iniciar el contrato digital' });
  }
});

// ── GET /:idArrendamiento/pdf ──────────────────────────────────────────────
// Devuelve el PDF almacenado para que el usuario lo descargue y firme.
router.get('/:idArrendamiento/pdf', async (req, res) => {
  try {
    const contrato = await ContratoDigital.findOne({
      where: { arrendamiento_idArrendamiento: req.params.idArrendamiento }
    });
    if (!contrato) return res.status(404).json({ error: 'Contrato no iniciado' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=contrato_${req.params.idArrendamiento}.pdf`);
    res.send(contrato.pdfBytes);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el PDF' });
  }
});

// ── GET /:idArrendamiento/comprobante ─────────────────────────────────────
// Genera un PDF comprobante de firmas cuando el contrato está completo.
router.get('/:idArrendamiento/comprobante', async (req, res) => {
  try {
    const contrato = await ContratoDigital.findOne({
      where: { arrendamiento_idArrendamiento: req.params.idArrendamiento }
    });
    if (!contrato) return res.status(404).json({ error: 'Contrato no encontrado' });
    if (contrato.estadoFirma !== 'completo') {
      return res.status(400).json({ error: 'El contrato aún no ha sido firmado por ambas partes' });
    }

    const arrendamiento = await Arrendamiento.findByPk(req.params.idArrendamiento, {
      include: [
        { model: Propiedad, as: 'propiedad' },
        { model: Arrendatario, as: 'arrendatario', include: [{ model: Usuario, as: 'usuario' }] }
      ]
    });
    const arrendador = await Arrendador.findByPk(arrendamiento.propiedad.arrendador_idArrendador, {
      include: [{ model: Usuario, as: 'usuario' }]
    });

    const nomArrendador   = `${arrendador.usuario.usuarioNom} ${arrendador.usuario.usuarioApePat} ${arrendador.usuario.usuarioApeMat || ''}`.trim();
    const nomArrendatario = `${arrendamiento.arrendatario.usuario.usuarioNom} ${arrendamiento.arrendatario.usuario.usuarioApePat} ${arrendamiento.arrendatario.usuario.usuarioApeMat || ''}`.trim();

    const hashActual   = computarHashPDF(contrato.pdfBytes);
    const integridadOk = hashActual === contrato.pdfHash;

    const certArr    = await caClient.validarCertificado(contrato.certSerialArrendador);
    const firmaArrOk = certArr.valido
      ? verificarFirmaUsuario(contrato.pdfBytes, contrato.firmaArrendador, certArr.publicKeySpki)
      : false;

    const certAt     = await caClient.validarCertificado(contrato.certSerialArrendatario);
    const firmaAtOk  = certAt.valido
      ? verificarFirmaUsuario(contrato.pdfBytes, contrato.firmaArrendatario, certAt.publicKeySpki)
      : false;

    const todoValido = integridadOk && firmaArrOk && firmaAtOk;

    const pdfBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      const doc = new PDFDocument({ size: 'A4', margin: 65, bufferPages: true });
      doc.on('data', c => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const ML = 65, MR = 530, ANCHO = MR - ML;
      const NEGRO = '#000000', GRIS = '#555555', GRIS_CLARO = '#888888';
      const VERDE = '#15803d', ROJO = '#dc2626';
      const numContrato = `ARR-${String(req.params.idArrendamiento).padStart(4, '0')}`;
      const ahora    = new Date();
      const fechaStr = ahora.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
      const horaStr  = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const seccion = (titulo) => {
        doc.moveDown(0.8);
        doc.save().moveTo(ML, doc.y).lineTo(MR, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke().restore();
        doc.moveDown(0.4);
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#444444')
           .text(titulo.toUpperCase(), ML, doc.y, { width: ANCHO, characterSpacing: 0.8 });
        doc.moveDown(0.5);
      };

      const fila = (label, value, colorValue) => {
        const yPos = doc.y;
        doc.fontSize(8).font('Helvetica').fillColor(GRIS_CLARO)
           .text(label, ML, yPos, { width: 165, lineBreak: false });
        doc.fontSize(8).font('Helvetica').fillColor(colorValue || NEGRO)
           .text(String(value || '—'), ML + 170, yPos, { width: ANCHO - 170 });
      };

      const checkRow = (label, ok) => {
        doc.fontSize(8).font('Helvetica').fillColor(ok ? VERDE : ROJO)
           .text(`${ok ? '[✓]' : '[✗]'}  ${label}`, ML + 10, doc.y, { width: ANCHO - 10 });
        doc.moveDown(0.35);
      };

      // Encabezado
      doc.save().rect(ML, 48, ANCHO, 32).fill('#f8f9fa').restore();
      doc.fontSize(7).font('Helvetica').fillColor(GRIS_CLARO)
         .text('BLOCKHOME CA  —  Entidad Certificadora Digital  —  IPN ESCOM TT-A046', ML, 58, { align: 'center', width: ANCHO });
      doc.save().moveTo(ML, 82).lineTo(MR, 82).strokeColor(NEGRO).lineWidth(1).stroke().restore();
      doc.y = 94;

      doc.fontSize(14).font('Helvetica-Bold').fillColor(NEGRO)
         .text('COMPROBANTE DE FIRMAS DIGITALES', ML, doc.y, { align: 'center', width: ANCHO });
      doc.moveDown(0.4);
      doc.fontSize(8.5).font('Helvetica').fillColor(GRIS)
         .text(`Contrato ${numContrato}  ·  Emitido el ${fechaStr} a las ${horaStr}`, ML, doc.y, { align: 'center', width: ANCHO });
      doc.moveDown(0.6);

      // Banner de estado general
      const estadoColor = todoValido ? VERDE : ROJO;
      const estadoLabel = todoValido ? '✓  CONTRATO ÍNTEGRO Y AUTÉNTICO' : '✗  VERIFICACIÓN FALLIDA';
      doc.save().rect(ML, doc.y, ANCHO, 24).fill(todoValido ? '#f0fdf4' : '#fef2f2').restore();
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(estadoColor)
         .text(estadoLabel, ML, doc.y + 7, { align: 'center', width: ANCHO });
      doc.y += 34;

      // Documento original
      seccion('Documento original');
      fila('No. de contrato',       numContrato);
      fila('Hash SHA-256',           contrato.pdfHash, '#1d4ed8');
      fila('Algoritmo de hash',      'SHA-256');
      fila('Integridad del documento', integridadOk
        ? 'Correcto — el documento no ha sido alterado'
        : 'ERROR — hash no coincide', integridadOk ? VERDE : ROJO);

      // Firma del arrendador
      seccion('Firma del arrendador');
      fila('Titular',                nomArrendador);
      fila('No. de serie del cert.', contrato.certSerialArrendador);
      fila('Fecha y hora de firma',  new Date(contrato.fechaFirmaArrendador).toLocaleString('es-MX'));
      fila('Algoritmo de firma',     'ECDSA P-256');
      fila('Firma ECDSA',            firmaArrOk ? 'Válida' : 'INVÁLIDA', firmaArrOk ? VERDE : ROJO);
      fila('Certificado en Blockhome CA', certArr.valido ? 'Válido y vigente' : 'Inválido o revocado', certArr.valido ? VERDE : ROJO);

      // Firma del arrendatario
      seccion('Firma del arrendatario');
      fila('Titular',                nomArrendatario);
      fila('No. de serie del cert.', contrato.certSerialArrendatario);
      fila('Fecha y hora de firma',  new Date(contrato.fechaFirmaArrendatario).toLocaleString('es-MX'));
      fila('Algoritmo de firma',     'ECDSA P-256');
      fila('Firma ECDSA',            firmaAtOk ? 'Válida' : 'INVÁLIDA', firmaAtOk ? VERDE : ROJO);
      fila('Certificado en Blockhome CA', certAt.valido ? 'Válido y vigente' : 'Inválido o revocado', certAt.valido ? VERDE : ROJO);

      // Resultado detallado
      seccion('Resultado de verificación');
      checkRow('Integridad del documento (hash SHA-256 coincide)', integridadOk);
      checkRow('Firma digital ECDSA P-256 del arrendador válida', firmaArrOk);
      checkRow('Certificado del arrendador emitido y vigente en Blockhome CA', certArr.valido);
      checkRow('Firma digital ECDSA P-256 del arrendatario válida', firmaAtOk);
      checkRow('Certificado del arrendatario emitido y vigente en Blockhome CA', certAt.valido);

      // Pie
      doc.moveDown(1.2);
      doc.save().moveTo(ML, doc.y).lineTo(MR, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke().restore();
      doc.moveDown(0.4);
      doc.fontSize(7).font('Helvetica').fillColor('#aaaaaa')
         .text('Este comprobante fue generado automáticamente por la plataforma Blockhome. No requiere sello ni firma adicional.', ML, doc.y, { align: 'center', width: ANCHO });
      doc.moveDown(0.3);
      doc.fontSize(7).font('Helvetica').fillColor('#aaaaaa')
         .text(`Blockhome © ${ahora.getFullYear()} — IPN ESCOM TT-A046 — Documento generado: ${fechaStr}`, ML, doc.y, { align: 'center', width: ANCHO });

      doc.end();
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=comprobante_firmas_${req.params.idArrendamiento}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[Contratos] Error al generar comprobante:', err);
    res.status(500).json({ error: 'Error al generar el comprobante' });
  }
});

// ── GET /:idArrendamiento ──────────────────────────────────────────────────
router.get('/:idArrendamiento', async (req, res) => {
  try {
    const contrato = await ContratoDigital.findOne({
      where: { arrendamiento_idArrendamiento: req.params.idArrendamiento },
      attributes: { exclude: ['pdfBytes'] }
    });
    if (!contrato) return res.status(404).json({ error: 'Contrato no iniciado' });
    res.json(contrato);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el contrato' });
  }
});

// ── POST /:idArrendamiento/firmar-arrendador ───────────────────────────────
// Body: { firmaBase64, certSerial }
router.post('/:idArrendamiento/firmar-arrendador', async (req, res) => {
  try {
    const { idArrendamiento } = req.params;
    const { firmaBase64, certSerial } = req.body;

    if (!firmaBase64 || !certSerial) {
      return res.status(400).json({ error: 'Se requieren firmaBase64 y certSerial' });
    }

    const contrato = await ContratoDigital.findOne({
      where: { arrendamiento_idArrendamiento: idArrendamiento }
    });
    if (!contrato) return res.status(404).json({ error: 'Contrato no iniciado' });
    if (contrato.estadoFirma !== 'pendiente_arrendador') {
      return res.status(409).json({ error: `Estado actual: ${contrato.estadoFirma}` });
    }

    // Validar certificado en la CA
    const validacion = await caClient.validarCertificado(certSerial);
    if (!validacion.valido) {
      return res.status(400).json({ error: `Certificado inválido: ${validacion.motivo}` });
    }

    // Verificar firma ECDSA
    const publicKeySpki = validacion.publicKeySpki;
    const esValida = verificarFirmaUsuario(contrato.pdfBytes, firmaBase64, publicKeySpki);
    if (!esValida) {
      return res.status(400).json({ error: 'La firma ECDSA no es válida para este documento' });
    }

    await contrato.update({
      firmaArrendador:     firmaBase64,
      certSerialArrendador: certSerial,
      estadoFirma:         'pendiente_arrendatario',
      fechaFirmaArrendador: new Date(),
    });

    res.json({ message: 'Firma del arrendador registrada. Ahora el arrendatario debe firmar.', estado: 'pendiente_arrendatario' });
  } catch (err) {
    console.error('[Contratos] Error al firmar arrendador:', err);
    res.status(500).json({ error: 'Error al procesar la firma' });
  }
});

// ── POST /:idArrendamiento/firmar-arrendatario ────────────────────────────
// Body: { firmaBase64, certSerial }
router.post('/:idArrendamiento/firmar-arrendatario', async (req, res) => {
  try {
    const { idArrendamiento } = req.params;
    const { firmaBase64, certSerial } = req.body;

    if (!firmaBase64 || !certSerial) {
      return res.status(400).json({ error: 'Se requieren firmaBase64 y certSerial' });
    }

    const contrato = await ContratoDigital.findOne({
      where: { arrendamiento_idArrendamiento: idArrendamiento }
    });
    if (!contrato) return res.status(404).json({ error: 'Contrato no iniciado' });
    if (contrato.estadoFirma !== 'pendiente_arrendatario') {
      return res.status(409).json({ error: `Estado actual: ${contrato.estadoFirma}` });
    }

    const validacion = await caClient.validarCertificado(certSerial);
    if (!validacion.valido) {
      return res.status(400).json({ error: `Certificado inválido: ${validacion.motivo}` });
    }

    const publicKeySpki = validacion.publicKeySpki;
    const esValida = verificarFirmaUsuario(contrato.pdfBytes, firmaBase64, publicKeySpki);
    if (!esValida) {
      return res.status(400).json({ error: 'La firma ECDSA no es válida para este documento' });
    }

    await contrato.update({
      firmaArrendatario:     firmaBase64,
      certSerialArrendatario: certSerial,
      estadoFirma:            'completo',
      fechaFirmaArrendatario: new Date(),
    });

    res.json({ message: 'Contrato digital completamente firmado por ambas partes.', estado: 'completo' });
  } catch (err) {
    console.error('[Contratos] Error al firmar arrendatario:', err);
    res.status(500).json({ error: 'Error al procesar la firma' });
  }
});

// ── POST /:idArrendamiento/verificar ──────────────────────────────────────
// Verificación criptográfica completa del contrato.
router.post('/:idArrendamiento/verificar', async (req, res) => {
  try {
    const contrato = await ContratoDigital.findOne({
      where: { arrendamiento_idArrendamiento: req.params.idArrendamiento }
    });
    if (!contrato) return res.status(404).json({ error: 'Contrato no encontrado' });
    if (contrato.estadoFirma !== 'completo') {
      return res.status(400).json({ error: 'El contrato no tiene ambas firmas aún' });
    }

    // Verificar integridad: hash actual del PDF almacenado
    const hashActual = computarHashPDF(contrato.pdfBytes);
    const integridadOk = hashActual === contrato.pdfHash;

    // Verificar firma del arrendador
    const certArr  = await caClient.validarCertificado(contrato.certSerialArrendador);
    const firmaArrOk = certArr.valido
      ? verificarFirmaUsuario(contrato.pdfBytes, contrato.firmaArrendador, certArr.publicKeySpki)
      : false;

    // Verificar firma del arrendatario
    const certAt   = await caClient.validarCertificado(contrato.certSerialArrendatario);
    const firmaAtOk = certAt.valido
      ? verificarFirmaUsuario(contrato.pdfBytes, contrato.firmaArrendatario, certAt.publicKeySpki)
      : false;

    const completamenteValido = integridadOk && firmaArrOk && firmaAtOk;

    res.json({
      valido: completamenteValido,
      detalle: {
        integridad:         { ok: integridadOk,  hashEsperado: contrato.pdfHash, hashActual },
        firmaArrendador:    { ok: firmaArrOk,    certValido: certArr.valido },
        firmaArrendatario:  { ok: firmaAtOk,     certValido: certAt.valido },
      },
      fechaFirmaArrendador:   contrato.fechaFirmaArrendador,
      fechaFirmaArrendatario: contrato.fechaFirmaArrendatario,
    });
  } catch (err) {
    console.error('[Contratos] Error al verificar:', err);
    res.status(500).json({ error: 'Error al verificar el contrato' });
  }
});

module.exports = router;
