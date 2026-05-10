import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import NavbarRegistro from '../../components/common/NavbarRegistro'
import FooterRegistro from '../../components/common/FooterRegistro'
import { verificarCodigo, reenviarCodigo, actualizarCorreo, validarCampo } from '../../services/authService'

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
    // Leer el nombre correcto del campo que mandan RegistroEstudiante y RegistroArrendador
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

  // Timer para reenvío
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
        // Redirigir a bienvenida pasando si el estudiante verificó con documento o no
        navigate('/bienvenida', {
          state: {
            // Usar el rol que viene del state de registro; si el backend lo devuelve también, tiene prioridad
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

    // Verificar que el nuevo correo no esté ya registrado
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarRegistro />
      <main style={{ flex: 1, padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
        <h2>Verificación de Correo</h2>

        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
          <p><strong>Correo registrado:</strong> {correo}</p>
          {!modoEdicion ? (
            <button
              onClick={() => setModoEdicion(true)}
              style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}
            >
              ¿Correo incorrecto? Actualizar
            </button>
          ) : (
            <form onSubmit={handleActualizarCorreo} style={{ marginTop: '0.5rem' }}>
              <input
                type="email"
                value={nuevoCorreo}
                onChange={(e) => setNuevoCorreo(e.target.value)}
                placeholder="Ingresa tu correo correcto"
                style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
                required
              />
              <button type="submit" disabled={cargando}>
                {cargando ? 'Verificando...' : 'Actualizar correo'}
              </button>
              <button
                type="button"
                onClick={() => { setModoEdicion(false); setNuevoCorreo(correo); setError('') }}
                style={{ marginLeft: '0.5rem' }}
              >
                Cancelar
              </button>
            </form>
          )}
        </div>

        <form onSubmit={handleVerificar}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Código de verificación (8 dígitos):</label><br />
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
              placeholder="Ej: 12345678"
              style={{ width: '100%', padding: '0.5rem', fontSize: '1.2rem', textAlign: 'center' }}
              required
            />
          </div>

          {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
          {mensaje && <div style={{ color: 'green', marginBottom: '1rem' }}>{mensaje}</div>}

          <button
            type="submit"
            disabled={cargando || codigo.length !== 8}
            style={{ width: '100%', padding: '0.75rem', marginBottom: '0.5rem' }}
          >
            {cargando ? 'Verificando...' : 'Verificar Código'}
          </button>

          <button
            type="button"
            onClick={handleReenviar}
            disabled={cargando || tiempoReenvio > 0}
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {tiempoReenvio > 0
              ? `Reenviar código en ${tiempoReenvio} segundos`
              : 'Reenviar código'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
          <p>Revisa tu bandeja de entrada y spam. El código expira en 24 horas.</p>
        </div>
      </main>
      <FooterRegistro />
    </div>
  )
}

export default VerificarCorreoPage