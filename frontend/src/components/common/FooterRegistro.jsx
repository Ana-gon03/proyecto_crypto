import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import ModalContacto from './ModalContacto'

const FooterRegistro = () => {
  const [modalAbierto, setModalAbierto] = useState(false)

  return (
    <>
      <footer style={{
        backgroundColor: '#333',
        color: 'white',
        textAlign: 'center',
        padding: '1.25rem 1rem',
        marginTop: 'auto',
      }}>
        <div style={{ marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 600 }}>
          Burroomies
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.3rem 1.25rem' }}>
          <Link to="/legal/aviso-privacidad" style={{ color: '#cbd5e1', fontSize: '0.78rem', textDecoration: 'none' }}>
            Aviso de Privacidad
          </Link>
          <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>·</span>
          <Link to="/legal/terminos-uso" style={{ color: '#cbd5e1', fontSize: '0.78rem', textDecoration: 'none' }}>
            Términos y Condiciones
          </Link>
          <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>·</span>
          <button 
            onClick={() => setModalAbierto(true)}
            style={{ color: '#cbd5e1', fontSize: '0.78rem', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Contacto
          </button>
        </div>
      </footer>

      {modalAbierto && <ModalContacto onClose={() => setModalAbierto(false)} />}
    </>
  )
}

export default FooterRegistro