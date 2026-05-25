import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'
import GestionLlaves from '../../components/common/GestionLlaves'
import api from '../../services/api'
import '../../styles/Arrendatario.css'

const PerfilArrendatario = () => {
  const navigate = useNavigate()

  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')

  const [nombres, setNombres] = useState('')
  const [apellidoPaterno, setApellidoPaterno] = useState('')
  const [apellidoMaterno, setApellidoMaterno] = useState('')
  const [telefono, setTelefono] = useState('')
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [usernameDisponible, setUsernameDisponible] = useState(true)

  const [modal, setModal] = useState({ isOpen: false, type: '', message: '', title: '' })

  useEffect(() => {
    cargarPerfil()
  }, [])

  const mostrarModal = (type, title, message) => setModal({ isOpen: true, type, title, message })
  const cerrarModal = () => setModal({ isOpen: false, type: '', message: '', title: '' })

  const cargarPerfil = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem('userId')
      const arrendatarioId = localStorage.getItem('arrendatarioId')

      if (!userId || !arrendatarioId) {
        setError('No has iniciado sesión')
        setLoading(false)
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/usuarios/perfil-arrendatario`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-arrendatario-id': arrendatarioId
        }
      })

      if (!response.ok) throw new Error('Error al cargar perfil')

      const data = await response.json()
      setPerfil(data)
      setNombres(data.usuario?.usuarioNom || '')
      setApellidoPaterno(data.usuario?.usuarioApePat || '')
      setApellidoMaterno(data.usuario?.usuarioApeMat || '')
      setTelefono(data.usuario?.usuarioTel || '')
      setUsername(data.arrendatarioUser || '')
    } catch (err) {
      setError('No se pudo cargar tu perfil')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const verificarUsername = async (usernameNuevo) => {
    if (usernameNuevo === perfil?.arrendatarioUser) {
      setUsernameDisponible(true)
      setUsernameError('')
      return
    }
    try {
      const response = await api.post('/auth/validar-campo', { campo: 'username', valor: usernameNuevo })
      if (response.data.existe) {
        setUsernameDisponible(false)
        setUsernameError('Este username ya está en uso')
      } else {
        setUsernameDisponible(true)
        setUsernameError('')
      }
    } catch (err) {
      console.error('Error al verificar username:', err)
    }
  }

  const handleUsernameChange = (e) => {
    const valor = e.target.value.replace(/\s/g, '').toLowerCase()
    setUsername(valor)
    if (valor.length >= 3) {
      verificarUsername(valor)
    } else {
      setUsernameError('Mínimo 3 caracteres')
      setUsernameDisponible(false)
    }
  }

  const handleGuardar = async () => {
    if (!usernameDisponible) {
      mostrarModal('error', 'Error', 'Corrige los errores antes de guardar')
      return
    }
    try {
      setGuardando(true)
      const userId = localStorage.getItem('userId')
      const arrendatarioId = localStorage.getItem('arrendatarioId')

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/usuarios/actualizar-perfil-arrendatario`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-arrendatario-id': arrendatarioId
        },
        body: JSON.stringify({
          usuarioNom: nombres,
          usuarioApePat: apellidoPaterno,
          usuarioApeMat: apellidoMaterno,
          usuarioTel: telefono,
          arrendatarioUser: username
        })
      })

      if (!response.ok) throw new Error('Error al guardar')

      const data = await response.json()
      setPerfil(data.perfil)
      setEditando(false)
      setMensajeExito('Perfil actualizado exitosamente')
      setTimeout(() => setMensajeExito(''), 3000)
    } catch (err) {
      mostrarModal('error', 'Error', 'Error al guardar los cambios')
      console.error('Error:', err)
    } finally {
      setGuardando(false)
    }
  }

  const handleCancelar = () => {
    setNombres(perfil?.usuario?.usuarioNom || '')
    setApellidoPaterno(perfil?.usuario?.usuarioApePat || '')
    setApellidoMaterno(perfil?.usuario?.usuarioApeMat || '')
    setTelefono(perfil?.usuario?.usuarioTel || '')
    setUsername(perfil?.arrendatarioUser || '')
    setUsernameError('')
    setUsernameDisponible(true)
    setEditando(false)
  }

  const handleEliminarCuenta = async () => {
    try {
      const userId = localStorage.getItem('userId')
      const arrendatarioId = localStorage.getItem('arrendatarioId')

      if (!userId || !arrendatarioId) {
        mostrarModal('error', 'Error', 'No has iniciado sesión')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/usuarios/eliminar-cuenta-arrendatario`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-arrendatario-id': arrendatarioId
        }
      })

      const data = await response.json()

      if (response.ok) {
        mostrarModal('success', 'Cuenta eliminada', data.message || 'Cuenta eliminada exitosamente')
        setTimeout(() => {
          localStorage.clear()
          navigate('/')
        }, 2000)
      } else {
        mostrarModal('error', 'Error', data.error || 'Error al eliminar la cuenta')
      }
    } catch (err) {
      console.error('Error:', err)
      mostrarModal('error', 'Error', 'Error al eliminar la cuenta')
    }
  }

  const confirmarEliminarCuenta = () => {
    mostrarModal('confirm', '⚠️ Eliminar Cuenta',
      '¿Estás seguro de eliminar tu cuenta? Esta acción no se puede deshacer. Tus datos personales serán eliminados, pero tus reseñas se conservarán de forma anónima.')
  }

  const usuario = perfil?.usuario || {}
  const carrera = perfil?.carrera || {}
  const nombreCompleto = [usuario.usuarioNom, usuario.usuarioApePat, usuario.usuarioApeMat].filter(Boolean).join(' ')

  if (loading) {
    return (
      <div className="atr-page">
        <NavbarArrendatario />
        <div className="atr-loading-center">
          <div className="atr-spinner" />
          <p>Cargando perfil…</p>
        </div>
        <FooterInicio />
      </div>
    )
  }

  return (
    <div className="atr-page">
      <NavbarArrendatario />

      <div className="atr-main">
        <h1 className="atr-page-title">Mi Perfil</h1>

        {/* Éxito */}
        {mensajeExito && (
          <div className="atr-alert atr-alert-success" style={{ marginBottom: '1.25rem' }}>
            <div className="atr-alert-icon">✅</div>
            <div className="atr-alert-body">
              <div className="atr-alert-title">{mensajeExito}</div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="atr-alert atr-alert-error" style={{ marginBottom: '1.25rem' }}>
            <div className="atr-alert-icon">⚠️</div>
            <div className="atr-alert-body">
              <div className="atr-alert-title">{error}</div>
            </div>
          </div>
        )}

        {perfil && (
          <div className="atr-card">

            {/* ── Hero ── */}
            <div className="atr-profile-hero">
              <div className="atr-profile-hero-avatar">
                {usuario.usuarioNom?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <h2 className="atr-profile-hero-name">{nombreCompleto || '—'}</h2>
              <p className="atr-profile-hero-username">@{perfil.arrendatarioUser}</p>
              <span className="atr-profile-hero-role">Estudiante IPN · UPALM</span>
            </div>

            <div className="atr-card-body">

              {!editando ? (
                <>
                  {/* Información Personal */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div className="atr-section-header">
                      <div className="atr-section-dot" />
                      <p className="atr-section-title" style={{ margin: 0 }}>Información Personal</p>
                    </div>
                    <div className="atr-info-grid">
                      <div className="atr-info-cell">
                        <div className="atr-info-label">Nombre</div>
                        <div className="atr-info-value">{usuario.usuarioNom || '—'}</div>
                      </div>
                      <div className="atr-info-cell">
                        <div className="atr-info-label">Apellido Paterno</div>
                        <div className="atr-info-value">{usuario.usuarioApePat || '—'}</div>
                      </div>
                      <div className="atr-info-cell">
                        <div className="atr-info-label">Apellido Materno</div>
                        <div className="atr-info-value">{usuario.usuarioApeMat || '—'}</div>
                      </div>
                      <div className="atr-info-cell">
                        <div className="atr-info-label">Teléfono</div>
                        <div className="atr-info-value">{usuario.usuarioTel || '—'}</div>
                      </div>
                      <div className="atr-info-cell atr-info-cell-full">
                        <div className="atr-info-label">Correo electrónico</div>
                        <div className="atr-info-value">{usuario.usuarioCorreo || '—'}</div>
                      </div>
                      <div className="atr-info-cell">
                        <div className="atr-info-label">CURP</div>
                        <div className="atr-info-value-muted" style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{usuario.usuarioCurp || '—'}</div>
                      </div>
                      <div className="atr-info-cell">
                        <div className="atr-info-label">Fecha de Nacimiento</div>
                        <div className="atr-info-value">
                          {usuario.usuarioFechaNac
                            ? new Date(usuario.usuarioFechaNac).toLocaleDateString('es-MX')
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información Académica */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div className="atr-section-header">
                      <div className="atr-section-dot" />
                      <p className="atr-section-title" style={{ margin: 0 }}>Información Académica</p>
                    </div>
                    <div className="atr-info-grid">
                      <div className="atr-info-cell">
                        <div className="atr-info-label">Número de Boleta</div>
                        <div className="atr-info-value" style={{ fontFamily: 'monospace' }}>{perfil.arrendatarioBoleta || '—'}</div>
                      </div>
                      <div className="atr-info-cell">
                        <div className="atr-info-label">Username</div>
                        <div className="atr-info-value">@{perfil.arrendatarioUser || '—'}</div>
                      </div>
                      <div className="atr-info-cell atr-info-cell-full">
                        <div className="atr-info-label">Carrera</div>
                        <div className="atr-info-value">{carrera.carreraNombre || '—'}</div>
                      </div>
                    </div>
                  </div>

                  <GestionLlaves
                    nombreUsuario={`${perfil?.usuario?.usuarioNom || ''} ${perfil?.usuario?.usuarioApePat || ''}`}
                  />

                  <div className="atr-btn-group" style={{ marginTop: '1rem' }}>
                    <button className="atr-btn-primary" onClick={() => setEditando(true)}>
                      Editar Perfil
                    </button>
                    <hr className="atr-divider" style={{ margin: '0.25rem 0' }} />
                    <button className="atr-btn-danger" onClick={confirmarEliminarCuenta}>
                      Eliminar Cuenta
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Formulario de edición */}
                  <div className="atr-section-header" style={{ marginBottom: '1rem' }}>
                    <div className="atr-section-dot" />
                    <p className="atr-section-title" style={{ margin: 0 }}>Editar Información</p>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <FormField label="Nombre" value={nombres} onChange={(e) => setNombres(e.target.value)} />
                    <FormField label="Apellido Paterno" value={apellidoPaterno} onChange={(e) => setApellidoPaterno(e.target.value)} />
                    <FormField label="Apellido Materno" value={apellidoMaterno} onChange={(e) => setApellidoMaterno(e.target.value)} />
                    <FormField label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} type="tel" />

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={labelStyle}>Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={handleUsernameChange}
                        style={{
                          ...inputStyle,
                          borderColor: usernameError ? '#DC2626' : (usernameDisponible && username !== perfil?.arrendatarioUser) ? '#059669' : '#e5e7eb'
                        }}
                      />
                      {usernameError && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#DC2626' }}>{usernameError}</p>
                      )}
                      {!usernameError && username !== perfil?.arrendatarioUser && usernameDisponible && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#059669' }}>Disponible</p>
                      )}
                    </div>
                  </div>

                  <div className="atr-section-header" style={{ marginBottom: '0.75rem' }}>
                    <div className="atr-section-dot" />
                    <p className="atr-section-title" style={{ margin: 0, color: '#9ca3af' }}>Campos no editables</p>
                  </div>
                  <div className="atr-info-grid" style={{ marginBottom: '1.5rem' }}>
                    <div className="atr-info-cell atr-info-cell-full">
                      <div className="atr-info-label">Correo</div>
                      <div className="atr-info-value-muted">{usuario.usuarioCorreo}</div>
                    </div>
                    <div className="atr-info-cell">
                      <div className="atr-info-label">CURP</div>
                      <div className="atr-info-value-muted">{usuario.usuarioCurp}</div>
                    </div>
                    <div className="atr-info-cell">
                      <div className="atr-info-label">Boleta</div>
                      <div className="atr-info-value-muted">{perfil.arrendatarioBoleta}</div>
                    </div>
                  </div>

                  <div className="atr-modal-actions" style={{ justifyContent: 'stretch' }}>
                    <button className="atr-btn-ghost" style={{ flex: 1 }} onClick={handleCancelar}>
                      Cancelar
                    </button>
                    <button
                      className="atr-btn-primary"
                      style={{ flex: 1 }}
                      disabled={guardando || !usernameDisponible}
                      onClick={handleGuardar}
                    >
                      {guardando ? 'Guardando…' : 'Guardar Cambios'}
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.isOpen && (
        <div
          className="atr-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModal() }}
        >
          <div className="atr-modal">
            <div className="atr-modal-icon">
              {modal.type === 'confirm' ? '⚠️' : modal.type === 'success' ? '✅' : '❌'}
            </div>
            <h3 className="atr-modal-title">{modal.title}</h3>
            <p className="atr-modal-desc" style={{ whiteSpace: 'pre-line' }}>{modal.message}</p>
            <div className="atr-modal-actions">
              {modal.type === 'confirm' ? (
                <>
                  <button className="atr-btn-ghost" style={{ width: 'auto', padding: '10px 24px' }} onClick={cerrarModal}>
                    Cancelar
                  </button>
                  <button
                    className="atr-btn-danger"
                    style={{ width: 'auto', padding: '10px 24px' }}
                    onClick={() => { cerrarModal(); handleEliminarCuenta() }}
                  >
                    Sí, eliminar
                  </button>
                </>
              ) : (
                <button className="atr-btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={cerrarModal}>
                  Entendido
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <FooterInicio />
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: '700',
  color: '#374151',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1.5px solid #e5e7eb',
  fontSize: '0.875rem',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  color: '#111827',
  boxSizing: 'border-box',
  outline: 'none',
  background: '#fafafa',
  transition: 'border-color 0.2s'
}

const InfoRow = ({ label, value, bloqueado }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '0.875rem',
    gap: '1rem'
  }}>
    <span style={{ color: '#6b7280', flexShrink: 0 }}>{label}</span>
    <span style={{ color: bloqueado ? '#9ca3af' : '#111827', fontWeight: '600', textAlign: 'right', wordBreak: 'break-all' }}>
      {value}
    </span>
  </div>
)

const FormField = ({ label, value, onChange, type = 'text' }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={labelStyle}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      style={inputStyle}
    />
  </div>
)

export default PerfilArrendatario
