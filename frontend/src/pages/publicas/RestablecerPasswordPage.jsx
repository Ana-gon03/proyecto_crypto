import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import NavbarInicio from '../../components/common/NavbarRegistro'
import FooterInicio from '../../components/common/FooterInicio'
import '../../styles/VerificarCorreo.css'

const RestablecerPasswordPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const correo = location.state?.correo || ''

  const [paso, setPaso] = useState(1)
  const [codigo, setCodigo] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  if (!correo) {
    navigate('/usuarios/inicio-sesion')
    return null
  }

  const handleVerificarCodigo = async (e) => {
    e.preventDefault()
    setError('')

    if (codigo.length !== 8) {
      setError('El código debe tener 8 dígitos')
      return
    }

    setCargando(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/verificar-codigo-recuperacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, codigo })
      })

      const data = await response.json()

      if (response.ok) {
        setPaso(2)
      } else {
        setError(data.error || 'Código incorrecto')
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const handleRestablecerPassword = async (e) => {
    e.preventDefault()
    setError('')

    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    
    if (!pwRegex.test(nuevaPassword)) {
      setError('La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo')
      return
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setCargando(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/restablecer-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, codigo, nuevaPassword })
      })

      const data = await response.json()

      if (response.ok) {
        setExito(true)
        setTimeout(() => {
          navigate('/usuarios/inicio-sesion')
        }, 3000)
      } else {
        setError(data.error || 'Error al restablecer')
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const handleReenviarCodigo = async () => {
    setCargando(true)
    setError('')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/recuperar-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Código reenviado a tu correo')
      } else {
        setError(data.error || 'Error al reenviar')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="verificar-page">
      <NavbarInicio />
      
      <div className="verificar-container">
        <div className="verificar-card">
          <div className="verificar-header">
            <div className="verificar-icon">
              {exito ? '✅' : paso === 1 ? '📧' : '🔐'}
            </div>
            <h2>
              {exito 
                ? '¡Contraseña restablecida!' 
                : paso === 1 
                  ? 'Verificar código' 
                  : 'Nueva contraseña'
              }
            </h2>
            <p>
              {exito 
                ? 'Serás redirigido al inicio de sesión...' 
                : paso === 1 
                  ? `Enviamos un código de 8 dígitos a ${correo}`
                  : 'Ingresa tu nueva contraseña'
              }
            </p>
          </div>
          
          <div className="verificar-body">

            {error && (
              <div className="verificar-error">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* PASO 1: Ingresar código */}
            {!exito && paso === 1 && (
              <form onSubmit={handleVerificarCodigo}>
                <div className="verificar-code-group">
                  <label className="verificar-code-label">Código de verificación (8 dígitos)</label>
                  <input
                    type="text"
                    className="verificar-code-input"
                    value={codigo}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '').slice(0, 8)
                      setCodigo(valor)
                      setError('')
                    }}
                    placeholder="12345678"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="verificar-btn verificar-btn-primary"
                  disabled={cargando || codigo.length !== 8}
                >
                  {cargando ? 'Verificando...' : 'Verificar código →'}
                </button>

                <button
                  type="button"
                  className="verificar-btn verificar-btn-secondary"
                  onClick={handleReenviarCodigo}
                  disabled={cargando}
                >
                  📧 Reenviar código
                </button>
              </form>
            )}

            {/* PASO 2: Nueva contraseña */}
            {!exito && paso === 2 && (
              <form onSubmit={handleRestablecerPassword}>
                <div className="verificar-code-group">
                  <label className="verificar-code-label">Nueva contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      className="verificar-code-input"
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      style={{ letterSpacing: 'normal' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="verificar-password-toggle"
                    >
                      {mostrarPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="verificar-code-group">
                  <label className="verificar-code-label">Confirmar contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      className="verificar-code-input"
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      placeholder="Repite tu nueva contraseña"
                      style={{ letterSpacing: 'normal' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="verificar-password-toggle"
                    >
                      {mostrarPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="verificar-info" style={{ marginBottom: '1.5rem' }}>
                  <label>Requisitos de la contraseña</label>
                  <ul>
                    <li>Mínimo 8 caracteres</li>
                    <li>Al menos una letra mayúscula</li>
                    <li>Al menos una letra minúscula</li>
                    <li>Al menos un número</li>
                    <li>Al menos un símbolo (@$!%*?&)</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  className="verificar-btn verificar-btn-primary"
                  disabled={cargando}
                >
                  {cargando ? 'Restableciendo...' : 'Restablecer Contraseña →'}
                </button>
              </form>
            )}

            <div className="verificar-hint">
              <button
                onClick={() => navigate('/usuarios/inicio-sesion')}
                className="verificar-back-btn"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <FooterInicio />
    </div>
  )
}

export default RestablecerPasswordPage