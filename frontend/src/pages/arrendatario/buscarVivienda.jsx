import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { buscarPropiedades, obtenerServicios } from '../../services/propiedadService'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'
import '../../styles/Arrendatario.css'

const BuscarVivienda = () => {
  const navigate = useNavigate()
  const [propiedades, setPropiedades] = useState([])
  const [servicios, setServicios] = useState({ Basicos: [], Entretenimiento: [], Adicionales: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalPropiedades, setTotalPropiedades] = useState(0)
  const [precioMinGlobal, setPrecioMinGlobal] = useState(0)
  const [precioMaxGlobal, setPrecioMaxGlobal] = useState(10000)
  const [serviciosAbiertos, setServiciosAbiertos] = useState({ Basicos: false, Entretenimiento: false, Adicionales: false })
  const [mensajeRelajado, setMensajeRelajado] = useState(null)
  const busquedaTimer = useRef(null)

  const [filtros, setFiltros] = useState({
    busqueda: '',
    ordenarPor: 'reciente',
    precioMin: '',
    precioMax: '',
    tipo: '',
    precioPor: '',
    lugaresMin: 1,
    serviciosBasicos: [],
    serviciosEntretenimiento: [],
    serviciosAdicionales: [],
    pagina: 1
  })

  useEffect(() => { cargarServicios() }, [])
  useEffect(() => { cargarPropiedades() }, [filtros])

  const cargarServicios = async () => {
    try {
      const response = await obtenerServicios()
      if (response.success) setServicios(response.data)
    } catch (e) { console.error(e) }
  }

  const cargarPropiedades = async () => {
    try {
      setLoading(true)
      setError(null)
      setMensajeRelajado(null)

      const params = {
        ...filtros,
        serviciosBasicos: filtros.serviciosBasicos.join(','),
        serviciosEntretenimiento: filtros.serviciosEntretenimiento.join(','),
        serviciosAdicionales: filtros.serviciosAdicionales.join(',')
      }

      const response = await buscarPropiedades(params)

      if (response.success) {
        setPropiedades(response.data.propiedades)
        setTotalPaginas(response.data.totalPaginas)
        setTotalPropiedades(response.data.total)
        setPrecioMinGlobal(response.data.precioMinGlobal || 0)
        setPrecioMaxGlobal(response.data.precioMaxGlobal || 10000)

        if (response.data.filtrosRelajados && response.data.mensajeRelajado) {
          setMensajeRelajado(response.data.mensajeRelajado)
        }
      }
    } catch (e) {
      setError('Error al cargar propiedades')
    } finally {
      setLoading(false)
    }
  }

  const setFiltro = (campo, valor) => setFiltros(prev => ({ ...prev, [campo]: valor, pagina: 1 }))

  const handleBusqueda = (valor) => {
    if (busquedaTimer.current) clearTimeout(busquedaTimer.current)
    busquedaTimer.current = setTimeout(() => setFiltro('busqueda', valor), 400)
  }

  const handleOrden = (valor) => setFiltro('ordenarPor', valor)

  const handleServicioChange = (categoria, servicioId) => {
    const campo = `servicios${categoria}`
    setFiltros(prev => {
      const current = prev[campo] || []
      const updated = current.includes(servicioId)
        ? current.filter(id => id !== servicioId)
        : [...current, servicioId]
      return { ...prev, [campo]: updated, pagina: 1 }
    })
  }

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '', ordenarPor: 'reciente', precioMin: '', precioMax: '',
      tipo: '', precioPor: '', lugaresMin: 1,
      serviciosBasicos: [], serviciosEntretenimiento: [], serviciosAdicionales: [], pagina: 1
    })
    setMensajeRelajado(null)
  }

  const cambiarPagina = (p) => {
    setFiltros(prev => ({ ...prev, pagina: p }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hayFiltrosActivos = filtros.busqueda || filtros.tipo || filtros.precioPor ||
    filtros.precioMin || filtros.precioMax || filtros.lugaresMin > 1 ||
    filtros.serviciosBasicos.length > 0 || filtros.serviciosEntretenimiento.length > 0 ||
    filtros.serviciosAdicionales.length > 0

  const sortBtn = (val) => `atr-sort-btn ${filtros.ordenarPor === val ? 'atr-sort-btn-active' : 'atr-sort-btn-inactive'}`
  const chipBtn = (active) => `atr-chip-btn ${active ? 'atr-chip-btn-active' : 'atr-chip-btn-inactive'}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarArrendatario />

      <div className="atr-search-layout">

        {/* ============ SIDEBAR DE FILTROS ============ */}
        <div className="atr-search-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 className="atr-sidebar-title" style={{ margin: 0 }}>🔎 Filtros</h2>
            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                style={{ fontSize: '12px', color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Limpiar todo
              </button>
            )}
          </div>

          {/* ORDENAR — Fecha */}
          <p className="atr-sidebar-label">Fecha</p>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            <button className={sortBtn('reciente')} onClick={() => handleOrden('reciente')}>Más reciente</button>
            <button className={sortBtn('antiguo')} onClick={() => handleOrden('antiguo')}>Más antiguo</button>
          </div>

          {/* ORDENAR — Precio */}
          <p className="atr-sidebar-label">Precio</p>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            <button className={sortBtn('precio_asc')} onClick={() => handleOrden('precio_asc')}>↑ Menor</button>
            <button className={sortBtn('precio_desc')} onClick={() => handleOrden('precio_desc')}>↓ Mayor</button>
          </div>

          {/* ORDENAR — Valoración */}
          <p className="atr-sidebar-label">Valoración</p>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            <button className={sortBtn('calificacion')} onClick={() => handleOrden('calificacion')}>⭐ Mejores</button>
            <button className={sortBtn('calificacion_asc')} onClick={() => handleOrden('calificacion_asc')}>👎 Peores</button>
          </div>

          <hr className="atr-sidebar-hr" />

          {/* RANGO DE PRECIO */}
          <p className="atr-sidebar-label">Rango de precio (MXN)</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '10px', marginTop: 0 }}>
            ${precioMinGlobal.toLocaleString('es-MX')} – ${precioMaxGlobal.toLocaleString('es-MX')}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '4px' }}>Mínimo</label>
              <input
                type="number"
                placeholder={`$${precioMinGlobal.toLocaleString('es-MX')}`}
                value={filtros.precioMin}
                onChange={(e) => setFiltro('precioMin', e.target.value)}
                className="atr-sidebar-input"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '4px' }}>Máximo</label>
              <input
                type="number"
                placeholder={`$${precioMaxGlobal.toLocaleString('es-MX')}`}
                value={filtros.precioMax}
                onChange={(e) => setFiltro('precioMax', e.target.value)}
                className="atr-sidebar-input"
              />
            </div>
          </div>

          <hr className="atr-sidebar-hr" />

          {/* TIPO DE VIVIENDA */}
          <p className="atr-sidebar-label">Tipo de vivienda</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {['Departamento', 'Casa', 'Habitación', 'Loft', 'Estudio'].map(t => (
              <button
                key={t}
                onClick={() => setFiltro('tipo', filtros.tipo === t ? '' : t)}
                className={chipBtn(filtros.tipo === t)}
              >
                {t}
              </button>
            ))}
          </div>

          <hr className="atr-sidebar-hr" />

          {/* PRECIO POR */}
          <p className="atr-sidebar-label">Precio por</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {['Propiedad', 'Persona', 'Habitación'].map(pp => (
              <button
                key={pp}
                onClick={() => setFiltro('precioPor', filtros.precioPor === pp ? '' : pp)}
                className={chipBtn(filtros.precioPor === pp)}
              >
                {pp}
              </button>
            ))}
          </div>

          <hr className="atr-sidebar-hr" />

          {/* LUGARES DISPONIBLES */}
          <p className="atr-sidebar-label">Lugares disponibles (mín.)</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <button className="atr-counter-btn" onClick={() => setFiltro('lugaresMin', Math.max(1, (filtros.lugaresMin || 1) - 1))}>−</button>
            <span className="atr-counter-value">{filtros.lugaresMin || 1}</span>
            <button className="atr-counter-btn" onClick={() => setFiltro('lugaresMin', (filtros.lugaresMin || 1) + 1)}>+</button>
          </div>

          <hr className="atr-sidebar-hr" />

          {/* SERVICIOS */}
          <p className="atr-sidebar-label">Servicios</p>
          {[
            ['Basicos', 'Servicios Básicos', 'serviciosBasicos'],
            ['Entretenimiento', 'Entretenimiento', 'serviciosEntretenimiento'],
            ['Adicionales', 'Servicios Adicionales', 'serviciosAdicionales'],
          ].map(([cat, label, campo]) => (
            <div key={cat} className="atr-service-accordion">
              <button
                onClick={() => setServiciosAbiertos(prev => ({ ...prev, [cat]: !prev[cat] }))}
                className="atr-service-accordion-btn"
              >
                <span>
                  {label}
                  {filtros[campo].length > 0 && (
                    <span className="atr-service-count-badge">{filtros[campo].length}</span>
                  )}
                </span>
                <span>{serviciosAbiertos[cat] ? '▲' : '▼'}</span>
              </button>
              {serviciosAbiertos[cat] && (
                <div className="atr-service-accordion-body">
                  {servicios[cat].length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>No disponibles</p>
                  ) : (
                    servicios[cat].map(servicio => (
                      <label key={servicio.idServicio} className="atr-service-check-label">
                        <input
                          type="checkbox"
                          checked={filtros[campo].includes(servicio.idServicio)}
                          onChange={() => handleServicioChange(cat, servicio.idServicio)}
                          style={{ accentColor: '#059669' }}
                        />
                        {servicio.servicioNombre}
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ============ RESULTADOS ============ */}
        <div className="atr-search-results">
          <div className="atr-results-header">
            <h1 className="atr-results-title">Buscar Vivienda</h1>
            <p className="atr-results-count">
              {totalPropiedades} {totalPropiedades === 1 ? 'vivienda encontrada' : 'viviendas encontradas'}
            </p>
          </div>

          {/* Mensaje de filtros relajados */}
          {mensajeRelajado && (
            <div className="atr-relaxed-alert">
              <span style={{ fontSize: '18px' }}>💡</span>
              <p>{mensajeRelajado}</p>
            </div>
          )}

          {/* Buscador */}
          <div className="atr-search-bar">
            <span className="atr-search-bar-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por título, descripción o código postal..."
              defaultValue={filtros.busqueda}
              onChange={(e) => handleBusqueda(e.target.value)}
              className="atr-search-input"
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: '#6b7280' }}>Cargando propiedades...</p>
            </div>
          ) : error ? (
            <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '15px', borderRadius: '12px' }}>
              {error}
            </div>
          ) : propiedades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: '40px', marginBottom: '10px' }}>🔍</p>
              <p style={{ fontSize: '18px', color: '#111827', fontWeight: 700 }}>No se encontraron viviendas</p>
              <p style={{ color: '#6b7280' }}>Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {propiedades.map(propiedad => (
                  <div
                    key={propiedad.id}
                    onClick={() => navigate(`/arrendatario/propiedad/${propiedad.id}`)}
                    className="atr-property-card"
                  >
                    {/* Imagen */}
                    <div className="atr-property-img">
                      {propiedad.fotoPrincipal ? (
                        <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}${propiedad.fotoPrincipal}`} alt={propiedad.titulo} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>🏠</div>
                      )}
                      <div className="atr-status-badge">
                        <span
                          className="atr-badge-pill"
                          style={{ backgroundColor: propiedad.estatus === 'Disponible' ? '#16A34A' : '#F59E0B' }}
                        >
                          {propiedad.estatus}
                        </span>
                        {propiedad.totalResenas === 0 && (
                          <span className="atr-badge-pill" style={{ backgroundColor: '#06B6D4' }}>
                            ✨ Nuevo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="atr-property-info">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <h3 className="atr-property-title">{propiedad.titulo}</h3>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                          <span className="atr-property-price">${propiedad.precio.toLocaleString('es-MX')}</span>
                          <span className="atr-property-price-label">por {propiedad.precioPor?.toLowerCase() || 'mes'}</span>
                        </div>
                      </div>

                      <p className="atr-property-type">{propiedad.tipo}</p>

                      <div className="atr-property-rating">
                        {propiedad.calificacionGeneral ? (
                          <>
                            <span style={{ color: '#F59E0B' }}>⭐</span>
                            <span style={{ fontWeight: 700, fontSize: '14px' }}>{propiedad.calificacionGeneral}</span>
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>({propiedad.totalResenas} {propiedad.totalResenas === 1 ? 'reseña' : 'reseñas'})</span>
                          </>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '12px', fontStyle: 'italic' }}>Sin reseñas aún</span>
                        )}
                      </div>

                      <div className="atr-property-meta">
                        <span>👥 {propiedad.lugares} {propiedad.lugares === 1 ? 'lugar' : 'lugares'}</span>
                        <span>💵 por {propiedad.precioPor?.toLowerCase()}</span>
                      </div>

                      {propiedad.servicios && propiedad.servicios.length > 0 && (
                        <div className="atr-property-tags">
                          {propiedad.servicios.slice(0, 4).map(serv => (
                            <span key={serv.idServicio} className="atr-property-tag">
                              {serv.servicioNombre}
                            </span>
                          ))}
                          {propiedad.servicios.length > 4 && (
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>+{propiedad.servicios.length - 4} más</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="atr-pagination">
                  <button
                    onClick={() => cambiarPagina(filtros.pagina - 1)}
                    disabled={filtros.pagina === 1}
                    className="atr-pagination-btn"
                  >
                    Anterior
                  </button>
                  {[...Array(totalPaginas)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => cambiarPagina(index + 1)}
                      className={`atr-pagination-btn ${filtros.pagina === index + 1 ? 'active' : ''}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => cambiarPagina(filtros.pagina + 1)}
                    disabled={filtros.pagina === totalPaginas}
                    className="atr-pagination-btn"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <FooterInicio />
    </div>
  )
}

export default BuscarVivienda
