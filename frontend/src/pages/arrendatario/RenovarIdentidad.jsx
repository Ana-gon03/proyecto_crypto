import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'
import SubirDocumento from '../../components/ui/SubirDocumento'
import '../../styles/Arrendatario.css'

const RenovarIdentidad = () => {
  const navigate = useNavigate()
  const [constanciaFile, setConstanciaFile] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [erroresDetalle, setErroresDetalle] = useState([])

  const handleEnviar = async () => {
    if (!constanciaFile) {
      setError('Debes seleccionar tu constancia en PDF')
      return
    }

    const userId = localStorage.getItem('userId')
    if (!userId) {
      navigate('/usuarios/inicio-sesion')
      return
    }

    try {
      setEnviando(true)
      setError(null)
      setErroresDetalle([])

      const fd = new FormData()
      fd.append('userId', userId)
      fd.append('constancia', constanciaFile)

      const response = await fetch('http://localhost:5000/api/auth/renovar-identidad', {
        method: 'POST',
        body: fd
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al renovar')
        if (data.detalles) setErroresDetalle(data.detalles)
        return
      }

      localStorage.setItem('arrendatarioVerificado', 'true')
      localStorage.setItem('arrendatarioFechaVerificacion', new Date().toISOString())

      navigate('/arrendatario/verificacion-exitosa', {
        state: { esRenovacion: true }
      })

    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.')
      console.error(err)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="atr-page">
      <NavbarArrendatario />

      <div className="atr-verify-wrapper">
        <div className="atr-verify-card" style={{ borderColor: '#D97706', borderWidth: '2px' }}>

          {/* Header naranja */}
          <div className="atr-verify-header atr-verify-header-warning">
            <div className="atr-verify-header-icon">🔄</div>
            <div className="atr-verify-header-title">Renovar verificación</div>
            <div className="atr-verify-header-sub">
              Tu verificación expiró. Sube tu constancia vigente para renovarla.
            </div>
          </div>

          <div className="atr-verify-body">

            {/* Aviso de expiración */}
            <div className="atr-alert atr-alert-warning" style={{ marginBottom: '1.25rem' }}>
              <div className="atr-alert-icon">⚠️</div>
              <div className="atr-alert-body">
                <div className="atr-alert-title">Tu verificación expiró</div>
                <div className="atr-alert-desc">
                  Por seguridad, las verificaciones duran 6 meses. Sube tu constancia más reciente
                  para renovarla y seguir viendo los datos de contacto de los arrendadores.
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="atr-instructions-box">
              <div className="atr-instructions-title">📋 Requisitos del documento</div>
              {[
                'Debe ser tu constancia de estudios vigente del IPN',
                'Formato PDF únicamente',
                'El código QR debe ser legible y estar vigente',
                'Los datos deben coincidir exactamente con tu registro'
              ].map((item, i) => (
                <div key={i} className="atr-req-item">
                  <div className="atr-req-check">✓</div>
                  <div className="atr-req-text">{item}</div>
                </div>
              ))}
            </div>

            {/* Subir documento */}
            <SubirDocumento
              tipo="constancia"
              onFileSelect={(file) => { setConstanciaFile(file); setError(null); setErroresDetalle([]) }}
              file={constanciaFile}
              setFile={setConstanciaFile}
              required={false}
              label="Constancia de Estudios (PDF)"
            />

            {/* Errores */}
            {error && (
              <div className="atr-error-box" style={{ marginBottom: '1.25rem' }}>
                <div className="atr-error-title">❌ {error}</div>
                {erroresDetalle.length > 0 && (
                  <ul className="atr-error-list">
                    {erroresDetalle.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Botones */}
            <div className="atr-btn-group">
              <button
                onClick={handleEnviar}
                disabled={enviando || !constanciaFile}
                className="atr-btn-primary"
              >
                {enviando ? '⏳ Verificando documento...' : '🔄 Renovar verificación'}
              </button>
              <button
                onClick={() => navigate('/arrendatario/buscar-vivienda')}
                className="atr-btn-ghost"
              >
                ← Volver
              </button>
            </div>

          </div>
        </div>
      </div>

      <FooterInicio />
    </div>
  )
}

export default RenovarIdentidad
