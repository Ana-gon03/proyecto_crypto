import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'
import { verificarExpiracion } from '../../services/authService'

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
    if (diasRestantes === null) return { color: '#1a237e', bg: '#e8eaf6', texto: 'Verificación pendiente' }
    if (diasRestantes <= 10) return { color: '#c62828', bg: '#ffebee', texto: '¡Urgente! Pocos días restantes' }
    if (diasRestantes <= 20) return { color: '#e65100', bg: '#fff3e0', texto: 'Atención requerida' }
    return { color: '#1a237e', bg: '#e8eaf6', texto: 'Verificación pendiente' }
  }

  const urgencia = getUrgencia()
  const porcentajeUsado = diasTranscurridos !== null ? Math.min((diasTranscurridos / 60) * 100, 100) : 0
  const colorBarra = diasRestantes <= 10 ? '#c62828' : diasRestantes <= 20 ? '#e65100' : '#1a237e'

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavbarArrendatario />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#666' }}>Verificando tu cuenta...</p>
        </div>
        <FooterInicio />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <NavbarArrendatario />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 20px' }}>
        <div style={{ width: '100%', maxWidth: '560px' }}>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            border: `2px solid ${urgencia.color}`,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>

            {/* Header */}
            <div style={{ backgroundColor: urgencia.color, padding: '25px 30px', textAlign: 'center' }}>
              <p style={{ fontSize: '48px', margin: '0 0 10px 0' }}>
                {diasRestantes <= 10 ? '🚨' : diasRestantes <= 20 ? '⚠️' : '🔐'}
              </p>
              <h1 style={{ color: 'white', fontSize: '20px', margin: '0 0 5px 0', fontWeight: 'bold' }}>
                {urgencia.texto}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', margin: 0 }}>
                Para usar todas las funciones debes verificar tu identidad
              </p>
            </div>

            <div style={{ padding: '30px' }}>

              {/* Contador de días */}
              {diasRestantes !== null && (
                <div style={{
                  backgroundColor: urgencia.bg,
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  marginBottom: '25px'
                }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666' }}>Tiempo restante para verificar</p>
                  <p style={{ margin: '0 0 3px 0', fontSize: '42px', fontWeight: 'bold', color: urgencia.color, lineHeight: 1 }}>
                    {diasRestantes}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: urgencia.color, fontWeight: '600' }}>
                    {diasRestantes === 1 ? 'día' : 'días'}
                  </p>
                  {/* Barra de progreso */}
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${porcentajeUsado}%`,
                        height: '100%',
                        backgroundColor: colorBarra,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                      <span style={{ fontSize: '11px', color: '#999' }}>Día 0</span>
                      <span style={{ fontSize: '11px', color: '#999' }}>Día 60 (límite)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Requisitos */}
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '14px', color: '#333', marginBottom: '12px', fontWeight: 'bold' }}>
                  📋 ¿Qué necesitas para verificarte?
                </h3>
                {[
                  'Tu constancia de estudios vigente del IPN',
                  'El archivo debe ser en formato PDF',
                  'El QR de la constancia debe ser legible',
                  'Los datos deben coincidir con tu registro'
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ color: '#28a745', fontSize: '14px', flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: '13px', color: '#555', lineHeight: '1.4' }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Advertencia urgente */}
              {diasRestantes !== null && diasRestantes <= 10 && (
                <div style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '6px',
                  padding: '12px 15px',
                  marginBottom: '20px',
                  display: 'flex',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>⏳</span>
                  <p style={{ margin: 0, fontSize: '13px', color: '#856404', lineHeight: '1.5' }}>
                    <strong>¡Atención!</strong> Si no verificas en los próximos {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'}, tu cuenta será <strong>eliminada automáticamente</strong>.
                  </p>
                </div>
              )}

              {/* Botones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => navigate('/arrendatario/verificar-identidad')}
                  style={{
                    width: '100%', padding: '14px',
                    backgroundColor: urgencia.color, color: 'white',
                    border: 'none', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '15px', fontWeight: 'bold'
                  }}
                >
                  📤 Verificar mi identidad ahora
                </button>
                <button
                  onClick={() => navigate('/arrendatario/buscar-vivienda')}
                  style={{
                    width: '100%', padding: '12px',
                    backgroundColor: 'white', color: '#555',
                    border: '1px solid #ddd', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '14px'
                  }}
                >
                  Buscar vivienda sin verificar
                </button>
              </div>

            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '15px' }}>
            Tu información es tratada de forma segura y solo se usa para verificar tu identidad estudiantil en Burroomies.
          </p>

        </div>
      </div>

      <FooterInicio />
    </div>
  )
}

export default VerificacionPendiente