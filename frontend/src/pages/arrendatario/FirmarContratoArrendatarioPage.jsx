import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'
import '../../styles/Arrendatario.css'

const FirmarContratoArrendatarioPage = () => {
  const navigate = useNavigate()
  const [arrendamiento, setArrendamiento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { cargarArrendamiento() }, [])

  const cargarArrendamiento = async () => {
    try {
      const userId       = localStorage.getItem('userId')
      const arrendatarioId = localStorage.getItem('arrendatarioId')
      if (!userId) { navigate('/usuarios/inicio-sesion'); return }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/arrendamientos/mi-arrendamiento`,
        { headers: { 'Content-Type': 'application/json', 'x-user-id': userId, 'x-arrendatario-id': arrendatarioId } }
      )
      if (response.status === 404) { setArrendamiento(null); return }
      if (!response.ok) throw new Error('Error al cargar')
      setArrendamiento(await response.json())
    } catch { setError('No se pudo cargar el arrendamiento') }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div className="atr-page">
      <NavbarArrendatario />
      <div className="atr-loading-center">
        <div className="atr-spinner" />
        <p>Cargando…</p>
      </div>
      <FooterInicio />
    </div>
  )

  return (
    <div className="atr-page">
      <NavbarArrendatario />

      <div className="atr-main">
        <h1 className="atr-page-title">Firmar Contrato</h1>

        {error && (
          <div className="atr-alert atr-alert-error">
            <div className="atr-alert-icon">⚠️</div>
            <div className="atr-alert-body">
              <div className="atr-alert-title">Error</div>
              <div className="atr-alert-desc">{error}</div>
            </div>
          </div>
        )}

        {!error && !arrendamiento && (
          <div className="atr-empty">
            <div className="atr-empty-icon">✍️</div>
            <div className="atr-empty-title">Sin arrendamiento activo</div>
            <div className="atr-empty-sub">No tienes un arrendamiento disponible para firmar.</div>
            <button
              className="atr-btn-primary"
              style={{ maxWidth: '220px', margin: '0 auto' }}
              onClick={() => navigate('/arrendatario/buscar-vivienda')}
            >
              🔍 Buscar Vivienda
            </button>
          </div>
        )}

        {arrendamiento && (
          <div style={{ maxWidth: '520px' }}>
            <div className="atr-card">
              <div className="atr-card-body">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {arrendamiento.propiedad?.propiedadTitulo || 'Mi Propiedad'}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--atr-text-light, #64748b)', marginBottom: '1.25rem' }}>
                  {arrendamiento.propiedad?.propiedadTipo} — Renta: ${Number(arrendamiento.arrendamientoRenta).toLocaleString('es-MX')} MXN/mes
                </p>
                <button
                  className="atr-btn-ghost"
                  style={{ width: '100%' }}
                  onClick={() => navigate(`/arrendatario/contratos/${arrendamiento.idArrendamiento}`)}
                >
                  ✍️ Firmar Contrato Digital
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <FooterInicio />
    </div>
  )
}

export default FirmarContratoArrendatarioPage
