import React from 'react'
import { Link } from 'react-router-dom'

const NavbarInicio = () => {
  return (
    <nav style={{
      backgroundColor: '#333',
      padding: '1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem' }}>
        🏠 Burroomies
      </Link>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/usuarios/inicio-sesion">
          <button style={{ padding: '0.5rem 1rem' }}>Iniciar Sesión</button>
        </Link>
        <Link to="/registro">
          <button style={{ padding: '0.5rem 1rem' }}>Registro</button>
        </Link>
      </div>
    </nav>
  )
}

export default NavbarInicio