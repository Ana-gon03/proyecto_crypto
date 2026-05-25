import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import logoImg from '../../assets/burro.png'
import '../../styles/Arrendador.css'

const NavbarArrendador = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const isActive = (path) => location.pathname === path

  const handleCerrarSesion = () => {
    localStorage.clear()
    navigate('/')
  }

  const cerrarMenu = () => setMenuAbierto(false)

  const nombre = localStorage.getItem('usuarioNom') || 'Arrendador'

  return (
    <nav className="arr-nav">
      <div className="arr-nav-inner">
        <Link to="/" className="arr-nav-brand" onClick={cerrarMenu}>
          <img src={logoImg} alt="Blockhome" className="arr-nav-logo" />
          <span className="arr-nav-brand-name">Blockhome</span>
        </Link>

        <div className="arr-nav-links">
          <Link
            to="/arrendador/mis-viviendas"
            className={`arr-nav-link${isActive('/arrendador/mis-viviendas') ? ' active' : ''}`}
          >
            Mis Viviendas
          </Link>
          <Link
            to="/arrendador/mis-arrendamientos"
            className={`arr-nav-link${isActive('/arrendador/mis-arrendamientos') ? ' active' : ''}`}
          >
            Mis Arrendamientos
          </Link>
          <Link
            to="/arrendador/mi-certificado-digital"
            className={`arr-nav-link${isActive('/arrendador/mi-certificado-digital') ? ' active' : ''}`}
          >
            Mi Certificado
          </Link>
          <Link
            to="/arrendador/mis-arrendamientos"
            className={`arr-nav-link${isActive('/arrendador/mis-arrendamientos') ? ' active' : ''}`}
            style={{ color: 'var(--purple-600)', fontWeight: 600 }}
          >
            ✍️ Firmar Contrato
          </Link>
        </div>

        <div className="arr-nav-right">
          <Link to="/arrendador/perfil" className="arr-nav-profile" onClick={cerrarMenu}>
            <div className="arr-nav-avatar">
              {nombre.charAt(0).toUpperCase()}
            </div>
            <span className="arr-nav-profile-name">Mi Perfil</span>
          </Link>
          <button className="arr-nav-logout" onClick={handleCerrarSesion}>
            Cerrar Sesión
          </button>
          <button
            className="arr-nav-hamburger"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Menú"
          >
            {menuAbierto ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuAbierto && (
        <div className="arr-nav-mobile-menu">
          <Link
            to="/arrendador/mis-viviendas"
            className={`arr-nav-mobile-link${isActive('/arrendador/mis-viviendas') ? ' active' : ''}`}
            onClick={cerrarMenu}
          >
            Mis Viviendas
          </Link>
          <Link
            to="/arrendador/mis-arrendamientos"
            className={`arr-nav-mobile-link${isActive('/arrendador/mis-arrendamientos') ? ' active' : ''}`}
            onClick={cerrarMenu}
          >
            Mis Arrendamientos
          </Link>
          <Link
            to="/arrendador/mi-certificado-digital"
            className={`arr-nav-mobile-link${isActive('/arrendador/mi-certificado-digital') ? ' active' : ''}`}
            onClick={cerrarMenu}
          >
            Mi Certificado
          </Link>
          <Link
            to="/arrendador/mis-arrendamientos"
            className="arr-nav-mobile-link"
            onClick={cerrarMenu}
          >
            ✍️ Firmar Contrato
          </Link>
          <Link to="/arrendador/perfil" className="arr-nav-mobile-link" onClick={cerrarMenu}>
            Mi Perfil
          </Link>
          <button className="arr-nav-mobile-btn" onClick={() => { cerrarMenu(); handleCerrarSesion(); }}>
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  )
}

export default NavbarArrendador
