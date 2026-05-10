const axios = require('axios');
const https = require('https');

const PDFCO_API_KEY = process.env.PDFCO_API_KEY;
const PDFCO_BASE = 'https://api.pdf.co/v1';

// ─────────────────────────────────────────────────────────────
// PASO 1: Obtener URL prefirmada para subir el archivo
// ─────────────────────────────────────────────────────────────
const obtenerUrlPrefirmada = async (nombreArchivo) => {
  const response = await axios.get(`${PDFCO_BASE}/file/upload/get-presigned-url`, {
    params: {
      contenttype: 'application/octet-stream',
      name: nombreArchivo
    },
    headers: { 'x-api-key': PDFCO_API_KEY }
  });

  if (response.data.error) {
    throw new Error(`Error obteniendo URL prefirmada: ${response.data.message}`);
  }

  // presignedUrl → para hacer el PUT de subida
  // url          → URL pública para usar en el siguiente paso
  return {
    presignedUrl: response.data.presignedUrl,
    publicUrl: response.data.url
  };
};

// ─────────────────────────────────────────────────────────────
// PASO 2: Subir el PDF al storage de PDF.co via PUT
// ─────────────────────────────────────────────────────────────
const subirArchivo = async (presignedUrl, pdfBuffer) => {
  await axios.put(presignedUrl, pdfBuffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': pdfBuffer.length
    }
  });
};

// ─────────────────────────────────────────────────────────────
// PASO 3: Leer el QR desde la URL pública
// ─────────────────────────────────────────────────────────────
const leerQRDesdeUrl = async (publicUrl) => {
  const response = await axios.post(`${PDFCO_BASE}/barcode/read/from/url`, {
    url: publicUrl,
    types: 'QRCode',
    pages: '',      // cadena vacía = todas las páginas
    async: false
  }, {
    headers: {
      'x-api-key': PDFCO_API_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (response.data.error) {
    throw new Error(`Error leyendo QR: ${response.data.message}`);
  }

  // La respuesta trae los barcodes en response.data.barcodes[].Value
  return response.data.barcodes || [];
};


// ─────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL: Extraer QR de un PDF (buffer)
// ─────────────────────────────────────────────────────────────
const extraerQRDePDF = async (pdfBuffer, type) => {
  try {
    console.log(`📤 Subiendo PDF a PDF.co para extraer QR (tipo: ${type})...`);

    const nombreArchivo = `doc_${Date.now()}.pdf`;

    // 1. Obtener URL prefirmada
    const { presignedUrl, publicUrl } = await obtenerUrlPrefirmada(nombreArchivo);
    console.log('✅ URL prefirmada obtenida');

    // 2. Subir el PDF
    await subirArchivo(presignedUrl, pdfBuffer);
    console.log('✅ PDF subido, URL pública:', publicUrl);

    // 3. Leer el QR
    const barcodes = await leerQRDesdeUrl(publicUrl);
    console.log(`📥 Barcodes encontrados: ${barcodes.length}`);

    if (barcodes.length === 0) {
      console.log('❌ No se encontró ningún QR en el PDF');
      return null;
    }

    // Tomar el primer QR con contenido
    const qrText = (barcodes[0].Value || '').trim();
    console.log('📌 Texto del QR extraído:', qrText);

    if (!qrText) {
      console.log('❌ El QR encontrado está vacío');
      return null;
    }

    if (type === 'constancia') {
      return await parseConstanciaDesdeURL(qrText);
    } else if (type === 'curp') {
      return parseCURPDocumento(qrText);
    }

    return null;

  } catch (error) {
    console.error('❌ Error al extraer QR:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
    return null;
  }
};


// ─────────────────────────────────────────────────────────────
// Parsear QR de documento CURP
//
// Formato del QR (texto plano separado por |):
//   MAGC030829MMNGRMA4||MAGAÑA|GARCILAZO|CAMILA XIMENA|MUJER|29/08/2003|MICHOACAN DE OCAMPO|16|
//   [0] CURP
//   [1] (vacío)
//   [2] Apellido paterno
//   [3] Apellido materno
//   [4] Nombre(s)
//   [5] Sexo
//   [6] Fecha nacimiento DD/MM/YYYY
//   [7] Estado
//   [8] Clave estado
// ─────────────────────────────────────────────────────────────
const parseCURPDocumento = (qrText) => {
  try {
    console.log('🔍 Parseando texto del QR CURP:', qrText);

    const textoLimpio = qrText.trim();
    const partes = textoLimpio.split('|').map(p => p.trim());

    let curpEncontrado = null;
    let fechaFormateada = null;

    const PATRON_CURP = /^[A-Z]{4}[0-9]{6}[A-Z]{6}[A-Z0-9]{2}$/;

    // El CURP es el primer campo
    if (partes[0] && PATRON_CURP.test(partes[0])) {
      curpEncontrado = partes[0];
      console.log('✅ CURP encontrado (por split):', curpEncontrado);
    } else {
      // Fallback: buscar con regex en todo el texto
      const curpMatch = textoLimpio.match(/[A-Z]{4}[0-9]{6}[A-Z]{6}[A-Z0-9]{2}/);
      if (curpMatch) {
        curpEncontrado = curpMatch[0];
        console.log('✅ CURP encontrado (por regex):', curpEncontrado);
      }
    }

    if (!curpEncontrado) {
      console.error('❌ No se encontró CURP en el texto:', textoLimpio);
      return null;
    }

    // Buscar fecha DD/MM/YYYY campo por campo
    const PATRON_FECHA = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    for (const parte of partes) {
      const m = parte.match(PATRON_FECHA);
      if (m) {
        fechaFormateada = `${m[3]}-${m[2]}-${m[1]}`; // → YYYY-MM-DD
        console.log('✅ Fecha encontrada:', parte, '→', fechaFormateada);
        break;
      }
    }

    // Fallback: regex en todo el texto
    if (!fechaFormateada) {
      const fechaMatch = textoLimpio.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
      if (fechaMatch) {
        fechaFormateada = `${fechaMatch[3]}-${fechaMatch[2]}-${fechaMatch[1]}`;
        console.log('✅ Fecha encontrada (regex fallback):', fechaMatch[0], '→', fechaFormateada);
      }
    }

    return {
      curp: curpEncontrado,
      fechaNacimiento: fechaFormateada  // YYYY-MM-DD
    };

  } catch (error) {
    console.error('❌ Error parseando QR CURP:', error);
    return null;
  }
};


// ─────────────────────────────────────────────────────────────
// Seguir redirecciones manualmente acumulando cookies
// El SAES/IPN usa sesiones ASP.NET que requieren cookies entre saltos
// ─────────────────────────────────────────────────────────────
const seguirRedirecciones = (urlInicial, cookiesAcumuladas = '', saltoMax = 10) => {
  return new Promise((resolve, reject) => {
    let saltos = 0;

    const HEADERS_BASE = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    };

    const hacer = (urlActual, cookies) => {
      if (saltos >= saltoMax) {
        return reject(new Error(`Demasiadas redirecciones (>${saltoMax}) en: ${urlActual}`));
      }
      saltos++;

      const urlObj = new URL(urlActual);
      const opciones = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: { ...HEADERS_BASE, ...(cookies ? { Cookie: cookies } : {}) }
      };

      console.log(`🔀 Salto ${saltos}: GET ${urlActual.substring(0, 80)}...`);

      const req = https.request(opciones, (res) => {
        // Acumular cookies de Set-Cookie
        const nuevasCookies = res.headers['set-cookie'];
        if (nuevasCookies) {
          const parseadas = nuevasCookies.map(c => c.split(';')[0]).join('; ');
          cookies = cookies ? `${cookies}; ${parseadas}` : parseadas;
          console.log('🍪 Cookies acumuladas:', cookies.substring(0, 100));
        }

        // Si es redirección, seguir
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          const location = res.headers['location'];
          if (!location) return reject(new Error('Redirección sin Location header'));

          // Resolver URL relativa si es necesario
          const siguienteUrl = location.startsWith('http')
            ? location
            : `${urlObj.protocol}//${urlObj.hostname}${location}`;

          console.log(`↪️  Redirigiendo a: ${siguienteUrl.substring(0, 80)}...`);

          // Consumir el body para liberar el socket antes del siguiente salto
          res.resume();
          return hacer(siguienteUrl, cookies);
        }

        // Respuesta final — leer el body
        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve({ html: body, statusCode: res.statusCode }));
      });

      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
      req.end();
    };

    hacer(urlInicial, cookiesAcumuladas);
  });
};


// ─────────────────────────────────────────────────────────────
// Parsear constancia desde la URL del QR (SAES/IPN)
// Validamos: "valido/válido" + "vigente", CURP y Boleta.
// ─────────────────────────────────────────────────────────────
const parseConstanciaDesdeURL = async (url) => {
  try {
    const esURL = url.startsWith('http://') || url.startsWith('https://');
    if (!esURL) {
      console.error('❌ El QR no contiene una URL válida:', url);
      return null;
    }

    console.log('🌐 Obteniendo constancia desde:', url);

    const { html, statusCode } = await seguirRedirecciones(url);
    console.log(`📥 Respuesta final HTTP ${statusCode}, tamaño: ${html.length} chars`);

    // Limpiar HTML → texto plano
    const textoPlano = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')  // quitar JS
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')    // quitar CSS
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é')
      .replace(/&iacute;/g, 'í').replace(/&oacute;/g, 'ó')
      .replace(/&uacute;/g, 'ú').replace(/&ntilde;/g, 'ñ')
      .replace(/&Aacute;/g, 'Á').replace(/&Eacute;/g, 'É')
      .replace(/&Iacute;/g, 'Í').replace(/&Oacute;/g, 'Ó')
      .replace(/&Uacute;/g, 'Ú').replace(/&Ntilde;/g, 'Ñ')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('📄 Texto plano (primeros 1000 chars):', textoPlano.substring(0, 1000));

    const textoLower = textoPlano.toLowerCase();
    const esValido  = textoLower.includes('válido') || textoLower.includes('valido');
    const esVigente = textoLower.includes('vigente');

    if (!esValido || !esVigente) {
      console.error('❌ La constancia no contiene "válido" y "vigente"');
      console.log('🔎 Texto para debug:', textoPlano.substring(0, 600));
      return null;
    }

    console.log('✅ Constancia válida y vigente');

    const curpMatch = textoPlano.match(/CURP[:\s]+([A-Z0-9]{18})/i);
    const curp      = curpMatch ? curpMatch[1].trim() : null;

    const boletaMatch = textoPlano.match(/Boleta[:\s]+(\d{5,15})/i)
                     || textoPlano.match(/N[uú]mero de control[:\s]+(\d{5,15})/i)
                     || textoPlano.match(/Matr[ií]cula[:\s]+(\d{5,15})/i);
    const boleta = boletaMatch ? boletaMatch[1].trim() : null;

    console.log('✅ CURP de constancia:', curp);
    console.log('✅ Boleta de constancia:', boleta);

    return { esValido: true, esVigente: true, url, curp, boleta };

  } catch (error) {
    console.error('❌ Error al obtener la página de constancia:', error.message);
    return null;
  }
};


// ─────────────────────────────────────────────────────────────
// Validar constancia: válido+vigente, CURP y Boleta
// ─────────────────────────────────────────────────────────────
const validarConstancia = (formData, qrData) => {
  const errores = [];

  if (!qrData) {
    errores.push('No se pudo leer la constancia. Verifica que el PDF sea el correcto.');
    return errores;
  }

  if (!qrData.esValido || !qrData.esVigente) {
    errores.push('La constancia no es válida o no está vigente según el sistema del IPN.');
    return errores;
  }

  if (qrData.curp) {
    if (formData.curp.toUpperCase() !== qrData.curp.toUpperCase()) {
      errores.push(`El CURP de la constancia (${qrData.curp}) no coincide con el ingresado (${formData.curp})`);
    }
  } else {
    console.warn('⚠️  No se extrajo el CURP de la constancia — se omite esa validación');
  }

  if (qrData.boleta) {
    if (String(formData.boleta).trim() !== String(qrData.boleta).trim()) {
      errores.push(`La boleta de la constancia (${qrData.boleta}) no coincide con la ingresada (${formData.boleta})`);
    }
  } else {
    console.warn('⚠️  No se extrajo la boleta de la constancia — se omite esa validación');
  }

  return errores;
};


// ─────────────────────────────────────────────────────────────
// Validar documento CURP: CURP y fecha de nacimiento
// ─────────────────────────────────────────────────────────────
const validarCURPDocumento = (formData, qrData) => {
  const errores = [];

  if (!qrData) {
    errores.push('No se pudo leer el QR del documento CURP. Verifica que el PDF sea el correcto.');
    return errores;
  }

  console.log('🔍 Comparando CURP  — QR:', qrData.curp, '| Form:', formData.curp);

  if (qrData.curp) {
    if (formData.curp.toUpperCase() !== qrData.curp.toUpperCase()) {
      errores.push(`El CURP del documento (${qrData.curp}) no coincide con el ingresado (${formData.curp})`);
    }
  } else {
    errores.push('No se pudo leer el CURP del documento. Intenta con otro archivo.');
    return errores;
  }

  if (qrData.fechaNacimiento && formData.fechaNacimiento) {
    console.log('🔍 Comparando fechas — QR:', qrData.fechaNacimiento, '| Form:', formData.fechaNacimiento);
    if (qrData.fechaNacimiento !== formData.fechaNacimiento) {
      errores.push(`La fecha de nacimiento del documento (${qrData.fechaNacimiento}) no coincide con la ingresada (${formData.fechaNacimiento})`);
    }
  } else if (!qrData.fechaNacimiento) {
    console.warn('⚠️  No se extrajo la fecha del QR — se omite esa validación');
  }

  return errores;
};


// ─────────────────────────────────────────────────────────────
module.exports = {
  extraerQRDePDF,
  validarConstancia,
  validarCURPDocumento
};