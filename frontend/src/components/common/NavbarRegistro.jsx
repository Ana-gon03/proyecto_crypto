import React from 'react'
import { Link } from 'react-router-dom'

const NavbarRegistro = () => {
  return (
    <nav style={{
      backgroundColor: '#333',
      padding: '1rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem' }}>
        🏠 Burroomies
      </Link>
    </nav>
  )
}

export default NavbarRegistro
