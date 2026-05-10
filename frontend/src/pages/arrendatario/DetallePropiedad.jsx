import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenerDetallePropiedad } from '../../services/propiedadService'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'

const DetallePropiedad = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [propiedad, setPropiedad] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fotoActiva, setFotoActiva] = useState(0)

  useEffect(() => {
    cargarPropiedad()
  }, [id])

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

  // Separar servicios por categoría
  const serviciosBasicos = propiedad?.servicios?.filter(s => s.servicioCategoria === 'Basico') || []
  const serviciosEntretenimiento = propiedad?.servicios?.filter(s => s.servicioCategoria === 'Entretenimiento') || []
  const serviciosAdicionales = propiedad?.servicios?.filter(s => s.servicioCategoria === 'Adicional') || []

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavbarArrendatario />
        <div style={{ flex: 1, textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#666' }}>Cargando propiedad...</p>
        </div>
        <FooterInicio />
      </div>
    )
  }

  if (error || !propiedad) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavbarArrendatario />
        <div style={{ flex: 1, padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ color: 'red', padding: '20px', backgroundColor: '#ffe6e6', borderRadius: '5px', marginBottom: '20px' }}>
            {error || 'Propiedad no encontrada'}
          </div>
          <button onClick={() => navigate('/arrendatario/buscar-vivienda')} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            ← Volver a resultados
          </button>
        </div>
        <FooterInicio />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarArrendatario />

      <div style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '20px', width: '100%' }}>
        {/* Botón volver */}
        <button 
          onClick={() => navigate('/arrendatario/buscar-vivienda')}
          style={{
            padding: '10px 20px',
            marginBottom: '20px',
            cursor: 'pointer',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '14px'
          }}
        >
          ← Volver a resultados
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
          {/* Columna principal */}
          <div>
            {/* Galería de fotos */}
            <div style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              overflow: 'hidden',
              marginBottom: '20px',
              backgroundColor: 'white'
            }}>
              {propiedad.fotos && propiedad.fotos.length > 0 ? (
                <>
                  <div style={{ height: '400px', backgroundColor: '#f0f0f0' }}>
                    <img
                      src={`http://localhost:5000${propiedad.fotos[fotoActiva].fotosURL}`}
                      alt={`Foto ${fotoActiva + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span style="font-size:60px">🏠</span>'; }}
                    />
                  </div>
                  {propiedad.fotos.length > 1 && (
                    <div style={{ display: 'flex', gap: '10px', padding: '10px', overflow: 'auto' }}>
                      {propiedad.fotos.map((foto, index) => (
                        <img
                          key={foto.idFotos}
                          src={`http://localhost:5000${foto.fotosURL}`}
                          alt={`Miniatura ${index + 1}`}
                          onClick={() => setFotoActiva(index)}
                          style={{
                            width: '80px',
                            height: '60px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            border: index === fotoActiva ? '3px solid #1a237e' : '3px solid transparent',
                            opacity: index === fotoActiva ? 1 : 0.6
                          }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ 
                  height: '400px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f0f0f0',
                  fontSize: '60px'
                }}>
                  🏠
                </div>
              )}
            </div>

            {/* Información principal */}
            <div style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '25px',
              marginBottom: '20px',
              backgroundColor: 'white'
            }}>
              <h1 style={{ marginTop: 0, fontSize: '24px' }}>{propiedad.titulo}</h1>
              
              <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                <span style={{ 
                  padding: '5px 12px', 
                  backgroundColor: '#1a237e', 
                  color: 'white', 
                  borderRadius: '3px',
                  fontSize: '13px'
                }}>
                  {propiedad.tipo}
                </span>
                <span style={{ 
                  padding: '5px 12px', 
                  backgroundColor: propiedad.estatus === 'Disponible' ? '#28a745' : 
                                  propiedad.estatus === 'Sin Disponibilidad' ? '#ffc107' : '#dc3545',
                  color: 'white', 
                  borderRadius: '3px',
                  fontSize: '13px'
                }}>
                  {propiedad.estatus}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h2 style={{ color: '#1a237e', margin: 0, fontSize: '28px' }}>
                    ${propiedad.precio.toLocaleString('es-MX')}
                  </h2>
                  <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '14px' }}>
                    por {propiedad.precioPor.toLowerCase()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                    👥 {propiedad.lugares} lugares disponibles
                  </p>
                  <p style={{ color: '#666', margin: 0, fontSize: '13px' }}>
                    📅 Publicado el {formatFecha(propiedad.fechaRegistro)}
                  </p>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Descripción</h3>
              <p style={{ color: '#666', lineHeight: '1.6', fontSize: '14px' }}>{propiedad.descripcion}</p>

              <hr style={{ margin: '20px 0' }} />

              <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>📍 Dirección</h3>
              <p style={{ color: '#666', lineHeight: '1.6', fontSize: '14px' }}>
                {propiedad.direccion.calle} #{propiedad.direccion.numExt}
                {propiedad.direccion.numInt && ` Int. ${propiedad.direccion.numInt}`}<br />
                Col. {propiedad.direccion.colonia}<br />
                {propiedad.direccion.municipio}, {propiedad.direccion.estado}<br />
                C.P. {propiedad.direccion.cp}
              </p>

              <hr style={{ margin: '20px 0' }} />

              {/* ✅ SERVICIOS SEPARADOS POR CATEGORÍA */}
              <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Servicios incluidos</h3>
              
              {serviciosBasicos.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', color: '#1a237e', marginBottom: '8px' }}>🔌 Servicios Básicos</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {serviciosBasicos.map(servicio => (
                      <span key={servicio.idServicio} style={{
                        padding: '8px 15px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '5px',
                        fontSize: '13px',
                        color: '#1a237e'
                      }}>
                        {servicio.servicioNombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {serviciosEntretenimiento.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', color: '#2e7d32', marginBottom: '8px' }}>🎮 Entretenimiento</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {serviciosEntretenimiento.map(servicio => (
                      <span key={servicio.idServicio} style={{
                        padding: '8px 15px',
                        backgroundColor: '#e8f5e9',
                        borderRadius: '5px',
                        fontSize: '13px',
                        color: '#2e7d32'
                      }}>
                        {servicio.servicioNombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {serviciosAdicionales.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', color: '#00838f', marginBottom: '8px' }}>✨ Servicios Adicionales</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {serviciosAdicionales.map(servicio => (
                      <span key={servicio.idServicio} style={{
                        padding: '8px 15px',
                        backgroundColor: '#e0f7fa',
                        borderRadius: '5px',
                        fontSize: '13px',
                        color: '#00838f'
                      }}>
                        {servicio.servicioNombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {propiedad.servicios.length === 0 && (
                <p style={{ color: '#999', fontStyle: 'italic' }}>No hay servicios registrados</p>
              )}
            </div>

            {/* Sección de Reseñas */}
            <div style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '25px',
              backgroundColor: 'white'
            }}>
              <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Reseñas y Calificaciones</h2>
              
              {propiedad.calificaciones.totalResenas > 0 ? (
                <>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '20px',
                    marginBottom: '30px',
                    textAlign: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a237e' }}>
                        {propiedad.calificaciones.promedioCalGen || 'N/A'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>⭐ General</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a237e' }}>
                        {propiedad.calificaciones.promedioCalSerBasic || 'N/A'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>🔌 Serv. Básicos</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a237e' }}>
                        {propiedad.calificaciones.promedioCalSerComEnt || 'N/A'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>🎮 Entretenimiento</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a237e' }}>
                        {propiedad.calificaciones.promedioCalSerAdicio || 'N/A'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>✨ Adicionales</div>
                    </div>
                  </div>
                  <hr style={{ marginBottom: '20px' }} />
                </>
              ) : null}

              {propiedad.resenas && propiedad.resenas.length > 0 ? (
                <div>
                  {propiedad.resenas.map(resena => (
                    <div 
                      key={resena.id} 
                      style={{ 
                        padding: '15px 0', 
                        borderBottom: '1px solid #eee'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                        <strong style={{ fontSize: '14px' }}>{resena.autor.nombre || 'Anónimo'}</strong>
                        <span style={{ color: '#666', fontSize: '13px' }}>
                          {formatFecha(resena.fecha)}
                          {resena.duracionRenta && ` · ${resena.duracionRenta} meses`}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 8px 0', color: '#555', fontSize: '14px', lineHeight: '1.5' }}>{resena.descripcion}</p>
                      <div style={{ color: '#ffc107', fontSize: '14px', marginBottom: '5px' }}>
                        {'⭐'.repeat(Math.round(resena.calGen))}
                      </div>
                      {resena.sentimiento && (
                        <span style={{ 
                          display: 'inline-block',
                          marginTop: '5px',
                          padding: '3px 8px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '3px',
                          fontSize: '11px',
                          color: '#555'
                        }}>
                          {resena.sentimiento}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#999', padding: '30px', fontSize: '14px' }}>
                  No hay reseñas para mostrar
                </p>
              )}
            </div>
          </div>

          {/* Sidebar - Arrendador */}
          <div style={{ position: 'sticky', top: '20px', alignSelf: 'start' }}>
            <div style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '20px',
              backgroundColor: 'white'
            }}>
              <h3 style={{ marginTop: 0, fontSize: '18px', marginBottom: '20px' }}>Arrendador</h3>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px',
                paddingBottom: '20px',
                borderBottom: '1px solid #eee'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#1a237e',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginRight: '15px'
                }}>
                  {propiedad.arrendador.nombre.charAt(0)}
                </div>
                <div>
                  <strong style={{ fontSize: '15px' }}>{propiedad.arrendador.nombre}</strong>
                </div>
              </div>

              <h4 style={{ fontSize: '14px', marginBottom: '15px', color: '#555' }}>📞 Contacto</h4>
              
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>Correo electrónico:</div>
                <div style={{ fontSize: '14px', wordBreak: 'break-all' }}>{propiedad.arrendador.correo}</div>
              </div>
              
              <div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>Teléfono:</div>
                <div style={{ fontSize: '14px' }}>{propiedad.arrendador.telefono || 'No disponible'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FooterInicio />
    </div>
  )
}

export default DetallePropiedad