import React from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'

const VerificacionExitosa = () => {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <NavbarArrendatario />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 20px' }}>
        <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            border: '2px solid #28a745',
            padding: '40px 30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <p style={{ fontSize: '60px', margin: '0 0 15px 0' }}>🎉</p>
            <h1 style={{ color: '#28a745', fontSize: '22px', marginBottom: '10px' }}>
              ¡Identidad verificada!
            </h1>
            <p style={{ color: '#555', fontSize: '14px', marginBottom: '25px', lineHeight: '1.6' }}>
              Tu constancia fue validada exitosamente. Ya tienes acceso completo a la plataforma Burroomies.
            </p>
            <button
              onClick={() => navigate('/arrendatario/buscar-vivienda')}
              style={{
                width: '100%', padding: '14px',
                backgroundColor: '#28a745', color: 'white',
                border: 'none', borderRadius: '6px',
                cursor: 'pointer', fontSize: '15px', fontWeight: 'bold',
                marginBottom: '10px'
              }}
            >
              🏠 Buscar vivienda
            </button>
            <button
              onClick={() => navigate('/arrendatario/mi-arrendamiento')}
              style={{
                width: '100%', padding: '12px',
                backgroundColor: 'white', color: '#555',
                border: '1px solid #ddd', borderRadius: '6px',
                cursor: 'pointer', fontSize: '14px'
              }}
            >
              Ver mi arrendamiento
            </button>
          </div>
        </div>
      </div>
      <FooterInicio />
    </div>
  )
}

export default VerificacionExitosa