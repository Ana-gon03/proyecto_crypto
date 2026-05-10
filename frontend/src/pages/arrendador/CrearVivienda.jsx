import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendador from '../../components/common/NavbarArrendador'
import FooterInicio from '../../components/common/FooterInicio'
import { getServiciosCatalogo, buscarCP, crearPropiedad } from '../../services/propiedadService'

const CrearVivienda = () => {
  const navigate = useNavigate()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [errors, setErrors] = useState({})

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
  const [servicios, setServicios] = useState({ Basico: [], Entretenimiento: [], Adicional: [] })
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])

  // Fotos
  const [fotos, setFotos] = useState([])
  const [previews, setPreviews] = useState([])

  // Estados del CP
  const [buscandoCP, setBuscandoCP] = useState(false)
  const [cpValido, setCpValido] = useState(null)

  useEffect(() => {
    cargarServicios()
  }, [])

  const cargarServicios = async () => {
    try {
      const data = await getServiciosCatalogo()
      setServicios(data)
    } catch (err) {
      console.error('Error al cargar servicios')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let v = value

    // Validaciones por tipo de campo
    if (name === 'propiedadTitulo') {
      v = value.slice(0, 100)
    } else if (name === 'propiedadDescripcion') {
      v = value.slice(0, 500)
    } else if (name === 'propiedadLugares') {
      v = value.replace(/[^0-9]/g, '')
      if (v) {
        const num = parseInt(v)
        if (num < 1) v = '1'
        if (num > 10) v = '10'
      }
    } else if (name === 'propiedadPrecio') {
      v = value.replace(/[^0-9.]/g, '')
      // Permitir solo 2 decimales
      const parts = v.split('.')
      if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
      if (parts[1] && parts[1].length > 2) v = parts[0] + '.' + parts[1].slice(0, 2)
    } else if (name === 'cp') {
      v = value.replace(/[^0-9]/g, '').slice(0, 5)
    } else if (name === 'direccionCalle') {
      v = value.slice(0, 100)
    } else if (name === 'direccionNumExt' || name === 'direccionNumInt') {
      v = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
    }

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
      setFormData({
        ...formData,
        colonia: data.colonia,
        municipio: data.municipio,
        estado: data.estado
      })
      setCpValido(true)
    } catch (err) {
      setCpValido(false)
      setError('CP no encontrado o no aceptado en el sistema')
      setFormData({
        ...formData,
        colonia: '',
        municipio: '',
        estado: ''
      })
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

  const handleFotosChange = (e) => {
    const files = Array.from(e.target.files)
    
    // Validar tipo de archivo
    const formatosValidos = ['image/jpeg', 'image/png', 'image/webp']
    const archivosInvalidos = files.filter(f => !formatosValidos.includes(f.type))
    if (archivosInvalidos.length > 0) {
      setError('Solo se permiten imágenes JPG, PNG o WebP')
      return
    }
    
    if (files.length + fotos.length > 10) {
      setError('Máximo 10 fotos permitidas')
      return
    }

    setFotos(prev => [...prev, ...files])
    if (errors.fotos) setErrors({ ...errors, fotos: null })
    
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const eliminarFoto = (index) => {
    setFotos(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  // VALIDACIONES
  const validarFormulario = () => {
    const errs = {}

    if (!formData.propiedadTitulo || formData.propiedadTitulo.trim().length < 5) {
      errs.propiedadTitulo = 'El título es obligatorio (mínimo 5 caracteres)'
    }

    if (!formData.propiedadDescripcion || formData.propiedadDescripcion.trim().length < 20) {
      errs.propiedadDescripcion = 'La descripción es obligatoria (mínimo 20 caracteres)'
    }

    if (!formData.propiedadTipo) {
      errs.propiedadTipo = 'Selecciona un tipo de propiedad'
    }

    if (!formData.propiedadLugares || parseInt(formData.propiedadLugares) < 1) {
      errs.propiedadLugares = 'Debe tener al menos 1 lugar disponible'
    } else if (parseInt(formData.propiedadLugares) > 10) {
      errs.propiedadLugares = 'Máximo 10 lugares'
    }

    if (!formData.propiedadPrecio || isNaN(formData.propiedadPrecio) || parseFloat(formData.propiedadPrecio) <= 0) {
      errs.propiedadPrecio = 'El precio debe ser un número mayor a 0'
    }

    if (!formData.propiedadPrecioPor) {
      errs.propiedadPrecioPor = 'Selecciona el tipo de precio'
    }

    if (!formData.cp || formData.cp.length !== 5) {
      errs.cp = 'El código postal debe tener 5 dígitos'
    } else if (cpValido === false) {
      errs.cp = 'El CP no es válido o no está aceptado'
    }

    if (!formData.direccionCalle || formData.direccionCalle.trim().length < 3) {
      errs.direccionCalle = 'La calle es obligatoria (mínimo 3 caracteres)'
    }

    if (!formData.direccionNumExt) {
      errs.direccionNumExt = 'El número exterior es obligatorio'
    }

    if (!formData.colonia) {
      errs.colonia = 'Debes buscar un CP válido'
    }

    if (fotos.length < 3) {
      errs.fotos = 'Debes subir mínimo 3 fotos'
    }

    if (fotos.length > 10) {
      errs.fotos = 'Máximo 10 fotos permitidas'
    }

    // Validar al menos un servicio básico
    const serviciosBasicos = servicios.Basico || []
    const tieneBasico = serviciosBasicos.some(s => serviciosSeleccionados.includes(s.idServicio))
    if (!tieneBasico) {
      errs.servicios = 'Debes seleccionar al menos un servicio básico'
    }

    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar formulario
    const erroresValidacion = validarFormulario()
    if (Object.keys(erroresValidacion).length > 0) {
      setErrors(erroresValidacion)
      setError('Por favor corrige los errores en el formulario')
      return
    }

    const arrendadorId = localStorage.getItem('arrendadorId')
    if (!arrendadorId) {
      navigate('/usuarios/inicio-sesion')
      return
    }

    setCargando(true)
    setError('')
    setMensaje('')

    try {
      const formDataToSend = new FormData()
      
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key])
      })
      
      formDataToSend.append('arrendador_idArrendador', arrendadorId)
      
      if (serviciosSeleccionados.length > 0) {
        formDataToSend.append('servicios', JSON.stringify(serviciosSeleccionados))
      } else {
        formDataToSend.append('servicios', '[]')
      }
      
      fotos.forEach(foto => {
        formDataToSend.append('fotos', foto)
      })

      await crearPropiedad(formDataToSend)
      setMensaje('✅ Propiedad creada exitosamente')
      
      setTimeout(() => {
        navigate('/arrendador/mis-viviendas')
      }, 1500)
      
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear propiedad')
    } finally {
      setCargando(false)
    }
  }

  const inputStyle = (fieldName) => ({
    width: '100%',
    padding: '0.5rem',
    marginTop: '0.25rem',
    border: errors[fieldName] ? '2px solid #dc2626' : '1px solid #d1d5db',
    borderRadius: '4px',
    boxSizing: 'border-box'
  })

  const errorStyle = {
    color: '#dc2626',
    fontSize: '0.8rem',
    marginTop: '0.25rem'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarArrendador />
      <main style={{ flex: 1, padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h2>Crear Nueva Vivienda</h2>

        <form onSubmit={handleSubmit}>
          {/* Información básica */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>Información Básica</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>Título de la propiedad *</label><br />
              <input
                type="text"
                name="propiedadTitulo"
                value={formData.propiedadTitulo}
                onChange={handleChange}
                placeholder="Ej: Loft moderno cerca de ESCOM"
                maxLength={100}
                style={inputStyle('propiedadTitulo')}
                required
              />
              {errors.propiedadTitulo && <div style={errorStyle}>{errors.propiedadTitulo}</div>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Descripción *</label><br />
              <textarea
                name="propiedadDescripcion"
                value={formData.propiedadDescripcion}
                onChange={handleChange}
                placeholder="Describe tu propiedad... (mínimo 20 caracteres)"
                rows="4"
                maxLength={500}
                style={inputStyle('propiedadDescripcion')}
                required
              />
              <small style={{ color: '#888' }}>{formData.propiedadDescripcion.length}/500 caracteres</small>
              {errors.propiedadDescripcion && <div style={errorStyle}>{errors.propiedadDescripcion}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Tipo *</label><br />
                <select
                  name="propiedadTipo"
                  value={formData.propiedadTipo}
                  onChange={handleChange}
                  style={inputStyle('propiedadTipo')}
                >
                  <option value="Departamento">Departamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Habitación">Habitación</option>
                  <option value="Loft">Loft</option>
                  <option value="Estudio">Estudio</option>
                </select>
                {errors.propiedadTipo && <div style={errorStyle}>{errors.propiedadTipo}</div>}
              </div>

              <div>
                <label>Lugares disponibles *</label><br />
                <input
                  type="number"
                  name="propiedadLugares"
                  value={formData.propiedadLugares}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  style={inputStyle('propiedadLugares')}
                  required
                />
                {errors.propiedadLugares && <div style={errorStyle}>{errors.propiedadLugares}</div>}
              </div>

              <div>
                <label>Tipo de precio *</label><br />
                <select
                  name="propiedadPrecioPor"
                  value={formData.propiedadPrecioPor}
                  onChange={handleChange}
                  style={inputStyle('propiedadPrecioPor')}
                >
                  <option value="Persona">Por persona</option>
                  <option value="Habitación">Por habitación</option>
                  <option value="Propiedad">Propiedad completa</option>
                </select>
                {errors.propiedadPrecioPor && <div style={errorStyle}>{errors.propiedadPrecioPor}</div>}
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label>Precio mensual ($) *</label><br />
              <input
                type="number"
                name="propiedadPrecio"
                value={formData.propiedadPrecio}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                style={inputStyle('propiedadPrecio')}
                required
              />
              {errors.propiedadPrecio && <div style={errorStyle}>{errors.propiedadPrecio}</div>}
            </div>
          </div>

          {/* Dirección */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>Dirección</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>Código Postal *</label><br />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  name="cp"
                  value={formData.cp}
                  onChange={handleChange}
                  onBlur={handleBuscarCP}
                  maxLength="5"
                  placeholder="07700"
                  style={{ ...inputStyle('cp'), flex: 1 }}
                  required
                />
                <button
                  type="button"
                  onClick={handleBuscarCP}
                  disabled={buscandoCP || formData.cp.length !== 5}
                  style={{ padding: '0.5rem 1rem', marginTop: '0.25rem', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {buscandoCP ? 'Buscando...' : 'Buscar CP'}
                </button>
              </div>
              {cpValido === true && <small style={{ color: '#16a34a' }}>✓ CP válido</small>}
              {cpValido === false && <small style={{ color: '#dc2626' }}>✗ CP no aceptado</small>}
              {errors.cp && <div style={errorStyle}>{errors.cp}</div>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Calle *</label><br />
              <input
                type="text"
                name="direccionCalle"
                value={formData.direccionCalle}
                onChange={handleChange}
                maxLength={100}
                style={inputStyle('direccionCalle')}
                required
              />
              {errors.direccionCalle && <div style={errorStyle}>{errors.direccionCalle}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Número exterior *</label><br />
                <input
                  type="text"
                  name="direccionNumExt"
                  value={formData.direccionNumExt}
                  onChange={handleChange}
                  maxLength={10}
                  style={inputStyle('direccionNumExt')}
                  required
                />
                {errors.direccionNumExt && <div style={errorStyle}>{errors.direccionNumExt}</div>}
              </div>
              <div>
                <label>Número interior (opcional)</label><br />
                <input
                  type="text"
                  name="direccionNumInt"
                  value={formData.direccionNumInt}
                  onChange={handleChange}
                  maxLength={10}
                  style={inputStyle('direccionNumInt')}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label>Colonia *</label><br />
                <input
                  type="text"
                  name="colonia"
                  value={formData.colonia}
                  readOnly
                  style={{ ...inputStyle('colonia'), backgroundColor: '#f5f5f5' }}
                />
                {errors.colonia && <div style={errorStyle}>{errors.colonia}</div>}
              </div>
              <div>
                <label>Municipio *</label><br />
                <input
                  type="text"
                  name="municipio"
                  value={formData.municipio}
                  readOnly
                  style={{ ...inputStyle('municipio'), backgroundColor: '#f5f5f5' }}
                />
              </div>
              <div>
                <label>Estado *</label><br />
                <input
                  type="text"
                  name="estado"
                  value={formData.estado}
                  readOnly
                  style={{ ...inputStyle('estado'), backgroundColor: '#f5f5f5' }}
                />
              </div>
            </div>
          </div>

          {/* Servicios */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>Servicios</h3>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
              Debes seleccionar al menos un servicio básico. Los servicios de entretenimiento y adicionales son opcionales.
            </p>
            {errors.servicios && <div style={errorStyle}>{errors.servicios}</div>}
            
            {Object.keys(servicios).map(categoria => (
              <div key={categoria} style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: '#374151', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                  {categoria === 'Basico' ? '🔧 Servicios Básicos (mínimo 1 requerido)' :
                   categoria === 'Entretenimiento' ? '📺 Entretenimiento (Opcional)' :
                   '✨ Servicios Adicionales (Opcional)'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  {servicios[categoria].map(servicio => (
                    <label
                      key={servicio.idServicio}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.5rem',
                        backgroundColor: serviciosSeleccionados.includes(servicio.idServicio) ? '#e3f2fd' : '#f5f5f5',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={serviciosSeleccionados.includes(servicio.idServicio)}
                        onChange={() => toggleServicio(servicio.idServicio)}
                        style={{ marginRight: '0.5rem' }}
                      />
                      {servicio.servicioNombre}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Fotos */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>Fotos ({fotos.length}/10) - Mínimo 3 *</h3>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
              Formatos aceptados: JPG, PNG, WebP
            </p>
            
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFotosChange}
              style={{ marginBottom: '0.5rem' }}
            />
            {errors.fotos && <div style={errorStyle}>{errors.fotos}</div>}

            {previews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {previews.map((preview, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img
                      src={preview}
                      alt={`Foto ${index + 1}`}
                      style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <button
                      type="button"
                      onClick={() => eliminarFoto(index)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        backgroundColor: 'red',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '25px',
                        height: '25px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div style={{ color: '#dc2626', marginBottom: '1rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '4px', border: '1px solid #dc2626' }}>
              {error}
            </div>
          )}

          {mensaje && (
            <div style={{ color: '#16a34a', marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '4px', border: '1px solid #16a34a' }}>
              {mensaje}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={cargando}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: cargando ? '#86efac' : '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: cargando ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: '600' }}
            >
              {cargando ? '⏳ Creando...' : '🏠 Crear Vivienda'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/arrendador/mis-viviendas')}
              style={{ padding: '0.75rem 2rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
      <FooterInicio />
    </div>
  )
}

export default CrearVivienda