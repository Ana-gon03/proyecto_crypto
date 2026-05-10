// backend/src/middlewares/auth.js
// Middleware simple que extrae el userId de los headers personalizados
// (coincide con lo que envías desde el frontend)

const authMiddleware = (req, res, next) => {
  // Intenta obtener userId desde diferentes headers que usa tu frontend
  const userId = req.headers['x-user-id'] || req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: 'No autorizado. Falta identificación de usuario.' });
  }
  
  // Adjuntar el userId al objeto req para usarlo en los controladores
  req.user = { idUsuario: parseInt(userId) };
  next();
};

module.exports = authMiddleware;