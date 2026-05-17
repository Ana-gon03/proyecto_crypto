import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendador from '../../components/common/NavbarArrendador'
import FooterInicio from '../../components/common/FooterInicio'
import { getPropiedadesDisponibles } from '../../services/propiedadService'
import { buscarArrendatario, crearArrendamiento } from '../../services/arrendamientoService'
import '../../styles/Arrendador.css'

const CrearArrendamiento = () => {
  const navigate = useNavigate()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    arrendamientoFechaInicio: '',
    arrendamientoRenta: '',
    arrendamientoDescrip: '',
    arrendatario_idArrendatario: '',
    propiedad_idPropiedad: ''
  })

  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [arrendatarioSeleccionado, setArrendatarioSeleccionado] = useState(null)
  const [propiedades, setPropiedades] = useState([])
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null)

  useEffect(() => { cargarPropiedades() }, [])

  const cargarPropiedades = async () => {
    try {
      const idArrendador = localStorage.getItem('arrendadorId')
      if (!idArrendador) { navigate('/usuarios/inicio-sesion'); return }
      const data = await getPropiedadesDisponibles(idArrendador)
      setPropiedades(data)
    } catch { setError('Error al cargar propiedades') }
  }

  const handleBuscarArrendatario = async () => {
    if (terminoBusqueda.length < 3) { setError('Ingresa al menos 3 caracteres para buscar'); return }
    setBuscando(true); setError(''); setResultadosBusqueda([])
    try {
      const data = await buscarArrendatario(terminoBusqueda)
      if (data.length === 0) setError('No se encontraron arrendatarios con ese username o correo')
      else setResultadosBusqueda(data)
    } catch { setError('Error al buscar arrendatario') }
    finally { setBuscando(false) }
  }

  const handleSeleccionarArrendatario = (arrendatario) => {
    if (arrendatario.arrendatarioVerificado !== 1) {
      setError('Este arrendatario NO ha verificado su identidad. No se puede crear un arrendamiento.')
      return
    }
    setArrendatarioSeleccionado(arrendatario)
    setFormData({ ...formData, arrendatario_idArrendatario: arrendatario.idArrendatario })
    setResultadosBusqueda([]); setTerminoBusqueda(''); setError('')
  }

  const handleSeleccionarPropiedad = (e) => {
    const idPropiedad = e.target.value
    const prop = propiedades.find(p => p.idPropiedad == idPropiedad)
    setPropiedadSeleccionada(prop || null)
    setFormData(prev => ({ ...prev, propiedad_idPropiedad: idPropiedad, arrendamientoRenta: prop?.propiedadPrecio || prev.arrendamientoRenta }))
    if (errors.propiedad_idPropiedad) setErrors({ ...errors, propiedad_idPropiedad: null })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) setErrors({ ...errors, [name]: null })
  }

  const validarFormulario = () => {
    const errs = {}
    if (!arrendatarioSeleccionado) errs.arrendatario_idArrendatario = 'Debes seleccionar un arrendatario verificado'
    if (!formData.propiedad_idPropiedad) errs.propiedad_idPropiedad = 'Debes seleccionar una vivienda'
    if (!formData.arrendamientoFechaInicio) {
      errs.arrendamientoFechaInicio = 'La fecha de inicio es obligatoria'
    } else {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const fechaSeleccionada = new Date(formData.arrendamientoFechaInicio + 'T00:00:00')
      if (fechaSeleccionada < hoy) errs.arrendamientoFechaInicio = 'La fecha de inicio no puede ser una fecha pasada'
    }
    if (!formData.arrendamientoRenta) errs.arrendamientoRenta = 'La renta es obligatoria'
    else if (isNaN(formData.arrendamientoRenta) || parseFloat(formData.arrendamientoRenta) <= 0) errs.arrendamientoRenta = 'La renta debe ser un número mayor a 0'
    if (!formData.arrendamientoDescrip || formData.arrendamientoDescrip.trim().length < 10) errs.arrendamientoDescrip = 'La descripción es obligatoria (mínimo 10 caracteres)'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const erroresValidacion = validarFormulario()
    if (Object.keys(erroresValidacion).length > 0) {
      setErrors(erroresValidacion); setError('Por favor corrige los errores en el formulario'); return
    }
    setCargando(true); setError(''); setMensaje(''); setErrors({})
    try {
      await crearArrendamiento(formData)
      setMensaje('Arrendamiento creado exitosamente')
      setTimeout(() => navigate('/arrendador/mis-arrendamientos'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear arrendamiento')
    } finally { setCargando(false) }
  }

  const formatearDireccion = (prop) => {
    if (!prop?.direccion) return 'Dirección no disponible'
    const dir = prop.direccion
    let d = `${dir.direccionCalle} #${dir.direccionNumExt}`
    if (dir.direccionNumInt) d += ` Int. ${dir.direccionNumInt}`
    if (dir.cp) d += `, Col. ${dir.cp.d_asenta}, ${dir.cp.D_mnpio}, ${dir.cp.d_estado}, CP ${dir.cp.d_codigo}`
    return d
  }

  return (
    <div className="arr-page">
      <NavbarArrendador />
      <main className="arr-main" style={{ maxWidth: '820px' }}>
        <div className="arr-page-header">
          <div>
            <h1 className="arr-page-title">Crear Arrendamiento</h1>
            <p className="arr-page-hint">Registra un nuevo contrato de arrendamiento</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* 1. Seleccionar Arrendatario */}
          <div className="arr-form-card">
            <div className="arr-form-card-header">
              <div className="arr-form-card-header-icon">👤</div>
              <div>
                <h3>1. Seleccionar Arrendatario</h3>
                <p>El arrendatario debe tener identidad verificada</p>
              </div>
            </div>
            <div className="arr-form-card-body">
              {arrendatarioSeleccionado ? (
                <div className="arr-selected-tenant">
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 2px' }}>
                      {arrendatarioSeleccionado.usuario?.usuarioNom} {arrendatarioSeleccionado.usuario?.usuarioApePat}
                      <span className="arr-badge arr-badge-success" style={{ marginLeft: '0.5rem' }}>✓ Verificado</span>
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', margin: 0 }}>
                      @{arrendatarioSeleccionado.arrendatarioUser} · {arrendatarioSeleccionado.usuario?.usuarioCorreo} · Boleta: {arrendatarioSeleccionado.arrendatarioBoleta}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="arr-btn-danger arr-btn-sm"
                    onClick={() => { setArrendatarioSeleccionado(null); setFormData({ ...formData, arrendatario_idArrendatario: '' }) }}
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <>
                  <div className="arr-cp-row" style={{ marginBottom: '0.75rem' }}>
                    <div className="arr-form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <input
                        type="text"
                        value={terminoBusqueda}
                        onChange={(e) => setTerminoBusqueda(e.target.value)}
                        placeholder="Buscar por username o correo..."
                        className={`arr-form-input${errors.arrendatario_idArrendatario ? ' is-error' : ''}`}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleBuscarArrendatario())}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleBuscarArrendatario}
                      disabled={buscando || terminoBusqueda.length < 3}
                      className="arr-btn-primary"
                      style={{ height: '44px', borderRadius: '12px', flexShrink: 0 }}
                    >
                      {buscando ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                  {errors.arrendatario_idArrendatario && (
                    <span className="arr-form-error">{errors.arrendatario_idArrendatario}</span>
                  )}

                  {resultadosBusqueda.length > 0 && (
                    <div className="arr-search-results">
                      {resultadosBusqueda.map(a => (
                        <div
                          key={a.idArrendatario}
                          className={`arr-search-result-item${a.arrendatarioVerificado !== 1 ? ' disabled' : ''}`}
                          onClick={() => handleSeleccionarArrendatario(a)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span className="arr-search-result-name">
                                {a.usuario?.usuarioNom} {a.usuario?.usuarioApePat}
                              </span>
                              <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginLeft: '0.4rem' }}>
                                @{a.arrendatarioUser}
                              </span>
                            </div>
                            {a.arrendatarioVerificado === 1
                              ? <span className="arr-badge arr-badge-success">✓ Verificado</span>
                              : <span className="arr-badge arr-badge-danger">✗ No verificado</span>
                            }
                          </div>
                          <p className="arr-search-result-sub">{a.usuario?.usuarioCorreo} · Boleta: {a.arrendatarioBoleta}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 2. Seleccionar Vivienda */}
          <div className="arr-form-card">
            <div className="arr-form-card-header">
              <div className="arr-form-card-header-icon">🏠</div>
              <div>
                <h3>2. Seleccionar Vivienda</h3>
                <p>Solo se muestran propiedades con lugares disponibles</p>
              </div>
            </div>
            <div className="arr-form-card-body">
              <div className="arr-form-group">
                <label className="arr-form-label">Vivienda <span>*</span></label>
                <select
                  name="propiedad_idPropiedad"
                  value={formData.propiedad_idPropiedad}
                  onChange={handleSeleccionarPropiedad}
                  className={`arr-form-select${errors.propiedad_idPropiedad ? ' is-error' : ''}`}
                >
                  <option value="">Selecciona una vivienda...</option>
                  {propiedades.map(prop => (
                    <option key={prop.idPropiedad} value={prop.idPropiedad}>
                      {prop.propiedadTitulo} ({prop.propiedadTipo}) — {prop.lugaresDisponibles} lugar(es)
                    </option>
                  ))}
                </select>
                {errors.propiedad_idPropiedad && <span className="arr-form-error">{errors.propiedad_idPropiedad}</span>}
              </div>

              {propiedadSeleccionada && (
                <div className="arr-selected-info">
                  <p><strong>📍 Dirección:</strong> {formatearDireccion(propiedadSeleccionada)}</p>
                  <p><strong>👥 Lugares:</strong> {propiedadSeleccionada.lugaresDisponibles} disponible(s) de {propiedadSeleccionada.propiedadLugares}</p>
                  <p>
                    <strong>💰 Precio:</strong>{' '}
                    <span className="arr-info-value price">${propiedadSeleccionada.propiedadPrecio}/mes</span>
                    {propiedadSeleccionada.propiedadPrecioPor === 'Propiedad' && ' (Propiedad completa)'}
                    {propiedadSeleccionada.propiedadPrecioPor === 'Persona' && ' (Por persona)'}
                    {propiedadSeleccionada.propiedadPrecioPor === 'Habitación' && ' (Por habitación)'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 3. Datos del Arrendamiento */}
          <div className="arr-form-card">
            <div className="arr-form-card-header">
              <div className="arr-form-card-header-icon">📋</div>
              <div>
                <h3>3. Datos del Arrendamiento</h3>
                <p>Fechas, renta y condiciones del contrato</p>
              </div>
            </div>
            <div className="arr-form-card-body">
              <div className="arr-form-group">
                <label className="arr-form-label">Fecha de inicio <span>*</span></label>
                <input
                  type="date"
                  name="arrendamientoFechaInicio"
                  value={formData.arrendamientoFechaInicio}
                  onChange={handleChange}
                  min={(() => { const h = new Date(); return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}-${String(h.getDate()).padStart(2,'0')}` })()}
                  className={`arr-form-input${errors.arrendamientoFechaInicio ? ' is-error' : ''}`}
                />
                {errors.arrendamientoFechaInicio && <span className="arr-form-error">{errors.arrendamientoFechaInicio}</span>}
              </div>

              <div className="arr-form-group">
                <label className="arr-form-label">Renta mensual ($) <span>*</span></label>
                <input
                  type="number"
                  name="arrendamientoRenta"
                  value={formData.arrendamientoRenta}
                  readOnly
                  className="arr-form-input"
                  style={{ background: 'var(--gray-50)' }}
                />
                <span className="arr-form-hint">El precio es fijo según la vivienda seleccionada</span>
                {errors.arrendamientoRenta && <span className="arr-form-error">{errors.arrendamientoRenta}</span>}
              </div>

              <div className="arr-form-group">
                <label className="arr-form-label">Descripción del arrendamiento <span>*</span></label>
                <textarea
                  name="arrendamientoDescrip"
                  value={formData.arrendamientoDescrip}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Ej: Contrato anual, incluye servicios de agua y luz... (mínimo 10 caracteres)"
                  className="arr-form-textarea"
                />
                {errors.arrendamientoDescrip && <span className="arr-form-error">{errors.arrendamientoDescrip}</span>}
              </div>
            </div>
          </div>

          {error && <div className="arr-alert arr-alert-error">⚠️ {error}</div>}
          {mensaje && <div className="arr-alert arr-alert-success">✅ {mensaje}</div>}

          <div className="arr-form-footer" style={{ marginTop: 0 }}>
            <button
              type="button"
              className="arr-btn-ghost"
              onClick={() => navigate('/arrendador/mis-arrendamientos')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="arr-btn-primary"
            >
              {cargando ? '⏳ Creando...' : '✅ Crear Arrendamiento'}
            </button>
          </div>
        </form>
      </main>
      <FooterInicio />
    </div>
  )
}

export default CrearArrendamiento
