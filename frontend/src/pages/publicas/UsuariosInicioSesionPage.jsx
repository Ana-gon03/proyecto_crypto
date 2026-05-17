import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUsuario, reenviarCodigo } from '../../services/authService'
import '../../styles/Login.css'

const UsuariosInicioSesionPage = () => {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)

  const [mostrarRecuperar, setMostrarRecuperar] = useState(false)
  const [correoRecuperar, setCorreoRecuperar] = useState('')
  const [enviandoRecuperar, setEnviandoRecuperar] = useState(false)
  const [mensajeRecuperar, setMensajeRecuperar] = useState('')
  const [errorRecuperar, setErrorRecuperar] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')

    try {
      const data = await loginUsuario(correo, password)

      if (data.rol === 'arrendador') {
        localStorage.setItem('userId', data.userId)
        localStorage.setItem('rol', data.rol)
        localStorage.setItem('correo', data.correo)
        localStorage.setItem('arrendadorId', data.arrendadorId)

        if (!data.correoVerificado) {
          await reenviarCodigo(data.correo)
          navigate('/verificar-correo-login', {
            state: {
              correo: data.correo,
              userId: data.userId,
              rol: 'arrendador',
              arrendadorId: data.arrendadorId
            }
          })
          return
        }
        localStorage.setItem('correoVerificado', '1')
        navigate('/arrendador/mis-arrendamientos')
        return
      }

      if (data.rol === 'arrendatario') {
        localStorage.setItem('userId', data.userId)
        localStorage.setItem('rol', data.rol)
        localStorage.setItem('correo', data.correo)
        localStorage.setItem('arrendatarioId', data.arrendatarioId)
        localStorage.setItem('fechaRegistro', data.fechaRegistro)
        localStorage.setItem('arrendatarioVerificado', data.arrendatarioVerificado)
        localStorage.setItem('arrendatarioFechaVerificacion', data.arrendatarioFechaVerificacion || null)

        if (!data.correoVerificado) {
          await reenviarCodigo(data.correo)
          navigate('/verificar-correo-login', {
            state: {
              correo: data.correo,
              userId: data.userId,
              rol: 'arrendatario',
              arrendatarioId: data.arrendatarioId,
              fechaRegistro: data.fechaRegistro,
              arrendatarioVerificado: data.arrendatarioVerificado
            }
          })
          return
        }

        localStorage.setItem('correoVerificado', '1')

        if (data.arrendatarioVerificado) {
          navigate('/arrendatario/buscar-vivienda')
          return
        }

        navigate('/verificar-expiracion', { state: { userId: data.userId } })
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const handleRecuperarPassword = async (e) => {
    e.preventDefault()

    if (!correoRecuperar.trim()) {
      setErrorRecuperar('Ingresa tu correo electrónico')
      return
    }

    setEnviandoRecuperar(true)
    setErrorRecuperar('')
    setMensajeRecuperar('')

    try {
      const response = await fetch('http://localhost:5000/api/auth/recuperar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: correoRecuperar })
      })

      const data = await response.json()

      if (response.ok) {
        setMensajeRecuperar('Código enviado. Redirigiendo...')
        setTimeout(() => {
          setMostrarRecuperar(false)
          navigate('/restablecer-password', { state: { correo: correoRecuperar } })
        }, 1000)
      } else {
        setErrorRecuperar(data.error || 'Error al enviar el código')
      }
    } catch (err) {
      setErrorRecuperar('Error de conexión. Intenta de nuevo.')
    } finally {
      setEnviandoRecuperar(false)
    }
  }

  return (
    <div className="login-page">

      {/* ═══ PANEL IZQUIERDO ═══ */}
      <div className="login-panel-left">
        {/* Marca */}
        <Link to="/" className="login-brand">
          <div className="login-brand-icon">🏠</div>
          <span className="login-brand-name">Blockhoom</span>
        </Link>

        {/* Contenido central */}
        <div className="login-left-body">
          <h2 className="login-left-title">
            Vivir cerca<br />
            de tu campus<br />
            <em>es posible.</em>
          </h2>
          <p className="login-left-sub">
            Miles de estudiantes de la UPALM ya dejaron de perder horas en
            traslados. Tú también puedes.
          </p>
          <div className="login-left-benefits">
            {[
              { icon: "🛡️", text: "Sin intermediarios ni agencias" },
              { icon: "💬", text: "Reseñas reales de la comunidad IPN" },
              { icon: "⚡", text: "Encuentra lugar en minutos, no en semanas" },
            ].map(({ icon, text }) => (
              <div className="login-left-benefit" key={text}>
                <div className="login-benefit-icon">{icon}</div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="login-left-footer">
          © 2025 Blockhoom · UPALM IPN
        </div>
      </div>

      {/* ═══ PANEL DERECHO — FORMULARIO ═══ */}
      <div className="login-panel-right">
        <div className="login-form-container">

          <div className="login-form-header">
            <Link to="/" className="login-form-back">
              ← Volver al inicio
            </Link>
            <h1 className="login-form-title">Hola, de nuevo</h1>
            <p className="login-form-subtitle">
              Ingresa tus datos y continúa donde lo dejaste
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="login-group">
              <label className="login-label">
                Correo electrónico <span>*</span>
              </label>
              <div className="login-input-wrapper">
                <input
                  type="email"
                  className="login-input"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
            </div>

            <div className="login-group">
              <label className="login-label">
                Contraseña <span>*</span>
              </label>
              <div className="login-input-wrapper">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  className="login-input login-input-icon"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              <div className="login-forgot">
                <button
                  type="button"
                  className="login-forgot-btn"
                  onClick={() => {
                    setMostrarRecuperar(true)
                    setErrorRecuperar('')
                    setMensajeRecuperar('')
                    setCorreoRecuperar('')
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <span>⚠️</span>
                <span className="login-error-text">{error}</span>
              </div>
            )}

            <button type="submit" className="login-btn" disabled={cargando}>
              {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>

            <div className="login-divider">
              <div className="login-divider-line" />
              <span>¿No tienes cuenta?</span>
              <div className="login-divider-line" />
            </div>

            <div className="login-register-link">
              <Link to="/registro">Regístrate aquí</Link>
            </div>
          </form>
        </div>
      </div>

      {/* ═══ MODAL RECUPERAR CONTRASEÑA ═══ */}
      {mostrarRecuperar && (
        <div className="recover-overlay" onClick={(e) => { if (e.target === e.currentTarget) setMostrarRecuperar(false) }}>
          <div className="recover-modal">
            <div className="recover-modal-icon">🔐</div>
            <h3 className="recover-modal-title">Recuperar Contraseña</h3>
            <p className="recover-modal-sub">
              Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña.
            </p>

            {mensajeRecuperar && (
              <div className="recover-success">✅ {mensajeRecuperar}</div>
            )}

            {errorRecuperar && (
              <div className="recover-error">❌ {errorRecuperar}</div>
            )}

            {!mensajeRecuperar && (
              <form onSubmit={handleRecuperarPassword}>
                <div className="recover-form-group">
                  <label className="recover-label">Correo electrónico</label>
                  <input
                    type="email"
                    className="recover-input"
                    value={correoRecuperar}
                    onChange={(e) => { setCorreoRecuperar(e.target.value); setErrorRecuperar('') }}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
                <div className="recover-btns">
                  <button
                    type="button"
                    className="recover-btn-cancel"
                    onClick={() => setMostrarRecuperar(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="recover-btn-submit"
                    disabled={enviandoRecuperar}
                  >
                    {enviandoRecuperar ? '⏳ Enviando...' : 'Enviar código'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UsuariosInicioSesionPage
