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
      const token = localStorage.getItem('token') || localStorage.getItem('blockhome_token')
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
      <div className="atr-page">
        <NavbarArrendatario />
        <div className="atr-loading-center">
          <div className="atr-spinner" />
          <p>Cargando arrendamiento…</p>
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
                {/* Hero con overlay */}
                <div className="atr-card-hero">
                  {primeraFoto ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000'}${primeraFoto}`}
                      alt={propiedad?.propiedadTitulo || 'Propiedad'}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="atr-card-hero-placeholder">🏠</div>
                  )}
                  <div className="atr-hero-overlay" />
                  <div className="atr-hero-bottom">
                    <div className="atr-hero-badge-row">
                      <span className="atr-hero-pill atr-hero-pill-green">Activo</span>
                      {propiedad?.propiedadTipo && (
                        <span className="atr-hero-pill atr-hero-pill-white">{propiedad.propiedadTipo}</span>
                      )}
                    </div>
                    <h2 className="atr-hero-title">{propiedad?.propiedadTitulo || 'Mi Propiedad'}</h2>
                    {direccion && (
                      <p className="atr-hero-subtitle">
                        {[
                          direccion.calle ? `${direccion.calle}${direccion.numExt ? ' #' + direccion.numExt : ''}` : null,
                          direccion.colonia ? `Col. ${direccion.colonia}` : null,
                        ].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {renta != null && (
                      <p className="atr-hero-price">
                        ${Number(renta).toLocaleString('es-MX')} <span>MXN / mes</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="atr-card-body">
                  {/* Descripción */}
                  {propiedad?.propiedadDescripcion && (
                    <>
                      <div className="atr-section-header">
                        <div className="atr-section-dot" />
                        <p className="atr-section-title" style={{ margin: 0 }}>Descripción</p>
                      </div>
                      <div className="atr-card-desc" style={{ marginBottom: '1.5rem' }}>
                        {propiedad.propiedadDescripcion}
                      </div>
                    </>
                  )}

                  {/* Ver contrato */}
                  <button className="atr-btn-primary" onClick={handleDescargarContrato}>
                    Ver Contrato
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ COLUMNA LATERAL ═══ */}
            <div className="mir-side">

              {/* Arrendador */}
              <div className="atr-card">
                <div className="atr-card-body">
                  <div className="atr-section-header" style={{ marginBottom: '0.85rem' }}>
                    <div className="atr-section-dot" />
                    <p className="atr-section-title" style={{ margin: 0 }}>Arrendador</p>
                  </div>

                  <div className="atr-landlord-card-v2">
                    <div className="atr-landlord-avatar-v2">
                      {nombreArrendador.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="atr-landlord-name-v2">{nombreArrendador}</p>
                      <span className="atr-landlord-tag">Arrendador verificado</span>
                    </div>
                  </div>

                  <div className="atr-section-header" style={{ marginBottom: '0.75rem', marginTop: '0.25rem' }}>
                    <div className="atr-section-dot" />
                    <p className="atr-section-title" style={{ margin: 0 }}>Contacto</p>
                  </div>

                  <div className="atr-contact-chip">
                    <div className="atr-contact-chip-icon">✉</div>
                    <span>{arrendador?.usuarioCorreo || 'No disponible'}</span>
                  </div>
                  <div className="atr-contact-chip">
                    <div className="atr-contact-chip-icon">☎</div>
                    <span>{arrendador?.usuarioTel || 'No disponible'}</span>
                  </div>
                </div>
              </div>

              {/* Detalles del contrato */}
              <div className="atr-card">
                <div className="atr-card-body">
                  <div className="atr-section-header" style={{ marginBottom: '0.5rem' }}>
                    <div className="atr-section-dot" />
                    <p className="atr-section-title" style={{ margin: 0 }}>Detalles del contrato</p>
                  </div>

                  <div className="atr-contract-row">
                    <div className="atr-contract-icon">💵</div>
                    <div>
                      <div className="atr-contract-label">Renta mensual</div>
                      <div className="atr-contract-value-green">
                        {renta != null ? `$${Number(renta).toLocaleString('es-MX')} MXN` : '—'}
                      </div>
                    </div>
                  </div>

                  {arrendamiento.arrendamientoFechaInicio && (
                    <div className="atr-contract-row">
                      <div className="atr-contract-icon">📅</div>
                      <div>
                        <div className="atr-contract-label">Fecha de inicio</div>
                        <div className="atr-contract-value">
                          {(() => {
                            try {
                              return new Date(arrendamiento.arrendamientoFechaInicio)
                                .toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                            } catch { return arrendamiento.arrendamientoFechaInicio }
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="atr-contract-row">
                    <div className="atr-contract-icon">✅</div>
                    <div>
                      <div className="atr-contract-label">Estado</div>
                      <div className="atr-contract-value">
                        {esperandoArrendador ? 'Pendiente de confirmar' : 'Activo'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Finalizar */}
              {!esperandoArrendador && (
                <button className="atr-btn-danger" onClick={() => setMostrarModal(true)}>
                  Finalizar Arrendamiento
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
