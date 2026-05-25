import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'
import '../../styles/Arrendatario.css'

const GROSERIAS = [
  'pendejo', 'pendeja', 'puta', 'puto', 'chinga', 'chingada', 'chingado',
  'mierda', 'cabron', 'cabrona', 'pinche', 'culero', 'culera', 'idiota',
  'estupido', 'estupida', 'mamadas', 'verga', 'culo', 'hdp', 'hijo de puta',
  'perra', 'perro', 'joto', 'wey', 'buey', 'chido', 'chingar'
]

const EncuestaFinalizacion = () => {
  const { idArrendamiento } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [completado, setCompletado] = useState(false)

  const [serviciosPropiedad, setServiciosPropiedad] = useState({
    basicos: false,
    entretenimiento: false,
    adicionales: false
  })
  const [listaServicios, setListaServicios] = useState([])

  const [calServiciosBasicos, setCalServiciosBasicos] = useState(0)
  const [calEntretenimiento, setCalEntretenimiento] = useState(0)
  const [calAdicionales, setCalAdicionales] = useState(0)
  const [calGeneral, setCalGeneral] = useState(0)
  const [resena, setResena] = useState('')

  // Estado para el modal
  const [modal, setModal] = useState({ isOpen: false, message: '' })

  useEffect(() => {
    cargarArrendamiento()
  }, [])

  const mostrarModal = (message) => {
    setModal({ isOpen: true, message })
  }

  const cerrarModal = () => {
    setModal({ isOpen: false, message: '' })
  }

  const cargarArrendamiento = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('blockhome_token')
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/arrendamientos/${idArrendamiento}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Error al cargar')

      const data = await response.json()

      const servicios = data.propiedad?.servicios || []
      setServiciosPropiedad({
        basicos: servicios.some(s => s.servicioCategoria === 'Basico'),
        entretenimiento: servicios.some(s => s.servicioCategoria === 'Entretenimiento'),
        adicionales: servicios.some(s => s.servicioCategoria === 'Adicional')
      })
      setListaServicios(servicios)

    } catch (error) {
      setError('No se pudo cargar la información')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarEncuesta = async () => {
    if (calGeneral === 0) {
      mostrarModal('La calificación general es obligatoria')
      return
    }

    // Filtro de groserías
    if (resena.trim()) {
      const resenaLower = resena.toLowerCase()
      if (GROSERIAS.some(g => resenaLower.includes(g))) {
        mostrarModal('Tu reseña contiene palabras inapropiadas. Por favor, expresa tu experiencia con respeto.')
        return
      }
    }

    try {
      setEnviando(true)
      const token = localStorage.getItem('token') || localStorage.getItem('blockhome_token')

      const datos = {
        resenaCalGen: calGeneral,
        resenaDescrip: resena || 'Sin comentarios',
        resenaDuracionRenta: null
      }

      if (serviciosPropiedad.basicos) {
        datos.resenaCalSerBasic = calServiciosBasicos || null
      }
      if (serviciosPropiedad.entretenimiento) {
        datos.resenaCalSerComEnt = calEntretenimiento || null
      }
      if (serviciosPropiedad.adicionales) {
        datos.resenaCalSerAdicio = calAdicionales || null
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/arrendamientos/${idArrendamiento}/finalizar-estudiante`, {
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
        mostrarModal(result.message || 'Error al enviar la encuesta')
      }
    } catch (error) {
      mostrarModal('Error al enviar la encuesta')
      console.error('Error:', error)
    } finally {
      setEnviando(false)
    }
  }

  // Función para filtrar servicios por categoría
  const filtrarServicios = (categoria) => {
    return listaServicios.filter(s => s.servicioCategoria === categoria)
  }

  const renderEstrellas = (valor, onChange) => {
    return (
      <div className="atr-stars">
        {[1, 2, 3, 4, 5].map(num => (
          <span
            key={num}
            onClick={() => onChange(num)}
            className={`atr-star ${num <= valor ? 'active' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  const renderServiciosList = (categoria) => {
    const serviciosFiltrados = filtrarServicios(categoria)
    if (serviciosFiltrados.length === 0) return null

    return (
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #d1fae5',
        borderRadius: '6px',
        padding: '14px',
        marginTop: '15px'
      }}>
        <p style={{ fontSize: '13px', color: '#555', marginBottom: '10px', fontWeight: '600' }}>
          Servicios {categoria.toLowerCase()} que ofrecía esta propiedad:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {serviciosFiltrados.map(s => (
            <span key={s.idServicio} style={{
              backgroundColor: '#d1fae5',
              color: '#059669',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {s.servicioNombre || s.servicioCategoria}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="atr-page">
        <NavbarArrendatario />
        <div className="atr-main">
          <div className="atr-loading">
            <p>Cargando...</p>
          </div>
        </div>
        <FooterInicio />
      </div>
    )
  }

  if (completado) {
    return (
      <div className="atr-page">
        <NavbarArrendatario />
        <div className="atr-verify-wrapper">
          <div className="atr-verify-card atr-verify-card-success">
            <div className="atr-verify-header atr-verify-header-success">
              <div className="atr-verify-header-icon">✅</div>
              <div className="atr-verify-header-title">¡Encuesta enviada con éxito!</div>
              <div className="atr-verify-header-sub">
                Tu arrendamiento ha sido finalizado
              </div>
            </div>
            <div className="atr-verify-body">
              <div className="atr-alert atr-alert-success">
                <div className="atr-alert-icon">🎉</div>
                <div className="atr-alert-body">
                  <div className="atr-alert-title">¡Gracias por tu opinión!</div>
                  <div className="atr-alert-desc">
                    Tu arrendamiento ha sido finalizado exitosamente.
                  </div>
                </div>
              </div>
              <div className="atr-btn-group">
                <button
                  onClick={() => navigate('/arrendatario/mi-arrendamiento')}
                  className="atr-btn-primary"
                >
                  Volver a Mi Arrendamiento
                </button>
              </div>
            </div>
          </div>
        </div>
        <FooterInicio />
      </div>
    )
  }

  return (
    <div className="atr-page">
      <NavbarArrendatario />

      {/* Modal personalizado */}
      {modal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '40px', marginBottom: '15px' }}>⚠️</p>
            <p style={{ fontSize: '16px', color: '#333', marginBottom: '25px', lineHeight: '1.5' }}>
              {modal.message}
            </p>
            <button
              onClick={cerrarModal}
              style={{
                padding: '10px 25px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <div className="atr-main">
        <h1 className="atr-page-title" style={{ textAlign: 'center' }}>📝 Encuesta de Finalización</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '30px' }}>
          Califica del 1 al 5 tu experiencia<br />
          <span style={{ fontSize: '12px' }}>(1 = Muy malo · 5 = Excelente)</span>
        </p>

        {/* CALIFICACIÓN GENERAL (OBLIGATORIA) */}
        <div className="atr-survey-card atr-survey-card-required">
          <div className="atr-survey-card-title">
            ⭐ ¿En general, qué calificación le darías a tu experiencia arrendando esta vivienda?
          </div>
          <div className="atr-survey-card-required-label">* Obligatorio</div>
          {renderEstrellas(calGeneral, setCalGeneral)}
          {calGeneral > 0 && (
            <div className="atr-star-label">
              {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][calGeneral]}
            </div>
          )}
        </div>

        {/* SERVICIOS BÁSICOS (condicional) */}
        {serviciosPropiedad.basicos && (
          <div className="atr-survey-card">
            <div className="atr-survey-card-title">
              🔌 ¿Qué tal te parecieron los servicios básicos que te proporcionó la vivienda?
            </div>
            {renderEstrellas(calServiciosBasicos, setCalServiciosBasicos)}
            {calServiciosBasicos > 0 && (
              <div className="atr-star-label">
                {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][calServiciosBasicos]}
              </div>
            )}
            {renderServiciosList('Basico')}
          </div>
        )}

        {/* ENTRETENIMIENTO (condicional) */}
        {serviciosPropiedad.entretenimiento && (
          <div className="atr-survey-card">
            <div className="atr-survey-card-title">
              🎮 ¿Qué tal te parecieron los servicios de entretenimiento?
            </div>
            {renderEstrellas(calEntretenimiento, setCalEntretenimiento)}
            {calEntretenimiento > 0 && (
              <div className="atr-star-label">
                {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][calEntretenimiento]}
              </div>
            )}
            {renderServiciosList('Entretenimiento')}
          </div>
        )}

        {/* ADICIONALES (condicional) */}
        {serviciosPropiedad.adicionales && (
          <div className="atr-survey-card">
            <div className="atr-survey-card-title">
              ✨ ¿Qué tal te parecieron los servicios adicionales?
            </div>
            {renderEstrellas(calAdicionales, setCalAdicionales)}
            {calAdicionales > 0 && (
              <div className="atr-star-label">
                {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][calAdicionales]}
              </div>
            )}
            {renderServiciosList('Adicional')}
          </div>
        )}

        {/* RESEÑA ESCRITA */}
        <div className="atr-survey-card">
          <div className="atr-survey-card-title">
            💬 ¿Quieres dejar una reseña sobre tu experiencia?
          </div>
          <textarea
            value={resena}
            onChange={(e) => setResena(e.target.value)}
            placeholder="Cuéntanos tu experiencia viviendo aquí..."
            rows={4}
            className="atr-textarea"
          />
        </div>

        {/* BOTÓN ENVIAR */}
        <button
          onClick={handleEnviarEncuesta}
          disabled={enviando}
          className="atr-btn-primary"
          style={{ marginBottom: '30px' }}
        >
          {enviando ? 'Enviando...' : '✅ Finalizar Encuesta'}
        </button>
      </div>

      <FooterInicio />
    </div>
  )
}

export default EncuestaFinalizacion