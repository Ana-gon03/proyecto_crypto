import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'

const EncuestaFinalizacion = () => {
  const { idArrendamiento } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [completado, setCompletado] = useState(false)
  
  // Datos del arrendamiento
  const [serviciosPropiedad, setServiciosPropiedad] = useState({
    basicos: false,
    entretenimiento: false,
    adicionales: false
  })
  
  // Calificaciones
  const [calServiciosBasicos, setCalServiciosBasicos] = useState(0)
  const [calEntretenimiento, setCalEntretenimiento] = useState(0)
  const [calAdicionales, setCalAdicionales] = useState(0)
  const [calGeneral, setCalGeneral] = useState(0)
  const [resena, setResena] = useState('')

  useEffect(() => {
    cargarArrendamiento()
  }, [])

  const cargarArrendamiento = async () => {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('burroomies_token')
        const response = await fetch(`http://localhost:5000/api/arrendamientos/${idArrendamiento}`, {
        headers: { Authorization: `Bearer ${token}` }
        })

        if (!response.ok) throw new Error('Error al cargar')

        const data = await response.json()
        
        // ✅ minúscula, como devuelve Sequelize
        const servicios = data.propiedad?.servicios || []
        setServiciosPropiedad({
        basicos: servicios.some(s => s.servicioCategoria === 'Basico'),
        entretenimiento: servicios.some(s => s.servicioCategoria === 'Entretenimiento'),
        adicionales: servicios.some(s => s.servicioCategoria === 'Adicional')
        })
        
    } catch (error) {
        setError('No se pudo cargar la información')
        console.error('Error:', error)
    } finally {
        setLoading(false)
    }
    }
  
  const handleEnviarEncuesta = async () => {
    // Validar calificación general (obligatoria)
    if (calGeneral === 0) {
      alert('La calificación general es obligatoria')
      return
    }

    try {
      setEnviando(true)
      const token = localStorage.getItem('token') || localStorage.getItem('burroomies_token')
      
      const datos = {
        resenaCalGen: calGeneral,
        resenaDescrip: resena || 'Sin comentarios',
        resenaDuracionRenta: null
      }

      // Solo enviar calificaciones de servicios que existen
      if (serviciosPropiedad.basicos) {
        datos.resenaCalSerBasic = calServiciosBasicos || null
      }
      if (serviciosPropiedad.entretenimiento) {
        datos.resenaCalSerComEnt = calEntretenimiento || null
      }
      if (serviciosPropiedad.adicionales) {
        datos.resenaCalSerAdicio = calAdicionales || null
      }

      const response = await fetch(`http://localhost:5000/api/arrendamientos/${idArrendamiento}/finalizar-estudiante`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(datos)
      })

      const result = await response.json()

      if (response.ok) {
        setCompletado(true)
      } else {
        alert(result.message || 'Error al enviar la encuesta')
      }
    } catch (error) {
      alert('Error al enviar la encuesta')
      console.error('Error:', error)
    } finally {
      setEnviando(false)
    }
  }

  const renderEstrellas = (valor, onChange) => {
    return (
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '5px' }}>
        {[1, 2, 3, 4, 5].map(num => (
          <span
            key={num}
            onClick={() => onChange(num)}
            style={{
              fontSize: '35px',
              cursor: 'pointer',
              color: num <= valor ? '#ffc107' : '#e0e0e0',
              transition: 'transform 0.1s',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavbarArrendatario />
        <div style={{ flex: 1, textAlign: 'center', padding: '60px' }}>
          <p>Cargando...</p>
        </div>
        <FooterInicio />
      </div>
    )
  }

  if (completado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavbarArrendatario />
        <div style={{ flex: 1, maxWidth: '600px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: '60px', marginBottom: '20px' }}>✅</p>
          <h2 style={{ color: '#28a745', marginBottom: '15px' }}>¡Encuesta enviada con éxito!</h2>
          <p style={{ color: '#666', marginBottom: '25px', fontSize: '14px' }}>
            Tu arrendamiento ha sido finalizado. Gracias por tu opinión.
          </p>
          <button 
            onClick={() => navigate('/arrendatario/mi-arrendamiento')}
            style={{
              padding: '12px 30px',
              backgroundColor: '#1a237e',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Volver a Mi Arrendamiento
          </button>
        </div>
        <FooterInicio />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarArrendatario />

      <div style={{ flex: 1, maxWidth: '700px', margin: '0 auto', padding: '20px', width: '100%' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '5px', textAlign: 'center' }}>📝 Encuesta de Finalización</h1>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '30px' }}>
          Califica del 1 al 5 tu experiencia<br />
          <span style={{ fontSize: '12px', color: '#999' }}>
            (1 = Muy malo · 5 = Excelente)
          </span>
        </p>

        {/* CALIFICACIÓN GENERAL (OBLIGATORIA) */}
        <div style={{
          backgroundColor: 'white',
          border: '2px solid #1a237e',
          borderRadius: '8px',
          padding: '25px',
          marginBottom: '20px'
        }}>
          <h3 style={{ textAlign: 'center', fontSize: '16px', marginBottom: '15px', color: '#333' }}>
            ⭐ ¿En general, qué calificación le darías a tu experiencia arrendando esta vivienda?
          </h3>
          <p style={{ textAlign: 'center', color: '#dc3545', fontSize: '12px', marginBottom: '15px' }}>
            * Obligatorio
          </p>
          {renderEstrellas(calGeneral, setCalGeneral)}
          {calGeneral > 0 && (
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#1a237e', fontWeight: 'bold', marginTop: '10px' }}>
              {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][calGeneral]}
            </p>
          )}
        </div>

        {/* SERVICIOS BÁSICOS (condicional) */}
        {serviciosPropiedad.basicos && (
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '25px',
            marginBottom: '20px'
          }}>
            <h3 style={{ textAlign: 'center', fontSize: '16px', marginBottom: '15px', color: '#333' }}>
              🔌 ¿Qué tal te parecieron los servicios básicos que te proporcionó la vivienda?
            </h3>
            {renderEstrellas(calServiciosBasicos, setCalServiciosBasicos)}
            {calServiciosBasicos > 0 && (
              <p style={{ textAlign: 'center', fontSize: '14px', color: '#1a237e', fontWeight: 'bold', marginTop: '10px' }}>
                {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][calServiciosBasicos]}
              </p>
            )}
          </div>
        )}

        {/* ENTRETENIMIENTO (condicional) */}
        {serviciosPropiedad.entretenimiento && (
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '25px',
            marginBottom: '20px'
          }}>
            <h3 style={{ textAlign: 'center', fontSize: '16px', marginBottom: '15px', color: '#333' }}>
              🎮 ¿Qué tal te parecieron los servicios de entretenimiento?
            </h3>
            {renderEstrellas(calEntretenimiento, setCalEntretenimiento)}
            {calEntretenimiento > 0 && (
              <p style={{ textAlign: 'center', fontSize: '14px', color: '#1a237e', fontWeight: 'bold', marginTop: '10px' }}>
                {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][calEntretenimiento]}
              </p>
            )}
          </div>
        )}

        {/* ADICIONALES (condicional) */}
        {serviciosPropiedad.adicionales && (
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '25px',
            marginBottom: '20px'
          }}>
            <h3 style={{ textAlign: 'center', fontSize: '16px', marginBottom: '15px', color: '#333' }}>
              ✨ ¿Qué tal te parecieron los servicios adicionales?
            </h3>
            {renderEstrellas(calAdicionales, setCalAdicionales)}
            {calAdicionales > 0 && (
              <p style={{ textAlign: 'center', fontSize: '14px', color: '#1a237e', fontWeight: 'bold', marginTop: '10px' }}>
                {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][calAdicionales]}
              </p>
            )}
          </div>
        )}

        {/* RESEÑA ESCRITA */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '25px',
          marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#333' }}>
            💬 ¿Quieres dejar una reseña sobre tu experiencia?
          </h3>
          <textarea
            value={resena}
            onChange={(e) => setResena(e.target.value)}
            placeholder="Cuéntanos tu experiencia viviendo aquí..."
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '14px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* BOTÓN ENVIAR */}
        <button 
          onClick={handleEnviarEncuesta}
          disabled={enviando}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: enviando ? '#ccc' : '#1a237e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: enviando ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '30px'
          }}
        >
          {enviando ? 'Enviando...' : '✅ Finalizar Encuesta'}
        </button>
      </div>

      <FooterInicio />
    </div>
  )
}

export default EncuestaFinalizacion