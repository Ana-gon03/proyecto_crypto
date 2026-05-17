import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendador from '../../components/common/NavbarArrendador'
import FooterInicio from '../../components/common/FooterInicio'
import { getServiciosCatalogo, buscarCP, crearPropiedad } from '../../services/propiedadService'
import '../../styles/Arrendador.css'

const CrearVivienda = () => {
  const navigate = useNavigate()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    propiedadTitulo: '',
    propiedadDescripcion: '',
    propiedadTipo: 'Departamento',
    propiedadLugares: 1,
    propiedadPrecio: '',
    propiedadPrecioPor: 'Persona',
    direccionCalle: '',
    direccionNumExt: '',
    direccionNumInt: '',
    cp: '',
    colonia: '',
    municipio: '',
    estado: ''
  })

  const [servicios, setServicios] = useState({ Basico: [], Entretenimiento: [], Adicional: [] })
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
  const [fotos, setFotos] = useState([])
  const [previews, setPreviews] = useState([])
  const [buscandoCP, setBuscandoCP] = useState(false)
  const [cpValido, setCpValido] = useState(null)

  useEffect(() => { cargarServicios() }, [])

  const cargarServicios = async () => {
    try {
      const data = await getServiciosCatalogo()
      setServicios(data)
    } catch { /* silenced */ }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let v = value
    if (name === 'propiedadTitulo') v = value.slice(0, 100)
    else if (name === 'propiedadDescripcion') v = value.slice(0, 500)
    else if (name === 'propiedadLugares') {
      v = value.replace(/[^0-9]/g, '')
      if (v) { const n = parseInt(v); if (n < 1) v = '1'; if (n > 10) v = '10' }
    } else if (name === 'propiedadPrecio') {
      v = value.replace(/[^0-9.]/g, '')
      const parts = v.split('.')
      if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
      if (parts[1] && parts[1].length > 2) v = parts[0] + '.' + parts[1].slice(0, 2)
    } else if (name === 'cp') {
      v = value.replace(/[^0-9]/g, '').slice(0, 5)
    } else if (name === 'direccionCalle') v = value.slice(0, 100)
    else if (name === 'direccionNumExt' || name === 'direccionNumInt') v = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
    setFormData({ ...formData, [name]: v })
    if (errors[name]) setErrors({ ...errors, [name]: null })
  }

  const handleBuscarCP = async () => {
    if (formData.cp.length !== 5) return
    setBuscandoCP(true)
    setCpValido(null)
    setError('')
    setErrors({ ...errors, cp: null })
    try {
      const data = await buscarCP(formData.cp)
      setFormData({ ...formData, colonia: data.colonia, municipio: data.municipio, estado: data.estado })
      setCpValido(true)
    } catch {
      setCpValido(false)
      setError('CP no encontrado o no aceptado en el sistema')
      setFormData({ ...formData, colonia: '', municipio: '', estado: '' })
    } finally { setBuscandoCP(false) }
  }

  const toggleServicio = (id) => {
    setServiciosSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleFotosChange = (e) => {
    const files = Array.from(e.target.files)
    const validos = ['image/jpeg', 'image/png', 'image/webp']
    if (files.some(f => !validos.includes(f.type))) { setError('Solo se permiten imágenes JPG, PNG o WebP'); return }
    if (files.length + fotos.length > 10) { setError('Máximo 10 fotos permitidas'); return }
    setFotos(prev => [...prev, ...files])
    if (errors.fotos) setErrors({ ...errors, fotos: null })
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  const eliminarFoto = (index) => {
    setFotos(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => { URL.revokeObjectURL(prev[index]); return prev.filter((_, i) => i !== index) })
  }

  const validarFormulario = () => {
    const errs = {}
    if (!formData.propiedadTitulo || formData.propiedadTitulo.trim().length < 5) errs.propiedadTitulo = 'El título es obligatorio (mínimo 5 caracteres)'
    if (!formData.propiedadDescripcion || formData.propiedadDescripcion.trim().length < 20) errs.propiedadDescripcion = 'La descripción es obligatoria (mínimo 20 caracteres)'
    if (!formData.propiedadTipo) errs.propiedadTipo = 'Selecciona un tipo de propiedad'
    if (!formData.propiedadLugares || parseInt(formData.propiedadLugares) < 1) errs.propiedadLugares = 'Debe tener al menos 1 lugar'
    else if (parseInt(formData.propiedadLugares) > 10) errs.propiedadLugares = 'Máximo 10 lugares'
    if (!formData.propiedadPrecio || isNaN(formData.propiedadPrecio) || parseFloat(formData.propiedadPrecio) <= 0) errs.propiedadPrecio = 'El precio debe ser mayor a 0'
    if (!formData.propiedadPrecioPor) errs.propiedadPrecioPor = 'Selecciona el tipo de precio'
    if (!formData.cp || formData.cp.length !== 5) errs.cp = 'El código postal debe tener 5 dígitos'
    else if (cpValido === false) errs.cp = 'El CP no es válido'
    if (!formData.direccionCalle || formData.direccionCalle.trim().length < 3) errs.direccionCalle = 'La calle es obligatoria (mínimo 3 caracteres)'
    if (!formData.direccionNumExt) errs.direccionNumExt = 'El número exterior es obligatorio'
    if (!formData.colonia) errs.colonia = 'Debes buscar un CP válido'
    if (fotos.length < 3) errs.fotos = 'Debes subir mínimo 3 fotos'
    if (fotos.length > 10) errs.fotos = 'Máximo 10 fotos permitidas'
    const tieneBasico = (servicios.Basico || []).some(s => serviciosSeleccionados.includes(s.idServicio))
    if (!tieneBasico) errs.servicios = 'Debes seleccionar al menos un servicio básico'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const erroresValidacion = validarFormulario()
    if (Object.keys(erroresValidacion).length > 0) {
      setErrors(erroresValidacion)
      setError('Por favor corrige los errores en el formulario')
      return
    }
    const arrendadorId = localStorage.getItem('arrendadorId')
    if (!arrendadorId) { navigate('/usuarios/inicio-sesion'); return }
    setCargando(true); setError(''); setMensaje('')
    try {
      const fd = new FormData()
      Object.keys(formData).forEach(k => fd.append(k, formData[k]))
      fd.append('arrendador_idArrendador', arrendadorId)
      fd.append('servicios', JSON.stringify(serviciosSeleccionados))
      fotos.forEach(f => fd.append('fotos', f))
      await crearPropiedad(fd)
      setMensaje('Propiedad creada exitosamente')
      setTimeout(() => navigate('/arrendador/mis-viviendas'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear propiedad')
    } finally { setCargando(false) }
  }

  const inputCls = (field) => `arr-form-input${errors[field] ? ' is-error' : ''}`

  return (
    <div className="arr-page">
      <NavbarArrendador />
      <main className="arr-main" style={{ maxWidth: '820px' }}>
        <div className="arr-page-header">
          <div>
            <h1 className="arr-page-title">Crear Nueva Vivienda</h1>
            <p className="arr-page-hint">Completa todos los campos para publicar tu propiedad</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Información Básica */}
          <div className="arr-form-card">
            <div className="arr-form-card-header">
              <div className="arr-form-card-header-icon">🏠</div>
              <div>
                <h3>Información Básica</h3>
                <p>Datos generales de tu propiedad</p>
              </div>
            </div>
            <div className="arr-form-card-body">
              <div className="arr-form-group">
                <label className="arr-form-label">Título de la propiedad <span>*</span></label>
                <input
                  type="text"
                  name="propiedadTitulo"
                  value={formData.propiedadTitulo}
                  onChange={handleChange}
                  placeholder="Ej: Loft moderno cerca de ESCOM"
                  maxLength={100}
                  className={inputCls('propiedadTitulo')}
                />
                {errors.propiedadTitulo && <span className="arr-form-error">{errors.propiedadTitulo}</span>}
              </div>

              <div className="arr-form-group">
                <label className="arr-form-label">Descripción <span>*</span></label>
                <textarea
                  name="propiedadDescripcion"
                  value={formData.propiedadDescripcion}
                  onChange={handleChange}
                  placeholder="Describe tu propiedad... (mínimo 20 caracteres)"
                  rows={4}
                  maxLength={500}
                  className="arr-form-textarea"
                />
                <span className="arr-form-hint">{formData.propiedadDescripcion.length}/500 caracteres</span>
                {errors.propiedadDescripcion && <span className="arr-form-error">{errors.propiedadDescripcion}</span>}
              </div>

              <div className="arr-form-grid-3">
                <div className="arr-form-group">
                  <label className="arr-form-label">Tipo <span>*</span></label>
                  <select name="propiedadTipo" value={formData.propiedadTipo} onChange={handleChange} className="arr-form-select">
                    <option value="Departamento">Departamento</option>
                    <option value="Casa">Casa</option>
                    <option value="Habitación">Habitación</option>
                    <option value="Loft">Loft</option>
                    <option value="Estudio">Estudio</option>
                  </select>
                </div>
                <div className="arr-form-group">
                  <label className="arr-form-label">Lugares disponibles <span>*</span></label>
                  <input
                    type="number"
                    name="propiedadLugares"
                    value={formData.propiedadLugares}
                    onChange={handleChange}
                    min="1"
                    max="10"
                    className={inputCls('propiedadLugares')}
                  />
                  {errors.propiedadLugares && <span className="arr-form-error">{errors.propiedadLugares}</span>}
                </div>
                <div className="arr-form-group">
                  <label className="arr-form-label">Tipo de precio <span>*</span></label>
                  <select name="propiedadPrecioPor" value={formData.propiedadPrecioPor} onChange={handleChange} className="arr-form-select">
                    <option value="Persona">Por persona</option>
                    <option value="Habitación">Por habitación</option>
                    <option value="Propiedad">Propiedad completa</option>
                  </select>
                </div>
              </div>

              <div className="arr-form-group">
                <label className="arr-form-label">Precio mensual ($) <span>*</span></label>
                <input
                  type="number"
                  name="propiedadPrecio"
                  value={formData.propiedadPrecio}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={inputCls('propiedadPrecio')}
                />
                {errors.propiedadPrecio && <span className="arr-form-error">{errors.propiedadPrecio}</span>}
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="arr-form-card">
            <div className="arr-form-card-header">
              <div className="arr-form-card-header-icon">📍</div>
              <div>
                <h3>Dirección</h3>
                <p>Ubicación de tu propiedad</p>
              </div>
            </div>
            <div className="arr-form-card-body">
              <div className="arr-form-group">
                <label className="arr-form-label">Código Postal <span>*</span></label>
                <div className="arr-cp-row">
                  <div className="arr-form-group">
                    <input
                      type="text"
                      name="cp"
                      value={formData.cp}
                      onChange={handleChange}
                      onBlur={handleBuscarCP}
                      maxLength="5"
                      placeholder="07700"
                      className={inputCls('cp')}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleBuscarCP}
                    disabled={buscandoCP || formData.cp.length !== 5}
                    className="arr-btn-ghost"
                    style={{ height: '44px', borderRadius: '12px', flexShrink: 0 }}
                  >
                    {buscandoCP ? 'Buscando...' : 'Buscar CP'}
                  </button>
                </div>
                {cpValido === true && <span className="arr-form-hint ok">✓ CP válido</span>}
                {cpValido === false && <span className="arr-form-error">✗ CP no aceptado en el sistema</span>}
                {errors.cp && <span className="arr-form-error">{errors.cp}</span>}
              </div>

              <div className="arr-form-group">
                <label className="arr-form-label">Calle <span>*</span></label>
                <input
                  type="text"
                  name="direccionCalle"
                  value={formData.direccionCalle}
                  onChange={handleChange}
                  maxLength={100}
                  className={inputCls('direccionCalle')}
                />
                {errors.direccionCalle && <span className="arr-form-error">{errors.direccionCalle}</span>}
              </div>

              <div className="arr-form-grid-2">
                <div className="arr-form-group">
                  <label className="arr-form-label">Número exterior <span>*</span></label>
                  <input
                    type="text"
                    name="direccionNumExt"
                    value={formData.direccionNumExt}
                    onChange={handleChange}
                    maxLength={10}
                    className={inputCls('direccionNumExt')}
                  />
                  {errors.direccionNumExt && <span className="arr-form-error">{errors.direccionNumExt}</span>}
                </div>
                <div className="arr-form-group">
                  <label className="arr-form-label">Número interior <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(opcional)</span></label>
                  <input
                    type="text"
                    name="direccionNumInt"
                    value={formData.direccionNumInt}
                    onChange={handleChange}
                    maxLength={10}
                    className="arr-form-input"
                  />
                </div>
              </div>

              <div className="arr-form-grid-3">
                <div className="arr-form-group">
                  <label className="arr-form-label">Colonia</label>
                  <input type="text" name="colonia" value={formData.colonia} readOnly className="arr-form-input" disabled />
                  {errors.colonia && <span className="arr-form-error">{errors.colonia}</span>}
                </div>
                <div className="arr-form-group">
                  <label className="arr-form-label">Municipio</label>
                  <input type="text" name="municipio" value={formData.municipio} readOnly className="arr-form-input" disabled />
                </div>
                <div className="arr-form-group">
                  <label className="arr-form-label">Estado</label>
                  <input type="text" name="estado" value={formData.estado} readOnly className="arr-form-input" disabled />
                </div>
              </div>
            </div>
          </div>

          {/* Servicios */}
          <div className="arr-form-card">
            <div className="arr-form-card-header">
              <div className="arr-form-card-header-icon">🛠</div>
              <div>
                <h3>Servicios</h3>
                <p>Selecciona al menos un servicio básico</p>
              </div>
            </div>
            <div className="arr-form-card-body">
              {errors.servicios && <div className="arr-alert arr-alert-error" style={{ marginBottom: '1rem' }}>⚠️ {errors.servicios}</div>}
              {Object.keys(servicios).map(cat => (
                <div key={cat} className="arr-services-section">
                  <p className="arr-services-cat-title">
                    {cat === 'Basico' ? '🔧 Servicios Básicos (mínimo 1)' :
                     cat === 'Entretenimiento' ? '📺 Entretenimiento (Opcional)' :
                     '✨ Adicionales (Opcional)'}
                  </p>
                  <div className="arr-services-grid">
                    {servicios[cat].map(s => (
                      <label
                        key={s.idServicio}
                        className={`arr-service-chip${serviciosSeleccionados.includes(s.idServicio) ? ' selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={serviciosSeleccionados.includes(s.idServicio)}
                          onChange={() => toggleServicio(s.idServicio)}
                        />
                        {serviciosSeleccionados.includes(s.idServicio) ? '✓' : '○'} {s.servicioNombre}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fotos */}
          <div className="arr-form-card">
            <div className="arr-form-card-header">
              <div className="arr-form-card-header-icon">📷</div>
              <div>
                <h3>Fotos ({fotos.length}/10)</h3>
                <p>Mínimo 3 fotos — JPG, PNG o WebP</p>
              </div>
            </div>
            <div className="arr-form-card-body">
              <label className="arr-upload-zone">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFotosChange}
                />
                <span className="arr-upload-label">📤 Seleccionar imágenes</span>
                <span className="arr-upload-hint">Haz clic para abrir el selector de archivos</span>
              </label>
              {errors.fotos && <span className="arr-form-error" style={{ marginTop: '0.5rem', display: 'block' }}>{errors.fotos}</span>}
              {previews.length > 0 && (
                <div className="arr-foto-grid">
                  {previews.map((preview, i) => (
                    <div key={i} className="arr-foto-item">
                      <img src={preview} alt={`Foto ${i + 1}`} />
                      <button type="button" className="arr-foto-remove" onClick={() => eliminarFoto(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <div className="arr-alert arr-alert-error">⚠️ {error}</div>}
          {mensaje && <div className="arr-alert arr-alert-success">✅ {mensaje}</div>}

          <div className="arr-form-footer" style={{ marginTop: 0 }}>
            <button
              type="button"
              className="arr-btn-ghost"
              onClick={() => navigate('/arrendador/mis-viviendas')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="arr-btn-primary"
            >
              {cargando ? '⏳ Creando...' : '🏠 Crear Vivienda'}
            </button>
          </div>
        </form>
      </main>
      <FooterInicio />
    </div>
  )
}

export default CrearVivienda
