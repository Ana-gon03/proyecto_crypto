import React, { useState, useEffect } from 'react'
import { getPropiedadCompleta, actualizarPropiedad, getServiciosCatalogo, buscarCP } from '../../services/propiedadService'
import '../../styles/Arrendador.css'

const ModalDetalleVivienda = ({ propiedad, onClose, onUpdate }) => {
  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

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

  const [serviciosCatalogo, setServiciosCatalogo] = useState({ Basico: [], Entretenimiento: [], Adicional: [] })
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
  const [fotosExistentes, setFotosExistentes] = useState([])
  const [nuevasFotos, setNuevasFotos] = useState([])
  const [previewsNuevas, setPreviewsNuevas] = useState([])
  const [buscandoCP, setBuscandoCP] = useState(false)
  const [cpValido, setCpValido] = useState(null)

  useEffect(() => {
    cargarDatosCompletos()
    cargarServicios()
  }, [propiedad.idPropiedad])

  const cargarDatosCompletos = async () => {
    setCargandoDatos(true)
    try {
      const data = await getPropiedadCompleta(propiedad.idPropiedad)
      setFormData({
        propiedadTitulo: data.propiedadTitulo || '',
        propiedadDescripcion: data.propiedadDescripcion || '',
        propiedadTipo: data.propiedadTipo || 'Departamento',
        propiedadLugares: data.propiedadLugares || 1,
        propiedadPrecio: data.propiedadPrecio || '',
        propiedadPrecioPor: data.propiedadPrecioPor || 'Persona',
        direccionCalle: data.direccion?.direccionCalle || '',
        direccionNumExt: data.direccion?.direccionNumExt || '',
        direccionNumInt: data.direccion?.direccionNumInt || '',
        cp: data.direccion?.cp?.d_codigo || '',
        colonia: data.direccion?.cp?.d_asenta || '',
        municipio: data.direccion?.cp?.D_mnpio || '',
        estado: data.direccion?.cp?.d_estado || ''
      })
      setFotosExistentes(data.fotos || [])
      if (data.servicios?.length > 0) setServiciosSeleccionados(data.servicios.map(s => s.idServicio))
    } catch { setError('Error al cargar los datos de la propiedad') }
    finally { setCargandoDatos(false) }
  }

  const cargarServicios = async () => {
    try { const data = await getServiciosCatalogo(); setServiciosCatalogo(data) }
    catch { /* silenced */ }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleBuscarCP = async () => {
    if (formData.cp.length !== 5) return
    setBuscandoCP(true); setCpValido(null); setError('')
    try {
      const data = await buscarCP(formData.cp)
      setFormData(prev => ({ ...prev, colonia: data.colonia, municipio: data.municipio, estado: data.estado }))
      setCpValido(true)
    } catch { setCpValido(false); setError('CP no encontrado o no aceptado en el sistema') }
    finally { setBuscandoCP(false) }
  }

  const toggleServicio = (id) => {
    setServiciosSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleNuevasFotos = (e) => {
    const files = Array.from(e.target.files)
    if (fotosExistentes.length + nuevasFotos.length + files.length > 10) { alert('Máximo 10 fotos en total'); return }
    setNuevasFotos(prev => [...prev, ...files])
    setPreviewsNuevas(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  const eliminarFotoExistente = (idFoto) => {
    if (fotosExistentes.length - 1 + nuevasFotos.length < 3) { alert('Debes mantener al menos 3 fotos'); return }
    setFotosExistentes(prev => prev.filter(f => f.idFotos !== idFoto))
  }

  const eliminarNuevaFoto = (index) => {
    setNuevasFotos(prev => prev.filter((_, i) => i !== index))
    setPreviewsNuevas(prev => { URL.revokeObjectURL(prev[index]); return prev.filter((_, i) => i !== index) })
  }

  const handleGuardar = async () => {
    const total = fotosExistentes.length + nuevasFotos.length
    if (total < 3) { setError('Debes tener mínimo 3 fotos'); return }
    if (total > 10) { setError('Máximo 10 fotos permitidas'); return }
    if (cpValido === false) { setError('El CP no es válido'); return }
    setCargando(true); setError(''); setMensaje('')
    try {
      const fd = new FormData()
      Object.keys(formData).forEach(k => { if (formData[k] !== null && formData[k] !== undefined) fd.append(k, formData[k]) })
      fd.append('servicios', JSON.stringify(serviciosSeleccionados))
      fd.append('fotosExistentes', JSON.stringify(fotosExistentes.map(f => f.idFotos)))
      nuevasFotos.forEach(f => fd.append('fotos', f))
      await actualizarPropiedad(propiedad.idPropiedad, fd)
      setMensaje('¡Propiedad actualizada exitosamente!')
      setTimeout(() => { onUpdate(); onClose() }, 1500)
    } catch (err) { setError(err.response?.data?.error || 'Error al actualizar la propiedad') }
    finally { setCargando(false) }
  }

  const todosLosServicios = [
    ...serviciosCatalogo.Basico,
    ...serviciosCatalogo.Entretenimiento,
    ...serviciosCatalogo.Adicional
  ]

  if (cargandoDatos) return (
    <div className="arr-modal-overlay">
      <div className="arr-modal arr-modal-md">
        <div className="arr-modal-body" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="arr-loading">Cargando datos de la propiedad...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="arr-modal-overlay">
      <div className="arr-modal arr-modal-lg">
        <div className="arr-modal-header">
          <h3 className="arr-modal-title">
            {editando ? '✏️ Editar Vivienda' : `📋 ${formData.propiedadTitulo}`}
          </h3>
          <button className="arr-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="arr-modal-body">
          {!editando ? (
            // MODO VER
            <>
              <div className="arr-info-section">
                <p className="arr-info-section-title">🏠 Datos de la Propiedad</p>
                <div className="arr-info-grid">
                  <div className="arr-info-item">
                    <p className="arr-info-label">Tipo</p>
                    <p className="arr-info-value">{propiedad.propiedadTipo}</p>
                  </div>
                  <div className="arr-info-item">
                    <p className="arr-info-label">Precio</p>
                    <p className="arr-info-value price">${propiedad.propiedadPrecio}/mes</p>
                  </div>
                  <div className="arr-info-item">
                    <p className="arr-info-label">Lugares</p>
                    <p className="arr-info-value">{propiedad.lugaresDisponibles} disponibles / {propiedad.propiedadLugares} totales</p>
                  </div>
                  <div className="arr-info-item">
                    <p className="arr-info-label">Estatus</p>
                    <p className="arr-info-value">{propiedad.propiedadEstatus}</p>
                  </div>
                </div>
              </div>

              <div className="arr-info-section">
                <p className="arr-info-section-title">📍 Dirección</p>
                <div className="arr-info-grid cols-1">
                  <div className="arr-info-item">
                    <p className="arr-info-value">
                      {formData.direccionCalle} #{formData.direccionNumExt}
                      {formData.direccionNumInt && ` Int. ${formData.direccionNumInt}`}, Col. {formData.colonia}, {formData.municipio}, {formData.estado}, CP {formData.cp}
                    </p>
                  </div>
                </div>
              </div>

              <div className="arr-info-section">
                <p className="arr-info-section-title">📝 Descripción</p>
                <p className="arr-info-value">{propiedad.propiedadDescripcion}</p>
              </div>

              {fotosExistentes.length > 0 && (
                <div className="arr-info-section">
                  <p className="arr-info-section-title">📸 Fotos ({fotosExistentes.length})</p>
                  <div className="arr-foto-grid">
                    {fotosExistentes.map(foto => (
                      <div key={foto.idFotos} className="arr-foto-item">
                        <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}${foto.fotosURL}`} alt="Foto" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {serviciosSeleccionados.length > 0 && (
                <div className="arr-info-section">
                  <p className="arr-info-section-title">🛠 Servicios ({serviciosSeleccionados.length})</p>
                  <div className="arr-service-tags">
                    {todosLosServicios.filter(s => serviciosSeleccionados.includes(s.idServicio)).map(s => (
                      <span key={s.idServicio} className="arr-service-tag">{s.servicioNombre}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            // MODO EDICIÓN
            <>
              <div className="arr-form-group">
                <label className="arr-form-label">Título</label>
                <input type="text" name="propiedadTitulo" value={formData.propiedadTitulo} onChange={handleChange} className="arr-form-input" />
              </div>

              <div className="arr-form-group">
                <label className="arr-form-label">Descripción</label>
                <textarea name="propiedadDescripcion" value={formData.propiedadDescripcion} onChange={handleChange} rows={3} className="arr-form-textarea" />
              </div>

              <div className="arr-form-grid-3" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                <div className="arr-form-group">
                  <label className="arr-form-label">Tipo</label>
                  <select name="propiedadTipo" value={formData.propiedadTipo} onChange={handleChange} className="arr-form-select">
                    <option value="Departamento">Departamento</option>
                    <option value="Casa">Casa</option>
                    <option value="Habitación">Habitación</option>
                    <option value="Loft">Loft</option>
                    <option value="Estudio">Estudio</option>
                  </select>
                </div>
                <div className="arr-form-group">
                  <label className="arr-form-label">Lugares</label>
                  <input type="number" name="propiedadLugares" value={formData.propiedadLugares} onChange={handleChange} min="1" max="10" className="arr-form-input" />
                </div>
                <div className="arr-form-group">
                  <label className="arr-form-label">Precio ($)</label>
                  <input type="number" name="propiedadPrecio" value={formData.propiedadPrecio} onChange={handleChange} min="0" step="0.01" className="arr-form-input" />
                </div>
                <div className="arr-form-group">
                  <label className="arr-form-label">Precio por</label>
                  <select name="propiedadPrecioPor" value={formData.propiedadPrecioPor} onChange={handleChange} className="arr-form-select">
                    <option value="Persona">Por persona</option>
                    <option value="Habitación">Por habitación</option>
                    <option value="Propiedad">Propiedad completa</option>
                  </select>
                </div>
              </div>

              {/* Dirección */}
              <div className="arr-form-card" style={{ marginBottom: '1rem', boxShadow: 'none', border: '1px solid var(--gray-100)' }}>
                <div className="arr-form-card-header" style={{ padding: '0.75rem 1rem' }}>
                  <div className="arr-form-card-header-icon" style={{ width: 28, height: 28, fontSize: '0.85rem' }}>📍</div>
                  <div><h3 style={{ fontSize: '0.9rem' }}>Dirección</h3></div>
                </div>
                <div className="arr-form-card-body" style={{ padding: '1rem' }}>
                  <div className="arr-cp-row" style={{ marginBottom: '0.75rem' }}>
                    <div className="arr-form-group" style={{ marginBottom: 0 }}>
                      <input type="text" name="cp" value={formData.cp} onChange={handleChange} maxLength="5" placeholder="Código Postal" className="arr-form-input" />
                    </div>
                    <button type="button" onClick={handleBuscarCP} disabled={buscandoCP || formData.cp.length !== 5} className="arr-btn-ghost arr-btn-sm" style={{ height: '44px', flexShrink: 0 }}>
                      {buscandoCP ? '...' : 'Buscar CP'}
                    </button>
                  </div>
                  {cpValido === true && <span className="arr-form-hint ok">✓ CP válido</span>}
                  {cpValido === false && <span className="arr-form-error">✗ CP no aceptado</span>}
                  <div className="arr-form-grid-3" style={{ marginTop: '0.5rem' }}>
                    <div className="arr-form-group" style={{ gridColumn: '1 / 3' }}>
                      <input type="text" name="direccionCalle" value={formData.direccionCalle} onChange={handleChange} placeholder="Calle" className="arr-form-input" />
                    </div>
                    <div className="arr-form-group">
                      <input type="text" name="direccionNumExt" value={formData.direccionNumExt} onChange={handleChange} placeholder="# Ext" className="arr-form-input" />
                    </div>
                  </div>
                  <div className="arr-form-group">
                    <input type="text" name="direccionNumInt" value={formData.direccionNumInt} onChange={handleChange} placeholder="# Interior (opcional)" className="arr-form-input" />
                  </div>
                  {formData.colonia && (
                    <div className="arr-address-auto">Col. {formData.colonia}, {formData.municipio}, {formData.estado}</div>
                  )}
                </div>
              </div>

              {/* Servicios */}
              <div className="arr-form-group">
                <label className="arr-form-label">Servicios</label>
                {Object.keys(serviciosCatalogo).map(cat => (
                  <div key={cat} className="arr-services-section">
                    <p className="arr-services-cat-title">
                      {cat === 'Basico' ? '🔧 Básicos' : cat === 'Entretenimiento' ? '📺 Entretenimiento' : '✨ Adicionales'}
                    </p>
                    <div className="arr-services-grid">
                      {serviciosCatalogo[cat].map(s => (
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

              {/* Fotos */}
              <div className="arr-form-group">
                <label className="arr-form-label">Fotos ({fotosExistentes.length + nuevasFotos.length}/10) — mínimo 3</label>

                {fotosExistentes.length > 0 && (
                  <div className="arr-foto-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
                    {fotosExistentes.map(foto => (
                      <div key={foto.idFotos} className="arr-foto-item">
                        <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}${foto.fotosURL}`} alt="Foto" />
                        <button type="button" className="arr-foto-remove" onClick={() => eliminarFotoExistente(foto.idFotos)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {previewsNuevas.length > 0 && (
                  <div className="arr-foto-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
                    {previewsNuevas.map((p, i) => (
                      <div key={i} className="arr-foto-item">
                        <img src={p} alt="Nueva" />
                        <button type="button" className="arr-foto-remove" onClick={() => eliminarNuevaFoto(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="arr-upload-zone" style={{ marginTop: '0.75rem' }}>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleNuevasFotos} />
                  <span className="arr-upload-label">📤 Agregar más fotos</span>
                  <span className="arr-upload-hint">JPG, PNG o WebP</span>
                </label>
              </div>

              {error && <div className="arr-alert arr-alert-error">⚠️ {error}</div>}
              {mensaje && <div className="arr-alert arr-alert-success">✅ {mensaje}</div>}
            </>
          )}
        </div>

        <div className="arr-modal-footer">
          {!editando ? (
            <>
              <button className="arr-btn-ghost arr-btn-sm" onClick={onClose}>Cerrar</button>
              <button className="arr-btn-primary arr-btn-sm" onClick={() => setEditando(true)}>✏️ Editar Propiedad</button>
            </>
          ) : (
            <>
              <button
                className="arr-btn-ghost arr-btn-sm"
                onClick={() => { setEditando(false); setError(''); cargarDatosCompletos() }}
              >
                Cancelar
              </button>
              <button className="arr-btn-primary arr-btn-sm" disabled={cargando} onClick={handleGuardar}>
                {cargando ? '⏳ Guardando...' : '💾 Guardar Cambios'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModalDetalleVivienda
