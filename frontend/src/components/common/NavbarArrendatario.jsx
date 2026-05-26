import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import logoImg from '../../assets/burro.png'
import '../../styles/Arrendatario.css'

const NavbarArrendatario = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const isActive = (path) => location.pathname === path
  const esPaginaFirma = location.pathname.startsWith('/arrendatario/contratos/')
  const isFirmaActive = esPaginaFirma || location.pathname === '/arrendatario/firmar-contrato'

  const handleCerrarSesion = () => {
    localStorage.clear()
    navigate('/')
  }

  const cerrarMenu = () => setMenuAbierto(false)

  const nombre = localStorage.getItem('usuarioNom') || 'Estudiante'

  return (
    <nav className="atr-nav">
      <div className="atr-nav-inner">
        <Link to="/arrendatario/buscar-vivienda" className="atr-nav-brand" onClick={cerrarMenu}>
          <img src={logoImg} alt="Blockhome" className="atr-nav-logo" />
          <span className="atr-nav-brand-name">Blockhome</span>
        </Link>

        <div className="atr-nav-links">
          <Link
            to="/arrendatario/buscar-vivienda"
            className={`atr-nav-link${isActive('/arrendatario/buscar-vivienda') ? ' active' : ''}`}
          >
            Buscar Vivienda
          </Link>
          <Link
            to="/arrendatario/mi-arrendamiento"
            className={`atr-nav-link${isActive('/arrendatario/mi-arrendamiento') ? ' active' : ''}`}
          >
            Mi Arrendamiento
          </Link>
          <Link
            to="/arrendatario/mi-certificado-digital"
            className={`atr-nav-link${isActive('/arrendatario/mi-certificado-digital') ? ' active' : ''}`}
          >
            Mi Certificado
          </Link>
          <Link
            to="/arrendatario/firmar-contrato"
            className={`atr-nav-link${isFirmaActive ? ' active' : ''}`}
            style={{ color: 'var(--green-600)', fontWeight: 600 }}
          >
            ✍️ Firmar Contrato
          </Link>
        </div>

        <div className="atr-nav-right">
          <Link to="/arrendatario/perfil" className="atr-nav-profile" onClick={cerrarMenu}>
            <div className="atr-nav-avatar">
              {nombre.charAt(0).toUpperCase()}
            </div>
            <span className="atr-nav-profile-name">Mi Perfil</span>
          </Link>
          <button className="atr-nav-logout" onClick={handleCerrarSesion}>
            Cerrar Sesión
          </button>
          <button
            className="atr-nav-hamburger"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Menú"
          >
            {menuAbierto ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuAbierto && (
        <div className="atr-nav-mobile-menu">
          <Link
            to="/arrendatario/buscar-vivienda"
            className={`atr-nav-mobile-link${isActive('/arrendatario/buscar-vivienda') ? ' active' : ''}`}
            onClick={cerrarMenu}
          >
            Buscar Vivienda
          </Link>
          <Link
            to="/arrendatario/mi-arrendamiento"
            className={`atr-nav-mobile-link${isActive('/arrendatario/mi-arrendamiento') ? ' active' : ''}`}
            onClick={cerrarMenu}
          >
            Mi Arrendamiento
          </Link>
          <Link
            to="/arrendatario/mi-certificado-digital"
            className={`atr-nav-mobile-link${isActive('/arrendatario/mi-certificado-digital') ? ' active' : ''}`}
            onClick={cerrarMenu}
          >
            Mi Certificado
          </Link>
          <Link
            to="/arrendatario/firmar-contrato"
            className="atr-nav-mobile-link"
            onClick={cerrarMenu}
          >
            ✍️ Firmar Contrato
          </Link>
          <Link to="/arrendatario/perfil" className="atr-nav-mobile-link" onClick={cerrarMenu}>
            Mi Perfil
          </Link>
          <button className="atr-nav-mobile-btn" onClick={() => { cerrarMenu(); handleCerrarSesion(); }}>
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  )
}

export default NavbarArrendatario
