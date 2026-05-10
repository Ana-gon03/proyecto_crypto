import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import NavbarArrendador from '../../components/common/NavbarArrendador'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'
import AESEncryptor from '../../components/common/AESEncryptor'
import ECDSASigner from '../../components/common/ECDSASigner'
import {
  cargarClavePrivadaDesdeArchivo,
  importarClavePublicaECDH,
  derivarSecretoCompartido,
  derivarClaveAESDeSecreto,
  descifrarAESGCM,
  verificarECDSA,
  calcularSHA256,
} from '../../utils/cryptoUtils'

// ─────────────────────────────────────────────────────────────────────────────
// UIContratos — flujo completo de contrato cifrado con ECDH/ECDSA
// Ruta: /contratos/:idArrendamiento
// Detecta el rol desde localStorage y muestra la vista correspondiente.
// ─────────────────────────────────────────────────────────────────────────────

const ESTADO_LABEL = {
  pendiente: { texto: 'Pendiente de firma',  color: '#856404', bg: '#fff3cd' },
  firmado:   { texto: 'Firmado (esperando arrendatario)', color: '#0c5460', bg: '#d1ecf1' },
  aceptado:  { texto: 'Aceptado por ambas partes', color: '#155724', bg: '#d4edda' },
  rechazado: { texto: 'Rechazado',            color: '#721c24', bg: '#f8d7da' },
}

const UIContratos = () => {
  const { idArrendamiento } = useParams()
  const navigate = useNavigate()

  const rol          = localStorage.getItem('rol')       // 'arrendador' | 'arrendatario'
  const userId       = localStorage.getItem('userId')
  const arrendadorId = localStorage.getItem('arrendadorId')
  const arrendatarioId = localStorage.getItem('arrendatarioId')

  // ── Estado general ────────────────────────────────────────────────────────
  const [cargando,  setCargando]  = useState(true)
  const [contrato,  setContrato]  = useState(null)   // datos del backend
  const [arrendamiento, setArrendamiento] = useState(null)
  const [error,     setError]     = useState('')
  const [mensaje,   setMensaje]   = useState('')

  // ── Estado arrendador (subir PDF) ─────────────────────────────────────────
  const [pdfFile,      setPdfFile]      = useState(null)
  const [pdfBuffer,    setPdfBuffer]    = useState(null)
  const [hashHex,      setHashHex]      = useState('')
  const [cifradoB64,   setCifradoB64]   = useState('')
  const [firmaArrendador, setFirmaArrendador] = useState('')
  const [enviando,     setEnviando]     = useState(false)
  const inputRef = useRef()

  // ── Estado arrendatario (ver + aceptar) ───────────────────────────────────
  const [pdfDescifrado,  setPdfDescifrado]  = useState(null)  // Blob URL
  const [firmaValida,    setFirmaValida]    = useState(null)  // null | true | false
  const [firmaArrendatario, setFirmaArrendatario] = useState('')
  const [aceptando,      setAceptando]      = useState(false)

  // Claves públicas de ambas partes (se cargan aparte del arrendamiento)
  const [clavesArrendatario, setClavesArrendatario] = useState(null)
  const [clavesArrendador,   setClavesArrendador]   = useState(null)

  // Claves privadas del usuario actual (cargadas desde localStorage o archivo)
  const [clavesPrivadas, setClavesPrivadas] = useState(null)
  const [cargandoClaves, setCargandoClaves] = useState(false)
  const inputClaveRef = useRef()

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    cargarDatos()
  }, [idArrendamiento])

  const handleCargarArchivoClaves = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      setCargandoClaves(true)
      setError('')
      const resultado = await cargarClavePrivadaDesdeArchivo(file)
      setClavesPrivadas({ ecdhPrivKey: resultado.ecdhPrivKey, ecdsaPrivKey: resultado.ecdsaPrivKey })
      setMensaje('Claves cargadas correctamente desde archivo')
    } catch (err) {
      setError('Error al cargar el archivo de claves: ' + err.message)
    } finally {
      setCargandoClaves(false)
      e.target.value = ''
    }
  }

  const obtenerClavesPublicas = async (idUsuario) => {
    try {
      const resp = await fetch(`http://localhost:5000/api/usuarios/${idUsuario}/claves-publicas`)
      if (resp.ok) return await resp.json()
    } catch { /* silencioso */ }
    return null
  }

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError('')

      // 1. Carga el arrendamiento para obtener los IDs de arrendador y arrendatario
      const respArr = await fetch(`http://localhost:5000/api/arrendamientos/${idArrendamiento}`, {
        headers: { 'x-user-id': userId },
      })
      if (!respArr.ok) throw new Error('Arrendamiento no encontrado')
      const arrData = await respArr.json()
      setArrendamiento(arrData)

      // 2. Obtiene claves públicas del arrendatario directamente desde /usuarios/:id/claves-publicas
      const idUsuarioArrendatario = arrData.arrendatario?.usuario?.idUsuario
      if (idUsuarioArrendatario) {
        const claves = await obtenerClavesPublicas(idUsuarioArrendatario)
        setClavesArrendatario(claves)
      }

      // 3. Obtiene claves públicas del arrendador (necesarias para que el arrendatario descifre)
      // El arrendador está en propiedad → arrendador → usuario_idUsuario
      // Lo pedimos a través del contrato completo si existe, o buscamos por arrendadorId del localStorage
      const idUsuarioArrendador = localStorage.getItem('rol') === 'arrendatario'
        ? null // se obtiene del contrato más abajo
        : parseInt(userId)

      if (idUsuarioArrendador) {
        const clavesArr = await obtenerClavesPublicas(idUsuarioArrendador)
        setClavesArrendador(clavesArr)
      }

      // 4. Intenta cargar el contrato existente (puede no existir aún)
      const respCon = await fetch(
        `http://localhost:5000/api/contratos/arrendamiento/${idArrendamiento}`,
        { headers: { 'x-user-id': userId } }
      )
      if (respCon.status === 404) {
        setContrato(null)
      } else if (respCon.ok) {
        const conData = await respCon.json()
        // Carga el contrato completo (incluye ecdhPublicKey del arrendador vía ContratosCtrl)
        const respFull = await fetch(
          `http://localhost:5000/api/contratos/${conData.idContrato}`,
          { headers: { 'x-user-id': userId } }
        )
        if (respFull.ok) {
          const contratoCompleto = await respFull.json()
          setContrato(contratoCompleto)
          // Si el arrendatario está viendo, obtiene claves del arrendador desde el contrato completo
          if (contratoCompleto.arrendador?.ecdhPublicKey) {
            setClavesArrendador({
              ecdhPublicKey:  contratoCompleto.arrendador.ecdhPublicKey,
              ecdsaPublicKey: contratoCompleto.arrendador.ecdsaPublicKey,
            })
          }
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  // ── Manejo del PDF seleccionado ───────────────────────────────────────────
  const handleSeleccionarPDF = async (e) => {
    const file = e.target.files[0]
    if (!file || file.type !== 'application/pdf') {
      setError('Selecciona un archivo PDF válido')
      return
    }
    setPdfFile(file)
    setHashHex('')
    setCifradoB64('')
    setFirmaArrendador('')
    setError('')

    const buffer = await file.arrayBuffer()
    setPdfBuffer(buffer)
    const hash = await calcularSHA256(buffer)
    setHashHex(hash)
  }

  // Callback de AESEncryptor: recibe { cifradoB64, hashHex }
  const handleCifrado = ({ cifradoB64: cifB64, hashHex: hHash }) => {
    setCifradoB64(cifB64)
    setHashHex(hHash)
  }

  // ── Enviar contrato al backend (arrendador) ───────────────────────────────
  const handleEnviarContrato = async () => {
    if (!cifradoB64 || !hashHex || !firmaArrendador) {
      setError('Debes cifrar el PDF y firmarlo antes de enviarlo')
      return
    }
    try {
      setEnviando(true)
      setError('')
      const resp = await fetch('http://localhost:5000/api/contratos/crear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id':      userId,
          'x-arrendador-id': arrendadorId,
          'x-ecdh-public-key': localStorage.getItem('burroomies_ecdh_pub') || '',
        },
        body: JSON.stringify({
          arrendamiento_idArrendamiento: parseInt(idArrendamiento),
          contratoCifradoB64:   cifradoB64,
          contratoHashDocumento: hashHex,
          contratoFirmaArrendador: firmaArrendador,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Error al crear contrato')
      setMensaje('Contrato enviado exitosamente')
      await cargarDatos()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  // ── Descifrar y verificar contrato (arrendatario) ────────────────────────
  const handleDescifrar = async () => {
    const ecdhPubArrendador = clavesArrendador?.ecdhPublicKey || contrato?.arrendador?.ecdhPublicKey
    if (!contrato?.contratoCifradoB64 || !ecdhPubArrendador) {
      setError('No se puede descifrar: falta la clave pública ECDH del arrendador')
      return
    }
    if (!clavesPrivadas?.ecdhPrivKey) {
      setError('Carga tu archivo de claves privadas antes de descifrar.')
      return
    }
    try {
      setError('')
      // Deriva shared_secret: ECDH(arrendatario_priv, arrendador_pub)
      const miPriv       = clavesPrivadas.ecdhPrivKey
      const suPub        = await importarClavePublicaECDH(ecdhPubArrendador)
      const sharedBits   = await derivarSecretoCompartido(miPriv, suPub)
      const aesKey       = await derivarClaveAESDeSecreto(sharedBits)

      // Decodifica base64 → Uint8Array y descifra
      const cifradoBytes = Uint8Array.from(
        atob(contrato.contratoCifradoB64), c => c.charCodeAt(0)
      )
      const pdfOriginal  = await descifrarAESGCM(aesKey, cifradoBytes)

      // Crea URL de objeto para el visor PDF
      const blob    = new Blob([pdfOriginal], { type: 'application/pdf' })
      const blobURL = URL.createObjectURL(blob)
      setPdfDescifrado(blobURL)

      // Verifica la firma ECDSA del arrendador
      const ecdsaPubArrendador = clavesArrendador?.ecdsaPublicKey || contrato?.arrendador?.ecdsaPublicKey
      if (contrato.contratoFirmaArrendador && ecdsaPubArrendador) {
        const valida = await verificarECDSA(
          ecdsaPubArrendador,
          contrato.contratoFirmaArrendador,
          contrato.contratoHashDocumento
        )
        setFirmaValida(valida)
      }
    } catch (err) {
      setError('Error al descifrar el contrato: ' + err.message)
    }
  }

  // Callback de ECDSASigner: firma y envía al backend en un solo paso
  const handleFirmaYAceptar = async (firma) => {
    setFirmaArrendatario(firma)
    try {
      setAceptando(true)
      setError('')
      const resp = await fetch('http://localhost:5000/api/contratos/verificar-y-aceptar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id':         userId,
          'x-arrendatario-id': arrendatarioId,
        },
        body: JSON.stringify({
          idContrato:                contrato.idContrato,
          contratoFirmaArrendatario: firma,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Error al aceptar contrato')
      setMensaje('Contrato aceptado y firmado exitosamente')
      await cargarDatos()
    } catch (err) {
      setError(err.message)
    } finally {
      setAceptando(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const Navbar = rol === 'arrendador' ? NavbarArrendador : NavbarArrendatario
  const linkPerfil = rol === 'arrendador' ? '/arrendador/perfil' : '/arrendatario/perfil'

  if (cargando) return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1, textAlign: 'center', padding: '60px' }}>
        <p style={{ color: '#666' }}>Cargando información del contrato...</p>
      </div>
      <FooterInicio />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ flex: 1, maxWidth: '800px', margin: '0 auto', padding: '20px', width: '100%' }}>
        <h1 style={{ fontSize: '22px', marginBottom: '6px' }}>📄 Contrato de Arrendamiento</h1>
        <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
          Arrendamiento #{idArrendamiento}
          {arrendamiento && ` · ${arrendamiento.propiedad?.propiedadTitulo || ''}`}
        </p>

        {/* Mensajes de estado */}
        {mensaje && (
          <div style={{ padding: '12px', backgroundColor: '#d4edda', color: '#155724',
            borderRadius: '5px', marginBottom: '16px', fontWeight: 'bold' }}>
            ✅ {mensaje}
          </div>
        )}
        {error && (
          <div style={{ padding: '12px', backgroundColor: '#f8d7da', color: '#721c24',
            borderRadius: '5px', marginBottom: '16px' }}>
            ❌ {error}
          </div>
        )}

        {/* Panel de claves privadas */}
        {!clavesPrivadas ? (
          <div style={{
            border: '2px solid #ffc107', borderRadius: '8px', padding: '18px',
            backgroundColor: '#fffbf0', marginBottom: '20px',
          }}>
            <p style={{ fontWeight: 'bold', color: '#856404', marginBottom: '8px' }}>
              🔑 Carga tu archivo de claves privadas para continuar
            </p>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
              Selecciona el archivo <code>burroomies_claves_*.json</code> que descargaste
              cuando generaste tus claves. Sin él no podrás cifrar, firmar ni descifrar contratos.
            </p>
            <input
              ref={inputClaveRef}
              type="file"
              accept=".json"
              onChange={handleCargarArchivoClaves}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => inputClaveRef.current.click()}
                disabled={cargandoClaves}
                style={{
                  padding: '9px 18px', backgroundColor: '#1a237e', color: 'white',
                  border: 'none', borderRadius: '5px', cursor: cargandoClaves ? 'not-allowed' : 'pointer',
                  fontSize: '14px', fontWeight: 'bold',
                }}
              >
                {cargandoClaves ? 'Cargando...' : '📂 Seleccionar archivo de claves'}
              </button>
              <Link
                to={linkPerfil}
                style={{ fontSize: '13px', color: '#1a237e' }}
              >
                ¿No tienes el archivo? Genera tus claves desde tu perfil
              </Link>
            </div>
          </div>
        ) : (
          <div style={{
            border: '1px solid #28a745', borderRadius: '8px', padding: '10px 16px',
            backgroundColor: '#f0fff4', marginBottom: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ color: '#155724', fontSize: '13px', fontWeight: 'bold' }}>
              ✅ Claves privadas cargadas — puedes cifrar, firmar y descifrar
            </span>
            <button
              onClick={() => { setClavesPrivadas(null); setMensaje('') }}
              style={{
                background: 'none', border: 'none', color: '#6c757d',
                cursor: 'pointer', fontSize: '12px',
              }}
            >
              Cambiar archivo
            </button>
          </div>
        )}

        {/* Badge de estado */}
        {contrato && (
          <div style={{
            display: 'inline-block', padding: '6px 14px', borderRadius: '20px',
            backgroundColor: ESTADO_LABEL[contrato.contratoEstado]?.bg || '#eee',
            color: ESTADO_LABEL[contrato.contratoEstado]?.color || '#333',
            fontWeight: 'bold', fontSize: '13px', marginBottom: '20px',
          }}>
            {ESTADO_LABEL[contrato.contratoEstado]?.texto || contrato.contratoEstado}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            VISTA ARRENDADOR
        ═══════════════════════════════════════════════════════════ */}
        {rol === 'arrendador' && (
          <div>
            {!contrato ? (
              // ── Sin contrato: subir PDF ──────────────────────────────────
              <div style={cardStyle}>
                <h2 style={seccionTitleStyle}>📤 Subir contrato cifrado</h2>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                  El PDF se cifrará con AES-GCM 256 usando la clave pública ECDH del
                  arrendatario. Solo él podrá descifrarlo. El servidor nunca ve el texto
                  plano del contrato.
                </p>

                {/* Paso 1: Seleccionar PDF */}
                <div style={pasoStyle}>
                  <span style={pasoBadgeStyle}>1</span>
                  <div>
                    <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                      Selecciona el PDF del contrato
                    </p>
                    <input
                      ref={inputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleSeleccionarPDF}
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={() => inputRef.current.click()}
                      style={btnSecundario}
                    >
                      📎 Seleccionar PDF
                    </button>
                    {pdfFile && (
                      <p style={{ marginTop: '8px', color: '#155724', fontSize: '13px' }}>
                        ✅ {pdfFile.name} — Hash SHA-256: <code style={{ fontSize: '11px' }}>{hashHex.slice(0, 16)}…</code>
                      </p>
                    )}
                  </div>
                </div>

                {/* Paso 2: Cifrar */}
                <div style={pasoStyle}>
                  <span style={pasoBadgeStyle}>2</span>
                  <div>
                    <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                      Cifrar con la clave pública ECDH del arrendatario
                    </p>
                    {clavesArrendatario?.ecdhPublicKey ? (
                      <AESEncryptor
                        pdfBuffer={pdfBuffer}
                        ecdhPublicKeyB64={clavesArrendatario.ecdhPublicKey}
                        ecdhPrivKey={clavesPrivadas?.ecdhPrivKey || null}
                        onCifrado={handleCifrado}
                        disabled={!pdfBuffer || !clavesPrivadas}
                      />
                    ) : (
                      <p style={{ color: '#856404', fontSize: '13px' }}>
                        ⚠️ El arrendatario aún no tiene claves ECDH generadas.
                        Pídele que vaya a su perfil y las genere.
                      </p>
                    )}
                  </div>
                </div>

                {/* Paso 3: Firmar */}
                <div style={pasoStyle}>
                  <span style={pasoBadgeStyle}>3</span>
                  <div>
                    <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                      Firmar el hash SHA-256 con tu clave ECDSA
                    </p>
                    <ECDSASigner
                      hashHex={hashHex}
                      onFirma={setFirmaArrendador}
                      privKey={clavesPrivadas?.ecdsaPrivKey || null}
                      labelBoton="Firmar contrato"
                      disabled={!cifradoB64}
                    />
                  </div>
                </div>

                {/* Paso 4: Enviar */}
                <div style={{ marginTop: '20px' }}>
                  <button
                    onClick={handleEnviarContrato}
                    disabled={enviando || !cifradoB64 || !firmaArrendador}
                    style={{
                      ...btnPrincipal,
                      backgroundColor: enviando || !cifradoB64 || !firmaArrendador ? '#ccc' : '#1a237e',
                      cursor: enviando || !cifradoB64 || !firmaArrendador ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {enviando ? 'Enviando...' : '📨 Enviar contrato al arrendatario'}
                  </button>
                </div>
              </div>
            ) : (
              // ── Con contrato: mostrar estado ─────────────────────────────
              <div style={cardStyle}>
                <h2 style={seccionTitleStyle}>📋 Estado del contrato</h2>
                <InfoRow label="ID Contrato"   value={`#${contrato.idContrato}`} />
                <InfoRow label="Hash SHA-256"  value={contrato.contratoHashDocumento?.slice(0, 32) + '…'} />
                <InfoRow label="Fecha"         value={contrato.contratoFechaCreacion
                  ? new Date(contrato.contratoFechaCreacion).toLocaleString('es-MX') : '—'} />
                <InfoRow label="Firma tuya"    value={contrato.contratoFirmaArrendador ? '✅ Presente' : '❌ Faltante'} />
                <InfoRow label="Firma arrendatario" value={contrato.contratoFirmaArrendatario ? '✅ Presente' : '⏳ Pendiente'} />
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            VISTA ARRENDATARIO
        ═══════════════════════════════════════════════════════════ */}
        {rol === 'arrendatario' && (
          <div>
            {!contrato ? (
              <div style={{ ...cardStyle, textAlign: 'center', color: '#666', padding: '40px' }}>
                <p style={{ fontSize: '40px' }}>📭</p>
                <p>El arrendador aún no ha subido el contrato.</p>
              </div>
            ) : (
              <div style={cardStyle}>
                <h2 style={seccionTitleStyle}>📄 Revisar y firmar contrato</h2>

                <InfoRow label="ID Contrato"  value={`#${contrato.idContrato}`} />
                <InfoRow label="Hash SHA-256" value={contrato.contratoHashDocumento?.slice(0, 32) + '…'} />
                <InfoRow label="Fecha"        value={contrato.contratoFechaCreacion
                  ? new Date(contrato.contratoFechaCreacion).toLocaleString('es-MX') : '—'} />

                {/* Descifrar */}
                {!pdfDescifrado && contrato.contratoEstado !== 'pendiente' && (
                  <div style={{ marginTop: '20px' }}>
                    <button onClick={handleDescifrar} style={btnPrincipal}>
                      🔓 Descifrar y ver contrato
                    </button>
                  </div>
                )}

                {/* Visor PDF */}
                {pdfDescifrado && (
                  <div style={{ marginTop: '20px' }}>
                    {firmaValida !== null && (
                      <div style={{
                        padding: '10px', borderRadius: '5px', marginBottom: '12px',
                        backgroundColor: firmaValida ? '#d4edda' : '#f8d7da',
                        color: firmaValida ? '#155724' : '#721c24',
                        fontWeight: 'bold', fontSize: '13px',
                      }}>
                        {firmaValida
                          ? '✅ Firma del arrendador verificada correctamente'
                          : '❌ La firma del arrendador NO es válida — no aceptes este contrato'}
                      </div>
                    )}
                    <iframe
                      src={pdfDescifrado}
                      title="Contrato"
                      style={{ width: '100%', height: '500px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                )}

                {/* Firmar y aceptar — un solo clic: firma + envío al backend */}
                {contrato.contratoEstado === 'firmado' && pdfDescifrado && firmaValida && !firmaArrendatario && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '20px' }}>
                    <p style={{ fontSize: '14px', color: '#333', marginBottom: '12px' }}>
                      Si estás de acuerdo con el contrato, fírmalo digitalmente para aceptarlo:
                    </p>
                    {aceptando ? (
                      <p style={{ color: '#666', fontSize: '14px' }}>Enviando firma al servidor...</p>
                    ) : (
                      <ECDSASigner
                        hashHex={contrato.contratoHashDocumento}
                        onFirma={handleFirmaYAceptar}
                        privKey={clavesPrivadas?.ecdsaPrivKey || null}
                        labelBoton="Firmar y aceptar contrato"
                      />
                    )}
                  </div>
                )}

                {contrato.contratoEstado === 'aceptado' && (
                  <div style={{
                    marginTop: '20px', padding: '16px', backgroundColor: '#d4edda',
                    borderRadius: '8px', textAlign: 'center',
                  }}>
                    <p style={{ color: '#155724', fontWeight: 'bold', fontSize: '15px' }}>
                      ✅ Contrato aceptado y firmado digitalmente por ambas partes
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <FooterInicio />
    </div>
  )
}

// ── Componentes y estilos auxiliares ─────────────────────────────────────────

const InfoRow = ({ label, value }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between',
    padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px',
  }}>
    <span style={{ color: '#666' }}>{label}</span>
    <span style={{ color: '#333', fontWeight: '500', fontFamily: 'monospace', fontSize: '13px' }}>{value}</span>
  </div>
)

const cardStyle = {
  backgroundColor: 'white',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '20px',
}

const seccionTitleStyle = {
  fontSize: '16px', color: '#333', marginBottom: '16px', fontWeight: 'bold',
}

const pasoStyle = {
  display: 'flex', gap: '14px', alignItems: 'flex-start',
  padding: '14px 0', borderBottom: '1px solid #f5f5f5',
}

const pasoBadgeStyle = {
  flexShrink: 0,
  width: '28px', height: '28px',
  backgroundColor: '#1a237e', color: 'white',
  borderRadius: '50%', display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center',
  fontSize: '13px', fontWeight: 'bold',
}

const btnPrincipal = {
  padding: '11px 22px', backgroundColor: '#1a237e',
  color: 'white', border: 'none', borderRadius: '5px',
  cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
}

const btnSecundario = {
  padding: '9px 18px', backgroundColor: '#f0f0f0',
  color: '#333', border: '1px solid #ddd', borderRadius: '5px',
  cursor: 'pointer', fontSize: '14px',
}

export default UIContratos
