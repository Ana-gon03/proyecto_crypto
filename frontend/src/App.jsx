import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Páginas públicas
import HomePage from './pages/publicas/HomePage'
import RegistroUsuarioPage from './pages/publicas/RegistroUsuarioPage'
import UsuariosInicioSesionPage from './pages/publicas/UsuariosInicioSesionPage'
import VerificarCorreoPage from './pages/publicas/VerificarCorreoPage'
import VerificarCorreoLogin from './pages/publicas/VerificarCorreoLogin'
import VerificarExpiracion from './pages/publicas/VerificarExpiracion'
import Bienvenidapage from './pages/publicas/Bienvenidapage'
import AvisoPrivacidadPage from './pages/publicas/AvisoPrivacidadPage'
import TerminosUsoPage from './pages/publicas/TerminosUsoPage'
import FaqPage from './pages/publicas/FaqPage'

// Páginas de arrendador
import MisArrendamientosArrendador from './pages/arrendador/MisArrendamientosArrendador'
import MisViviendas from './pages/arrendador/MisViviendas'
import CrearVivienda from './pages/arrendador/CrearVivienda'
import CrearArrendamiento from './pages/arrendador/CrearArrendamiento'
import ProtectedArrendadorRoute from './components/common/ProtectedArrendadorRoute'
import PerfilArrendador from './pages/arrendador/PerfilArrendador'

// Páginas de admin
import AdminInicioSesionPage from './pages/admin/AdminInicioSesionPage'
import AdminArrendatariosPage from './pages/admin/AdminArrendatariosPage'
import AdminArrendadoresPage from './pages/admin/AdminArrendadoresPage'
import AdminPropiedadesPage from './pages/admin/AdminPropiedadesPage'
import ProtectedAdminRoute from './components/common/ProtectedAdminRoute'

// Páginas de arrendatario
import BuscarVivienda from './pages/arrendatario/buscarVivienda'
import ProtectedArrendatarioRoute from './components/common/ProtectedArrendatarioRoute'
import DetallePropiedad from './pages/arrendatario/DetallePropiedad'
import MiArrendamiento from './pages/arrendatario/MiArrendamiento'
import EncuestaFinalizacion from './pages/arrendatario/EncuestaFinalizacion'
import PerfilArrendatario from './pages/arrendatario/PerfilArrendatario'
import VerificacionPendiente from './pages/arrendatario/VerificacionPendiente'
import VerificarIdentidad from './pages/arrendatario/VerificarIdentidad'
import VerificacionExitosa from './pages/arrendatario/VerificacionExitosa'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/registro" element={<RegistroUsuarioPage />} />
        <Route path="/usuarios/inicio-sesion" element={<UsuariosInicioSesionPage />} />
        <Route path="/verificar-correo" element={<VerificarCorreoPage />} />
        <Route path="/verificar-correo-login" element={<VerificarCorreoLogin />} />
        <Route path="/verificar-expiracion" element={<VerificarExpiracion />} />
        <Route path="/bienvenida" element={<Bienvenidapage />} />
        <Route path="/legal/aviso-privacidad" element={<AvisoPrivacidadPage />} />
        <Route path="/legal/terminos-uso" element={<TerminosUsoPage />} />
        <Route path="/faq" element={<FaqPage />} />

        {/* Rutas de arrendador */}
        <Route path="/arrendador/mis-arrendamientos" element={
          <ProtectedArrendadorRoute><MisArrendamientosArrendador /></ProtectedArrendadorRoute>
        } />
        <Route path="/arrendador/mis-viviendas" element={
          <ProtectedArrendadorRoute><MisViviendas /></ProtectedArrendadorRoute>
        } />
        <Route path="/arrendador/crear-vivienda" element={
          <ProtectedArrendadorRoute><CrearVivienda /></ProtectedArrendadorRoute>
        } />
        <Route path="/arrendador/crear-arrendamiento" element={
          <ProtectedArrendadorRoute><CrearArrendamiento /></ProtectedArrendadorRoute>
        } />
        <Route path="/arrendador/perfil" element={
          <ProtectedArrendadorRoute><PerfilArrendador /></ProtectedArrendadorRoute>
        } />

        {/* Rutas de arrendatario */}
        <Route path="/arrendatario/buscar-vivienda" element={
          <ProtectedArrendatarioRoute><BuscarVivienda /></ProtectedArrendatarioRoute>
        } />
        
        <Route path="/arrendatario/propiedad/:id" element={
          <ProtectedArrendatarioRoute><DetallePropiedad /></ProtectedArrendatarioRoute>
        } />

        <Route path="/arrendatario/mi-arrendamiento" element={
          <ProtectedArrendatarioRoute><MiArrendamiento /></ProtectedArrendatarioRoute>
        } />
        <Route path="/arrendatario/encuesta-finalizacion/:idArrendamiento" element={
          <ProtectedArrendatarioRoute><EncuestaFinalizacion /></ProtectedArrendatarioRoute>
        } />
                <Route path="/arrendatario/perfil" element={
          <ProtectedArrendatarioRoute><PerfilArrendatario /></ProtectedArrendatarioRoute>
        } />

        <Route path="/arrendatario/verificacion-pendiente" element={
          <ProtectedArrendatarioRoute><VerificacionPendiente /></ProtectedArrendatarioRoute>
        } />

        <Route path="/arrendatario/verificar-identidad" element={
          <ProtectedArrendatarioRoute><VerificarIdentidad /></ProtectedArrendatarioRoute>
        } />

        <Route path="/arrendatario/verificacion-exitosa" element={
          <ProtectedArrendatarioRoute><VerificacionExitosa /></ProtectedArrendatarioRoute>
        } />

        {/* Rutas de admin */}
        <Route path="/admin/inicio-sesion" element={<AdminInicioSesionPage />} />
        <Route path="/admin/arrendatarios" element={
          <ProtectedAdminRoute><AdminArrendatariosPage /></ProtectedAdminRoute>
        } />
        <Route path="/admin/arrendadores" element={
          <ProtectedAdminRoute><AdminArrendadoresPage /></ProtectedAdminRoute>
        } />
        <Route path="/admin/propiedades" element={
          <ProtectedAdminRoute><AdminPropiedadesPage /></ProtectedAdminRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App