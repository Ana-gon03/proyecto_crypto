import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'
import FirmarContrato from '../../components/common/FirmarContrato'
import { getContrato, verificarContrato, getPdfUrl, getComprobanteUrl } from '../../services/contratoDigitalService'
import { getMiCertificado } from '../../services/caService'
import '../../styles/Arrendatario.css'
import '../../styles/Arrendador.css'

export default function ContratosArrendatario() {
  const { idArrendamiento } = useParams()
  const navigate = useNavigate()

  const [contrato, setContrato]         = useState(null)
  const [certificado, setCertificado]   = useState(null)
  const [verificacion, setVerificacion] = useState(null)
  const [cargando, setCargando]         = useState(true)
  const [error, setError]               = useState('')
  const [mensaje, setMensaje]           = useState('')

  useEffect(() => { cargarDatos() }, [idArrendamiento])

  async function cargarDatos() {
    setCargando(true); setError('')
    try {
      const [cert, contratoData] = await Promise.allSettled([
        getMiCertificado(),
        getContrato(idArrendamiento),
      ])
      if (cert.status === 'fulfilled') setCertificado(cert.value)
      if (contratoData.status === 'fulfilled') setContrato(contratoData.value)
    } catch { /* tolerado */ }
    finally { setCargando(false) }
  }

  async function handleVerificar() {
    try {
      const result = await verificarContrato(idArrendamiento)
      setVerificacion(result)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al verificar')
    }
  }

  const sinCertificado = !certificado

  return (
    <div className="arr-page">
      <NavbarArrendatario />
      <main className="arr-main">
        <div className="arr-profile-wrapper">

          <div className="arr-profile-card">
            <div className="arr-profile-hero">
              <div className="arr-avatar" style={{ fontSize: '2rem' }}>📄</div>
              <p className="arr-profile-name">Contrato Digital</p>
              <div className="arr-profile-role-badge">Arrendamiento #{idArrendamiento}</div>
            </div>
            <div className="arr-profile-hero-actions">
              <button className="arr-btn-ghost" onClick={() => navigate('/arrendatario/mi-arrendamiento')}>
                ← Volver
              </button>
            </div>
          </div>

          {mensaje && <div className="arr-alert arr-alert-success" style={{ marginBottom: '1rem' }}>{mensaje}</div>}
          {error   && <div className="arr-alert arr-alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}

          {cargando ? (
            <p className="arr-loading">Cargando contrato...</p>
          ) : (
            <>
              {sinCertificado && (
                <div className="arr-form-card">
                  <div className="arr-form-card-body">
                    <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '1rem' }}>
                      ⚠️ Necesitas un <strong>certificado digital</strong> para firmar contratos.
                      Ve a tu perfil y genera tu identidad digital.
                    </div>
                    <button className="arr-btn-primary" style={{ marginTop: '1rem' }}
                      onClick={() => navigate('/arrendatario/perfil')}>
                      Ir a mi perfil
                    </button>
                  </div>
                </div>
              )}

              {!contrato && (
                <div className="arr-form-card">
                  <div className="arr-form-card-body">
                    <p>El arrendador aún no ha iniciado el proceso de firma digital de este contrato.</p>
                  </div>
                </div>
              )}

              {contrato && (
                <>
                  <div className="arr-form-card">
                    <div className="arr-form-card-header">
                      <div className="arr-form-card-header-icon">📊</div>
                      <div><h3>Estado del contrato</h3></div>
                    </div>
                    <div className="arr-form-card-body">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <InfoRow label="Estado de firma" value={<EstadoBadge estado={contrato.estadoFirma} />} />
                        <InfoRow label="Hash SHA-256" value={
                          <code style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>{contrato.pdfHash}</code>
                        } />
                        <InfoRow label="Creado" value={new Date(contrato.fechaCreacion).toLocaleString('es-MX')} />
                        {contrato.fechaFirmaArrendador && (
                          <InfoRow label="Firma arrendador" value={new Date(contrato.fechaFirmaArrendador).toLocaleString('es-MX')} />
                        )}
                        {contrato.fechaFirmaArrendatario && (
                          <InfoRow label="Firma arrendatario" value={new Date(contrato.fechaFirmaArrendatario).toLocaleString('es-MX')} />
                        )}
                      </div>
                      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <a
                          href={getPdfUrl(idArrendamiento)}
                          target="_blank"
                          rel="noreferrer"
                          className="arr-btn-ghost"
                          style={{ display: 'inline-block' }}
                        >
                          👁 Ver / Descargar PDF
                        </a>
                        {contrato.estadoFirma === 'completo' && (
                          <a
                            href={getComprobanteUrl(idArrendamiento)}
                            download={`comprobante_firmas_${idArrendamiento}.pdf`}
                            className="arr-btn-primary"
                            style={{ display: 'inline-block' }}
                          >
                            📋 Descargar Comprobante de Firmas
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {contrato.estadoFirma === 'pendiente_arrendador' && (
                    <div className="arr-form-card">
                      <div className="arr-form-card-body">
                        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '0.75rem' }}>
                          ⏳ Esperando que el arrendador firme primero.
                        </div>
                      </div>
                    </div>
                  )}

                  {contrato.estadoFirma === 'pendiente_arrendatario' && !sinCertificado && (
                    <div className="arr-form-card">
                      <div className="arr-form-card-header">
                        <div className="arr-form-card-header-icon">✍️</div>
                        <div>
                          <h3>Tu firma</h3>
                          <p>El arrendador ya firmó. Ahora debes revisar y firmar.</p>
                        </div>
                      </div>
                      <div className="arr-form-card-body">
                        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                          ℹ️ Revisa el PDF antes de firmar. Tu firma digital garantiza que aceptas el contrato.
                        </div>
                        <FirmarContrato
                          idArrendamiento={idArrendamiento}
                          rol="arrendatario"
                          certSerial={certificado?.serialNumber}
                          onFirmado={() => { setMensaje('¡Contrato firmado por ambas partes!'); cargarDatos() }}
                        />
                      </div>
                    </div>
                  )}

                  {contrato.estadoFirma === 'completo' && (
                    <div className="arr-form-card">
                      <div className="arr-form-card-header">
                        <div className="arr-form-card-header-icon">🛡️</div>
                        <div><h3>Verificación criptográfica</h3></div>
                      </div>
                      <div className="arr-form-card-body">
                        <div className="arr-alert arr-alert-success" style={{ marginBottom: '1rem' }}>
                          ✅ Contrato firmado digitalmente por ambas partes.
                        </div>
                        <button className="arr-btn-primary" onClick={handleVerificar}>
                          🔍 Verificar autenticidad del contrato
                        </button>
                        {verificacion && <ResultadoVerificacion data={verificacion} />}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

        </div>
      </main>
      <FooterInicio />
    </div>
  )
}

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', alignItems: 'flex-start' }}>
    <span style={{ minWidth: '130px', color: '#666', fontWeight: 500, flexShrink: 0 }}>{label}:</span>
    <span>{value || '—'}</span>
  </div>
)

const EstadoBadge = ({ estado }) => {
  const map = {
    pendiente_arrendador:   { label: 'Pendiente firma arrendador',  color: '#f59e0b' },
    pendiente_arrendatario: { label: 'Pendiente tu firma',           color: '#3b82f6' },
    completo:               { label: 'Completo — ambas firmas',       color: '#16a34a' },
  }
  const cfg = map[estado] || { label: estado, color: '#888' }
  return <span style={{ fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
}

const ResultadoVerificacion = ({ data }) => (
  <div style={{ marginTop: '1rem', background: data.valido ? '#f0fdf4' : '#fef2f2', border: `1px solid ${data.valido ? '#86efac' : '#fca5a5'}`, borderRadius: '8px', padding: '1rem', fontSize: '0.85rem' }}>
    <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>
      {data.valido ? '✅ Contrato íntegro y auténtico' : '❌ Verificación fallida'}
    </p>
    <CheckRow label="Integridad del documento (hash SHA-256)" ok={data.detalle?.integridad?.ok} />
    <CheckRow label="Firma del arrendador (ECDSA)"           ok={data.detalle?.firmaArrendador?.ok} />
    <CheckRow label="Certificado del arrendador (CA)"        ok={data.detalle?.firmaArrendador?.certValido} />
    <CheckRow label="Firma del arrendatario (ECDSA)"         ok={data.detalle?.firmaArrendatario?.ok} />
    <CheckRow label="Certificado del arrendatario (CA)"      ok={data.detalle?.firmaArrendatario?.certValido} />
  </div>
)

const CheckRow = ({ label, ok }) => (
  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
    <span>{ok ? '✅' : '❌'}</span>
    <span>{label}</span>
  </div>
)
