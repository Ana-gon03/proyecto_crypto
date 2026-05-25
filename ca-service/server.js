/**
 * Entidad Certificadora Burroomies — IPN-ESCOM TT-A046
 * Puerto: 5001
 * Sirve el portal web en / y la API REST en /api/
 */

const express      = require('express');
const cors         = require('cors');
const session      = require('express-session');
const cookieParser = require('cookie-parser');
const dotenv       = require('dotenv');
const path         = require('path');
const bcrypt       = require('bcryptjs');

dotenv.config();

const { inicializarCA }  = require('./src/ca');
const { usuarios }       = require('./src/db');

const app  = express();
const PORT = process.env.PORT || 5001;

// ── Inicializar la CA ──────────────────────────────────────────────────────
inicializarCA();

// ── Crear cuenta admin por defecto si no existe ────────────────────────────
(async () => {
  const adminEmail = process.env.CA_ADMIN_EMAIL || 'admin@burroomies-ca.mx';
  const adminPass  = process.env.CA_ADMIN_PASS  || 'Admin2026CA!';
  if (!usuarios.buscarPorCorreo(adminEmail)) {
    const hash = await bcrypt.hash(adminPass, 12);
    usuarios.crear({
      id:            'admin-001',
      nombre:        'Administrador CA',
      correo:        adminEmail,
      hashContra:    hash,
      rol:           'admin',
      fechaRegistro: new Date().toISOString(),
    });
    console.log(`[CA] Admin creado: ${adminEmail}`);
  }
})();

// ── Middlewares ────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(session({
  secret:            process.env.SESSION_SECRET || 'ca_session_burroomies_2026',
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: false, httpOnly: true, maxAge: 8 * 60 * 60 * 1000 },
}));

// ── Servir portal CA (HTML estático) ──────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Rutas API ──────────────────────────────────────────────────────────────
app.use('/api/portal', require('./src/routes/portal.routes'));
app.use('/api/ca',     require('./src/routes/certificados.routes'));
app.use('/api/admin',  require('./src/routes/admin.routes'));

// ── SPA fallback para rutas del portal ────────────────────────────────────
app.get('/solicitar',     (_, res) => res.sendFile(path.join(__dirname, 'public', 'solicitar.html')));
app.get('/mi-certificado',(_, res) => res.sendFile(path.join(__dirname, 'public', 'mi-certificado.html')));
app.get('/verificar',     (_, res) => res.sendFile(path.join(__dirname, 'public', 'verificar.html')));
app.get('/admin',         (_, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.listen(PORT, () => {
  console.log(`[CA Service] Portal: http://localhost:${PORT}`);
  console.log(`[CA Service] API:    http://localhost:${PORT}/api/ca/info`);
});
