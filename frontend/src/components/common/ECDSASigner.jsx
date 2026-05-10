import React, { useState } from 'react'
import {
  cargarClavePrivadaECDSA,
  firmarECDSA,
  tieneClavesLocales,
} from '../../utils/cryptoUtils'

/**
 * Firma el hash SHA-256 de un PDF con la clave privada ECDSA del usuario.
 *
 * Props:
 *   hashHex         string    — SHA-256 hex del PDF (64 chars)
 *   onFirma         function  — recibe la firma base64 cuando se completa
 *   labelBoton?     string    — texto del botón (default: "Firmar documento")
 *   disabled?       boolean
 */
const ECDSASigner = ({ hashHex, onFirma, labelBoton = 'Firmar documento', disabled = false }) => {
  const [firmando, setFirmando] = useState(false)
  const [firmado, setFirmado]   = useState(false)
  const [error, setError]       = useState('')

  const handleFirmar = async () => {
    if (!hashHex) {
      setError('No hay hash para firmar')
      return
    }
    if (!tieneClavesLocales()) {
      setError('No tienes claves de seguridad. Ve a tu perfil y genéralas primero.')
      return
    }

    try {
      setFirmando(true)
      setError('')
      const ecdsaPrivKey = await cargarClavePrivadaECDSA()
      const firma = await firmarECDSA(ecdsaPrivKey, hashHex)
      setFirmado(true)
      onFirma(firma)
    } catch (err) {
      setError('Error al firmar: ' + err.message)
    } finally {
      setFirmando(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleFirmar}
        disabled={disabled || firmando || firmado || !hashHex}
        style={{
          padding: '10px 20px',
          backgroundColor: firmado ? '#28a745' : (disabled || firmando || !hashHex) ? '#ccc' : '#1a237e',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: (disabled || firmando || firmado || !hashHex) ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {firmado ? '✅ Firmado' : firmando ? 'Firmando...' : `✍️ ${labelBoton}`}
      </button>

      {error && (
        <p style={{ color: '#dc3545', fontSize: '13px', marginTop: '6px' }}>❌ {error}</p>
      )}
    </div>
  )
}

export default ECDSASigner
