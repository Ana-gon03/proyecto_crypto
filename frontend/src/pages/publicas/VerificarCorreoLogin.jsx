import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import NavbarInicio from '../../components/common/NavbarInicio'
import FooterInicio from '../../components/common/FooterInicio'
import { verificarCodigoLogin, reenviarCodigo, actualizarCorreo, validarCampo } from '../../services/authService'

const VerificarCorreoLogin = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const [correo, setCorreo] = useState('')
  const [userId, setUserId] = useState(null)
  const [rol, setRol] = useState(null)
  const [arrendadorId, setArrendadorId] = useState(null)
  const [arrendatarioId, setArrendatarioId] = useState(null)
  const [fechaRegistro, setFechaRegistro] = useState(null)
  const [arrendatarioVerificadoInicial, setArrendatarioVerificadoInicial] = useState(null)

  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [tiempoReenvio, setTiempoReenvio] = useState(60)

  const [modoEdicion, setModoEdicion] = useState(false)
  const [nuevoCorreo, setNuevoCorreo] = useState('')

  useEffect(() => {
    const state = location.state
    if (!state?.correo) {
      navigate('/usuarios/inicio-sesion')
      return
    }
    setCorreo(state.correo)
    setNuevoCorreo(state.correo)
    setUserId(state.userId)
    setRol(state.rol)
    setArrendadorId(state.arrendadorId || null)
    setArrendatarioId(state.arrendatarioId || null)
    setFechaRegistro(state.fechaRegistro || null)
    setArrendatarioVerificadoInicial(state.arrendatarioVerificado ?? null)
  }, [location, navigate])

  useEffect(() => {
    if (tiempoReenvio <= 0) return
    const timer = setTimeout(() => setTiempoReenvio(tiempoReenvio - 1), 1000)
    return () => clearTimeout(timer)
  }, [tiempoReenvio])

  const handleVerificar = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    setMensaje('')
    try {
      const data = await verificarCodigoLogin(correo, codigo)
      setMensaje('¡Correo verificado! Redirigiendo...')
      setTimeout(() => {
        if (rol === 'arrendador') {
          localStorage.setItem('correoVerificado', '1')
          localStorage.setItem('userId', userId)
          localStorage.setItem('rol', rol)
          localStorage.setItem('arrendadorId', arrendadorId)
          navigate('/arrendador/mis-arrendamientos')
          return
        }
        if (rol === 'arrendatario') {
        const verificadoIdentidad = data.arrendatarioVerificado === 1 || arrendatarioVerificadoInicial === 1
        if (verificadoIdentidad) {
            navigate('/arrendatario/buscar-vivienda')
            return
        }
        // Dejar que el backend decida si expiró o no
        navigate('/verificar-expiracion', { state: { userId } })
        }
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
      await reenviarCodigo(correo)
      setMensaje('Código reenviado. Revisa tu correo.')
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
    setError('')
    setMensaje('')

    if (!nuevoCorreo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoCorreo)) {
      setError('Ingresa un correo electrónico válido')
      return
    }

    setCargando(true)
    try {
      const resultado = await validarCampo('correo', nuevoCorreo)
      if (resultado.existe) {
        setError('Este correo ya está registrado por otra cuenta')
        setCargando(false)
        return
      }
      await actualizarCorreo(correo, nuevoCorreo)
      setCorreo(nuevoCorreo)
      setModoEdicion(false)
      setTiempoReenvio(0)
      setCodigo('')
      setMensaje('Correo actualizado. Se envió un nuevo código.')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar el correo')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarInicio />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h2>Verificación de Correo</h2>
          <p style={{ marginBottom: '1rem', color: '#555' }}>
            Ingresa el código de 8 dígitos que enviamos a <strong>{correo}</strong>
          </p>

          <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            {!modoEdicion ? (
              <button
                type="button"
                onClick={() => { setModoEdicion(true); setError(''); setMensaje('') }}
                style={{ background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.85rem' }}
              >
                ¿Correo incorrecto o no te llega? Actualizar correo
              </button>
            ) : (
              <form onSubmit={handleActualizarCorreo}>
                <label style={{ fontSize: '0.85rem' }}>Nuevo correo:</label><br />
                <input
                  type="email"
                  value={nuevoCorreo}
                  onChange={(e) => setNuevoCorreo(e.target.value)}
                  placeholder="nuevo@correo.com"
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}
                  required
                />
                <button type="submit" disabled={cargando} style={{ marginRight: '0.5rem', padding: '0.4rem 0.75rem' }}>
                  {cargando ? 'Actualizando...' : 'Actualizar'}
                </button>
                <button
                  type="button"
                  onClick={() => { setModoEdicion(false); setNuevoCorreo(correo); setError('') }}
                  style={{ padding: '0.4rem 0.75rem' }}
                >
                  Cancelar
                </button>
              </form>
            )}
          </div>

          <form onSubmit={handleVerificar}>
            <div style={{ marginBottom: '1rem' }}>
              <label>Código de verificación:</label><br />
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                placeholder="12345678"
                style={{ width: '100%', padding: '0.75rem', fontSize: '1.3rem', textAlign: 'center', marginTop: '0.25rem', letterSpacing: '0.3rem' }}
                required
              />
            </div>

            {error && (
              <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', border: '1px solid red', borderRadius: '4px' }}>
                {error}
              </div>
            )}
            {mensaje && (
              <div style={{ color: 'green', marginBottom: '1rem', padding: '0.5rem', border: '1px solid green', borderRadius: '4px' }}>
                {mensaje}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando || codigo.length !== 8}
              style={{ width: '100%', padding: '0.75rem', marginBottom: '0.5rem', cursor: (cargando || codigo.length !== 8) ? 'not-allowed' : 'pointer' }}
            >
              {cargando ? 'Verificando...' : 'Verificar Código'}
            </button>

            <button
              type="button"
              onClick={handleReenviar}
              disabled={cargando || tiempoReenvio > 0}
              style={{ width: '100%', padding: '0.75rem', cursor: (cargando || tiempoReenvio > 0) ? 'not-allowed' : 'pointer' }}
            >
              {tiempoReenvio > 0 ? `Reenviar código en ${tiempoReenvio}s` : 'Reenviar código'}
            </button>
          </form>

          <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#888', textAlign: 'center' }}>
            Revisa tu bandeja de entrada y spam. El código expira en 24 horas.
          </p>

          <p style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
            <button
              type="button"
              onClick={() => navigate('/usuarios/inicio-sesion')}
              style={{ background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              Volver al inicio de sesión
            </button>
          </p>
        </div>
      </main>
      <FooterInicio />
    </div>
  )
}

export default VerificarCorreoLogin