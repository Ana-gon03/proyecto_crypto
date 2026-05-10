import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendador from '../../components/common/NavbarArrendador'
import FooterInicio from '../../components/common/FooterInicio'
import { getPropiedadesDisponibles } from '../../services/propiedadService'
import { buscarArrendatario, crearArrendamiento } from '../../services/arrendamientoService'

const CrearArrendamiento = () => {
  const navigate = useNavigate()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [errors, setErrors] = useState({})

  // Formulario
  const [formData, setFormData] = useState({
    arrendamientoFechaInicio: '',
    arrendamientoRenta: '',
    arrendamientoDescrip: '',
    arrendatario_idArrendatario: '',
    propiedad_idPropiedad: ''
  })

  // Búsqueda de arrendatario
  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [arrendatarioSeleccionado, setArrendatarioSeleccionado] = useState(null)

  // Propiedades disponibles
  const [propiedades, setPropiedades] = useState([])
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null)

  useEffect(() => {
    cargarPropiedades()
  }, [])

  const cargarPropiedades = async () => {
    try {
      const idArrendador = localStorage.getItem('arrendadorId')
      if (!idArrendador) {
        navigate('/usuarios/inicio-sesion')
        return
      }
      const data = await getPropiedadesDisponibles(idArrendador)
      setPropiedades(data)
    } catch (err) {
      setError('Error al cargar propiedades')
    }
  }

  const handleBuscarArrendatario = async () => {
    if (terminoBusqueda.length < 3) {
      setError('Ingresa al menos 3 caracteres para buscar')
      return
    }

    setBuscando(true)
    setError('')
    setResultadosBusqueda([])

    try {
      const data = await buscarArrendatario(terminoBusqueda)
      if (data.length === 0) {
        setError('No se encontraron arrendatarios con ese username o correo')
      } else {
        setResultadosBusqueda(data)
      }
    } catch (err) {
      setError('Error al buscar arrendatario')
    } finally {
      setBuscando(false)
    }
  }

  const handleSeleccionarArrendatario = (arrendatario) => {
    // ✅ VERIFICACIÓN 1: El arrendatario debe estar verificado
    if (arrendatario.arrendatarioVerificado !== 1) {
      setError('❌ Este arrendatario NO ha verificado su identidad. No se puede crear un arrendamiento.')
      return
    }

    setArrendatarioSeleccionado(arrendatario)
    setFormData({ ...formData, arrendatario_idArrendatario: arrendatario.idArrendatario })
    setResultadosBusqueda([])
    setTerminoBusqueda('')
    setError('')
  }

  const handleSeleccionarPropiedad = (e) => {
    const idPropiedad = e.target.value
    setFormData({ ...formData, propiedad_idPropiedad: idPropiedad })
    
    const prop = propiedades.find(p => p.idPropiedad == idPropiedad)
    setPropiedadSeleccionada(prop || null)
    
    // Autocompletar precio
    if (prop) {
      setFormData(prev => ({ 
        ...prev, 
        arrendamientoRenta: prop.propiedadPrecio,
        propiedad_idPropiedad: idPropiedad
      }))
    }
    if (errors.propiedad_idPropiedad) setErrors({ ...errors, propiedad_idPropiedad: null })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) setErrors({ ...errors, [name]: null })
  }

  // ✅ VALIDACIONES
  const validarFormulario = () => {
    const errs = {}

    if (!arrendatarioSeleccionado) {
      errs.arrendatario_idArrendatario = 'Debes seleccionar un arrendatario verificado'
    }

    if (!formData.propiedad_idPropiedad) {
      errs.propiedad_idPropiedad = 'Debes seleccionar una vivienda'
    }

    if (!formData.arrendamientoFechaInicio) {
      errs.arrendamientoFechaInicio = 'La fecha de inicio es obligatoria'
    }

    if (!formData.arrendamientoRenta) {
      errs.arrendamientoRenta = 'La renta es obligatoria'
    } else if (isNaN(formData.arrendamientoRenta) || parseFloat(formData.arrendamientoRenta) <= 0) {
      errs.arrendamientoRenta = 'La renta debe ser un número mayor a 0'
    }

    if (!formData.arrendamientoDescrip || formData.arrendamientoDescrip.trim().length < 10) {
      errs.arrendamientoDescrip = 'La descripción es obligatoria (mínimo 10 caracteres)'
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

    setCargando(true)
    setError('')
    setMensaje('')
    setErrors({})

    try {
      await crearArrendamiento(formData)
      setMensaje('✅ Arrendamiento creado exitosamente')
      
      setTimeout(() => {
        navigate('/arrendador/mis-arrendamientos')
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear arrendamiento')
    } finally {
      setCargando(false)
    }
  }

  const formatearDireccion = (prop) => {
    if (!prop?.direccion) return 'Dirección no disponible'
    const dir = prop.direccion
    let direccion = `${dir.direccionCalle} #${dir.direccionNumExt}`
    if (dir.direccionNumInt) direccion += ` Int. ${dir.direccionNumInt}`
    if (dir.cp) {
      direccion += `, Col. ${dir.cp.d_asenta}, ${dir.cp.D_mnpio}, ${dir.cp.d_estado}, CP ${dir.cp.d_codigo}`
    }
    return direccion
  }

  // Estilos para los campos con error
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
        <h2>Crear Nuevo Arrendamiento</h2>

        <form onSubmit={handleSubmit}>
          {/* Buscar Arrendatario */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>1. Seleccionar Arrendatario *</h3>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
              El arrendatario debe estar verificado (identidad confirmada)
            </p>

            {arrendatarioSeleccionado ? (
              <div style={{ padding: '1rem', backgroundColor: '#e8f5e9', borderRadius: '4px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{arrendatarioSeleccionado.usuario?.usuarioNom} {arrendatarioSeleccionado.usuario?.usuarioApePat}</strong>
                    <span style={{ marginLeft: '0.5rem', backgroundColor: '#16a34a', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                      ✓ Verificado
                    </span>
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>
                      Username: {arrendatarioSeleccionado.arrendatarioUser} • 
                      Correo: {arrendatarioSeleccionado.usuario?.usuarioCorreo} • 
                      Boleta: {arrendatarioSeleccionado.arrendatarioBoleta}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setArrendatarioSeleccionado(null)
                      setFormData({ ...formData, arrendatario_idArrendatario: '' })
                    }}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    value={terminoBusqueda}
                    onChange={(e) => setTerminoBusqueda(e.target.value)}
                    placeholder="Buscar por username o correo del arrendatario..."
                    style={{ flex: 1, padding: '0.5rem', border: errors.arrendatario_idArrendatario ? '2px solid #dc2626' : '1px solid #d1d5db', borderRadius: '4px' }}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleBuscarArrendatario())}
                  />
                  <button
                    type="button"
                    onClick={handleBuscarArrendatario}
                    disabled={buscando || terminoBusqueda.length < 3}
                    style={{ padding: '0.5rem 1.5rem', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {buscando ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
                {errors.arrendatario_idArrendatario && <div style={errorStyle}>{errors.arrendatario_idArrendatario}</div>}

                {resultadosBusqueda.length > 0 && (
                  <div style={{ border: '1px solid #ddd', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                    {resultadosBusqueda.map(arrendatario => (
                      <div
                        key={arrendatario.idArrendatario}
                        onClick={() => handleSeleccionarArrendatario(arrendatario)}
                        style={{
                          padding: '0.75rem',
                          cursor: arrendatario.arrendatarioVerificado === 1 ? 'pointer' : 'not-allowed',
                          borderBottom: '1px solid #eee',
                          backgroundColor: arrendatario.arrendatarioVerificado === 1 ? 'white' : '#fef2f2',
                          opacity: arrendatario.arrendatarioVerificado === 1 ? 1 : 0.7,
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (arrendatario.arrendatarioVerificado === 1) {
                            e.currentTarget.style.backgroundColor = '#f5f5f5'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (arrendatario.arrendatarioVerificado === 1) {
                            e.currentTarget.style.backgroundColor = 'white'
                          }
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>{arrendatario.usuario?.usuarioNom} {arrendatario.usuario?.usuarioApePat}</strong>
                            <span style={{ marginLeft: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                              @{arrendatario.arrendatarioUser}
                            </span>
                          </div>
                          {arrendatario.arrendatarioVerificado === 1 ? (
                            <span style={{ backgroundColor: '#16a34a', color: 'white', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                              ✓ Verificado
                            </span>
                          ) : (
                            <span style={{ backgroundColor: '#dc2626', color: 'white', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                              ✗ No verificado
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                          {arrendatario.usuario?.usuarioCorreo} • Boleta: {arrendatario.arrendatarioBoleta}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Seleccionar Vivienda */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>2. Seleccionar Vivienda *</h3>

            <select
              name="propiedad_idPropiedad"
              value={formData.propiedad_idPropiedad}
              onChange={handleSeleccionarPropiedad}
              style={inputStyle('propiedad_idPropiedad')}
              required
            >
              <option value="">Selecciona una vivienda...</option>
              {propiedades.map(prop => (
                <option key={prop.idPropiedad} value={prop.idPropiedad}>
                  {prop.propiedadTitulo} ({prop.propiedadTipo}) - {prop.lugaresDisponibles} lugares disponibles
                </option>
              ))}
            </select>
            {errors.propiedad_idPropiedad && <div style={errorStyle}>{errors.propiedad_idPropiedad}</div>}

            {propiedadSeleccionada && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <p><strong>📍 Dirección:</strong> {formatearDireccion(propiedadSeleccionada)}</p>
                <p><strong>👥 Lugares:</strong> {propiedadSeleccionada.lugaresDisponibles} disponible(s) de {propiedadSeleccionada.propiedadLugares}</p>
                <p><strong>💰 Precio:</strong> ${propiedadSeleccionada.propiedadPrecio}/mes 
                  {propiedadSeleccionada.propiedadPrecioPor === 'Propiedad' && ' (Propiedad completa)'}
                  {propiedadSeleccionada.propiedadPrecioPor === 'Persona' && ' (Por persona)'}
                  {propiedadSeleccionada.propiedadPrecioPor === 'Habitación' && ' (Por habitación)'}
                </p>
              </div>
            )}
          </div>

          {/* Datos del Arrendamiento */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>3. Datos del Arrendamiento</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label>Fecha de inicio *</label><br />
              <input
                type="date"
                name="arrendamientoFechaInicio"
                value={formData.arrendamientoFechaInicio}
                onChange={handleChange}
                style={inputStyle('arrendamientoFechaInicio')}
                required
              />
              {errors.arrendamientoFechaInicio && <div style={errorStyle}>{errors.arrendamientoFechaInicio}</div>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Renta mensual ($) *</label><br />
              <input
                type="number"
                name="arrendamientoRenta"
                value={formData.arrendamientoRenta}
                readOnly
                style={{ ...inputStyle('arrendamientoRenta'), backgroundColor: '#f5f5f5', color: '#666' }}
                required
              />
              <small style={{ color: '#888' }}>El precio es fijo según la vivienda seleccionada</small>
              {errors.arrendamientoRenta && <div style={errorStyle}>{errors.arrendamientoRenta}</div>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Descripción del arrendamiento *</label><br />
              <textarea
                name="arrendamientoDescrip"
                value={formData.arrendamientoDescrip}
                onChange={handleChange}
                rows="3"
                placeholder="Ej: Contrato anual, incluye servicios de agua y luz... (mínimo 10 caracteres)"
                style={inputStyle('arrendamientoDescrip')}
                required
              />
              {errors.arrendamientoDescrip && <div style={errorStyle}>{errors.arrendamientoDescrip}</div>}
            </div>
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
              {cargando ? '⏳ Creando...' : '✅ Crear Arrendamiento'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/arrendador/mis-arrendamientos')}
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

export default CrearArrendamiento