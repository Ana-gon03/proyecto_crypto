import React, { useState } from 'react'
import {
  cargarClavePrivadaECDH,
  importarClavePublicaECDH,
  derivarSecretoCompartido,
  derivarClaveAESDeSecreto,
  cifrarAESGCM,
  calcularSHA256,
  tieneClavesLocales,
} from '../../utils/cryptoUtils'

/**
 * Cifra un ArrayBuffer (PDF) con AES-GCM 256 usando ECDH con la clave
 * pública del destinatario. Devuelve { cifradoB64, hashHex }.
 *
 * Props:
 *   pdfBuffer          ArrayBuffer   — bytes del PDF original
 *   ecdhPublicKeyB64   string        — clave pública ECDH del destinatario (base64)
 *   onCifrado          function      — recibe { cifradoB64, hashHex }
 *   labelBoton?        string
 *   disabled?          boolean
 */
const AESEncryptor = ({
  pdfBuffer,
  ecdhPublicKeyB64,
  onCifrado,
  labelBoton = 'Cifrar y preparar contrato',
  disabled = false,
}) => {
  const [cifrando, setCifrando] = useState(false)
  const [cifrado, setCifrado]   = useState(false)
  const [error, setError]       = useState('')

  const handleCifrar = async () => {
    if (!pdfBuffer) {
      setError('No hay PDF cargado')
      return
    }
    if (!ecdhPublicKeyB64) {
      setError('No se tiene la clave pública del destinatario')
      return
    }
    if (!tieneClavesLocales()) {
      setError('No tienes claves de seguridad. Ve a tu perfil y genéralas primero.')
      return
    }

    try {
      setCifrando(true)
      setError('')

      // Calcula el hash SHA-256 del PDF ORIGINAL antes de cifrar
      const hashHex = await calcularSHA256(pdfBuffer)

      // Deriva el shared_secret: ECDH(mi_priv_ECDH, destinatario_pub_ECDH)
      const miClavePrivECDH    = await cargarClavePrivadaECDH()
      const suClavePubECDH     = await importarClavePublicaECDH(ecdhPublicKeyB64)
      const sharedBits         = await derivarSecretoCompartido(miClavePrivECDH, suClavePubECDH)
      const aesKey             = await derivarClaveAESDeSecreto(sharedBits)

      // Cifra el PDF
      const cifradoBytes = await cifrarAESGCM(aesKey, pdfBuffer)

      // Convierte a base64 para enviar por JSON
      const cifradoB64 = btoa(String.fromCharCode(...cifradoBytes))

      setCifrado(true)
      onCifrado({ cifradoB64, hashHex })
    } catch (err) {
      setError('Error al cifrar: ' + err.message)
    } finally {
      setCifrando(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleCifrar}
        disabled={disabled || cifrando || cifrado || !pdfBuffer || !ecdhPublicKeyB64}
        style={{
          padding: '10px 20px',
          backgroundColor: cifrado
            ? '#28a745'
            : disabled || cifrando || !pdfBuffer || !ecdhPublicKeyB64
            ? '#ccc'
            : '#1a237e',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: disabled || cifrando || cifrado || !pdfBuffer || !ecdhPublicKeyB64
            ? 'not-allowed'
            : 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {cifrado ? '✅ Contrato cifrado' : cifrando ? 'Cifrando...' : `🔒 ${labelBoton}`}
      </button>

      {error && (
        <p style={{ color: '#dc3545', fontSize: '13px', marginTop: '6px' }}>❌ {error}</p>
      )}
    </div>
  )
}

export default AESEncryptor
