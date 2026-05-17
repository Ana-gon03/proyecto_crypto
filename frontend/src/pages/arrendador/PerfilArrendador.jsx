import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendador from '../../components/common/NavbarArrendador'
import FooterInicio from '../../components/common/FooterInicio'
import ModalConfirmacion from '../../components/common/ModalConfirmacion'
import { getPerfilArrendador, actualizarPerfilArrendador } from '../../services/authService'
import '../../styles/Arrendador.css'

const PerfilArrendador = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [modalAlerta, setModalAlerta] = useState({ abierto: false, mensaje: '' })

  // Estado para modales
  const [modal, setModal] = useState({ isOpen: false, type: '', message: '', title: '' })

  const [perfil, setPerfil] = useState({
    usuario: { usuarioNom: '', usuarioApePat: '', usuarioApeMat: '', usuarioCorreo: '', usuarioTel: '', usuarioCurp: '', usuarioFechaNac: '' },
    arrendadorRFC: '',
    direccion: { direccionCalle: '', direccionNumExt: '', direccionNumInt: '', cp: { d_codigo: '', d_asenta: '', D_mnpio: '', d_estado: '' } }
  })

  const [nombres, setNombres] = useState('')
  const [apellidoPaterno, setApellidoPaterno] = useState('')
  const [apellidoMaterno, setApellidoMaterno] = useState('')
  const [telefono, setTelefono] = useState('')
  const [calle, setCalle] = useState('')
  const [numExt, setNumExt] = useState('')
  const [numInt, setNumInt] = useState('')
  const [cp, setCP] = useState('')
  const [colonia, setColonia] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [estado, setEstado] = useState('')

  useEffect(() => { cargarPerfil() }, [])

  const mostrarModal = (type, title, message) => {
    setModal({ isOpen: true, type, title, message })
  }

  const cerrarModal = () => {
    setModal({ isOpen: false, type: '', message: '', title: '' })
  }

  const cargarPerfil = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem('userId')
      if (!userId) { navigate('/usuarios/inicio-sesion'); return }
      const data = await getPerfilArrendador(userId)
      setPerfil(data)
      setNombres(data.usuario?.usuarioNom || '')
      setApellidoPaterno(data.usuario?.usuarioApePat || '')
      setApellidoMaterno(data.usuario?.usuarioApeMat || '')
      setTelefono(data.usuario?.usuarioTel || '')
      setCalle(data.direccion?.direccionCalle || '')
      setNumExt(data.direccion?.direccionNumExt || '')
      setNumInt(data.direccion?.direccionNumInt || '')
      setCP(data.direccion?.cp?.d_codigo || '')
      setColonia(data.direccion?.cp?.d_asenta || '')
      setMunicipio(data.direccion?.cp?.D_mnpio || '')
      setEstado(data.direccion?.cp?.d_estado || '')
    } catch { setError('Error al cargar perfil') }
    finally { setLoading(false) }
  }

  const handleCPChange = async (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5)
    setCP(val)
    if (val.length === 5) {
      try {
        const { buscarCP } = await import('../../services/propiedadService')
        const data = await buscarCP(val)
        setColonia(data.colonia || ''); setMunicipio(data.municipio || ''); setEstado(data.estado || '')
      } catch { setColonia(''); setMunicipio(''); setEstado('') }
    }
  }

  const handleGuardar = async () => {
    setGuardando(true); setError(''); setMensajeExito('')
    try {
      const userId = localStorage.getItem('userId')
      await actualizarPerfilArrendador(userId, {
        usuarioNom: nombres, usuarioApePat: apellidoPaterno, usuarioApeMat: apellidoMaterno,
        usuarioTel: telefono, direccionCalle: calle, direccionNumExt: numExt, direccionNumInt: numInt, cp
      })
      const dataActualizada = await getPerfilArrendador(userId)
      setPerfil(dataActualizada)
      setMensajeExito('Perfil actualizado exitosamente')
      setEditando(false)
      setTimeout(() => setMensajeExito(''), 3000)
    } catch (err) { setError(err.response?.data?.error || 'Error al actualizar perfil') }
    finally { setGuardando(false) }
  }

  const handleCancelar = () => {
    setNombres(perfil.usuario?.usuarioNom || '')
    setApellidoPaterno(perfil.usuario?.usuarioApePat || '')
    setApellidoMaterno(perfil.usuario?.usuarioApeMat || '')
    setTelefono(perfil.usuario?.usuarioTel || '')
    setCalle(perfil.direccion?.direccionCalle || '')
    setNumExt(perfil.direccion?.direccionNumExt || '')
    setNumInt(perfil.direccion?.direccionNumInt || '')
    setCP(perfil.direccion?.cp?.d_codigo || '')
    setColonia(perfil.direccion?.cp?.d_asenta || '')
    setMunicipio(perfil.direccion?.cp?.D_mnpio || '')
    setEstado(perfil.direccion?.cp?.d_estado || '')
    setEditando(false); setError('')
  }

  const handleEliminarCuenta = async () => {
    setModalEliminar(false)
    try {
      const userId = localStorage.getItem('userId')
      const arrendadorId = localStorage.getItem('arrendadorId')
      if (!userId || !arrendadorId) { setError('No has iniciado sesión'); return }
      const response = await fetch('http://localhost:5000/api/usuarios/eliminar-cuenta-arrendador', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId, 'x-arrendador-id': arrendadorId }
      })
      const data = await response.json()
      if (response.ok) { localStorage.clear(); navigate('/') }
      else setModalAlerta({ abierto: true, mensaje: data.error || 'Error al eliminar la cuenta' })
    } catch { setModalAlerta({ abierto: true, mensaje: 'Error al eliminar la cuenta' }) }
  }

  if (loading) return (
    <div className="arr-page">
      <NavbarArrendador />
      <main className="arr-main"><p className="arr-loading">Cargando perfil...</p></main>
      <FooterInicio />
    </div>
  )

  const usuario = perfil?.usuario || {}
  const dir = perfil?.direccion || {}
  const cpData = dir?.cp || {}

  const iniciales = [usuario.usuarioNom, usuario.usuarioApePat]
    .filter(Boolean).map(n => n[0].toUpperCase()).join('')

  return (
    <div className="arr-page">
      <NavbarArrendador />
      <main className="arr-main">
        <div className="arr-profile-wrapper">

          {mensajeExito && <div className="arr-alert arr-alert-success" style={{ marginBottom: '1rem' }}>✅ {mensajeExito}</div>}
          {error && <div className="arr-alert arr-alert-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

          {/* ── Hero ───────────────────────────────────────── */}
          <div className="arr-profile-card">
            <div className="arr-profile-hero">
              <div className="arr-avatar">{iniciales || '?'}</div>
              <p className="arr-profile-name">
                {usuario.usuarioNom} {usuario.usuarioApePat} {usuario.usuarioApeMat || ''}
              </p>
              <div className="arr-profile-role-badge">🏠 Arrendador</div>
              <p className="arr-profile-hero-email">{usuario.usuarioCorreo}</p>
            </div>
            <div className="arr-profile-hero-actions">
              {!editando
                ? <button className="arr-btn-primary" onClick={() => setEditando(true)}>✏️ Editar Perfil</button>
                : <>
                    <button className="arr-btn-ghost" onClick={handleCancelar}>Cancelar</button>
                    <button className="arr-btn-primary" disabled={guardando} onClick={handleGuardar}>
                      {guardando ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                    </button>
                  </>
              }
            </div>
          </div>

          {/* ── Modo ver ───────────────────────────────────── */}
          {!editando && (
            <>
              <div className="arr-profile-two-col">
                {/* Datos Personales */}
                <div className="arr-form-card" style={{ marginBottom: 0 }}>
                  <div className="arr-form-card-header">
                    <div className="arr-form-card-header-icon">👤</div>
                    <div>
                      <h3>Datos Personales</h3>
                    </div>
                  </div>
                  <div className="arr-form-card-body">
                    <div className="arr-pf-grid">
                      <DataItem label="Nombre" value={usuario.usuarioNom} />
                      <DataItem label="Apellido Paterno" value={usuario.usuarioApePat} />
                      <DataItem label="Apellido Materno" value={usuario.usuarioApeMat} />
                      <DataItem label="Teléfono" value={usuario.usuarioTel} />
                      <DataItem label="Correo electrónico" value={usuario.usuarioCorreo} locked full />
                      <DataItem label="CURP" value={usuario.usuarioCurp} locked />
                      <DataItem label="RFC" value={perfil.arrendadorRFC} locked />
                      <DataItem
                        label="Fecha de Nacimiento"
                        value={usuario.usuarioFechaNac
                          ? new Date(usuario.usuarioFechaNac).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                          : null}
                        locked
                      />
                    </div>
                  </div>
                </div>

                {/* Dirección */}
                <div className="arr-form-card" style={{ marginBottom: 0 }}>
                  <div className="arr-form-card-header">
                    <div className="arr-form-card-header-icon">📍</div>
                    <div>
                      <h3>Dirección</h3>
                    </div>
                  </div>
                  <div className="arr-form-card-body">
                    <div className="arr-pf-grid">
                      <DataItem label="Calle" value={dir.direccionCalle} full />
                      <DataItem label="Número Exterior" value={dir.direccionNumExt} />
                      <DataItem label="Número Interior" value={dir.direccionNumInt} />
                      <DataItem label="Código Postal" value={cpData.d_codigo} />
                      <DataItem label="Colonia" value={cpData.d_asenta} />
                      <DataItem label="Municipio" value={cpData.D_mnpio} full />
                      <DataItem label="Estado" value={cpData.d_estado} full />
                    </div>
                  </div>
                </div>
              </div>

              {/* Zona de peligro */}
              <div className="arr-profile-danger-card">
                <div className="arr-profile-danger-info">
                  <p className="arr-profile-danger-title">Eliminar Cuenta</p>
                  <p className="arr-profile-danger-desc">
                    Se borrarán permanentemente tus propiedades, arrendamientos y datos personales. Esta acción no se puede deshacer.
                  </p>
                </div>
                <button className="arr-btn-danger arr-btn-sm" style={{ flexShrink: 0 }} onClick={() => setModalEliminar(true)}>
                  Eliminar
                </button>
              </div>
            </>
          )}

          {/* ── Modo editar ─────────────────────────────────── */}
          {editando && (
            <>
              <div className="arr-profile-two-col">
                {/* Editar datos personales */}
                <div className="arr-form-card" style={{ marginBottom: 0 }}>
                  <div className="arr-form-card-header">
                    <div className="arr-form-card-header-icon">✏️</div>
                    <div>
                      <h3>Datos Personales</h3>
                      <p>Campos editables</p>
                    </div>
                  </div>
                  <div className="arr-form-card-body">
                    <div className="arr-form-group">
                      <label className="arr-form-label">Nombre</label>
                      <input className="arr-form-input" value={nombres} onChange={e => setNombres(e.target.value)} />
                    </div>
                    <div className="arr-form-group">
                      <label className="arr-form-label">Apellido Paterno</label>
                      <input className="arr-form-input" value={apellidoPaterno} onChange={e => setApellidoPaterno(e.target.value)} />
                    </div>
                    <div className="arr-form-group">
                      <label className="arr-form-label">Apellido Materno</label>
                      <input className="arr-form-input" value={apellidoMaterno} onChange={e => setApellidoMaterno(e.target.value)} />
                    </div>
                    <div className="arr-form-group">
                      <label className="arr-form-label">Teléfono</label>
                      <input className="arr-form-input" type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} />
                    </div>

                    <hr className="arr-divider" />
                    <p className="arr-form-hint" style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Información no editable</p>
                    <div className="arr-pf-grid">
                      <DataItem label="Correo" value={usuario.usuarioCorreo} locked full />
                      <DataItem label="CURP" value={usuario.usuarioCurp} locked />
                      <DataItem label="RFC" value={perfil.arrendadorRFC} locked />
                    </div>
                  </div>
                </div>

                {/* Editar dirección */}
                <div className="arr-form-card" style={{ marginBottom: 0 }}>
                  <div className="arr-form-card-header">
                    <div className="arr-form-card-header-icon">📍</div>
                    <div>
                      <h3>Dirección</h3>
                      <p>CP autocompletado</p>
                    </div>
                  </div>
                  <div className="arr-form-card-body">
                    <div className="arr-form-group">
                      <label className="arr-form-label">Código Postal</label>
                      <input
                        className="arr-form-input"
                        value={cp}
                        onChange={handleCPChange}
                        maxLength={5}
                        placeholder="07700"
                      />
                    </div>
                    {(colonia || municipio || estado) && (
                      <div className="arr-address-auto" style={{ marginBottom: '0.75rem' }}>
                        Col. {colonia}, {municipio}, {estado}
                      </div>
                    )}
                    <div className="arr-form-group">
                      <label className="arr-form-label">Calle</label>
                      <input className="arr-form-input" value={calle} onChange={e => setCalle(e.target.value)} />
                    </div>
                    <div className="arr-form-grid-2">
                      <div className="arr-form-group">
                        <label className="arr-form-label">Núm. Exterior</label>
                        <input className="arr-form-input" value={numExt} onChange={e => setNumExt(e.target.value)} />
                      </div>
                      <div className="arr-form-group">
                        <label className="arr-form-label">Núm. Interior</label>
                        <input className="arr-form-input" value={numInt} onChange={e => setNumInt(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </main>
      <FooterInicio />

      {modalEliminar && (
        <ModalConfirmacion
          titulo="Eliminar Cuenta"
          mensaje="Esta acción no se puede deshacer. Se eliminarán tus propiedades, arrendamientos y datos personales."
          textoConfirmar="Eliminar"
          textoCancelar="Cancelar"
          peligro={true}
          onConfirmar={handleEliminarCuenta}
          onCancelar={() => setModalEliminar(false)}
        />
      )}

      {modalAlerta.abierto && (
        <ModalConfirmacion
          titulo="Aviso"
          mensaje={modalAlerta.mensaje}
          textoConfirmar="Entendido"
          peligro={false}
          onConfirmar={() => setModalAlerta({ abierto: false, mensaje: '' })}
        />
      )}
    </div>
  )
}

const DataItem = ({ label, value, locked, full }) => (
  <div className={`arr-pf-item${full ? ' arr-pf-item-full' : ''}`}>
    <span className="arr-pf-label">
        {label}
    </span>
    <span className={`arr-pf-value${locked ? ' locked' : ''}${!value ? ' empty' : ''}`}>
      {value || '—'}
    </span>
  </div>
)

export default PerfilArrendador
