import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import burroLogo from '../../assets/burro.png'
import '../admin/admin.css'

const NavbarAdmin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('adminUser')
    localStorage.removeItem('adminId')
    navigate('/admin/inicio-sesion')
  }

  const isActive = (path) => location.pathname === path
  const cerrarMenu = () => setMenuAbierto(false)

  return (
    <nav className="admin-nav">
      <Link to="/admin/arrendatarios" className="admin-nav-brand" onClick={cerrarMenu}>
        <img src={burroLogo} alt="Blockhoom" className="admin-nav-logo" onError={e => { e.target.style.display = 'none' }} />
        <span className="admin-nav-title">Blockhoom</span>
      </Link>

      <div className="admin-nav-links">
        <Link
          to="/admin/arrendatarios"
          className={`admin-nav-link${isActive('/admin/arrendatarios') ? ' admin-nav-link--active' : ''}`}
        >
          🎓 Arrendatarios
        </Link>
        <Link
          to="/admin/arrendadores"
          className={`admin-nav-link${isActive('/admin/arrendadores') ? ' admin-nav-link--active' : ''}`}
        >
          🏠 Arrendadores
        </Link>
        <Link
          to="/admin/propiedades"
          className={`admin-nav-link${isActive('/admin/propiedades') ? ' admin-nav-link--active' : ''}`}
        >
          🏘️ Propiedades
        </Link>
        <button className="admin-nav-logout" onClick={handleLogout}>
          🚪 Cerrar Sesión
        </button>
      </div>

      <button
        className="admin-nav-hamburger"
        onClick={() => setMenuAbierto(!menuAbierto)}
        aria-label="Menú"
      >
        {menuAbierto ? '✕' : '☰'}
      </button>

      {menuAbierto && (
        <div className="admin-nav-mobile-menu" style={{ width: '100%', order: 3 }}>
          <Link
            to="/admin/arrendatarios"
            className="admin-nav-mobile-link"
            onClick={cerrarMenu}
          >
            🎓 Arrendatarios
          </Link>
          <Link
            to="/admin/arrendadores"
            className="admin-nav-mobile-link"
            onClick={cerrarMenu}
          >
            🏠 Arrendadores
          </Link>
          <Link
            to="/admin/propiedades"
            className="admin-nav-mobile-link"
            onClick={cerrarMenu}
          >
            🏘️ Propiedades
          </Link>
          <button className="admin-nav-mobile-btn" onClick={() => { cerrarMenu(); handleLogout(); }}>
            🚪 Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  )
}

export default NavbarAdmin
