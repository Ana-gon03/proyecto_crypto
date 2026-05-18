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

  const getStatusKey = (estatus) => {
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

        {/* ── Encabezado ── */}
        <div className="arr-page-header">
          <div>
            <h1 className="arr-page-title">Mis Viviendas</h1>
            <p className="arr-page-hint">
              {propiedades.length} de 3 viviendas registradas
            </p>
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

        {/* ── Estado vacío ── */}
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

          /* ── Grid de tarjetas ── */
          <div className="arr-viviendas-grid">
            {propiedades.map(propiedad => {
              const statusKey = getStatusKey(propiedad.propiedadEstatus)
              const disponibles = propiedad.lugaresDisponibles ?? 0
              const totales = propiedad.propiedadLugares ?? 0
              const pctLugares = totales > 0 ? (disponibles / totales) * 100 : 0

              return (
                <div className="arr-viv-card" key={propiedad.idPropiedad}>

                  {/* Hero imagen */}
                  <div className="arr-viv-hero">
                    {propiedad.fotos?.[0] ? (
                      <img
                        src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}${propiedad.fotos[0].fotosURL}`}
                        alt={propiedad.propiedadTitulo}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <div className="arr-viv-hero-empty">
                        <span>📷</span>
                        <span>Sin foto</span>
                      </div>
                    )}
                    <span className={`arr-viv-status-badge ${statusKey}`}>
                      {propiedad.propiedadEstatus === 'Disponible'      ? '✅ Disponible'
                       : propiedad.propiedadEstatus === 'Sin Disponibilidad' ? '⚠️ Sin disponibilidad'
                       : '❌ Desactivada'}
                    </span>
                  </div>

                  {/* Cuerpo */}
                  <div className="arr-viv-body">
                    <h3 className="arr-viv-title" title={propiedad.propiedadTitulo}>
                      {propiedad.propiedadTitulo}
                    </h3>
                    <p className="arr-viv-type">{propiedad.propiedadTipo}</p>

                    <div className="arr-viv-price-row">
                      <span className="arr-viv-price">
                        ${Number(propiedad.propiedadPrecio).toLocaleString('es-MX')}
                      </span>
                      <span className="arr-viv-price-label">MXN / mes</span>
                    </div>

                    {/* Barra de lugares */}
                    <div className="arr-viv-places">
                      <div className="arr-viv-places-label">
                        <span>Lugares disponibles</span>
                        <span>{disponibles} / {totales}</span>
                      </div>
                      <div className="arr-viv-places-track">
                        <div
                          className="arr-viv-places-fill"
                          style={{ width: `${pctLugares}%` }}
                        />
                      </div>
                    </div>

                    <p className="arr-viv-desc">
                      {propiedad.propiedadDescripcion || 'Sin descripción'}
                    </p>
                  </div>

                  {/* Footer con acciones */}
                  <div className="arr-viv-footer">
                    <select
                      className={`arr-status-select ${statusKey}`}
                      value={propiedad.propiedadEstatus}
                      onChange={(e) => handleCambiarEstado(propiedad.idPropiedad, e.target.value)}
                    >
                      <option value="Disponible">✅ Disponible</option>
                      <option value="Sin Disponibilidad">⚠️ Sin Disponibilidad</option>
                      <option value="Desactivada">❌ Desactivada</option>
                    </select>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="arr-btn-primary arr-btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => { setPropiedadSeleccionada(propiedad); setModalAbierto(true) }}
                      >
                        👁 Ver Detalle
                      </button>
                      <button
                        className="arr-btn-danger arr-btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleSolicitarEliminar(propiedad.idPropiedad)}
                        disabled={!puedeEliminar(propiedad)}
                        title={!puedeEliminar(propiedad) ? 'No puedes eliminar una propiedad con arrendamientos activos' : ''}
                      >
                        🗑 Eliminar
                      </button>
                    </div>
                  </div>

                </div>
              )
            })}
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
