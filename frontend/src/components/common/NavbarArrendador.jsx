import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

const NavbarArrendador = () => {
  const navigate = useNavigate()

  const handleCerrarSesion = () => {
    // Preserva las claves públicas (no son sensibles y sirven para saber si el usuario ya generó claves)
    const ecdhPub  = localStorage.getItem('burroomies_ecdh_pub')
    const ecdsaPub = localStorage.getItem('burroomies_ecdsa_pub')
    localStorage.clear()
    if (ecdhPub)  localStorage.setItem('burroomies_ecdh_pub',  ecdhPub)
    if (ecdsaPub) localStorage.setItem('burroomies_ecdsa_pub', ecdsaPub)
    navigate('/')
  }

  return (
    <nav style={{
      backgroundColor: '#333',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
        🏠 Burroomies
      </Link>
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Link to="/arrendador/mis-arrendamientos">
          <button style={{ padding: '0.5rem 1rem', backgroundColor: '#4a90d9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Mis Arrendamientos
          </button>
        </Link>
        
        <Link to="/arrendador/mis-viviendas">
          <button style={{ padding: '0.5rem 1rem', backgroundColor: '#4a90d9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Mis Viviendas
          </button>
        </Link>
        
        <Link to="/arrendador/perfil">
          <button style={{ padding: '0.5rem', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1.2rem' }} title="Editar Perfil">
            👤
          </button>
        </Link>
        
        <button 
          onClick={handleCerrarSesion}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#d94a4a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Cerrar Sesión
        </button>
      </div>
    </nav>
  )
}

export default NavbarArrendador