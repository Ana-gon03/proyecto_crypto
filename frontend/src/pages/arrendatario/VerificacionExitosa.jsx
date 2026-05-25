import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'
import '../../styles/Arrendatario.css'

const VerificacionExitosa = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const esRenovacion = location.state?.esRenovacion || false

  return (
    <div className="atr-page">
      <NavbarArrendatario />

      <div className="atr-verify-wrapper">
        <div className="atr-verify-card atr-verify-card-success">

          {/* Header */}
          <div className={`atr-verify-header ${esRenovacion ? 'atr-verify-header-warning' : 'atr-verify-header-success'}`}>
            <div className="atr-verify-header-icon">{esRenovacion ? '🔄' : '🎉'}</div>
            <div className="atr-verify-header-title">
              {esRenovacion ? '¡Verificación renovada!' : '¡Identidad verificada!'}
            </div>
            <div className="atr-verify-header-sub">
              {esRenovacion ? 'Tu verificación fue renovada por 6 meses más' : 'Tu cuenta ahora tiene acceso completo'}
            </div>
          </div>

          <div className="atr-verify-body">

            <div className="atr-alert atr-alert-success" style={{ marginBottom: '1.5rem' }}>
              <div className="atr-alert-icon">{esRenovacion ? '🔄' : '✅'}</div>
              <div className="atr-alert-body">
                <div className="atr-alert-title">{esRenovacion ? '¡Renovación exitosa!' : '¡Felicidades!'}</div>
                <div className="atr-alert-desc">
                  {esRenovacion
                    ? 'Tu verificación ha sido renovada. Ya puedes ver los datos de contacto de los arrendadores.'
                    : 'Tu constancia fue validada exitosamente. Ya tienes acceso completo a la plataforma Blockhome.'
                  }
                </div>
              </div>
            </div>

            <div className="atr-btn-group">
              <button
                onClick={() => navigate('/arrendatario/buscar-vivienda')}
                className="atr-btn-primary"
                style={{
                  background: esRenovacion ? '#e65100' : '#16A34A',
                  boxShadow: esRenovacion ? '0 4px 16px rgba(230,81,0,0.25)' : '0 4px 16px rgba(22,163,74,0.25)'
                }}
              >
                🏠 Buscar vivienda
              </button>
              <button
                onClick={() => navigate('/arrendatario/mi-arrendamiento')}
                className="atr-btn-ghost"
              >
                Ver mi arrendamiento
              </button>
            </div>

          </div>
        </div>
      </div>

      <FooterInicio />
    </div>
  )
}

export default VerificacionExitosa