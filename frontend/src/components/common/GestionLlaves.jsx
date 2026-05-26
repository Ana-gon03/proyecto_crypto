import { useState, useEffect, useRef } from 'react'
import {
  leerArchivoCer,
} from '../../utils/cryptoUtils'
import { getMiCertificado } from '../../services/caService'
import api from '../../services/api'
import '../../styles/Arrendador.css'

const CA_PORTAL_URL = import.meta.env.VITE_CA_URL || 'http://localhost:5001'

export default function GestionLlaves({ nombreUsuario }) {
  const [estado, setEstado]           = useState('cargando')
  const [certificado, setCertificado] = useState(null)
  const [mensaje, setMensaje]         = useState('')
  const [error, setError]             = useState('')
  const [cargando, setCargando]       = useState(false)
  const cerFileRef = useRef(null)

  useEffect(() => { verificarEstado() }, [])

  async function verificarEstado() {
    setEstado('cargando')
    try {
      const cert = await getMiCertificado()
      setCertificado(cert)
      setEstado('con-certificado')
    } catch {
      setEstado('sin-certificado')
    }
  }

  // ── Registrar .cer existente desde archivo ───────────────────────────────
  async function handleRegistrarCer(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(''); setMensaje(''); setCargando(true)
    try {
      const certPEM = await leerArchivoCer(file)
      const userId  = localStorage.getItem('userId')
      await api.post('/ca/registrar-certificado', { certPEM }, {
        headers: { 'x-user-id': userId },
      })
      setMensaje('Certificado registrado. Recargando...')
      await verificarEstado()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al registrar el certificado')
    } finally {
      setCargando(false)
      if (cerFileRef.current) cerFileRef.current.value = ''
    }
  }

  if (estado === 'cargando') {
    return <div className="arr-form-card"><p className="arr-loading">Verificando identidad digital…</p></div>
  }

  return (
    <div className="arr-form-card">
      <div className="arr-form-card-header">
        <div className="arr-form-card-header-icon">🔐</div>
        <div>
          <h3>Identidad Digital</h3>
          <p>Certificado X.509 ECDSA P-256 — Burroomies CA</p>
        </div>
      </div>
      <div className="arr-form-card-body">

        {mensaje && <div className="arr-alert arr-alert-success" style={{ marginBottom: '1rem' }}>✅ {mensaje}</div>}
        {error   && <div className="arr-alert arr-alert-error"   style={{ marginBottom: '1rem' }}>❌ {error}</div>}

        {/* ── Sin certificado ──────────────────────────────────── */}
        {estado === 'sin-certificado' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '0.85rem', fontSize: '0.85rem', color: '#713f12' }}>
              ⚠️ Aún no tienes un certificado registrado. Obtén tu certificado digital en el portal CA y luego regístralo aquí.
            </div>

            <a
              href={CA_PORTAL_URL}
              target="_blank"
              rel="noreferrer"
              className="arr-btn-primary"
              style={{ textAlign: 'center', textDecoration: 'none' }}
            >
              🏛️ Ir al Portal CA — Obtener certificado
            </a>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.84rem', color: '#555', marginBottom: '0.5rem' }}>
                ¿Ya obtuviste tu archivo <strong>.cer</strong>? Regístralo aquí:
              </p>
              <label className="arr-btn-ghost" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                {cargando ? '⏳ Registrando…' : '📄 Subir archivo .cer'}
                <input ref={cerFileRef} type="file" accept=".cer,.pem,.crt" style={{ display: 'none' }} onChange={handleRegistrarCer} />
              </label>
            </div>
          </div>
        )}

        {/* ── Con certificado ──────────────────────────────────── */}
        {estado === 'con-certificado' && certificado && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#166534' }}>
              ✅ Certificado activo y vigente
            </div>

            <CertRow label="Serial"   value={<code style={{ fontSize: '0.73rem', wordBreak: 'break-all' }}>{certificado.serialHex || certificado.serialNumber}</code>} />
            <CertRow label="Titular"  value={certificado.nombre} />
            <CertRow label="Correo"   value={certificado.correo} />
            <CertRow label="Rol"      value={certificado.rol} />
            <CertRow label="Emitido"  value={certificado.fechaEmision ? new Date(certificado.fechaEmision).toLocaleDateString('es-MX') : '—'} />
            <CertRow label="Vence"    value={certificado.fechaVencimiento ? new Date(certificado.fechaVencimiento).toLocaleDateString('es-MX') : '—'} />

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', fontSize: '0.82rem', color: '#475569' }}>
              🔑 La llave privada <strong>nunca se almacena</strong> en el sistema. Deberás subir tu archivo <strong>.key</strong> cada vez que firmes un contrato.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const CertRow = ({ label, value }) => (
  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.84rem', alignItems: 'flex-start' }}>
    <span style={{ minWidth: '70px', color: '#666', fontWeight: 500, flexShrink: 0 }}>{label}:</span>
    <span>{value || '—'}</span>
  </div>
)
