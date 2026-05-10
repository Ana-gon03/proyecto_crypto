import React from 'react'
import { Link } from 'react-router-dom'
import NavbarInicio from '../../components/common/NavbarInicio'
import FooterInicio from '../../components/common/FooterInicio'

const HomePage = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      <NavbarInicio />
      <main style={{ flex: 1, padding: '2rem', textAlign: 'center' }}>
        <h1>Bienvenido a Burroomies</h1>
        <p>Encuentra la vivienda perfecta para estudiantes del IPN</p>
      </main>
      <FooterInicio />
      
      {/* Ícono flotante de pregunta */}
      <Link 
        to="/faq"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: '#5e60ce',
          color: 'white',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          textDecoration: 'none',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          transition: 'transform 0.2s',
          zIndex: 1000
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        ❓
      </Link>
    </div>
  )
}

export default HomePage