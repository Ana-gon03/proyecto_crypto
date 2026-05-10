import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { buscarPropiedades, obtenerServicios } from '../../services/propiedadService'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'

const BuscarVivienda = () => {
  const navigate = useNavigate()
  
  const [propiedades, setPropiedades] = useState([])
  const [servicios, setServicios] = useState({ Basicos: [], Entretenimiento: [], Adicionales: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [filtros, setFiltros] = useState({
    serviciosBasicos: [],
    serviciosEntretenimiento: [],
    serviciosAdicionales: [],
    precioMin: '',
    precioMax: '',
    ordenarPor: 'reciente', // Por defecto: más reciente
    pagina: 1
  })
  
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalPropiedades, setTotalPropiedades] = useState(0)
  const [serviciosAbiertos, setServiciosAbiertos] = useState({ Basicos: false, Entretenimiento: false, Adicionales: false })

  useEffect(() => {
    cargarServicios()
  }, [])

  useEffect(() => {
    cargarPropiedades()
  }, [filtros])

  const cargarServicios = async () => {
    try {
      const response = await obtenerServicios()
      if (response.success) {
        setServicios(response.data)
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error)
    }
  }

  const cargarPropiedades = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        ...filtros,
        serviciosBasicos: filtros.serviciosBasicos.join(','),
        serviciosEntretenimiento: filtros.serviciosEntretenimiento.join(','),
        serviciosAdicionales: filtros.serviciosAdicionales.join(',')
      }
      
      console.log('Enviando filtros:', params) // Para debug
      
      const response = await buscarPropiedades(params)
      
      if (response.success) {
        setPropiedades(response.data.propiedades)
        setTotalPaginas(response.data.totalPaginas)
        setTotalPropiedades(response.data.total)
      }
    } catch (error) {
      setError('Error al cargar propiedades')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleServicioChange = (categoria, servicioId) => {
    setFiltros(prev => {
      const campo = `servicios${categoria}`
      const current = prev[campo] || []
      const updated = current.includes(servicioId)
        ? current.filter(id => id !== servicioId)
        : [...current, servicioId]
      
      return { ...prev, [campo]: updated, pagina: 1 }
    })
  }

  const handlePrecioChange = (tipo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [tipo]: valor,
      pagina: 1
    }))
  }

  const handleOrdenChange = (orden) => {
    console.log('Cambiando orden a:', orden) // Para debug
    setFiltros(prev => ({
      ...prev,
      ordenarPor: orden,
      pagina: 1
    }))
  }

  const limpiarFiltros = () => {
    setFiltros({
      serviciosBasicos: [],
      serviciosEntretenimiento: [],
      serviciosAdicionales: [],
      precioMin: '',
      precioMax: '',
      ordenarPor: 'reciente',
      pagina: 1
    })
  }

  const cambiarPagina = (nuevaPagina) => {
    setFiltros(prev => ({ ...prev, pagina: nuevaPagina }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtrosActivos = filtros.serviciosBasicos.length > 0 || 
    filtros.serviciosEntretenimiento.length > 0 || 
    filtros.serviciosAdicionales.length > 0 ||
    filtros.precioMin || filtros.precioMax

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarArrendatario />

      <div style={{ flex: 1, display: 'flex', maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '20px', gap: '30px' }}>
        
        {/* ============ SIDEBAR DE FILTROS (IZQUIERDA) ============ */}
        <div style={{ width: '280px', minWidth: '280px', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', height: 'fit-content', position: 'sticky', top: '20px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#333' }}>🔎 Filtros</h2>

          {/* ORDENAR POR */}
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Ordenar por</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px' }}>
            {[
              ['reciente', 'Más reciente'],
              ['antiguo', 'Más antiguo'],
              ['precio_asc', 'Precio ascendente'],
              ['precio_desc', 'Precio descendente'],
              ['calificacion', 'Mejor calificación'],
            ].map(([val, label]) => (
              <label key={val} style={labelStyle}>
                <input type="radio" name="orden" checked={filtros.ordenarPor === val} onChange={() => handleOrdenChange(val)} />
                {label}
              </label>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #ddd', marginBottom: '20px' }} />

          {/* PRECIO */}
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Precio (MXN)</p>
          <input type="number" placeholder="Mínimo" value={filtros.precioMin} onChange={(e) => handlePrecioChange('precioMin', e.target.value)} style={inputStyle} />
          <input type="number" placeholder="Máximo" value={filtros.precioMax} onChange={(e) => handlePrecioChange('precioMax', e.target.value)} style={inputStyle} />

          <div style={{ borderTop: '1px solid #ddd', marginBottom: '20px', marginTop: '5px' }} />

          {/* SERVICIOS CON PESTAÑA */}
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Servicios</p>
          {[
            ['Basicos', 'Servicios Básicos', 'serviciosBasicos'],
            ['Entretenimiento', 'Entretenimiento', 'serviciosEntretenimiento'],
            ['Adicionales', 'Servicios Adicionales', 'serviciosAdicionales'],
          ].map(([cat, label, campo]) => (
            <div key={cat} style={{ marginBottom: '10px', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
              <button
                onClick={() => setServiciosAbiertos(prev => ({ ...prev, [cat]: !prev[cat] }))}
                style={{ width: '100%', padding: '10px 12px', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: '600', color: '#333' }}
              >
                <span>
                  {label}
                  {filtros[campo].length > 0 && (
                    <span style={{ backgroundColor: '#1a237e', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', marginLeft: '6px' }}>
                      {filtros[campo].length}
                    </span>
                  )}
                </span>
                <span>{serviciosAbiertos[cat] ? '▲' : '▼'}</span>
              </button>
              {serviciosAbiertos[cat] && (
                <div style={{ padding: '10px 12px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {servicios[cat].length === 0
                    ? <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>No disponibles</p>
                    : servicios[cat].map(servicio => (
                      <label key={servicio.idServicio} style={labelStyle}>
                        <input type="checkbox" checked={filtros[campo].includes(servicio.idServicio)} onChange={() => handleServicioChange(cat, servicio.idServicio)} />
                        {servicio.servicioNombre}
                      </label>
                    ))
                  }
                </div>
              )}
            </div>
          ))}

          {filtrosActivos && (
            <button onClick={limpiarFiltros} style={{ ...btnLimpiarStyle, marginTop: '15px' }}>
              Limpiar todos los filtros
            </button>
          )}
        </div>

        {/* ============ RESULTADOS (DERECHA) ============ */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>Buscar Vivienda</h1>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: '#666' }}>Cargando propiedades...</p>
            </div>
          ) : error ? (
            <div style={{ color: 'red', padding: '20px', backgroundColor: '#ffe6e6', borderRadius: '5px' }}>
              {error}
            </div>
          ) : (
            <>
              <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
                {totalPropiedades} {totalPropiedades === 1 ? 'vivienda encontrada' : 'viviendas encontradas'}
              </p>
              
              {propiedades.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <p style={{ fontSize: '40px', marginBottom: '10px' }}>🔍</p>
                  <p style={{ fontSize: '18px', color: '#333' }}>No se encontraron viviendas</p>
                  <p style={{ color: '#666' }}>Intenta ajustar los filtros de búsqueda</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {propiedades.map(propiedad => (
                      <div 
                        key={propiedad.id} 
                        onClick={() => navigate(`/arrendatario/propiedad/${propiedad.id}`)}
                        style={cardStyle}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}
                      >
                        {/* Imagen */}
                        <div style={imgContainerStyle}>
                          {propiedad.fotoPrincipal ? (
                            <img src={`http://localhost:5000${propiedad.fotoPrincipal}`} alt={propiedad.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '50px', color: '#999' }}>🏠</span>
                          )}
                          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '5px' }}>
                            <span style={{ ...badgeStyle, backgroundColor: propiedad.estatus === 'Disponible' ? '#28a745' : propiedad.estatus === 'Sin Disponibilidad' ? '#ffc107' : '#dc3545' }}>
                              {propiedad.estatus}
                            </span>
                            {propiedad.totalResenas === 0 && (
                              <span style={{ ...badgeStyle, backgroundColor: '#17a2b8' }}>✨ Nuevo</span>
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div style={{ padding: '20px', flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>{propiedad.titulo}</h3>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#1a237e' }}>
                                ${propiedad.precio.toLocaleString('es-MX')}
                              </span>
                              <span style={{ fontSize: '13px', color: '#999', display: 'block' }}>/mes</span>
                            </div>
                          </div>
                          
                          <p style={{ color: '#666', margin: '0 0 10px 0', fontSize: '14px' }}>{propiedad.tipo}</p>
                          
                          {propiedad.calificacionGeneral ? (
                            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ color: '#ffc107', fontSize: '16px' }}>⭐</span>
                              <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{propiedad.calificacionGeneral}</span>
                              <span style={{ color: '#999', fontSize: '13px' }}>({propiedad.totalResenas} {propiedad.totalResenas === 1 ? 'reseña' : 'reseñas'})</span>
                            </div>
                          ) : (
                            <p style={{ color: '#999', fontSize: '13px', fontStyle: 'italic', margin: '0 0 10px 0' }}>Sin reseñas aún</p>
                          )}

                          <div style={{ display: 'flex', gap: '20px', color: '#666', fontSize: '14px' }}>
                            <span>👥 {propiedad.lugares} {propiedad.lugares === 1 ? 'lugar' : 'lugares'}</span>
                            <span>💵 por {propiedad.precioPor.toLowerCase()}</span>
                          </div>

                          {propiedad.servicios && propiedad.servicios.length > 0 && (
                            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {propiedad.servicios.slice(0, 4).map(serv => (
                                <span key={serv.idServicio} style={{ padding: '3px 8px', backgroundColor: '#f0f0f0', borderRadius: '12px', fontSize: '12px', color: '#555' }}>
                                  {serv.servicioNombre}
                                </span>
                              ))}
                              {propiedad.servicios.length > 4 && (
                                <span style={{ fontSize: '12px', color: '#999' }}>+{propiedad.servicios.length - 4} más</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Paginación */}
                  {totalPaginas > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px', marginBottom: '30px' }}>
                      <button onClick={() => cambiarPagina(filtros.pagina - 1)} disabled={filtros.pagina === 1} style={filtros.pagina === 1 ? { ...paginacionBtn, opacity: 0.5, cursor: 'not-allowed' } : paginacionBtn}>
                        ← Anterior
                      </button>
                      {[...Array(totalPaginas)].map((_, index) => (
                        <button key={index} onClick={() => cambiarPagina(index + 1)} style={filtros.pagina === index + 1 ? { ...paginacionBtn, backgroundColor: '#1a237e', color: 'white', fontWeight: 'bold' } : paginacionBtn}>
                          {index + 1}
                        </button>
                      ))}
                      <button onClick={() => cambiarPagina(filtros.pagina + 1)} disabled={filtros.pagina === totalPaginas} style={filtros.pagina === totalPaginas ? { ...paginacionBtn, opacity: 0.5, cursor: 'not-allowed' } : paginacionBtn}>
                        Siguiente →
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <FooterInicio />
    </div>
  )
}

// Estilos reutilizables
const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '5px',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#444'
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  marginBottom: '8px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  fontSize: '14px',
  boxSizing: 'border-box'
}

const btnLimpiarStyle = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px'
}

const cardStyle = {
  display: 'flex',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  overflow: 'hidden',
  cursor: 'pointer',
  backgroundColor: 'white',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  transition: 'box-shadow 0.2s'
}

const imgContainerStyle = {
  width: '280px',
  minWidth: '280px',
  height: '200px',
  backgroundColor: '#e9ecef',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative'
}

const badgeStyle = {
  padding: '4px 8px',
  color: 'white',
  borderRadius: '3px',
  fontSize: '11px',
  fontWeight: 'bold'
}

const paginacionBtn = {
  padding: '8px 15px',
  border: '1px solid #ddd',
  backgroundColor: 'white',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '14px'
}

export default BuscarVivienda