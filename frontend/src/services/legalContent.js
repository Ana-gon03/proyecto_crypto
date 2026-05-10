// ─── legalContent.js ────────────────────────────────────────────────────────
// Fuente única de verdad para el contenido legal.
// Importado tanto por LegalModal (registro) como por las páginas legales.

export const AVISO_PRIVACIDAD = {
  titulo: 'Aviso de Privacidad',
  // Secciones comunes a ambos roles
  comun: [
    {
      subtitulo: '1. Identidad del Responsable',
      texto: `RentIPN (en adelante "el Sistema") es responsable del tratamiento de sus datos personales.
Para ejercer sus derechos o resolver dudas puede contactarnos en: privacidad@rentipn.mx`
    },
    {
      subtitulo: '3. Finalidades del Tratamiento',
      texto: `Sus datos se utilizan para:
• Primarias (necesarias para el servicio): crear y gestionar su cuenta, verificar su identidad, facilitar la publicación y búsqueda de arrendamientos, y enviar comunicaciones relacionadas con el uso del sistema.
• Secundarias (opcionales): enviar avisos sobre nuevas funcionalidades o actualizaciones del sistema.`
    },
    {
      subtitulo: '4. Transferencia de Datos a Terceros',
      texto: `Sus datos podrán compartirse con:
• Proveedores tecnológicos que nos prestan servicios de infraestructura (alojamiento, procesamiento de documentos), bajo acuerdos de confidencialidad.
• No realizamos transferencias con fines comerciales a terceros ajenos al sistema. No vendemos sus datos personales.`
    },
    {
      subtitulo: '5. Plazo de Conservación',
      texto: `Sus datos se conservarán mientras su cuenta esté activa. Al eliminar su cuenta, los datos personales serán suprimidos en un plazo máximo de 30 días naturales, salvo obligación legal de retención (por ejemplo, 7 años para registros de transacciones con relevancia fiscal).`
    },
    {
      subtitulo: '6. Derechos ARCO',
      texto: `Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse (derechos ARCO) al tratamiento de sus datos personales. Para ejercerlos envíe un correo a privacidad@rentipn.mx indicando: nombre completo, derecho que desea ejercer y descripción del dato involucrado. Responderemos en un plazo máximo de 20 días hábiles.`
    },
    {
      subtitulo: '7. Transferencias Internacionales',
      texto: `Algunos de nuestros proveedores de infraestructura pueden operar servidores fuera de México. En dichos casos exigimos contractualmente un nivel de protección equivalente al establecido por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).`
    },
    {
      subtitulo: '8. Cambios al Aviso',
      texto: `Cualquier modificación a este aviso será notificada a través del correo registrado en su cuenta o mediante un aviso visible en el sistema al iniciar sesión.`
    }
  ],
  // Sección 2 diferente por rol
  datosPorRol: {
    estudiante: {
      subtitulo: '2. Datos Personales Recabados',
      texto: `Como estudiante, recabamos los siguientes datos personales:
• Datos de identificación: nombre completo, CURP, fecha de nacimiento.
• Datos de contacto: correo electrónico, número de teléfono.
• Datos académicos: boleta, carrera y unidad académica del IPN, constancia de estudios (PDF).
• Datos de autenticación: nombre de usuario y contraseña (almacenada con cifrado bcrypt).`
    },
    arrendador: {
      subtitulo: '2. Datos Personales Recabados',
      texto: `Como arrendador, recabamos los siguientes datos personales:
• Datos de identificación: nombre completo, CURP, fecha de nacimiento, RFC.
• Datos de contacto: correo electrónico, número de teléfono.
• Datos de domicilio: calle, número exterior/interior, colonia, municipio, estado y código postal.
• Documento CURP en formato PDF para verificación de identidad.
• Datos de autenticación: contraseña (almacenada con cifrado bcrypt).`
    }
  }
}

export const TERMINOS_USO = {
  titulo: 'Términos y Condiciones de Uso',
  // Secciones comunes
  comun: [
    {
      subtitulo: '1. Identidad y Objeto',
      texto: `RentIPN es una plataforma digital que facilita el contacto entre estudiantes del Instituto Politécnico Nacional (IPN) que buscan arrendamiento y personas físicas que desean ofrecer inmuebles en renta. No somos parte de ningún contrato de arrendamiento.`
    },
    {
      subtitulo: '3. Uso Permitido',
      texto: `El sistema debe usarse exclusivamente para:
• Publicar o buscar opciones de arrendamiento habitacional.
• Contactar a las partes interesadas de forma respetuosa.
Queda prohibido publicar información falsa, usar el sistema para actividades ilícitas, acosar a otros usuarios o intentar vulnerar la seguridad de la plataforma.`
    },
    {
      subtitulo: '4. Propiedad Intelectual',
      texto: `El diseño, código fuente, logotipos y contenidos del sistema son propiedad de RentIPN o de sus licenciantes. No se permite su reproducción, distribución o modificación sin autorización expresa por escrito.`
    },
    {
      subtitulo: '5. Limitación de Responsabilidad',
      texto: `RentIPN actúa como intermediario tecnológico. No nos hacemos responsables de: la veracidad de los anuncios publicados por los usuarios, los acuerdos económicos o legales celebrados entre arrendadores y arrendatarios, ni de daños derivados del uso indebido de la plataforma por parte de terceros.`
    },
    {
      subtitulo: '6. Suspensión y Cancelación',
      texto: `Nos reservamos el derecho de suspender o cancelar cuentas que incumplan estos términos, sin previo aviso en casos de uso fraudulento o ilegal.`
    },
    {
      subtitulo: '7. Legislación Aplicable',
      texto: `Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia las partes se someten a la jurisdicción de los tribunales competentes de la Ciudad de México.`
    },
    {
      subtitulo: '8. Contacto',
      texto: `Para reportes, quejas o aclaraciones: contacto@rentipn.mx`
    }
  ],
  // Sección 2 diferente por rol
  condicionesPorRol: {
    estudiante: {
      subtitulo: '2. Condiciones de Acceso como Estudiante',
      texto: `Para registrarse como Estudiante debe:
• Ser alumno activo del Instituto Politécnico Nacional (IPN).
• Tener al menos 17 años de edad.
• Proporcionar una boleta escolar válida y, en su caso, una constancia de estudios vigente para verificar su identidad.
• Si no verifica su identidad al momento del registro, tendrá un plazo de 2 meses para hacerlo. De lo contrario, su cuenta será eliminada automáticamente.
El acceso es estrictamente personal; compartir credenciales está prohibido.`
    },
    arrendador: {
      subtitulo: '2. Condiciones de Acceso como Arrendador',
      texto: `Para registrarse como Arrendador debe:
• Ser mayor de 18 años de edad.
• Proporcionar un documento CURP válido en formato PDF para verificar su identidad. Este paso es obligatorio y sin excepción.
• Contar con un RFC vigente.
• Ser propietario o contar con la facultad legal para arrendar el inmueble que publique.
El acceso es estrictamente personal; compartir credenciales está prohibido.`
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Construye el array de secciones ordenado para un rol dado
export const getAvisoPrivacidad = (rol) => {
  const secciones = [...AVISO_PRIVACIDAD.comun]
  // Insertar sección 2 en la posición correcta (después de la 1)
  secciones.splice(1, 0, AVISO_PRIVACIDAD.datosPorRol[rol])
  return { titulo: AVISO_PRIVACIDAD.titulo, contenido: secciones }
}

export const getTerminosUso = (rol) => {
  const secciones = [...TERMINOS_USO.comun]
  secciones.splice(1, 0, TERMINOS_USO.condicionesPorRol[rol])
  return { titulo: TERMINOS_USO.titulo, contenido: secciones }
}