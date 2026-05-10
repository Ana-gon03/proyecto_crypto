import React, { useState } from 'react'
import {
  importarClavePublicaECDH,
  derivarSecretoCompartido,
  derivarClaveAESDeSecreto,
  cifrarAESGCM,
  calcularSHA256,
} from '../../utils/cryptoUtils'

/**
 * Cifra un ArrayBuffer (PDF) con AES-GCM 256 usando ECDH con la clave
 * pública del destinatario. Devuelve { cifradoB64, hashHex }.
 *
 * Props:
 *   pdfBuffer          ArrayBuffer   — bytes del PDF original
 *   ecdhPublicKeyB64   string        — clave pública ECDH del destinatario (base64)
 *   ecdhPrivKey        CryptoKey     — clave privada ECDH del firmante (ya cargada)
 *   onCifrado          function      — recibe { cifradoB64, hashHex }
 *   labelBoton?        string
 *   disabled?          boolean
 */
const AESEncryptor = ({
  pdfBuffer,
  ecdhPublicKeyB64,
  ecdhPrivKey = null,
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
    if (!ecdhPrivKey) {
      setError('Carga tu archivo de claves privadas antes de cifrar.')
      return
    }

    try {
      setCifrando(true)
      setError('')

      const hashHex    = await calcularSHA256(pdfBuffer)
      const suClavePub = await importarClavePublicaECDH(ecdhPublicKeyB64)
      const sharedBits = await derivarSecretoCompartido(ecdhPrivKey, suClavePub)
      const aesKey     = await derivarClaveAESDeSecreto(sharedBits)

      const cifradoBytes = await cifrarAESGCM(aesKey, pdfBuffer)
      const cifradoB64   = btoa(String.fromCharCode(...cifradoBytes))

      setCifrado(true)
      onCifrado({ cifradoB64, hashHex })
    } catch (err) {
      setError('Error al cifrar: ' + err.message)
    } finally {
      setCifrando(false)
    }
  }

  const noReady = disabled || cifrando || cifrado || !pdfBuffer || !ecdhPublicKeyB64 || !ecdhPrivKey

  return (
    <div>
      <button
        onClick={handleCifrar}
        disabled={noReady}
        style={{
          padding: '10px 20px',
          backgroundColor: cifrado ? '#28a745' : noReady ? '#ccc' : '#1a237e',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: noReady ? 'not-allowed' : 'pointer',
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
