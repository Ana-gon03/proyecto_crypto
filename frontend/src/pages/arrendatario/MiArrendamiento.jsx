import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'
import '../../styles/Arrendatario.css'

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
      const fechaVerificacion = localStorage.getItem('arrendatarioFechaVerificacion')

      const nuncaVerificado = (arrendatarioVerificado === 'false' || arrendatarioVerificado === '0')
        && (!fechaVerificacion || fechaVerificacion === 'null' || fechaVerificacion === 'undefined')

      if (nuncaVerificado) {
        navigate('/arrendatario/verificacion-pendiente')
        return
      }

      const arrendatarioId = localStorage.getItem('arrendatarioId')

      if (!userId) {
        setError('No has iniciado sesión')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/arrendamientos/mi-arrendamiento`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-arrendatario-id': arrendatarioId
        }
      })

      if (response.status === 404) {
        setArrendamiento(null)
        return
      }

      if (!response.ok) throw new Error('Error al cargar')

      const data = await response.json()
      setArrendamiento(data)

      if (data.arrendamientoValEstudiante === 1) {
        setEsperandoArrendador(true)
      }
    } catch (err) {
      setError('No se pudo cargar tu arrendamiento')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmarFinalizar = () => {
    setMostrarModal(false)
    navigate(`/arrendatario/encuesta-finalizacion/${arrendamiento.idArrendamiento}`)
  }

  const handleDescargarContrato = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('blockhoom_token')
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/arrendamientos/${arrendamiento.idArrendamiento}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Error al obtener el PDF')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      console.error('Error al abrir contrato:', err)
      alert('No se pudo abrir el contrato')
    }
  }

  /* ── Verificación expirada ── */
  const verificacionExpirada = (() => {
    const fv = localStorage.getItem('arrendatarioFechaVerificacion')
    if (!fv || fv === 'null' || fv === 'undefined') return false
    const meses = (new Date() - new Date(fv)) / (1000 * 60 * 60 * 24 * 30)
    return meses >= 6
  })()

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f4f7f5' }}>
        <NavbarArrendatario />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Cargando arrendamiento...</p>
        </div>
        <FooterInicio />
      </div>
    )
  }

  /* ── Derivar datos seguros ── */
  const propiedad = arrendamiento?.propiedad || null
  const arrendador = propiedad?.arrendador?.usuario || null
  const primeraFoto = propiedad?.fotos?.[0]?.fotosURL || null
  const nombreArrendador = arrendador
    ? [arrendador.usuarioNom, arrendador.usuarioApePat, arrendador.usuarioApeMat].filter(Boolean).join(' ')
    : 'No disponible'
  const direccion = propiedad?.direccion || null
  const renta = arrendamiento?.arrendamientoRenta

  return (
    <div className="atr-page">
      <NavbarArrendatario />

      <div className="atr-main">
        <h1 className="atr-page-title">Mi Arrendamiento</h1>

        {/* ── Verificación expirada ── */}
        {verificacionExpirada && (
          <div className="atr-alert atr-alert-warning" style={{ marginBottom: '1.5rem' }}>
            <div className="atr-alert-icon">⚠️</div>
            <div className="atr-alert-body">
              <div className="atr-alert-title">Tu verificación de identidad ha expirado</div>
              <div className="atr-alert-desc">
                Renueva tu verificación para poder ver los datos de contacto de nuevos arrendadores.
              </div>
              <button
                onClick={() => navigate('/arrendatario/renovar-identidad')}
                style={{
                  marginTop: '10px', padding: '8px 18px', background: '#92400e',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                  fontFamily: 'Plus Jakarta Sans, sans-serif'
                }}
              >
                🔄 Renovar verificación
              </button>
            </div>
          </div>
        )}

        {/* ── Esperando arrendador ── */}
        {esperandoArrendador && (
          <div className="atr-alert atr-alert-info" style={{ marginBottom: '1.5rem' }}>
            <div className="atr-alert-icon">⏳</div>
            <div className="atr-alert-body">
              <div className="atr-alert-title">Esperando confirmación del arrendador</div>
              <div className="atr-alert-desc">
                Ya completaste tu parte. El contrato seguirá disponible hasta que el arrendador confirme.
              </div>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="atr-alert atr-alert-error">
            <div className="atr-alert-icon">⚠️</div>
            <div className="atr-alert-body">
              <div className="atr-alert-title">Error</div>
              <div className="atr-alert-desc">{error}</div>
            </div>
          </div>
        )}

        {/* ── Sin arrendamiento ── */}
        {!error && !arrendamiento && (
          <div className="atr-empty">
            <div className="atr-empty-icon">🏠</div>
            <div className="atr-empty-title">No tienes un arrendamiento activo</div>
            <div className="atr-empty-sub">
              Cuando un arrendador te asigne una propiedad, aparecerá aquí.
            </div>
            <button
              className="atr-btn-primary"
              style={{ maxWidth: '220px', margin: '0 auto' }}
              onClick={() => navigate('/arrendatario/buscar-vivienda')}
            >
              🔍 Buscar Vivienda
            </button>
          </div>
        )}

        {/* ── Arrendamiento activo ── */}
        {arrendamiento && (
          <div className="mir-layout">

            {/* ═══ COLUMNA PRINCIPAL ═══ */}
            <div className="mir-main">
              <div className="atr-card">
                {/* Hero imagen */}
                <div className="atr-card-hero">
                  {primeraFoto ? (
                    <img
                      src={`http://localhost:5000${primeraFoto}`}
                      alt={propiedad?.propiedadTitulo || 'Propiedad'}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="atr-card-hero-placeholder">🏠</div>
                  )}
                  <span className="atr-card-hero-badge atr-card-hero-badge-active">✅ Activo</span>
                </div>

                <div className="atr-card-body">
                  {/* Título y precio */}
                  <div className="atr-card-header">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 className="atr-card-title">
                        {propiedad?.propiedadTitulo || 'Propiedad'}
                      </h2>
                      <p className="atr-card-subtitle">
                        {propiedad?.propiedadTipo || ''}
                        {direccion?.colonia ? ` · ${direccion.colonia}` : ''}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                      <div className="atr-card-price">
                        {renta != null ? `$${Number(renta).toLocaleString('es-MX')}` : '—'}
                      </div>
                      <div className="atr-card-price-label">MXN / mes</div>
                    </div>
                  </div>

                  {/* Dirección */}
                  {direccion && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '1rem' }}>
                      <span>📍</span>
                      <span style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.5 }}>
                        {[
                          direccion.calle ? `${direccion.calle}${direccion.numExt ? ' #' + direccion.numExt : ''}` : null,
                          direccion.numInt ? `Int. ${direccion.numInt}` : null,
                          direccion.colonia ? `Col. ${direccion.colonia}` : null,
                          direccion.cp ? `C.P. ${direccion.cp}` : null
                        ].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Descripción */}
                  <div className="atr-card-desc">
                    {propiedad?.propiedadDescripcion || 'Sin descripción'}
                  </div>

                  {/* Ver contrato */}
                  <button className="atr-btn-primary" onClick={handleDescargarContrato}>
                    📄 Ver Contrato
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ COLUMNA LATERAL ═══ */}
            <div className="mir-side">

              {/* Arrendador */}
              <div className="atr-card" style={{ marginBottom: '1.25rem' }}>
                <div className="atr-card-body">
                  <p className="atr-section-title">Arrendador</p>
                  <div className="atr-landlord-row">
                    <div className="atr-landlord-avatar">
                      {nombreArrendador.charAt(0).toUpperCase()}
                    </div>
                    <div className="atr-landlord-name">{nombreArrendador}</div>
                  </div>
                  <hr className="atr-divider" />
                  <p className="atr-section-title">Contacto</p>
                  <div className="atr-contact-list">
                    <p className="atr-contact-item">
                      📧 {arrendador?.usuarioCorreo || 'No disponible'}
                    </p>
                    <p className="atr-contact-item">
                      📞 {arrendador?.usuarioTel || 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div className="atr-card" style={{ marginBottom: '1.25rem' }}>
                <div className="atr-card-body">
                  <p className="atr-section-title">Detalles del contrato</p>
                  <div className="atr-contact-list">
                    <p className="atr-contact-item">
                      💵 Renta mensual:&nbsp;
                      <strong style={{ color: '#059669' }}>
                        {renta != null ? `$${Number(renta).toLocaleString('es-MX')} MXN` : '—'}
                      </strong>
                    </p>
                    {arrendamiento.arrendamientoFechaInicio ? (
                      <p className="atr-contact-item">
                        📅 Inicio:&nbsp;
                        {(() => {
                          try {
                            return new Date(arrendamiento.arrendamientoFechaInicio)
                              .toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                          } catch { return arrendamiento.arrendamientoFechaInicio }
                        })()}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Finalizar */}
              {!esperandoArrendador && (
                <button className="atr-btn-danger" onClick={() => setMostrarModal(true)}>
                  ⚠️ Finalizar Arrendamiento
                </button>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ═══ MODAL ═══ */}
      {mostrarModal && (
        <div
          className="atr-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setMostrarModal(false) }}
        >
          <div className="atr-modal">
            <div className="atr-modal-icon">⚠️</div>
            <h3 className="atr-modal-title">¿Finalizar arrendamiento?</h3>
            <p className="atr-modal-desc">
              Esta acción no se puede deshacer. Para finalizar deberás contestar una breve encuesta sobre tu experiencia.
            </p>
            <p className="atr-modal-warning">¿Estás seguro de continuar?</p>
            <div className="atr-modal-actions">
              <button
                className="atr-btn-ghost"
                style={{ width: 'auto', padding: '10px 24px' }}
                onClick={() => setMostrarModal(false)}
              >
                Cancelar
              </button>
              <button
                className="atr-btn-danger"
                style={{ width: 'auto', padding: '10px 24px' }}
                onClick={handleConfirmarFinalizar}
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
