import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'
import { verificarExpiracion } from '../../services/authService'
import '../../styles/Arrendatario.css'

const VerificacionPendiente = () => {
  const navigate = useNavigate()
  const [diasRestantes, setDiasRestantes] = useState(null)
  const [diasTranscurridos, setDiasTranscurridos] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      navigate('/usuarios/inicio-sesion')
      return
    }

    const verificar = async () => {
      try {
        const data = await verificarExpiracion(userId)

        if (data.expirado) {
          localStorage.clear()
          navigate('/usuarios/verificar-expiracion', { state: { userId } })
          return
        }

        if (data.arrendatarioVerificado === 1) {
          navigate('/arrendatario/mi-arrendamiento')
          return
        }

        setDiasRestantes(data.diasRestantes)
        setDiasTranscurridos(data.diasTranscurridos)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    verificar()
  }, [navigate])

  const getUrgencia = () => {
    if (diasRestantes === null) return { headerClass: 'atr-verify-header-primary', texto: 'Verificación pendiente', icon: '🔐' }
    if (diasRestantes <= 10) return { headerClass: 'atr-verify-header-danger', texto: '¡Urgente! Pocos días restantes', icon: '🚨' }
    if (diasRestantes <= 20) return { headerClass: 'atr-verify-header-warning', texto: 'Atención requerida', icon: '⚠️' }
    return { headerClass: 'atr-verify-header-primary', texto: 'Verificación pendiente', icon: '🔐' }
  }

  const getDaysColor = () => {
    if (diasRestantes === null) return '#059669'
    if (diasRestantes <= 10) return '#c62828'
    if (diasRestantes <= 20) return '#e65100'
    return '#059669'
  }

  const urgencia = getUrgencia()
  const daysColor = getDaysColor()
  const porcentajeUsado = diasTranscurridos !== null ? Math.min((diasTranscurridos / 60) * 100, 100) : 0

  if (loading) {
    return (
      <div className="atr-page">
        <NavbarArrendatario />
        <div className="atr-main">
          <div className="atr-loading"><p>Verificando tu cuenta...</p></div>
        </div>
        <FooterInicio />
      </div>
    )
  }

  return (
    <div className="atr-page">
      <NavbarArrendatario />

      <div className="atr-verify-wrapper">
        <div style={{ width: '100%', maxWidth: '520px' }}>
          <div className="atr-verify-card">

            {/* Header */}
            <div className={`atr-verify-header ${urgencia.headerClass}`}>
              <div className="atr-verify-header-icon">{urgencia.icon}</div>
              <div className="atr-verify-header-title">{urgencia.texto}</div>
              <div className="atr-verify-header-sub">
                Para usar todas las funciones debes verificar tu identidad
              </div>
            </div>

            <div className="atr-verify-body">

              {/* Contador de días */}
              {diasRestantes !== null && (
                <div className="atr-days-box" style={{ background: daysColor + '12', marginBottom: '1.5rem' }}>
                  <div className="atr-days-label">Tiempo restante para verificar</div>
                  <div className="atr-days-number" style={{ color: daysColor }}>{diasRestantes}</div>
                  <div className="atr-days-unit" style={{ color: daysColor }}>
                    {diasRestantes === 1 ? 'día' : 'días'}
                  </div>
                  <div className="atr-progress-bar-track">
                    <div
                      className="atr-progress-bar-fill"
                      style={{ width: `${porcentajeUsado}%`, backgroundColor: daysColor }}
                    />
                  </div>
                  <div className="atr-progress-labels">
                    <span className="atr-progress-label">Día 0</span>
                    <span className="atr-progress-label">Día 60 (límite)</span>
                  </div>
                </div>
              )}

              {/* Requisitos */}
              <div className="atr-req-list">
                <div className="atr-req-title">📋 ¿Qué necesitas para verificarte?</div>
                {[
                  'Tu constancia de estudios vigente del IPN',
                  'El archivo debe ser en formato PDF',
                  'El QR de la constancia debe ser legible',
                  'Los datos deben coincidir con tu registro'
                ].map((item, i) => (
                  <div key={i} className="atr-req-item">
                    <div className="atr-req-check">✓</div>
                    <div className="atr-req-text">{item}</div>
                  </div>
                ))}
              </div>

              {/* Advertencia urgente */}
              {diasRestantes !== null && diasRestantes <= 10 && (
                <div className="atr-alert atr-alert-warning" style={{ marginBottom: '1.25rem' }}>
                  <div className="atr-alert-icon">⏳</div>
                  <div className="atr-alert-body">
                    <div className="atr-alert-title">¡Atención!</div>
                    <div className="atr-alert-desc">
                      Si no verificas en los próximos {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'},
                      tu cuenta será <strong>eliminada automáticamente</strong>.
                    </div>
                  </div>
                </div>
              )}

              {/* Botón */}
              <div className="atr-btn-group">
                <button
                  className="atr-btn-primary"
                  onClick={() => navigate('/arrendatario/verificar-identidad')}
                >
                  📤 Verificar mi identidad ahora
                </button>
              </div>

            </div>
          </div>

          <p className="atr-footnote" style={{ marginTop: '1rem' }}>
            Tu información es tratada de forma segura y solo se usa para verificar tu identidad estudiantil.
          </p>
        </div>
      </div>

      <FooterInicio />
    </div>
  )
}

export default VerificacionPendiente
