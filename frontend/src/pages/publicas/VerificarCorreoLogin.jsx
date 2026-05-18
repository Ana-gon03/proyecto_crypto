import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import NavbarSimple from '../../components/common/NavbarSimple'
import FooterInicio from '../../components/common/FooterInicio'
import '../../styles/VerificarCorreo.css'

const VerificarCorreoLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { correo, userId, rol, arrendadorId, arrendatarioId, fechaRegistro, arrendatarioVerificado } = location.state || {}

  const [codigo, setCodigo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [tiempoReenvio, setTiempoReenvio] = useState(60)

  if (!correo) {
    navigate('/usuarios/inicio-sesion')
    return null
  }

  useEffect(() => {
    if (tiempoReenvio <= 0) return
    const timer = setTimeout(() => setTiempoReenvio(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [tiempoReenvio])

  const handleVerificar = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')
    if (codigo.length !== 8) { setError('El código debe tener 8 dígitos'); return }
    setCargando(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/verificar-correo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, codigo })
      })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'Código incorrecto o expirado'); return }

      localStorage.setItem('correoVerificado', '1')

      if (rol === 'arrendador') {
        navigate('/arrendador/mis-arrendamientos')
      } else if (rol === 'arrendatario') {
        if (!arrendatarioVerificado) {
          navigate('/verificar-expiracion')
        } else {
          navigate('/arrendatario/buscar-vivienda')
        }
      } else {
        navigate('/usuarios/inicio-sesion')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const handleReenviar = async () => {
    setCargando(true)
    setError('')
    setMensaje('')
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/reenviar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo })
      })
      const data = await response.json()
      if (response.ok) {
        setMensaje('Código reenviado. Revisa tu correo.')
        setTiempoReenvio(60)
        setCodigo('')
      } else {
        setError(data.error || 'Error al reenviar')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="verificar-page">
      <NavbarSimple />
      <div className="verificar-container">
        <div className="verificar-card">
          <div className="verificar-header">
            <div className="verificar-icon">🔐</div>
            <h2>Verifica tu cuenta</h2>
            <p>Ingresa el código que enviamos a <strong>{correo}</strong></p>
          </div>
          <div className="verificar-body">
            {error && <div className="verificar-error"><span>⚠️</span> {error}</div>}
            {mensaje && <div className="verificar-success"><span>✓</span> {mensaje}</div>}

            <form onSubmit={handleVerificar}>
              <div className="verificar-code-group">
                <label className="verificar-code-label">Código de verificación (8 dígitos)</label>
                <input
                  type="text"
                  className="verificar-code-input"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                  placeholder="12345678"
                  required
                />
              </div>
              <button
                type="submit"
                className="verificar-btn verificar-btn-primary"
                disabled={cargando || codigo.length !== 8}
              >
                {cargando ? 'Verificando...' : 'Verificar Código →'}
              </button>
              <button
                type="button"
                className="verificar-btn verificar-btn-secondary"
                onClick={handleReenviar}
                disabled={cargando || tiempoReenvio > 0}
              >
                {tiempoReenvio > 0 ? `Reenviar código en ${tiempoReenvio}s` : 'Reenviar código'}
              </button>
            </form>

            <div className="verificar-hint">
              <button
                onClick={() => navigate('/usuarios/inicio-sesion')}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                ← Volver a Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
      <FooterInicio />
    </div>
  )
}

export default VerificarCorreoLogin
