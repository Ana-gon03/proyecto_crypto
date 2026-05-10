import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendador from '../../components/common/NavbarArrendador'
import FooterInicio from '../../components/common/FooterInicio'
import ModalDetalleArrendamiento from '../../components/arrendador/ModalDetalleArrendamiento'
import ModalConfirmacion from '../../components/common/ModalConfirmacion'
import { getArrendamientosArrendador, finalizarArrendamiento, descargarContratoPDF } from '../../services/arrendamientoService'
import { tieneClavesGeneradas } from '../../utils/cryptoUtils'

const MisArrendamientosArrendador = () => {
  const navigate = useNavigate()
  const [arrendamientos, setArrendamientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [arrendamientoSeleccionado, setArrendamientoSeleccionado] = useState(null)
  const [modalConfirmacion, setModalConfirmacion] = useState({ abierto: false, id: null })

  useEffect(() => {
    cargarArrendamientos()
  }, [])

  const cargarArrendamientos = async () => {
    try {
      const idArrendador = localStorage.getItem('arrendadorId')
      if (!idArrendador) {
        navigate('/usuarios/inicio-sesion')
        return
      }
      const data = await getArrendamientosArrendador(idArrendador)
      setArrendamientos(data)
    } catch (err) {
      setError('Error al cargar arrendamientos')
    } finally {
      setCargando(false)
    }
  }

  const handleVerDetalle = (arrendamiento) => {
    setArrendamientoSeleccionado(arrendamiento)
    setModalAbierto(true)
  }

  const handleSolicitarFinalizar = (idArrendamiento) => {
    setModalConfirmacion({ abierto: true, id: idArrendamiento })
  }

  const handleConfirmarFinalizar = async () => {
    try {
      await finalizarArrendamiento(modalConfirmacion.id)
      setModalConfirmacion({ abierto: false, id: null })
      cargarArrendamientos()
    } catch (err) {
      alert('Error al finalizar arrendamiento')
    }
  }

  if (cargando) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavbarArrendador />
        <main style={{ flex: 1, padding: '2rem', textAlign: 'center' }}>
          <p>Cargando arrendamientos...</p>
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
          <h2>Mis Arrendamientos</h2>
          <button
            onClick={() => navigate('/arrendador/crear-arrendamiento')}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}
          >
            + Crear Arrendamiento
          </button>
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem', padding: '1rem', backgroundColor: '#ffebee' }}>
            {error}
          </div>
        )}

        {arrendamientos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <p>No tienes arrendamientos creados.</p>
            <button
              onClick={() => navigate('/arrendador/crear-arrendamiento')}
              style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Crear mi primer arrendamiento
            </button>
          </div>
        ) : (
          <div>
            {arrendamientos.map(arrendamiento => (
              <div
                key={arrendamiento.idArrendamiento}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  backgroundColor: arrendamiento.arrendamientoValArrendador === 1 ? '#f0f0f0' : 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>
                      {arrendamiento.propiedad?.propiedadTitulo || 'Sin título'}
                      {arrendamiento.arrendamientoValArrendador === 1 && (
                        <span style={{ marginLeft: '1rem', padding: '0.25rem 0.75rem', backgroundColor: '#ff9800', color: 'white', borderRadius: '4px', fontSize: '0.8rem' }}>
                          Pendiente de confirmación del estudiante
                        </span>
                      )}
                    </h3>
                    
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>
                      <strong>Estudiante:</strong> {arrendamiento.arrendatario?.usuario?.usuarioNom} {arrendamiento.arrendatario?.usuario?.usuarioApePat}
                    </p>
                    
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>
                      <strong>Vivienda:</strong> {arrendamiento.propiedad?.propiedadTipo} - {arrendamiento.propiedad?.propiedadTitulo}
                    </p>
                    
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>
                      <strong>Renta:</strong> ${arrendamiento.arrendamientoRenta}
                    </p>
                    
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>
                      <strong>Inicio:</strong> {new Date(arrendamiento.arrendamientoFechaInicio).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                    <button
                      onClick={() => handleVerDetalle(arrendamiento)}
                      style={{ padding: '0.5rem 1rem', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Ver Detalle
                    </button>
                    
                    <button
                      onClick={() => descargarContratoPDF(arrendamiento.idArrendamiento)}
                      style={{ padding: '0.5rem 1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      📄 Ver PDF
                    </button>

                    <button
                      onClick={() => navigate(`/contratos/${arrendamiento.idArrendamiento}`)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: tieneClavesGeneradas() ? '#1a237e' : '#856404',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                      title={tieneClavesGeneradas() ? 'Gestionar contrato cifrado' : 'Genera tus claves en tu perfil primero'}
                    >
                      🔐 Contrato Cifrado
                    </button>
                    
                    {arrendamiento.arrendamientoValArrendador === 0 && (
                      <button
                        onClick={() => handleSolicitarFinalizar(arrendamiento.idArrendamiento)}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Finalizar
                      </button>
                    )}
                    
                    {arrendamiento.arrendamientoValArrendador === 1 && (
                      <span style={{ padding: '0.5rem', color: '#ff9800', fontSize: '0.85rem', textAlign: 'center' }}>
                        ⏳ Esperando estudiante
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalAbierto && arrendamientoSeleccionado && (
        <ModalDetalleArrendamiento
          arrendamiento={arrendamientoSeleccionado}
          onClose={() => {
            setModalAbierto(false)
            setArrendamientoSeleccionado(null)
          }}
        />
      )}

      {modalConfirmacion.abierto && (
        <ModalConfirmacion
          titulo="Finalizar Arrendamiento"
          mensaje="¿Estás seguro de finalizar este arrendamiento? Una vez confirmado, quedará pendiente de confirmación por el estudiante."
          onConfirmar={handleConfirmarFinalizar}
          onCancelar={() => setModalConfirmacion({ abierto: false, id: null })}
          textoConfirmar="Finalizar"
          textoCancelar="Cancelar"
          peligro={true}
        />
      )}

      <FooterInicio />
    </div>
  )
}

export default MisArrendamientosArrendador