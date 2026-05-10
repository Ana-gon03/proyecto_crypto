import React, { useState, useEffect } from 'react'
import { getPropiedadCompleta, actualizarPropiedad, getServiciosCatalogo, buscarCP } from '../../services/propiedadService'

const ModalDetalleVivienda = ({ propiedad, onClose, onUpdate }) => {
  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  // Datos del formulario
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

  // Servicios
  const [serviciosCatalogo, setServiciosCatalogo] = useState({ Basico: [], Entretenimiento: [], Adicional: [] })
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])

  // Fotos
  const [fotosExistentes, setFotosExistentes] = useState([])
  const [nuevasFotos, setNuevasFotos] = useState([])
  const [previewsNuevas, setPreviewsNuevas] = useState([])

  // CP
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
      
      // Actualizar formulario con datos reales
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
      
      // Servicios seleccionados
      if (data.servicios && data.servicios.length > 0) {
        setServiciosSeleccionados(data.servicios.map(s => s.idServicio))
      }
    } catch (err) {
      console.error('Error al cargar datos completos:', err)
      setError('Error al cargar los datos de la propiedad')
    } finally {
      setCargandoDatos(false)
    }
  }

  const cargarServicios = async () => {
    try {
      const data = await getServiciosCatalogo()
      setServiciosCatalogo(data)
    } catch (err) {
      console.error('Error al cargar servicios')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleBuscarCP = async () => {
    if (formData.cp.length !== 5) return
    
    setBuscandoCP(true)
    setCpValido(null)
    setError('')
    
    try {
      const data = await buscarCP(formData.cp)
      setFormData(prev => ({
        ...prev,
        colonia: data.colonia,
        municipio: data.municipio,
        estado: data.estado
      }))
      setCpValido(true)
    } catch (err) {
      setCpValido(false)
      setError('CP no encontrado o no aceptado en el sistema')
    } finally {
      setBuscandoCP(false)
    }
  }

  const toggleServicio = (idServicio) => {
    setServiciosSeleccionados(prev =>
      prev.includes(idServicio)
        ? prev.filter(id => id !== idServicio)
        : [...prev, idServicio]
    )
  }

  const handleNuevasFotos = (e) => {
    const files = Array.from(e.target.files)
    const totalFotos = fotosExistentes.length + nuevasFotos.length + files.length

    if (totalFotos > 10) {
      alert('Máximo 10 fotos en total')
      return
    }

    setNuevasFotos(prev => [...prev, ...files])
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setPreviewsNuevas(prev => [...prev, ...newPreviews])
  }

  const eliminarFotoExistente = (idFoto) => {
    const totalDespues = fotosExistentes.length - 1 + nuevasFotos.length
    if (totalDespues < 3) {
      alert('Debes mantener al menos 3 fotos')
      return
    }
    setFotosExistentes(prev => prev.filter(f => f.idFotos !== idFoto))
  }

  const eliminarNuevaFoto = (index) => {
    setNuevasFotos(prev => prev.filter((_, i) => i !== index))
    setPreviewsNuevas(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleGuardar = async () => {
    const totalFotos = fotosExistentes.length + nuevasFotos.length
    if (totalFotos < 3) {
      setError('Debes tener mínimo 3 fotos')
      return
    }

    if (totalFotos > 10) {
      setError('Máximo 10 fotos permitidas')
      return
    }

    if (cpValido === false) {
      setError('El CP no es válido')
      return
    }

    setCargando(true)
    setError('')
    setMensaje('')

    try {
      const formDataToSend = new FormData()
      
      // Agregar todos los campos del formulario
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key])
        }
      })
      
      formDataToSend.append('servicios', JSON.stringify(serviciosSeleccionados))
      formDataToSend.append('fotosExistentes', JSON.stringify(fotosExistentes.map(f => f.idFotos)))
      
      // Agregar nuevas fotos
      nuevasFotos.forEach(foto => {
        formDataToSend.append('fotos', foto)
      })

      await actualizarPropiedad(propiedad.idPropiedad, formDataToSend)
      setMensaje('¡Propiedad actualizada exitosamente!')
      
      setTimeout(() => {
        onUpdate()
        onClose()
      }, 1500)
      
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar la propiedad')
    } finally {
      setCargando(false)
    }
  }

  if (cargandoDatos) {
    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px' }}>
          <p>Cargando datos de la propiedad...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '700px',
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>{editando ? '✏️ Editar Vivienda' : '📋 ' + formData.propiedadTitulo}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        {!editando ? (
          // MODO VER
          <div>
            <p><strong>Tipo:</strong> {propiedad.propiedadTipo}</p>
            <p><strong>Precio:</strong> ${propiedad.propiedadPrecio}/mes ({formData.propiedadPrecioPor === 'Propiedad' ? 'Propiedad completa' : formData.propiedadPrecioPor === 'Persona' ? 'Por persona' : 'Por habitación'})</p>
            <p><strong>Lugares:</strong> {propiedad.lugaresDisponibles} disponibles / {propiedad.propiedadLugares} totales</p>
            <p><strong>Estado:</strong> {propiedad.propiedadEstatus}</p>
            <p><strong>📍 Dirección:</strong> {formData.direccionCalle} #{formData.direccionNumExt} {formData.direccionNumInt && `Int. ${formData.direccionNumInt}`}, Col. {formData.colonia}, {formData.municipio}, {formData.estado}, CP {formData.cp}</p>
            <p><strong>Descripción:</strong> {propiedad.propiedadDescripcion}</p>
            
            {/* Fotos */}
            {fotosExistentes.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Fotos ({fotosExistentes.length}):</strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {fotosExistentes.map(foto => (
                    <img
                      key={foto.idFotos}
                      src={`http://localhost:5000${foto.fotosURL}`}
                      alt="Foto"
                      style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Servicios */}
            {serviciosSeleccionados.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Servicios ({serviciosSeleccionados.length}):</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                  {serviciosCatalogo.Basico.concat(serviciosCatalogo.Entretenimiento, serviciosCatalogo.Adicional)
                    .filter(s => serviciosSeleccionados.includes(s.idServicio))
                    .map(s => (
                      <span key={s.idServicio} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '0.85rem' }}>
                        {s.servicioNombre}
                      </span>
                    ))
                  }
                </div>
              </div>
            )}

            <button
              onClick={() => setEditando(true)}
              style={{ marginTop: '1.5rem', width: '100%', padding: '0.5rem', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              ✏️ Editar Propiedad
            </button>
          </div>
        ) : (
          // MODO EDICIÓN
          <div>
            {/* Información básica */}
            <div style={{ marginBottom: '1rem' }}>
              <label><strong>Título:</strong></label><br />
              <input type="text" name="propiedadTitulo" value={formData.propiedadTitulo} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} required />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label><strong>Descripción:</strong></label><br />
              <textarea name="propiedadDescripcion" value={formData.propiedadDescripcion} onChange={handleChange} rows="3" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              <div>
                <label>Tipo:</label><br />
                <select name="propiedadTipo" value={formData.propiedadTipo} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }}>
                  <option value="Departamento">Departamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Habitación">Habitación</option>
                  <option value="Loft">Loft</option>
                  <option value="Estudio">Estudio</option>
                </select>
              </div>
              <div>
                <label>Lugares:</label><br />
                <input type="number" name="propiedadLugares" value={formData.propiedadLugares} onChange={handleChange} min="1" max="10" style={{ width: '100%', padding: '0.5rem' }} required />
              </div>
              <div>
                <label>Precio ($):</label><br />
                <input type="number" name="propiedadPrecio" value={formData.propiedadPrecio} onChange={handleChange} min="0" step="0.01" style={{ width: '100%', padding: '0.5rem' }} required />
              </div>
              <div>
                <label>Precio por:</label><br />
                <select name="propiedadPrecioPor" value={formData.propiedadPrecioPor} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }}>
                  <option value="Persona">Por persona</option>
                  <option value="Habitación">Por habitación</option>
                  <option value="Propiedad">Propiedad completa</option>
                </select>
              </div>
            </div>

            {/* Dirección */}
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>📍 Dirección</h4>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input 
                  type="text" 
                  name="cp" 
                  value={formData.cp} 
                  onChange={handleChange} 
                  maxLength="5" 
                  placeholder="Código Postal" 
                  style={{ flex: 1, padding: '0.5rem' }} 
                />
                <button type="button" onClick={handleBuscarCP} disabled={buscandoCP || formData.cp.length !== 5} style={{ padding: '0.5rem 1rem' }}>
                  {buscandoCP ? '...' : 'Buscar CP'}
                </button>
              </div>
              {cpValido === true && <small style={{ color: 'green' }}>✓ CP válido</small>}
              {cpValido === false && <small style={{ color: 'red' }}>✗ CP no aceptado</small>}
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input type="text" name="direccionCalle" value={formData.direccionCalle} onChange={handleChange} placeholder="Calle" style={{ padding: '0.5rem' }} required />
                <input type="text" name="direccionNumExt" value={formData.direccionNumExt} onChange={handleChange} placeholder="# Ext" style={{ padding: '0.5rem' }} required />
                <input type="text" name="direccionNumInt" value={formData.direccionNumInt} onChange={handleChange} placeholder="# Int" style={{ padding: '0.5rem' }} />
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                Col. {formData.colonia}, {formData.municipio}, {formData.estado}
              </div>
            </div>

            {/* Servicios */}
            <div style={{ marginBottom: '1rem' }}>
              <h4>🛠️ Servicios</h4>
              {Object.keys(serviciosCatalogo).map(categoria => (
                <div key={categoria} style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.9rem' }}>
                    {categoria === 'Basico' ? '🔧 Básicos' : categoria === 'Entretenimiento' ? '📺 Entretenimiento' : '✨ Adicionales'}
                  </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                    {serviciosCatalogo[categoria].map(servicio => (
                      <label 
                        key={servicio.idServicio} 
                        style={{ 
                          fontSize: '0.8rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: serviciosSeleccionados.includes(servicio.idServicio) ? '#e3f2fd' : '#f5f5f5', 
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={serviciosSeleccionados.includes(servicio.idServicio)} 
                          onChange={() => toggleServicio(servicio.idServicio)} 
                        />
                        {servicio.servicioNombre}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Fotos */}
            <div style={{ marginBottom: '1rem' }}>
              <h4>📸 Fotos ({fotosExistentes.length + nuevasFotos.length}/10) - Mínimo 3</h4>
              
              {fotosExistentes.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {fotosExistentes.map(foto => (
                    <div key={foto.idFotos} style={{ position: 'relative' }}>
                      <img src={`http://localhost:5000${foto.fotosURL}`} alt="Foto" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                      <button 
                        onClick={() => eliminarFotoExistente(foto.idFotos)} 
                        style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {previewsNuevas.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {previewsNuevas.map((preview, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img src={preview} alt="Nueva" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                      <button 
                        onClick={() => eliminarNuevaFoto(index)} 
                        style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.7rem' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleNuevasFotos} style={{ marginTop: '0.5rem' }} />
            </div>

            {error && <div style={{ color: 'red', padding: '0.75rem', marginBottom: '0.75rem', backgroundColor: '#ffebee', borderRadius: '4px' }}>{error}</div>}
            {mensaje && <div style={{ color: 'green', padding: '0.75rem', marginBottom: '0.75rem', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>{mensaje}</div>}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={handleGuardar} 
                disabled={cargando} 
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}
              >
                {cargando ? '⏳ Guardando...' : '💾 Guardar Cambios'}
              </button>
              <button 
                onClick={() => {
                  setEditando(false)
                  setError('')
                  cargarDatosCompletos() // Recargar datos originales
                }} 
                style={{ padding: '0.75rem 2rem', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModalDetalleVivienda