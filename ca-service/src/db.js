/**
 * Registro JSON de la Entidad Certificadora.
 * Almacena: certificados emitidos + usuarios del portal CA.
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE  = path.join(DATA_DIR, 'ca-registry.json');

function init() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ certificados: [], usuarios: [] }, null, 2));
  }
}
init();

function leer() { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
function guardar(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

// ── Certificados ───────────────────────────────────────────────────────────
const certs = {
  insertar(cert) {
    const data = leer(); data.certificados.push(cert); guardar(data);
  },
  buscarPorSerial(serialHex) {
    return leer().certificados.find(c => c.serialHex === serialHex) || null;
  },
  buscarActivoPorUsuario(usuarioId) {
    return leer().certificados.find(c => c.usuarioId === usuarioId && c.estado === 'activo') || null;
  },
  buscarActivoPorCorreo(correo) {
    return leer().certificados.find(c => c.correo === correo && c.estado === 'activo') || null;
  },
  listarTodos() {
    return leer().certificados;
  },
  actualizarEstado(serialHex, estado) {
    const data = leer();
    const c = data.certificados.find(c => c.serialHex === serialHex);
    if (c) { c.estado = estado; guardar(data); }
  },
};

// ── Usuarios del portal CA ─────────────────────────────────────────────────
const usuarios = {
  crear(u) {
    const data = leer(); data.usuarios.push(u); guardar(data);
  },
  buscarPorCorreo(correo) {
    return leer().usuarios.find(u => u.correo === correo) || null;
  },
  buscarPorId(id) {
    return leer().usuarios.find(u => u.id === id) || null;
  },
  esAdmin(correo) {
    const u = leer().usuarios.find(u => u.correo === correo);
    return u?.rol === 'admin';
  },
};

module.exports = { certs, usuarios };
