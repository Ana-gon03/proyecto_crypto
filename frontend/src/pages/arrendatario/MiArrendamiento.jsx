import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'

const MiArrendamiento = () => {
  const navigate = useNavigate()
  const [arrendamiento, setArrendamiento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [esperandoArrendador, setEsperandoArrendador] = useState(false)

  useEffect(() => {
    cargarArrendamiento()
  }, [])

  const cargarArrendamiento = async () => {
  try {
    setLoading(true)
    
    const userId = localStorage.getItem('userId')

    const arrendatarioVerificado = localStorage.getItem('arrendatarioVerificado')
    if (arrendatarioVerificado === 'false' || arrendatarioVerificado === '0') {
      navigate('/arrendatario/verificacion-pendiente')
      return
    }
    const arrendatarioId = localStorage.getItem('arrendatarioId')
    
    if (!userId) {
      setError('No has iniciado sesión')
      setLoading(false)
      return
    }

    const response = await fetch('http://localhost:5000/api/arrendamientos/mi-arrendamiento', {
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-arrendatario-id': arrendatarioId
      }
    })

    if (response.status === 404) {
      setArrendamiento(null)
      setLoading(false)
      return
    }

    if (!response.ok) throw new Error('Error al cargar')

    const data = await response.json()
    setArrendamiento(data)
    
    if (data.arrendamientoValEstudiante === 1) {
      setEsperandoArrendador(true)
    }
  } catch (error) {
    setError('No se pudo cargar tu arrendamiento')
    console.error('Error:', error)
  } finally {
    setLoading(false)
  }
}

  const handleFinalizarClick = () => {
    setMostrarModal(true)
  }

  const handleConfirmarFinalizar = () => {
    setMostrarModal(false)
    navigate(`/arrendatario/encuesta-finalizacion/${arrendamiento.idArrendamiento}`)
  }

  const handleDescargarContrato = () => {
    window.open(`http://localhost:5000/api/arrendamientos/${arrendamiento.idArrendamiento}/pdf`, '_blank')
  }

  const propiedad = arrendamiento?.propiedad
  const arrendador = propiedad?.arrendador?.usuario
  const nombreArrendador = arrendador 
    ? `${arrendador.usuarioNom} ${arrendador.usuarioApePat} ${arrendador.usuarioApeMat || ''}`.trim()
    : 'No disponible'
  
  const primeraFoto = propiedad?.fotos?.[0]?.fotosURL || null

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavbarArrendatario />
        <div style={{ flex: 1, textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#666' }}>Cargando arrendamiento...</p>
        </div>
        <FooterInicio />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarArrendatario />

      <div style={{ flex: 1, maxWidth: '900px', margin: '0 auto', padding: '20px', width: '100%' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>📋 Mi Arrendamiento</h1>

        {/* MENSAJE DE ESPERA */}
        {esperandoArrendador && (
          <div style={{
            padding: '20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '30px', margin: '0 0 10px 0' }}>⏳</p>
            <p style={{ fontWeight: 'bold', color: '#856404', margin: '0 0 8px 0', fontSize: '16px' }}>
              Esperando confirmación del arrendador
            </p>
            <p style={{ color: '#856404', fontSize: '14px', margin: 0 }}>
              Ya has finalizado tu parte. El contrato seguirá disponible hasta que el arrendador confirme.
            </p>
          </div>
        )}

        {/* SIN ARRENDAMIENTO */}
        {!loading && !error && !arrendamiento && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <p style={{ fontSize: '60px', marginBottom: '15px' }}>🏠</p>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '10px' }}>
              No tienes un arrendamiento activo
            </h2>
            <p style={{ color: '#666', marginBottom: '25px', fontSize: '14px' }}>
              Cuando un arrendador te asigne una propiedad, aparecerá aquí.
            </p>
            <button 
              onClick={() => navigate('/arrendatario/buscar-vivienda')}
              style={{
                padding: '12px 30px',
                backgroundColor: '#1a237e',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 'bold'
              }}
            >
              🔍 Buscar Vivienda
            </button>
          </div>
        )}

        {/* CON ARRENDAMIENTO ACTIVO */}
        {arrendamiento && (
          <>
            {/* Tarjeta de la propiedad */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              {/* Imagen */}
              <div style={{
                height: '250px',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {primeraFoto ? (
                  <img 
                    src={`http://localhost:5000${primeraFoto}`}
                    alt={propiedad?.propiedadTitulo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span style={{ fontSize: '60px' }}>🏠</span>
                )}
                <span style={{
                  position: 'absolute',
                  top: '15px',
                  left: '15px',
                  padding: '6px 15px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '5px',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  ✅ Activo
                </span>
              </div>

              <div style={{ padding: '25px' }}>
                {/* Título y precio */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '20px', margin: '0 0 5px 0', color: '#333' }}>
                      {propiedad?.propiedadTitulo || 'Propiedad'}
                    </h2>
                    <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                      {propiedad?.propiedadTipo} · {propiedad?.direccion?.colonia}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '24px', color: '#1a237e' }}>
                      ${arrendamiento.arrendamientoRenta?.toLocaleString('es-MX') || '0'}
                    </span>
                    <span style={{ fontSize: '13px', color: '#999', display: 'block' }}>MXN / mes</span>
                  </div>
                </div>

                {/* Descripción */}
                <div style={{ 
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '5px',
                  marginBottom: '20px'
                }}>
                  <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
                    {propiedad?.propiedadDescripcion || 'Sin descripción'}
                  </p>
                </div>

                {/* Botón descargar contrato */}
                <button 
                  onClick={handleDescargarContrato}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1a237e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '20px'
                  }}
                >
                  📄 Descargar Contrato
                </button>

                <hr style={{ margin: '0 0 20px 0' }} />

                {/* Información del arrendador */}
                <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#333' }}>👤 Arrendador</h3>
                
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center' }}>
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
                    fontWeight: 'bold'
                  }}>
                    {nombreArrendador.charAt(0)}
                  </div>
                  <div>
                    <strong style={{ fontSize: '15px' }}>{nombreArrendador}</strong>
                  </div>
                </div>

                <div style={{ paddingLeft: '10px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#555' }}>
                    📧 Correo: {arrendador?.usuarioCorreo || 'No disponible'}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
                    📞 Teléfono: {arrendador?.usuarioTel || 'No disponible'}
                  </p>
                </div>
              </div>
            </div>

            {/* Botón finalizar arrendamiento */}
            {!esperandoArrendador && (
              <button 
                onClick={handleFinalizarClick}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 'bold'
                }}
              >
                ⚠️ Finalizar Arrendamiento
              </button>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '20px',
            backgroundColor: '#ffe6e6',
            color: '#dc3545',
            borderRadius: '5px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {mostrarModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '450px',
            width: '90%',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '40px', marginBottom: '15px' }}>⚠️</p>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>¿Finalizar arrendamiento?</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px', lineHeight: '1.5' }}>
              Esta acción no se puede deshacer. Para finalizar deberás contestar una breve encuesta sobre tu experiencia.
            </p>
            <p style={{ color: '#dc3545', fontSize: '13px', fontWeight: 'bold', marginBottom: '20px' }}>
              ¿Estás seguro de continuar?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={() => setMostrarModal(false)}
                style={{
                  padding: '10px 25px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmarFinalizar}
                style={{
                  padding: '10px 25px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Sí, finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      <FooterInicio />
    </div>
  )
}

export default MiArrendamiento