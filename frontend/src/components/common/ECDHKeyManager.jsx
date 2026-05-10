import React, { useState, useEffect, useCallback } from 'react'
import {
  generarParECDH,
  generarParECDSA,
  exportarClavePublicaBase64,
  exportarClavePrivadaJWK,
  tieneClavesLocales,
  LS_ECDH_PRIV,
  LS_ECDH_PUB,
  LS_ECDSA_PRIV,
  LS_ECDSA_PUB,
} from '../../utils/cryptoUtils'

/**
 * Muestra el estado de las claves criptográficas del usuario y permite generarlas.
 * Las claves privadas quedan SOLO en localStorage; las públicas van al backend.
 *
 * Props:
 *   onClavesListas?: () => void  — se llama cuando las claves están disponibles
 */
const ECDHKeyManager = ({ onClavesListas }) => {
  const [tienClaves, setTienClaves]   = useState(false)
  const [generando, setGenerando]     = useState(false)
  const [mensaje, setMensaje]         = useState('')
  const [error, setError]             = useState('')

  const verificar = useCallback(() => {
    const ok = tieneClavesLocales()
    setTienClaves(ok)
    if (ok && onClavesListas) onClavesListas()
  }, [onClavesListas])

  useEffect(() => { verificar() }, [verificar])

  const handleGenerar = async (confirmar) => {
    if (confirmar && tienClaves) {
      const ok = window.confirm(
        '⚠️ Ya tienes claves de seguridad generadas.\n\n' +
        'Si las regeneras, los contratos cifrados anteriormente NO podrán descifrarse en este dispositivo.\n\n' +
        '¿Deseas continuar?'
      )
      if (!ok) return
    }

    try {
      setGenerando(true)
      setError('')
      setMensaje('Generando claves criptográficas P-256...')

      const [parECDH, parECDSA] = await Promise.all([
        generarParECDH(),
        generarParECDSA(),
      ])

      const [ecdhPubB64, ecdhPrivJWK, ecdsaPubB64, ecdsaPrivJWK] = await Promise.all([
        exportarClavePublicaBase64(parECDH.publicKey),
        exportarClavePrivadaJWK(parECDH.privateKey),
        exportarClavePublicaBase64(parECDSA.publicKey),
        exportarClavePrivadaJWK(parECDSA.privateKey),
      ])

      // Guarda claves privadas SOLO en localStorage
      localStorage.setItem(LS_ECDH_PUB,   ecdhPubB64)
      localStorage.setItem(LS_ECDH_PRIV,  JSON.stringify(ecdhPrivJWK))
      localStorage.setItem(LS_ECDSA_PUB,  ecdsaPubB64)
      localStorage.setItem(LS_ECDSA_PRIV, JSON.stringify(ecdsaPrivJWK))

      // Envía SOLO claves públicas al servidor
      const userId = localStorage.getItem('userId')
      const resp = await fetch(`http://localhost:5000/api/usuarios/${userId}/claves`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ecdhPublicKey: ecdhPubB64, ecdsaPublicKey: ecdsaPubB64 }),
      })

      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.error || 'Error al guardar claves en el servidor')
      }

      setTienClaves(true)
      setMensaje('Claves generadas y guardadas correctamente')
      if (onClavesListas) onClavesListas()
    } catch (err) {
      setError('Error al generar claves: ' + err.message)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div style={{
      border: '1px solid ' + (tienClaves ? '#28a745' : '#ffc107'),
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      backgroundColor: tienClaves ? '#f0fff4' : '#fffbf0',
    }}>
      <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#333' }}>
        🔐 Seguridad Criptográfica
      </h3>

      {tienClaves ? (
        <div>
          <p style={{ color: '#155724', fontWeight: 'bold', marginBottom: '10px' }}>
            ✅ Claves de seguridad generadas en este dispositivo
          </p>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
            Tus claves privadas están protegidas localmente. Puedes cifrar y firmar contratos.
          </p>
          <button
            onClick={() => handleGenerar(true)}
            disabled={generando}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: generando ? 'not-allowed' : 'pointer',
              fontSize: '13px',
            }}
          >
            {generando ? 'Regenerando...' : '🔄 Regenerar claves'}
          </button>
        </div>
      ) : (
        <div>
          <p style={{ color: '#856404', fontWeight: 'bold', marginBottom: '10px' }}>
            ⚠️ Aún no tienes claves de seguridad en este dispositivo
          </p>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
            Necesitas generar tus claves para poder crear, firmar y descifrar contratos.
          </p>
          <button
            onClick={() => handleGenerar(false)}
            disabled={generando}
            style={{
              padding: '10px 20px',
              backgroundColor: generando ? '#ccc' : '#1a237e',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: generando ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {generando ? 'Generando...' : '🔑 Generar mis claves de seguridad'}
          </button>
        </div>
      )}

      {mensaje && !error && (
        <p style={{ marginTop: '10px', color: '#155724', fontSize: '13px' }}>✅ {mensaje}</p>
      )}
      {error && (
        <p style={{ marginTop: '10px', color: '#dc3545', fontSize: '13px' }}>❌ {error}</p>
      )}
    </div>
  )
}

export default ECDHKeyManager
