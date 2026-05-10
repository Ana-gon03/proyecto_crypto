// frontend/src/components/common/ModalConfirmacion.jsx
import React from 'react'

const ModalConfirmacion = ({ titulo, mensaje, onConfirmar, onCancelar, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar', peligro = false }) => {
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
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '450px',
        width: '90%'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>{titulo}</h3>
        <p style={{ marginBottom: '1.5rem', color: '#555' }}>{mensaje}</p>
        
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancelar}
            style={{ padding: '0.5rem 1.5rem', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {textoCancelar}
          </button>
          <button
            onClick={onConfirmar}
            style={{ padding: '0.5rem 1.5rem', backgroundColor: peligro ? '#f44336' : '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalConfirmacion