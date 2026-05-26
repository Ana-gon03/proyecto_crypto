import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendador from '../../components/common/NavbarArrendador'
import FooterInicio from '../../components/common/FooterInicio'
import ModalDetalleArrendamiento from '../../components/arrendador/ModalDetalleArrendamiento'
import ModalConfirmacion from '../../components/common/ModalConfirmacion'
import { getArrendamientosArrendador, finalizarArrendamiento, descargarContratoPDF } from '../../services/arrendamientoService'
import '../../styles/Arrendador.css'

const MisArrendamientosArrendador = () => {
  const navigate = useNavigate()
  const [arrendamientos, setArrendamientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [arrendamientoSeleccionado, setArrendamientoSeleccionado] = useState(null)
  const [modalConfirmacion, setModalConfirmacion] = useState({ abierto: false, id: null })

  useEffect(() => { cargarArrendamientos() }, [])

  const cargarArrendamientos = async () => {
    try {
      const idArrendador = localStorage.getItem('arrendadorId')
      if (!idArrendador) { navigate('/usuarios/inicio-sesion'); return }
      const data = await getArrendamientosArrendador(idArrendador)
      setArrendamientos(data)
    } catch { setError('Error al cargar arrendamientos') }
    finally { setCargando(false) }
  }

  const handleConfirmarFinalizar = async () => {
    try {
      await finalizarArrendamiento(modalConfirmacion.id)
      setModalConfirmacion({ abierto: false, id: null })
      cargarArrendamientos()
    } catch { alert('Error al finalizar arrendamiento') }
  }

  if (cargando) return (
    <div className="arr-page">
      <NavbarArrendador />
      <main className="arr-main">
        <div className="arr-loading">
          <div className="arr-spinner" />
          <p>Cargando arrendamientos…</p>
        </div>
      </main>
      <FooterInicio />
    </div>
  )

  return (
    <div className="arr-page">
      <NavbarArrendador />

      <main className="arr-main">
        <div className="arr-page-header">
          <div>
            <h1 className="arr-page-title">Mis Arrendamientos</h1>
            <p className="arr-page-hint">{arrendamientos.length} arrendamiento{arrendamientos.length !== 1 ? 's' : ''} registrado{arrendamientos.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            className="arr-btn-primary"
            onClick={() => navigate('/arrendador/crear-arrendamiento')}
          >
            + Crear Arrendamiento
          </button>
        </div>

        {error && <div className="arr-alert arr-alert-error">⚠️ {error}</div>}

        {arrendamientos.length === 0 ? (
          <div className="arr-empty">
            <div className="arr-empty-icon">📋</div>
            <p className="arr-empty-title">Sin arrendamientos creados</p>
            <p className="arr-empty-sub">Registra un arrendamiento para comenzar a gestionar tus rentas.</p>
            <button
              className="arr-btn-primary"
              onClick={() => navigate('/arrendador/crear-arrendamiento')}
            >
              Crear mi primer arrendamiento
            </button>
          </div>
        ) : (
          <div>
            {arrendamientos.map(a => (
              <div className="arr-card" key={a.idArrendamiento}>
                <div className="arr-card-inner" style={{ alignItems: 'flex-start' }}>
                  <div className="arr-card-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      <h3 className="arr-card-title" style={{ margin: 0 }}>
                        {a.propiedad?.propiedadTitulo || 'Sin título'}
                      </h3>
                      {a.arrendamientoValArrendador === 1 ? (
                        <span className="arr-badge arr-badge-warning">⏳ Pendiente estudiante</span>
                      ) : (
                        <span className="arr-badge arr-badge-success">✓ Activo</span>
                      )}
                    </div>

                    <p className="arr-card-meta">
                      <strong>Estudiante:</strong> {a.arrendatario?.usuario?.usuarioNom} {a.arrendatario?.usuario?.usuarioApePat}
                    </p>
                    <p className="arr-card-meta">
                      <strong>Vivienda:</strong> {a.propiedad?.propiedadTipo} — {a.propiedad?.propiedadTitulo}
                    </p>
                    <p className="arr-card-meta">
                      <strong>Renta:</strong>{' '}
                      <span style={{ color: 'var(--purple-600)', fontWeight: 700 }}>${a.arrendamientoRenta}/mes</span>
                    </p>
                    <p className="arr-card-meta">
                      <strong>Inicio:</strong> {new Date(a.arrendamientoFechaInicio).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  <div className="arr-card-actions">
                    <button
                      className="arr-btn-primary arr-btn-sm"
                      onClick={() => { setArrendamientoSeleccionado(a); setModalAbierto(true) }}
                    >
                      👁 Ver Detalle
                    </button>

                    <button
                      className="arr-btn-ghost arr-btn-sm"
                      onClick={() => descargarContratoPDF(a.idArrendamiento)}
                    >
                      📄 Ver PDF
                    </button>

                    <button
                      className="arr-btn-firma arr-btn-sm"
                      onClick={() => navigate(`/arrendador/contratos/${a.idArrendamiento}`)}
                    >
                      🔏 Firmar Contrato Digital
                    </button>

                    {a.arrendamientoValArrendador === 0 && (
                      <button
                        className="arr-btn-danger arr-btn-sm"
                        onClick={() => setModalConfirmacion({ abierto: true, id: a.idArrendamiento })}
                      >
                        Finalizar
                      </button>
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
          onClose={() => { setModalAbierto(false); setArrendamientoSeleccionado(null) }}
        />
      )}

      {modalConfirmacion.abierto && (
        <ModalConfirmacion
          titulo="Finalizar Arrendamiento"
          mensaje="¿Estás seguro de finalizar este arrendamiento? Quedará pendiente de confirmación por el estudiante."
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
