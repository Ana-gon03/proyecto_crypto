import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const NavbarArrendatario = () => {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    localStorage.clear()
    navigate('/usuarios/inicio-sesion')
  }

  return (
    <nav style={{
      backgroundColor: '#1a237e',
      padding: '0 20px',
      color: 'white'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
        height: '60px'
      }}>
        {/* Logo/Home */}
        <NavLink 
          to="/arrendatario/buscar-vivienda" 
          style={{ 
            color: 'white', 
            textDecoration: 'none', 
            fontSize: '20px', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🏠 Burroomies
        </NavLink>

        {/* Botón móvil */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer'
          }}
          className="menu-toggle"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Menú */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <NavLink 
            to="/arrendatario/buscar-vivienda"
            style={({ isActive }) => ({
              color: 'white',
              textDecoration: 'none',
              padding: '8px 15px',
              borderRadius: '5px',
              backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            })}
          >
            🔍 Buscar Vivienda
          </NavLink>
          
          <NavLink 
            to="/arrendatario/mi-arrendamiento"
            style={({ isActive }) => ({
              color: 'white',
              textDecoration: 'none',
              padding: '8px 15px',
              borderRadius: '5px',
              backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            })}
          >
            📋 Mi Arrendamiento
          </NavLink>
          
          <NavLink 
            to="/arrendatario/perfil"
            style={({ isActive }) => ({
              color: 'white',
              textDecoration: 'none',
              padding: '8px 15px',
              borderRadius: '5px',
              backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            })}
          >
            👤 Perfil
          </NavLink>
          
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 15px',
              marginLeft: '10px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Estilos para responsive */}
      <style>{`
        @media (max-width: 768px) {
          .menu-toggle {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  )
}

export default NavbarArrendatario