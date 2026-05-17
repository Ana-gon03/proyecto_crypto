import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenerDetallePropiedad } from '../../services/propiedadService'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'
import '../../styles/Arrendatario.css'

const RESENAS_POR_PAGINA = 5

const DetallePropiedad = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [propiedad, setPropiedad] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fotoActiva, setFotoActiva] = useState(0)
  const [filtroSentimiento, setFiltroSentimiento] = useState('todas')
  const [paginaActual, setPaginaActual] = useState(1)
  const [estaVerificado, setEstaVerificado] = useState(false)
  const [esRenovacion, setEsRenovacion] = useState(false)

  useEffect(() => {
    cargarPropiedad()
    verificarEstadoVerificacion()
  }, [id])

  useEffect(() => {
    setPaginaActual(1)
  }, [filtroSentimiento])

  const verificarEstadoVerificacion = async () => {
      const fechaVerificacion = localStorage.getItem('arrendatarioFechaVerificacion')
      
      // Si tiene fecha de verificación guardada, verificar vigencia
      if (fechaVerificacion && fechaVerificacion !== 'null' && fechaVerificacion !== 'undefined') {
        const ahora = new Date()
        const fechaVer = new Date(fechaVerificacion)
        const mesesTranscurridos = (ahora - fechaVer) / (1000 * 60 * 60 * 24 * 30)
        
        if (mesesTranscurridos >= 6) {
          // Expirado - necesita renovación
          setEstaVerificado(false)
          setEsRenovacion(true)
          // NO cambiar arrendatarioVerificado a false en localStorage
          // para que MiArrendamiento no se confunda
          return
        } else {
          // Vigente
          setEstaVerificado(true)
          setEsRenovacion(false)
          localStorage.setItem('arrendatarioVerificado', 'true')
          return
        }
      }
      
      // Si no tiene fecha en localStorage, consultar al backend
      try {
        const userId = localStorage.getItem('userId')
        const response = await fetch('http://localhost:5000/api/auth/estado-verificacion', {
          headers: { 'x-user-id': userId }
        })
        const data = await response.json()
        
        if (data.success) {
          if (data.fechaVerificacion) {
            localStorage.setItem('arrendatarioFechaVerificacion', data.fechaVerificacion)
            
            const ahora = new Date()
            const fechaVer = new Date(data.fechaVerificacion)
            const mesesTranscurridos = (ahora - fechaVer) / (1000 * 60 * 60 * 24 * 30)
            
            if (mesesTranscurridos >= 6) {
              setEstaVerificado(false)
              setEsRenovacion(true)
            } else {
              setEstaVerificado(true)
              setEsRenovacion(false)
              localStorage.setItem('arrendatarioVerificado', 'true')
            }
          } else {
            // Nunca verificado
            setEstaVerificado(false)
            setEsRenovacion(false)
            localStorage.setItem('arrendatarioVerificado', 'false')
          }
        }
      } catch (error) {
        console.error('Error al obtener estado:', error)
        setEstaVerificado(false)
        setEsRenovacion(false)
      }
    }

  const cargarPropiedad = async () => {
    try {
      setLoading(true)
      const response = await obtenerDetallePropiedad(id)
      if (response.success) {
        setPropiedad(response.data)
      }
    } catch (error) {
      setError('Error al cargar la propiedad')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const serviciosBasicos = propiedad?.servicios?.filter(s => s.servicioCategoria === 'Basico') || []
  const serviciosEntretenimiento = propiedad?.servicios?.filter(s => s.servicioCategoria === 'Entretenimiento') || []
  const serviciosAdicionales = propiedad?.servicios?.filter(s => s.servicioCategoria === 'Adicional') || []

  // Filtrar y paginar reseñas
  const obtenerResenasFiltradas = () => {
    if (!propiedad?.resenas) return []
    
    let resenasFiltradas = propiedad.resenas
    
    if (filtroSentimiento !== 'todas') {
      resenasFiltradas = propiedad.resenas.filter(r => 
        r.sentimiento?.toLowerCase() === filtroSentimiento
      )
    }
    
    return resenasFiltradas
  }

  const resenasFiltradas = obtenerResenasFiltradas()
  const totalPaginas = Math.ceil(resenasFiltradas.length / RESENAS_POR_PAGINA)
  const inicio = (paginaActual - 1) * RESENAS_POR_PAGINA
  const resenasPaginadas = resenasFiltradas.slice(inicio, inicio + RESENAS_POR_PAGINA)

  // Contadores de sentimiento
  const contarSentimientos = (sentimiento) => {
    if (!propiedad?.resenas) return 0
    return propiedad.resenas.filter(r => r.sentimiento?.toLowerCase() === sentimiento).length
  }

  const totalPositivas = contarSentimientos('positivo')
  const totalNeutras = contarSentimientos('neutral')
  const totalNegativas = contarSentimientos('negativo')

  if (loading) {
    return (
      <div className="atr-page">
        <NavbarArrendatario />
        <div className="atr-main">
          <div className="atr-loading">
            <p>Cargando propiedad...</p>
          </div>
        </div>
        <FooterInicio />
      </div>
    )
  }

  if (error || !propiedad) {
    return (
      <div className="atr-page">
        <NavbarArrendatario />
        <div className="atr-main">
          <div className="atr-alert atr-alert-error">
            <div className="atr-alert-icon">⚠️</div>
            <div className="atr-alert-body">
              <div className="atr-alert-title">Error</div>
              <div className="atr-alert-desc">{error || 'Propiedad no encontrada'}</div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/arrendatario/buscar-vivienda')}
            className="atr-btn-ghost"
            style={{ width: 'auto' }}
          >
            ← Volver a resultados
          </button>
        </div>
        <FooterInicio />
      </div>
    )
  }

  return (
    <div className="atr-page">
      <NavbarArrendatario />

      <div className="atr-detail-container">
        {/* Botón volver */}
        <button
          onClick={() => navigate('/arrendatario/buscar-vivienda')}
          className="atr-btn-back"
        >
          ← Regresar
        </button>

        <div className="atr-detail-grid">
          {/* Columna principal */}
          <div className="atr-detail-main">
            {/* Galería de fotos */}
            <div className="atr-detail-gallery">
              {propiedad.fotos && propiedad.fotos.length > 0 ? (
                <>
                  <div className="atr-gallery-main">
                    <img
                      src={`http://localhost:5000${propiedad.fotos[fotoActiva].fotosURL}`}
                      alt={`Foto ${fotoActiva + 1}`}
                    />
                  </div>
                  {propiedad.fotos.length > 1 && (
                    <div className="atr-gallery-thumbs">
                      {propiedad.fotos.map((foto, index) => (
                        <img
                          key={foto.idFotos}
                          src={`http://localhost:5000${foto.fotosURL}`}
                          alt={`Miniatura ${index + 1}`}
                          onClick={() => setFotoActiva(index)}
                          className={`atr-gallery-thumb ${index === fotoActiva ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="atr-gallery-placeholder">🏠</div>
              )}
            </div>

            {/* Información principal */}
            <div className="atr-detail-card">
              <h1 className="atr-detail-title">{propiedad.titulo}</h1>
              
              <div className="atr-detail-badges">
                <span className="atr-badge atr-badge-primary">{propiedad.tipo}</span>
                <span className={`atr-badge atr-badge-${propiedad.estatus === 'Disponible' ? 'success' : 'warning'}`}>
                  {propiedad.estatus}
                </span>
              </div>

              <div className="atr-detail-price-row">
                <div>
                  <div className="atr-detail-price">
                    ${propiedad.precio.toLocaleString('es-MX')}
                  </div>
                  <div className="atr-detail-price-period">
                    por {propiedad.precioPor.toLowerCase()}
                  </div>
                </div>
                <div className="atr-detail-meta">
                  <div>👥 {propiedad.lugares} lugares disponibles</div>
                  <div>📅 Publicado el {formatFecha(propiedad.fechaRegistro)}</div>
                </div>
              </div>

              <div className="atr-detail-section">
                <h3>Descripción</h3>
                <p>{propiedad.descripcion}</p>
              </div>

              <hr className="atr-divider" />

              <div className="atr-detail-section">
                <h3>📍 Dirección</h3>
                <p>
                  {propiedad.direccion.calle} #{propiedad.direccion.numExt}
                  {propiedad.direccion.numInt && ` Int. ${propiedad.direccion.numInt}`}<br />
                  Col. {propiedad.direccion.colonia}<br />
                  {propiedad.direccion.municipio}, {propiedad.direccion.estado}<br />
                  C.P. {propiedad.direccion.cp}
                </p>
              </div>

              <hr className="atr-divider" />

              <div className="atr-detail-section">
                <h3>Servicios incluidos</h3>

                {serviciosBasicos.length > 0 && (
                  <div className="atr-service-category">
                    <h4>🔌 Servicios Básicos</h4>
                    <div className="atr-service-tags">
                      {serviciosBasicos.map(servicio => (
                        <span key={servicio.idServicio} className="atr-service-tag basic">{servicio.servicioNombre}</span>
                      ))}
                    </div>
                  </div>
                )}

                {serviciosEntretenimiento.length > 0 && (
                  <div className="atr-service-category">
                    <h4>🎮 Entretenimiento</h4>
                    <div className="atr-service-tags">
                      {serviciosEntretenimiento.map(servicio => (
                        <span key={servicio.idServicio} className="atr-service-tag entertainment">{servicio.servicioNombre}</span>
                      ))}
                    </div>
                  </div>
                )}

                {serviciosAdicionales.length > 0 && (
                  <div className="atr-service-category">
                    <h4>✨ Servicios Adicionales</h4>
                    <div className="atr-service-tags">
                      {serviciosAdicionales.map(servicio => (
                        <span key={servicio.idServicio} className="atr-service-tag additional">{servicio.servicioNombre}</span>
                      ))}
                    </div>
                  </div>
                )}

                {propiedad.servicios.length === 0 && (
                  <p className="atr-text-muted">No hay servicios registrados</p>
                )}
              </div>
            </div>

            {/* Sección de Reseñas */}
            <div className="atr-reviews-card">
              <h2>Reseñas y Calificaciones</h2>
              
              {propiedad.calificaciones.totalResenas > 0 && (
                <>
                  {/* Calificación general */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '20px',
                    marginBottom: '30px',
                    textAlign: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                        {propiedad.calificaciones.promedioCalGen || 'N/A'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>⭐ General</div>
                    </div>

                    {serviciosBasicos.length > 0 && (
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                          {propiedad.calificaciones.promedioCalSerBasic === null
                            ? <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 'bold' }}>✨ Nuevo</span>
                            : propiedad.calificaciones.promedioCalSerBasic > 0
                              ? propiedad.calificaciones.promedioCalSerBasic
                              : 'N/A'
                          }
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>🔌 Serv. Básicos</div>
                      </div>
                    )}

                    {serviciosEntretenimiento.length > 0 && (
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                          {propiedad.calificaciones.promedioCalSerComEnt === null
                            ? <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 'bold' }}>✨ Nuevo</span>
                            : propiedad.calificaciones.promedioCalSerComEnt > 0
                              ? propiedad.calificaciones.promedioCalSerComEnt
                              : 'N/A'
                          }
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>🎮 Entretenimiento</div>
                      </div>
                    )}

                    {serviciosAdicionales.length > 0 && (
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                          {propiedad.calificaciones.promedioCalSerAdicio === null
                            ? <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 'bold' }}>✨ Nuevo</span>
                            : propiedad.calificaciones.promedioCalSerAdicio > 0
                              ? propiedad.calificaciones.promedioCalSerAdicio
                              : 'N/A'
                          }
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>✨ Adicionales</div>
                      </div>
                    )}
                  </div>

                  <hr style={{ marginBottom: '20px' }} />

                  {/* Filtros de sentimiento */}
                  <div className="atr-sentiment-filters">
                    <button
                      className={`atr-chip-btn ${filtroSentimiento === 'todas' ? 'atr-chip-btn-active' : 'atr-chip-btn-inactive'}`}
                      onClick={() => setFiltroSentimiento('todas')}
                    >
                      📋 Todas ({propiedad.resenas.length})
                    </button>
                    <button
                      className={`atr-chip-btn ${filtroSentimiento === 'positivo' ? 'atr-chip-btn-active' : 'atr-chip-btn-inactive'}`}
                      onClick={() => setFiltroSentimiento('positivo')}
                    >
                      😊 Positivas ({totalPositivas})
                    </button>
                    <button
                      className={`atr-chip-btn ${filtroSentimiento === 'neutral' ? 'atr-chip-btn-active' : 'atr-chip-btn-inactive'}`}
                      onClick={() => setFiltroSentimiento('neutral')}
                    >
                      😐 Neutras ({totalNeutras})
                    </button>
                    <button
                      className={`atr-chip-btn ${filtroSentimiento === 'negativo' ? 'atr-chip-btn-active' : 'atr-chip-btn-inactive'}`}
                      onClick={() => setFiltroSentimiento('negativo')}
                    >
                      😞 Negativas ({totalNegativas})
                    </button>
                  </div>
                </>
              )}

              {/* Lista de reseñas */}
              {propiedad.resenas && propiedad.resenas.length > 0 ? (
                <div>
                  {resenasPaginadas.length > 0 ? (
                    <>
                      {resenasPaginadas.map(resena => {
                        const sent = resena.sentimiento?.toLowerCase()
                        const sentBg = sent === 'positivo' ? '#f0fdf4' : sent === 'negativo' ? '#fef2f2' : '#fffbeb'
                        const sentColor = sent === 'positivo' ? '#166534' : sent === 'negativo' ? '#991b1b' : '#92400e'
                        const sentLabel = sent === 'positivo' ? '😊 Positivo' : sent === 'negativo' ? '😞 Negativo' : '😐 Neutro'
                        return (
                          <div key={resena.id} className="atr-review-item">
                            <div className="atr-review-header">
                              <strong className="atr-review-author">{resena.autor?.nombre || 'Anónimo'}</strong>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{
                                  padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                                  fontWeight: '700', backgroundColor: sentBg, color: sentColor
                                }}>
                                  {sentLabel}
                                </span>
                                <span className="atr-review-date">{formatFecha(resena.fecha)}</span>
                              </div>
                            </div>
                            <div className="atr-review-meta">
                              <span className="atr-review-rating">⭐ {resena.calGen}</span>
                              {resena.duracionRenta && (
                                <span className="atr-review-duration">
                                  🕒 {resena.duracionRenta} {resena.duracionRenta === 1 ? 'mes' : 'meses'}
                                </span>
                              )}
                            </div>
                            <p className="atr-review-text">{resena.descripcion}</p>
                          </div>
                        )
                      })}

                      {/* Paginación */}
                      {totalPaginas > 1 && (
                        <div className="atr-pagination">
                          <button
                            className="atr-pagination-btn"
                            onClick={() => setPaginaActual(paginaActual - 1)}
                            disabled={paginaActual === 1}
                          >
                            ← Anterior
                          </button>
                          {[...Array(totalPaginas)].map((_, i) => (
                            <button
                              key={i}
                              className={`atr-pagination-btn ${paginaActual === i + 1 ? 'active' : ''}`}
                              onClick={() => setPaginaActual(i + 1)}
                            >
                              {i + 1}
                            </button>
                          ))}
                          <button
                            className="atr-pagination-btn"
                            onClick={() => setPaginaActual(paginaActual + 1)}
                            disabled={paginaActual === totalPaginas}
                          >
                            Siguiente →
                          </button>
                        </div>
                      )}

                      <p className="atr-footnote" style={{ marginTop: '0.75rem' }}>
                        Mostrando {inicio + 1}–{Math.min(inicio + RESENAS_POR_PAGINA, resenasFiltradas.length)} de {resenasFiltradas.length} reseñas
                        {filtroSentimiento !== 'todas' && ` · filtradas por "${filtroSentimiento}"`}
                      </p>
                    </>
                  ) : (
                    <p className="atr-reviews-empty">
                      No hay reseñas {filtroSentimiento !== 'todas' ? `de tipo "${filtroSentimiento}"` : ''} para mostrar
                    </p>
                  )}
                </div>
              ) : (
                <p className="atr-reviews-empty">No hay reseñas para mostrar</p>
              )}
            </div>
          </div>

          {/* Sidebar - Arrendador */}
          <div className="atr-detail-sidebar">
            <div className="atr-landlord-card">
              <h3>Arrendador</h3>
              
              <div className="atr-landlord-info">
                <div className="atr-landlord-avatar-lg">
                  {propiedad.arrendador.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="atr-landlord-name-lg">{propiedad.arrendador.nombre}</div>
              </div>

              <h4 style={{ fontSize: '14px', marginBottom: '15px', color: '#555' }}>📞 Contacto</h4>
              {estaVerificado ? (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>Correo electrónico:</div>
                    <div style={{ fontSize: '14px', wordBreak: 'break-all' }}>{propiedad.arrendador.correo}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>Teléfono:</div>
                    <div style={{ fontSize: '14px' }}>{propiedad.arrendador.telefono || 'No disponible'}</div>
                  </div>
                </>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>Correo electrónico:</div>
                      <div style={{ fontSize: '14px' }}>arrendador@correo.com</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>Teléfono:</div>
                      <div style={{ fontSize: '14px' }}>55 1234 5678</div>
                    </div>
                  </div>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                    <span style={{ fontSize: '20px', marginBottom: '6px' }}>🔒</span>
                    <p style={{ fontSize: '11px', color: '#333', margin: '0 0 10px 0', lineHeight: '1.4', fontWeight: '600' }}>
                      {esRenovacion
                        ? 'Tu verificación expiró hace más de 6 meses. Renueva para ver los datos de contacto.'
                        : 'Verifica tu identidad para ver los datos de contacto'
                      }
                    </p>
                    <button
                      onClick={() => { esRenovacion ? navigate('/arrendatario/renovar-identidad') : navigate('/arrendatario/verificar-identidad') }}
                      style={{ padding: '7px 12px', backgroundColor: esRenovacion ? '#e65100' : '#059669', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                    >
                      {esRenovacion ? '🔄 Renovar ahora' : '📤 Verificar ahora'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FooterInicio />
    </div>
  )
}

export default DetallePropiedad