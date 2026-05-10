import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import '../admin/admin.css'

const NavbarAdmin = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('adminUser')
    localStorage.removeItem('adminId')
    navigate('/admin/inicio-sesion')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="admin-nav">
      <Link to="/admin/arrendatarios" className="admin-nav-brand">
        <div className="admin-nav-logo">👑</div>
        <span className="admin-nav-title">Admin Burroomies</span>
      </Link>

      <div className="admin-nav-links">
        <Link
          to="/admin/arrendatarios"
          className="admin-nav-link"
          style={isActive('/admin/arrendatarios') ? { background: 'rgba(123,45,110,0.1)', color: '#7B2D6E' } : {}}
        >
          🎓 Arrendatarios
        </Link>
        <Link
          to="/admin/arrendadores"
          className="admin-nav-link"
          style={isActive('/admin/arrendadores') ? { background: 'rgba(123,45,110,0.1)', color: '#7B2D6E' } : {}}
        >
          🏠 Arrendadores
        </Link>
        <Link
          to="/admin/propiedades"
          className="admin-nav-link"
          style={isActive('/admin/propiedades') ? { background: 'rgba(123,45,110,0.1)', color: '#7B2D6E' } : {}}
        >
          🏘️ Propiedades
        </Link>
        <button className="admin-nav-logout" onClick={handleLogout}>
          🚪 Cerrar Sesión
        </button>
      </div>
    </nav>
  )
}

export default NavbarAdmin
