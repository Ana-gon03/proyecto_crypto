import React from 'react'

const ModalContacto = ({ onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>📞 Contacto</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Correo */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📧 Correo Electrónico</div>
          <a href="mailto:contacto@burroomies.mx" style={{ color: '#0066cc', textDecoration: 'none', fontSize: '1rem' }}>
            contacto@burroomies.mx
          </a>
        </div>

        {/* Redes Sociales */}
        <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.8rem' }}>🌐 Redes Sociales</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a 
              href="https://facebook.com/burroomies" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1877F2', textDecoration: 'none', fontSize: '1rem', padding: '0.5rem', borderRadius: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ fontSize: '1.5rem' }}>📘</span> Facebook
            </a>
            
            <a 
              href="https://instagram.com/burroomies" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#E4405F', textDecoration: 'none', fontSize: '1rem', padding: '0.5rem', borderRadius: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ fontSize: '1.5rem' }}>📷</span> Instagram
            </a>
            
            <a 
              href="https://twitter.com/burroomies" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1DA1F2', textDecoration: 'none', fontSize: '1rem', padding: '0.5rem', borderRadius: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ fontSize: '1.5rem' }}>🐦</span> Twitter / X
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalContacto