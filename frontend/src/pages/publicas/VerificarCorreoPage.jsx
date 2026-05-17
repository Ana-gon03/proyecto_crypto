import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import NavbarRegistro from '../../components/common/NavbarRegistro'
import FooterRegistro from '../../components/common/FooterInicio'
import { verificarCodigo, reenviarCodigo, actualizarCorreo, validarCampo } from '../../services/authService'
import '../../styles/VerificarCorreo.css'

const VerificarCorreoPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [verificadoConDocumento, setVerificadoConDocumento] = useState(null)
  const [rolUsuario, setRolUsuario] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [nuevoCorreo, setNuevoCorreo] = useState('')
  const [modoEdicion, setModoEdicion] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [tiempoReenvio, setTiempoReenvio] = useState(0)

  useEffect(() => {
    const correoRegistro = location.state?.correo
    const verificado = location.state?.verificadoConDocumento ?? null
    const rol = location.state?.rol ?? null
    if (correoRegistro) {
      setCorreo(correoRegistro)
      setNuevoCorreo(correoRegistro)
      setVerificadoConDocumento(verificado)
      setRolUsuario(rol)
    } else {
      navigate('/registro')
    }
  }, [location, navigate])

  useEffect(() => {
    if (tiempoReenvio > 0) {
      const timer = setTimeout(() => setTiempoReenvio(tiempoReenvio - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [tiempoReenvio])

  const handleVerificar = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    setMensaje('')
    try {
      const response = await verificarCodigo(correo, codigo)
      setMensaje(response.message)
      setTimeout(() => {
        navigate('/bienvenida', {
          state: {
            rol: response.rol || rolUsuario || 'estudiante',
            verificadoConDocumento
          }
        })
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al verificar el código')
    } finally {
      setCargando(false)
    }
  }

  const handleReenviar = async () => {
    setCargando(true)
    setError('')
    setMensaje('')
    try {
      const response = await reenviarCodigo(correo)
      setMensaje(response.message)
      setTiempoReenvio(60)
      setCodigo('')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al reenviar el código')
    } finally {
      setCargando(false)
    }
  }

  const handleActualizarCorreo = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    setMensaje('')

    if (!nuevoCorreo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoCorreo)) {
      setError('Ingresa un correo electrónico válido')
      setCargando(false)
      return
    }

    try {
      const resultado = await validarCampo('correo', nuevoCorreo)
      if (resultado.existe) {
        setError('Este correo ya está registrado por otra cuenta')
        setCargando(false)
        return
      }
    } catch {
      setError('No se pudo verificar el correo. Intenta de nuevo.')
      setCargando(false)
      return
    }

    try {
      const response = await actualizarCorreo(correo, nuevoCorreo)
      setMensaje(response.message)
      setCorreo(nuevoCorreo)
      setModoEdicion(false)
      setTiempoReenvio(0)
      setCodigo('')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar el correo')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="verificar-page">
      <NavbarRegistro />
      
      <div className="verificar-container">
        <div className="verificar-card">
          <div className="verificar-header">
            <div className="verificar-icon">📧</div>
            <h2>Verifica tu correo</h2>
            <p>Ingresa el código que enviamos a tu bandeja</p>
          </div>
          
          <div className="verificar-body">
            <div className="verificar-info">
              <label>Correo registrado</label>
              <div className="verificar-email">{correo}</div>
              {!modoEdicion ? (
                <button
                  type="button"
                  className="verificar-update-btn"
                  onClick={() => setModoEdicion(true)}
                >
                  ¿Correo incorrecto? Actualizar →
                </button>
              ) : (
                <form onSubmit={handleActualizarCorreo} className="verificar-update-form">
                  <input
                    type="email"
                    className="verificar-input"
                    value={nuevoCorreo}
                    onChange={(e) => setNuevoCorreo(e.target.value)}
                    placeholder="Ingresa tu correo correcto"
                    required
                  />
                  <div className="verificar-button-group">
                    <button type="submit" className="verificar-btn-primary-small" disabled={cargando}>
                      {cargando ? 'Verificando...' : 'Actualizar'}
                    </button>
                    <button
                      type="button"
                      className="verificar-btn-secondary-small"
                      onClick={() => { setModoEdicion(false); setNuevoCorreo(correo); setError('') }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>

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

              {error && (
                <div className="verificar-error">
                  <span>⚠️</span> {error}
                </div>
              )}
              {mensaje && (
                <div className="verificar-success">
                  <span>✓</span> {mensaje}
                </div>
              )}

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
                {tiempoReenvio > 0
                  ? `Reenviar código en ${tiempoReenvio}s`
                  : 'Reenviar código'}
              </button>
            </form>

            <div className="verificar-hint">
              Revisa tu bandeja de entrada y spam. El código expira en 24 horas.
            </div>
          </div>
        </div>
      </div>
      
      <FooterRegistro />
    </div>
  )
}

export default VerificarCorreoPage