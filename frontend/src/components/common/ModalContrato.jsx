// src/components/common/ModalContrato.jsx
import React from 'react';

const ModalContrato = ({ contratoTexto, onFirmar, onCerrar, firmando }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>📄 Contrato de Arrendamiento</h3>
          <button onClick={onCerrar} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
          {contratoTexto}
        </div>
        <div style={{ padding: '1rem', borderTop: '1px solid #ddd', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={onCerrar} style={{ padding: '0.5rem 1rem', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={onFirmar} disabled={firmando} style={{ padding: '0.5rem 1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: firmando ? 'not-allowed' : 'pointer' }}>
            {firmando ? 'Firmando...' : '✍️ Aceptar y Firmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalContrato;