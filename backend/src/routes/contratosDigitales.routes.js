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
