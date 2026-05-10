const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

// Crear carpeta si no existe
const uploadDir = path.join(__dirname, '../../uploads/fotos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar almacenamiento
const storage = multer.memoryStorage();

// Filtrar solo imágenes
const fileFilter = (req, file, cb) => {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPEG, PNG, WEBP)'), false);
  }
};

const uploadFotos = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo por foto
    files: 10 // Máximo 10 archivos
  }
});

// Middleware para comprimir y guardar imágenes
const comprimirYGuardar = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const arrendadorId = req.body.arrendadorId || 'temp';
    const timestamp = Date.now();
    const rutasGuardadas = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const nombreArchivo = `arrendador_${arrendadorId}_${timestamp}_${i + 1}.webp`;
      const rutaCompleta = path.join(uploadDir, nombreArchivo);

      // Comprimir y convertir a WebP (mucha compresión)
      await sharp(file.buffer)
        .resize(1200, 800, { // Redimensionar máximo 1200x800
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 60 }) // Comprimir a 60% calidad
        .toFile(rutaCompleta);

      rutasGuardadas.push(`/uploads/fotos/${nombreArchivo}`);
    }

    // Guardar las rutas en el request para usarlas después
    req.fotosRutas = rutasGuardadas;
    next();
  } catch (error) {
    console.error('Error al procesar imágenes:', error);
    res.status(500).json({ error: 'Error al procesar las imágenes' });
  }
};

module.exports = { uploadFotos, comprimirYGuardar };