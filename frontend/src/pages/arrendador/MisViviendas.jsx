import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendador from '../../components/common/NavbarArrendador'
import FooterInicio from '../../components/common/FooterInicio'
import ModalDetalleVivienda from '../../components/arrendador/ModalDetalleVivienda'
import ModalConfirmacion from '../../components/common/ModalConfirmacion'
import { getPropiedadesArrendador, cambiarEstadoPropiedad, eliminarPropiedad } from '../../services/propiedadService'

const MisViviendas = () => {
  const navigate = useNavigate()
  const [propiedades, setPropiedades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null)
  const [modalEliminar, setModalEliminar] = useState({ abierto: false, id: null })

  useEffect(() => {
    const idArrendador = localStorage.getItem('arrendadorId')
    if (!idArrendador) {
      navigate('/usuarios/inicio-sesion')
      return
    }
    cargarPropiedades(idArrendador)
  }, [navigate])

  const cargarPropiedades = async (idArrendador) => {
    try {
      const data = await getPropiedadesArrendador(idArrendador)
      setPropiedades(data)
    } catch (err) {
      setError('Error al cargar propiedades')
    } finally {
      setCargando(false)
    }
  }

  const handleCambiarEstado = async (idPropiedad, nuevoEstado) => {
    try {
      await cambiarEstadoPropiedad(idPropiedad, nuevoEstado)
      const idArrendador = localStorage.getItem('arrendadorId')
      cargarPropiedades(idArrendador)
    } catch (err) {
      alert('Error al cambiar estado')
    }
  }

  const handleSolicitarEliminar = (idPropiedad) => {
    setModalEliminar({ abierto: true, id: idPropiedad })
  }

  const handleConfirmarEliminar = async () => {
    try {
      await eliminarPropiedad(modalEliminar.id)
      setModalEliminar({ abierto: false, id: null })
      const idArrendador = localStorage.getItem('arrendadorId')
      cargarPropiedades(idArrendador)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar propiedad')
      setModalEliminar({ abierto: false, id: null })
    }
  }

  const handleVerDetalle = (propiedad) => {
    setPropiedadSeleccionada(propiedad)
    setModalAbierto(true)
  }

  // Verificar si se puede eliminar (sin arrendamientos activos ni pendientes)
  const puedeEliminar = (propiedad) => {
    return !propiedad.tieneArrendamientos
  }

  if (cargando) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavbarArrendador />
        <main style={{ flex: 1, padding: '2rem', textAlign: 'center' }}>
          <p>Cargando viviendas...</p>
        </main>
        <FooterInicio />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarArrendador />
      
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>Mis Viviendas ({propiedades.length}/3)</h2>
          {propiedades.length < 3 && (
            <button
              onClick={() => navigate('/arrendador/crear-vivienda')}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}
            >
              + Nueva Vivienda
            </button>
          )}
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem', padding: '1rem', backgroundColor: '#ffebee' }}>
            {error}
          </div>
        )}

        {propiedades.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <p>No tienes viviendas registradas.</p>
            <button
              onClick={() => navigate('/arrendador/crear-vivienda')}
              style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Crear mi primera vivienda
            </button>
          </div>
        ) : (
          <div>
            {propiedades.map(propiedad => (
              <div
                key={propiedad.idPropiedad}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  backgroundColor: 'white',
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'center'
                }}
              >
                <div style={{ width: '150px', height: '100px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                  {propiedad.fotos && propiedad.fotos[0] ? (
                    <img 
                      src={`http://localhost:5000${propiedad.fotos[0].fotosURL}`} 
                      alt={propiedad.propiedadTitulo}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                      Sin foto
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{propiedad.propiedadTitulo}</h3>
                  <p style={{ margin: '0.25rem 0', color: '#666' }}>
                    {propiedad.propiedadTipo} • ${propiedad.propiedadPrecio}/mes
                  </p>
                  <p style={{ margin: '0.25rem 0', color: '#666' }}>
                    Lugares: {propiedad.lugaresDisponibles} disponibles / {propiedad.propiedadLugares} totales
                  </p>
                  <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                    {propiedad.propiedadDescripcion?.substring(0, 100)}...
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
                  <select
                    value={propiedad.propiedadEstatus}
                    onChange={(e) => handleCambiarEstado(propiedad.idPropiedad, e.target.value)}
                    style={{ 
                      padding: '0.5rem', 
                      borderRadius: '4px',
                      backgroundColor: 
                        propiedad.propiedadEstatus === 'Disponible' ? '#e8f5e9' :
                        propiedad.propiedadEstatus === 'Sin Disponibilidad' ? '#fff3e0' : '#fce4ec',
                      border: '1px solid #ddd'
                    }}
                  >
                    <option value="Disponible">✅ Disponible</option>
                    <option value="Sin Disponibilidad">⚠️ Sin Disponibilidad</option>
                    <option value="Desactivada">❌ Desactivada</option>
                  </select>

                  <button
                    onClick={() => handleVerDetalle(propiedad)}
                    style={{ padding: '0.5rem', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Ver Detalle
                  </button>

                  <button
                  onClick={() => handleSolicitarEliminar(propiedad.idPropiedad)}
                  disabled={!puedeEliminar(propiedad)}
                  style={{ 
                    padding: '0.5rem', 
                    backgroundColor: puedeEliminar(propiedad) ? '#f44336' : '#ccc', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: puedeEliminar(propiedad) ? 'pointer' : 'not-allowed' 
                  }}
                  title={!puedeEliminar(propiedad) ? 'No puedes eliminar una propiedad con arrendamientos. Finalízalos primero.' : 'Eliminar propiedad'}
                >
                  Eliminar
                </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalAbierto && propiedadSeleccionada && (
        <ModalDetalleVivienda
          propiedad={propiedadSeleccionada}
          onClose={() => {
            setModalAbierto(false)
            setPropiedadSeleccionada(null)
          }}
          onUpdate={() => {
            const idArrendador = localStorage.getItem('arrendadorId')
            cargarPropiedades(idArrendador)
          }}
        />
      )}

      {modalEliminar.abierto && (
        <ModalConfirmacion
          titulo="Eliminar Propiedad"
          mensaje="¿Estás seguro de eliminar esta propiedad? Se borrarán permanentemente todas las fotos, servicios asociados y reseñas. Esta acción no se puede deshacer."
          onConfirmar={handleConfirmarEliminar}
          onCancelar={() => setModalEliminar({ abierto: false, id: null })}
          textoConfirmar="Eliminar"
          textoCancelar="Cancelar"
          peligro={true}
        />
      )}

      <FooterInicio />
    </div>
  )
}

export default MisViviendas