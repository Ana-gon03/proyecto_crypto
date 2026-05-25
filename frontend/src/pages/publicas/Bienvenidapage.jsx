import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import NavbarRegistro from '../../components/common/NavbarRegistro'
import FooterRegistro from '../../components/common/FooterInicio'
import '../../styles/VerificarCorreo.css'

const BienvenidaPage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const rol = location.state?.rol
  const verificadoConDocumento = location.state?.verificadoConDocumento
  const pendiente = rol === 'estudiante' && verificadoConDocumento === false

  // ── Estudiante con verificación pendiente ──────────────────────────────────
  if (pendiente) {
    return (
      <div className="verificar-page">
        <NavbarRegistro />
        
        <div className="verificar-container">
          <div className="verificar-card">
            <div className="verificar-header verificar-header-warning">
              <div className="verificar-header-icon">🎉</div>
              <div className="verificar-header-title">¡Bienvenid@ a Blockhome!</div>
              <div className="verificar-header-sub">
                Tu cuenta ha sido creada exitosamente
              </div>
            </div>
            
            <div className="verificar-body">
              
              <div className="verificar-alert-warning" style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#92400E', marginBottom: '0.25rem' }}>
                      Verificación de identidad pendiente
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#78350F', lineHeight: 1.5 }}>
                      Tienes <strong>2 meses</strong> para subir tu constancia de estudios y verificar tu identidad.
                      Si no lo haces antes de esa fecha, <strong>tu cuenta será eliminada automáticamente</strong>.
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#92400E', marginTop: '0.5rem' }}>
                      Puedes hacerlo desde tu perfil en cualquier momento.
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/usuarios/inicio-sesion')}
                className="verificar-btn verificar-btn-primary"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
        
        <FooterRegistro />
      </div>
    )
  }

  // ── Cuenta verificada (arrendador o estudiante con constancia) ─────────────
  return (
    <div className="verificar-page">
      <NavbarRegistro />
      
      <div className="verificar-container">
        <div className="verificar-card">
          <div className="verificar-header verificar-header-success">
            <div className="verificar-header-icon">✅</div>
            <div className="verificar-header-title">¡Bienvenid@!</div>
            <div className="verificar-header-sub">
              Tu cuenta ha sido creada y verificada exitosamente
            </div>
          </div>
          
          <div className="verificar-body">
            
            <div className="verificar-success" style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <span style={{ color: '#16A34A', fontWeight: 600 }}>
                ✔ Identidad verificada
              </span>
            </div>

            <p style={{ textAlign: 'center', color: '#4a4668', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {rol === 'arrendador'
                ? 'Ya puedes publicar tus inmuebles.'
                : 'Ya puedes buscar opciones de arrendamiento.'}
            </p>

            <button
              onClick={() => navigate('/usuarios/inicio-sesion')}
              className="verificar-btn verificar-btn-primary"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
      
      <FooterRegistro />
    </div>
  )
}

export default BienvenidaPage