# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Burroomies — TT-A046 | IPN ESCOM

## Contexto académico
- **Trabajo Terminal:** 2026 – A046
- **Institución:** Instituto Politécnico Nacional — Escuela Superior de Cómputo (ESCOM)
- **Título:** "Sistema web para la búsqueda de vivienda en renta para los estudiantes de la UPALM IPN"
- **Integrantes:** Castro Vázquez Nailea Tania, Magaña Garcilazo Camila Ximena, Ortiz González Ana Guadalupe
- **Directores:** Dr. Benjamín Cruz Torres, Ing. Ariel López Rojas

## Descripción del proyecto
Sistema web que permite a los estudiantes de la UPALM IPN buscar y comparar opciones de vivienda en renta, filtrar por presupuesto y características, contactar arrendadores y dejar reseñas. Los arrendadores pueden publicar y gestionar sus propiedades.

## Stack tecnológico
- **Frontend:** React 19 + Vite, CSS global, React Router v7
- **Backend:** Node.js + Express.js + Sequelize ORM
- **Base de datos:** MySQL (base de datos: `dbBurroomies`)
- **Algoritmo especial:** Clasificador Naive Bayes de sentimientos para reseñas (implementado desde cero en español, sin librerías externas)

## Comandos de desarrollo

Ambos servidores deben correr en terminales separadas:

```bash
# Backend (http://localhost:5000)
cd backend
npm run dev        # nodemon con auto-reload
npm start          # node sin auto-reload

# Frontend (http://localhost:5173)
cd frontend
npm run dev
npm run build
npm run lint
```

### Variables de entorno — `backend/.env`

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<password>
DB_NAME=dbBurroomies
DB_PORT=3306
JWT_SECRET=<secret>
BREVO_SMTP_USER=<brevo_user>
BREVO_SMTP_PASS=<brevo_pass>
BREVO_EMAIL_SENDER=<correo_remitente>
PDFCO_API_KEY=<pdfco_key>
ADMIN_EMAIL=<correo_admin>
```

## Arquitectura real del código

### Backend

Toda la lógica de negocio vive directamente en los archivos de rutas (`src/routes/`). El directorio `src/controllers/` existe pero solo contiene `busqueda.controller.js`.

**Mapeo ruta → prefijo API:**
- `auth.routes.js` → `/api/auth` — registro, login, verificación de correo, verificación de identidad, perfil
- `admin.routes.js` → `/api/admin` — CRUD de usuarios y propiedades
- `arrendamiento.routes.js` → `/api/arrendamientos` — contratos y generación de PDFs
- `propiedad.routes.js` → `/api/propiedades` — propiedades, servicios, fotos
- `catalogos.routes.js` → `/api/catalogos` — escuelas y carreras IPN
- `cp.routes.js` → `/api/cp` — búsqueda de códigos postales
- `usuario.routes.js` → `/api/usuarios` — búsqueda de arrendatarios
- `contacto.routes.js` → `/api` — formulario de contacto

**Servicios clave:**
- `src/config/email.js` — Brevo SMTP vía Nodemailer; envía códigos de 8 dígitos válidos por 24h
- `src/services/pdfco.service.js` — PDF.co API: sube buffer → obtiene URL prefirmada → extrae QR → valida campos contra formulario
- `src/middlewares/upload.js` — Multer en memoria para PDFs (5MB máx)
- `src/middlewares/uploadFotos.js` — Multer + Sharp para fotos de propiedades

**Relaciones entre modelos** (todas definidas en `src/models/associations.js`):
- `Usuario` ↔ `Arrendatario` (1:1) y `Usuario` ↔ `Arrendador` (1:1) — un usuario es uno u otro, nunca ambos
- `Arrendador` → `Direccion` → `CP`
- `Arrendador` → `Propiedad` → `Fotos`, `Arrendamiento`, `Resena`
- `Arrendatario` → `Carrera` → `UnidadAcademica`
- `Propiedad` ↔ `Servicio` (muchos a muchos a través de `ServicioHasPropiedad`)

### Frontend

**Estado de autenticación** en `localStorage` (sin Context ni store):
- `userId`, `rol` (`arrendador` | `arrendatario`), `correo`, `correoVerificado`
- `arrendadorId` o `arrendatarioId` según rol
- `arrendatarioVerificado`, `fechaRegistro` para estudiantes

**Protección de rutas** vía tres componentes wrapper:
- `ProtectedArrendadorRoute` — valida `rol === 'arrendador'` y `correoVerificado === '1'`
- `ProtectedArrendatarioRoute` — valida `rol === 'arrendatario'` y `correoVerificado === '1'`
- `ProtectedAdminRoute` — valida sesión admin en localStorage

**Capa de servicios** (`src/services/`): cada archivo agrupa llamadas a la API por dominio usando una instancia Axios compartida (`api.js`) apuntando a `http://localhost:5000/api`. Sin interceptores ni headers de auth — la API actualmente no usa JWT en las rutas aunque el paquete está instalado.

**Flujo de login para arrendatarios:**
1. Login → si correo no verificado → `/verificar-correo-login` → reenvía código
2. Correo verificado + identidad no verificada → `/verificar-expiracion` (si han pasado más de 60 días, elimina la cuenta)
3. Identidad verificada → `/arrendatario/buscar-vivienda`

**Fotos:** se sirven estáticamente desde `backend/uploads/` en la ruta `/uploads/<filename>`.

## Estructura del proyecto
```
Burroomies-V1.0/
├── backend/
│   ├── src/
│   │   ├── routes/        # Endpoints REST
│   │   ├── controllers/   # Lógica de negocio
│   │   ├── models/        # Modelos Sequelize
│   │   └── middlewares/   # Auth, validaciones
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── admin/     # Panel administrador
│       │   ├── arrendador/ # Panel arrendador
│       │   └── publicas/  # Páginas públicas
│       ├── components/
│       │   ├── admin/     # Formularios admin
│       │   └── common/    # Navbar, Footer, Modal
│       └── services/      # Llamadas a la API
└── db/                    # Scripts SQL
```

## Módulos implementados
1. **Autenticación** — Registro con verificación de documentos (constancia SAES para estudiantes, CURP para arrendadores), login, verificación por correo con código de 8 dígitos, reset de contraseña
2. **Módulo Estudiante (Arrendatario)** — Búsqueda y filtrado de propiedades, ver detalles, registrar arrendamiento, dejar reseñas
3. **Módulo Arrendador** — Publicar propiedades con fotos (Base64), gestionar disponibilidad, ver arrendamientos activos
4. **Módulo Administrador** — CRUD completo de estudiantes, arrendadores y propiedades, panel con tabla y modales
5. **Clasificador Naive Bayes** — Análisis de sentimiento de reseñas en español, entrenado con datos del proyecto, sin dependencias externas

## Lo que necesito que hagas
Estoy documentando el **Capítulo 6: Desarrollo e Implementación** de mi documento técnico IPN-ESCOM.

Cuando te pida documentar algo, sigue estas reglas:
- **Idioma:** Español formal, académico
- **Persona:** Tercera persona ("El sistema implementa...", "Se desarrolló...", "El módulo permite...")
- **Estilo:** IPN-ESCOM — claro, técnico, sin tuteos
- **Formato:** Redacción en párrafos (no bullets), con subtítulos numerados tipo "6.1", "6.1.1"
- **Incluir siempre:** descripción de qué hace, cómo funciona internamente, qué archivos lo implementan

## Capítulos ya documentados (NO repetir)
- Capítulo 1: Antecedentes (problema, propuesta, objetivos, justificación)
- Capítulo 2: Estado del arte
- Capítulo 3: Marco teórico
- Capítulo 4: Análisis (requerimientos, herramientas, riesgos, factibilidad)
- Capítulo 5: Diseño (casos de uso, arquitectura, diagramas de secuencia, clases, modelo relacional)

## Capítulo pendiente — Capítulo 6: Desarrollo e Implementación
Secciones que faltan por redactar:
- 6.1 Arquitectura implementada
- 6.2 Módulo de autenticación
- 6.3 Módulo del estudiante
- 6.4 Módulo del arrendador
- 6.5 Módulo del administrador
- 6.6 Clasificador Naive Bayes
- 6.7 Pruebas funcionales
