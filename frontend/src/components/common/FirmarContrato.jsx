import { useState, useRef } from 'react'
import {
  importarLlavePrivadaJwk,
  descifrarLlavePrivada,
  leerArchivoKey,
  leerArchivoCer,
  firmarDatos,
} from '../../utils/cryptoUtils'
import {
  getPdfBuffer,
  firmarComoArrendador,
  firmarComoArrendatario,
} from '../../services/contratoDigitalService'
import api from '../../services/api'

/**
 * Botón + lógica para firmar un contrato digitalmente con .cer + .key + passphrase.
 * @param {number}   idArrendamiento
 * @param {'arrendador'|'arrendatario'} rol
 * @param {Function} onFirmado   Callback al completar la firma
 */
export default function FirmarContrato({ idArrendamiento, rol, onFirmado }) {
  const [estado, setEstado]         = useState('listo')
  const [error, setError]           = useState('')
  const [certPEM, setCertPEM]       = useState('')
  const [keyData, setKeyData]       = useState(null)
  const [passphrase, setPassphrase] = useState('')
  const [showPass, setShowPass]     = useState(false)
  const cerRef = useRef(null)
  const keyRef = useRef(null)

  const ocupado = ['descargando-pdf', 'verificando', 'firmando', 'enviando'].includes(estado)

  // ── Leer archivo .cer ────────────────────────────────────────────────────
  async function handleCer(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const pem = await leerArchivoCer(file)
      setCertPEM(pem)
      setError('')
    } catch (err) {
      setError(err.message)
      if (cerRef.current) cerRef.current.value = ''
    }
  }

  // ── Leer archivo .key ────────────────────────────────────────────────────
  async function handleKey(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await leerArchivoKey(file)
      setKeyData(data)
      setError('')
    } catch (err) {
      setError(err.message)
      if (keyRef.current) keyRef.current.value = ''
    }
  }

  // ── Usar llave de sesión (si ya fue cargada en GestionLlaves) ────────────
  function tieneLlaveSesion() {
    return !!sessionStorage.getItem('ecdsaLlaveImportada')
  }

  // ── Firma principal ──────────────────────────────────────────────────────
  async function ejecutarFirma() {
    setError('')
    if (!certPEM && !tieneLlaveSesion()) {
      return setError('Sube tu archivo .cer antes de firmar.')
    }

    let privateKey
    if (tieneLlaveSesion() && !keyData) {
      // Usar llave ya cargada en la sesión desde GestionLlaves
      try {
        const jwk = JSON.parse(sessionStorage.getItem('ecdsaPrivateKeyJwk') || 'null')
        if (!jwk) throw new Error('Llave no encontrada en sesión')
        privateKey = await importarLlavePrivadaJwk(jwk)
      } catch (err) {
        return setError('No se pudo leer la llave de sesión. Cárgala en tu perfil.')
      }
    } else {
      if (!keyData) return setError('Sube tu archivo .key antes de firmar.')
      if (!passphrase) return setError('Introduce la contraseña del archivo .key.')
      try {
        const jwk = await descifrarLlavePrivada(keyData, passphrase)
        privateKey = await importarLlavePrivadaJwk(jwk)
      } catch (err) {
        return setError(err.message || 'Contraseña incorrecta o archivo .key inválido')
      }
    }

    try {
      // 1. Validar .cer con la CA y obtener serial + publicKey
      let certSerial
      if (certPEM) {
        setEstado('verificando')
        const userId = localStorage.getItem('userId')
        const vResp = await api.post('/ca/registrar-certificado', { certPEM }, {
          headers: { 'x-user-id': userId },
        })
        certSerial = vResp.data.serialHex
      } else {
        // Obtener serial del perfil
        const userId = localStorage.getItem('userId')
        const perfResp = await api.get('/ca/mi-certificado', { headers: { 'x-user-id': userId } })
        certSerial = perfResp.data.serialHex || perfResp.data.serialNumber
      }

      // 2. Descargar PDF
      setEstado('descargando-pdf')
      const pdfArrayBuffer = await getPdfBuffer(idArrendamiento)

      // 3. Firmar
      setEstado('firmando')
      const firmaBase64 = await firmarDatos(privateKey, pdfArrayBuffer)

      // 4. Enviar al backend
      setEstado('enviando')
      if (rol === 'arrendador') {
        await firmarComoArrendador(idArrendamiento, firmaBase64, certSerial)
      } else {
        await firmarComoArrendatario(idArrendamiento, firmaBase64, certSerial)
      }

      setEstado('completado')
      if (onFirmado) onFirmado()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al firmar el contrato')
      setEstado('listo')
    }
  }

  const labelEstado = {
    'verificando':     '🔍 Verificando certificado con la CA…',
    'descargando-pdf': '📄 Descargando contrato…',
    'firmando':        '✍️ Firmando con ECDSA P-256…',
    'enviando':        '📤 Enviando firma al servidor…',
  }[estado] || ''

  if (estado === 'completado') {
    return (
      <div className="arr-alert arr-alert-success">
        ✅ Contrato firmado digitalmente con ECDSA P-256 / SHA-256.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {error && <div className="arr-alert arr-alert-error">❌ {error}</div>}
      {ocupado && <div style={{ color: '#2563eb', fontSize: '0.85rem' }}>⏳ {labelEstado}</div>}

      {!ocupado && (
        <>
          {/* Archivos .cer y .key */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
              Archivos de firma digital (e.firma Blockhome CA)
            </p>

            {/* .cer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '6px', padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.82rem', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                📄 {certPEM ? '✅ .cer cargado' : 'Archivo .cer'}
                <input ref={cerRef} type="file" accept=".cer,.pem,.crt" style={{ display: 'none' }} onChange={handleCer} />
              </label>
              {certPEM && <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>Certificado listo</span>}
            </div>

            {/* .key — solo si no hay llave en sesión */}
            {!tieneLlaveSesion() && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <label style={{ background: '#fefce8', border: '1.5px solid #fde047', borderRadius: '6px', padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.82rem', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    🔑 {keyData ? '✅ .key cargado' : 'Archivo .key'}
                    <input ref={keyRef} type="file" accept=".key,.json" style={{ display: 'none' }} onChange={handleKey} />
                  </label>
                  {keyData && <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>Llave cifrada cargada</span>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={passphrase}
                    onChange={e => setPassphrase(e.target.value)}
                    placeholder="Contraseña del archivo .key"
                    style={{ flex: 1, padding: '0.45rem 0.7rem', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '0.83rem' }}
                  />
                  <button onClick={() => setShowPass(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </>
            )}

            {tieneLlaveSesion() && !keyData && (
              <div style={{ fontSize: '0.82rem', color: '#16a34a' }}>
                ✓ Llave privada ya cargada en sesión (desde tu perfil)
              </div>
            )}
          </div>

          <button
            className="arr-btn-primary"
            onClick={ejecutarFirma}
            style={{ alignSelf: 'flex-start' }}
          >
            ✍️ Firmar contrato digitalmente
          </button>
        </>
      )}
    </div>
  )
}
