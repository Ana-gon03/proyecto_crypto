import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendador from '../../components/common/NavbarArrendador'
import FooterInicio from '../../components/common/FooterInicio'
import ModalDetalleVivienda from '../../components/arrendador/ModalDetalleVivienda'
import ModalConfirmacion from '../../components/common/ModalConfirmacion'
import { getPropiedadesArrendador, cambiarEstadoPropiedad, eliminarPropiedad } from '../../services/propiedadService'
import '../../styles/Arrendador.css'

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
    if (!idArrendador) { navigate('/usuarios/inicio-sesion'); return }
    cargarPropiedades(idArrendador)
  }, [navigate])

  const cargarPropiedades = async (idArrendador) => {
    try {
      const data = await getPropiedadesArrendador(idArrendador)
      setPropiedades(data)
    } catch { setError('Error al cargar propiedades') }
    finally { setCargando(false) }
  }

  const handleCambiarEstado = async (idPropiedad, nuevoEstado) => {
    try {
      await cambiarEstadoPropiedad(idPropiedad, nuevoEstado)
      cargarPropiedades(localStorage.getItem('arrendadorId'))
    } catch { alert('Error al cambiar estado') }
  }

  const handleSolicitarEliminar = (id) => setModalEliminar({ abierto: true, id })

  const handleConfirmarEliminar = async () => {
    try {
      await eliminarPropiedad(modalEliminar.id)
      setModalEliminar({ abierto: false, id: null })
      cargarPropiedades(localStorage.getItem('arrendadorId'))
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar propiedad')
      setModalEliminar({ abierto: false, id: null })
    }
  }

  const puedeEliminar = (p) => !p.tieneArrendamientos

  const getStatusClass = (estatus) => {
    if (estatus === 'Disponible') return 'disponible'
    if (estatus === 'Sin Disponibilidad') return 'sin-disp'
    return 'desactivada'
  }

  if (cargando) return (
    <div className="arr-page">
      <NavbarArrendador />
      <main className="arr-main"><p className="arr-loading">Cargando viviendas...</p></main>
      <FooterInicio />
    </div>
  )

  return (
    <div className="arr-page">
      <NavbarArrendador />

      <main className="arr-main">
        <div className="arr-page-header">
          <div>
            <h1 className="arr-page-title">Mis Viviendas</h1>
            <p className="arr-page-hint">{propiedades.length} de 3 viviendas registradas</p>
          </div>
          {propiedades.length < 3 && (
            <button
              className="arr-btn-primary"
              onClick={() => navigate('/arrendador/crear-vivienda')}
            >
              + Nueva Vivienda
            </button>
          )}
        </div>

        {error && <div className="arr-alert arr-alert-error">⚠️ {error}</div>}

        {propiedades.length === 0 ? (
          <div className="arr-empty">
            <div className="arr-empty-icon">🏠</div>
            <p className="arr-empty-title">Sin viviendas registradas</p>
            <p className="arr-empty-sub">Publica tu primera vivienda para comenzar a rentar.</p>
            <button
              className="arr-btn-primary"
              onClick={() => navigate('/arrendador/crear-vivienda')}
            >
              Crear mi primera vivienda
            </button>
          </div>
        ) : (
          <div>
            {propiedades.map(propiedad => (
              <div className="arr-card" key={propiedad.idPropiedad}>
                <div className="arr-card-inner">
                  <div className="arr-card-image">
                    {propiedad.fotos?.[0] ? (
                      <img
                        src={`http://localhost:5000${propiedad.fotos[0].fotosURL}`}
                        alt={propiedad.propiedadTitulo}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <div className="arr-card-image-empty">
                        <span style={{ fontSize: '1.5rem' }}>📷</span>
                        <span>Sin foto</span>
                      </div>
                    )}
                  </div>

                  <div className="arr-card-info">
                    <h3 className="arr-card-title">{propiedad.propiedadTitulo}</h3>
                    <p className="arr-card-meta">
                      <strong>{propiedad.propiedadTipo}</strong> &nbsp;·&nbsp;
                      <strong style={{ color: 'var(--purple-600)' }}>${propiedad.propiedadPrecio}/mes</strong>
                    </p>
                    <p className="arr-card-meta">
                      Lugares: <strong>{propiedad.lugaresDisponibles}</strong> disponibles / {propiedad.propiedadLugares} totales
                    </p>
                    <p className="arr-card-desc">{propiedad.propiedadDescripcion}</p>
                  </div>

                  <div className="arr-card-actions">
                    <select
                      className={`arr-status-select ${getStatusClass(propiedad.propiedadEstatus)}`}
                      value={propiedad.propiedadEstatus}
                      onChange={(e) => handleCambiarEstado(propiedad.idPropiedad, e.target.value)}
                    >
                      <option value="Disponible">✅ Disponible</option>
                      <option value="Sin Disponibilidad">⚠️ Sin Disponibilidad</option>
                      <option value="Desactivada">❌ Desactivada</option>
                    </select>

                    <button
                      className="arr-btn-primary arr-btn-sm"
                      onClick={() => { setPropiedadSeleccionada(propiedad); setModalAbierto(true) }}
                    >
                      👁 Ver Detalle
                    </button>

                    <button
                      className="arr-btn-danger arr-btn-sm"
                      onClick={() => handleSolicitarEliminar(propiedad.idPropiedad)}
                      disabled={!puedeEliminar(propiedad)}
                      title={!puedeEliminar(propiedad) ? 'No puedes eliminar una propiedad con arrendamientos activos' : ''}
                    >
                      🗑 Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalAbierto && propiedadSeleccionada && (
        <ModalDetalleVivienda
          propiedad={propiedadSeleccionada}
          onClose={() => { setModalAbierto(false); setPropiedadSeleccionada(null) }}
          onUpdate={() => cargarPropiedades(localStorage.getItem('arrendadorId'))}
        />
      )}

      {modalEliminar.abierto && (
        <ModalConfirmacion
          titulo="Eliminar Propiedad"
          mensaje="¿Estás seguro de eliminar esta propiedad? Se borrarán permanentemente todas las fotos, servicios y reseñas. Esta acción no se puede deshacer."
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
