/**
 * Lógica de autenticación del portal CA.
 * Los usuarios se registran en el portal CA con sus propias credenciales.
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { usuarios } = require('./db');

async function registrar({ nombre, correo, contrasena, rol = 'usuario' }) {
  if (usuarios.buscarPorCorreo(correo)) {
    throw new Error('El correo ya está registrado en el portal CA');
  }
  const hashContra = await bcrypt.hash(contrasena, 12);
  const usuario = {
    id:          uuidv4(),
    nombre,
    correo,
    hashContra,
    rol,
    fechaRegistro: new Date().toISOString(),
  };
  usuarios.crear(usuario);
  return { id: usuario.id, nombre, correo, rol };
}

async function iniciarSesion(correo, contrasena) {
  const usuario = usuarios.buscarPorCorreo(correo);
  if (!usuario) throw new Error('Credenciales incorrectas');
  const ok = await bcrypt.compare(contrasena, usuario.hashContra);
  if (!ok) throw new Error('Credenciales incorrectas');
  return { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol };
}

function requireAuth(req, res, next) {
  if (!req.session?.usuario) {
    return res.status(401).json({ error: 'Sesión requerida' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session?.usuario || req.session.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso de administrador requerido' });
  }
  next();
}

module.exports = { registrar, iniciarSesion, requireAuth, requireAdmin };
