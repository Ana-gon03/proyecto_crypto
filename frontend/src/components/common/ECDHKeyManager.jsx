import React, { useState, useEffect, useCallback } from 'react'
import {
  generarParECDH,
  generarParECDSA,
  exportarClavePublicaBase64,
  descargarClavePrivada,
  tieneClavesGeneradas,
  LS_ECDH_PUB,
  LS_ECDSA_PUB,
} from '../../utils/cryptoUtils'

/**
 * Muestra el estado de las claves criptográficas y permite generarlas.
 * Las claves privadas SE DESCARGAN como archivo JSON — nunca se guardan en localStorage.
 * Solo las claves públicas quedan en localStorage (son información no sensible).
 *
 * Props:
 *   onClavesListas?: () => void
 */
const ECDHKeyManager = ({ onClavesListas }) => {
  const [tienClaves, setTienClaves] = useState(false)
  const [generando,  setGenerando]  = useState(false)
  const [mensaje,    setMensaje]    = useState('')
  const [error,      setError]      = useState('')

  const verificar = useCallback(() => {
    const ok = tieneClavesGeneradas()
    setTienClaves(ok)
    if (ok && onClavesListas) onClavesListas()
  }, [onClavesListas])

  useEffect(() => { verificar() }, [verificar])

  const handleGenerar = async (confirmar) => {
    if (confirmar && tienClaves) {
      const ok = window.confirm(
        '⚠️ Ya tienes claves de seguridad generadas.\n\n' +
        'Si las regeneras, los contratos cifrados anteriormente NO podrán descifrarse con el nuevo archivo.\n\n' +
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

      const [ecdhPubB64, ecdsaPubB64] = await Promise.all([
        exportarClavePublicaBase64(parECDH.publicKey),
        exportarClavePublicaBase64(parECDSA.publicKey),
      ])

      // Guarda SOLO las claves públicas en localStorage
      localStorage.setItem(LS_ECDH_PUB,  ecdhPubB64)
      localStorage.setItem(LS_ECDSA_PUB, ecdsaPubB64)

      // Envía claves públicas al servidor
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

      // Descarga el archivo con las claves privadas
      await descargarClavePrivada(parECDH.privateKey, parECDSA.privateKey, userId)

      setTienClaves(true)
      setMensaje('¡Claves generadas! Se descargó el archivo — guárdalo en un lugar seguro.')
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
          <p style={{ color: '#155724', fontWeight: 'bold', marginBottom: '8px' }}>
            ✅ Claves de seguridad generadas
          </p>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
            Tus claves públicas están registradas. Para firmar o descifrar contratos necesitarás
            el archivo <code>burroomies_claves_*.json</code> que se descargó al generarlas.
          </p>
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
            ⚠️ Si perdiste el archivo, deberás regenerar tus claves (los contratos anteriores no podrán descifrarse).
          </p>
          <button
            onClick={() => handleGenerar(true)}
            disabled={generando}
            style={{
              padding: '8px 16px', backgroundColor: '#6c757d', color: 'white',
              border: 'none', borderRadius: '5px',
              cursor: generando ? 'not-allowed' : 'pointer', fontSize: '13px',
            }}
          >
            {generando ? 'Regenerando...' : '🔄 Regenerar claves (nuevo archivo)'}
          </button>
        </div>
      ) : (
        <div>
          <p style={{ color: '#856404', fontWeight: 'bold', marginBottom: '8px' }}>
            ⚠️ Aún no tienes claves de seguridad
          </p>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
            Genera tus claves para poder crear, firmar y descifrar contratos.
            Se descargará un archivo JSON que debes guardar en un lugar seguro.
          </p>
          <button
            onClick={() => handleGenerar(false)}
            disabled={generando}
            style={{
              padding: '10px 20px',
              backgroundColor: generando ? '#ccc' : '#1a237e',
              color: 'white', border: 'none', borderRadius: '5px',
              cursor: generando ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: 'bold',
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
