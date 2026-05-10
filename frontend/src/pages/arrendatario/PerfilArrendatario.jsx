import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'
import api from '../../services/api'
import { generarParClaves } from '../../services/cryptoService'
import { registrarClavePublica } from '../../services/contratoService'

const PerfilArrendatario = () => {
  const navigate = useNavigate()
  
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')
  
  // Campos editables
  const [nombres, setNombres] = useState('')
  const [apellidoPaterno, setApellidoPaterno] = useState('')
  const [apellidoMaterno, setApellidoMaterno] = useState('')
  const [telefono, setTelefono] = useState('')
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [usernameDisponible, setUsernameDisponible] = useState(true)

  useEffect(() => {
    cargarPerfil()
  }, [])

  const cargarPerfil = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem('userId')
      const arrendatarioId = localStorage.getItem('arrendatarioId')
      
      if (!userId || !arrendatarioId) {
        setError('No has iniciado sesión')
        setLoading(false)
        return
      }

      const response = await fetch(`http://localhost:5000/api/usuarios/perfil-arrendatario`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-arrendatario-id': arrendatarioId
        }
      })

      if (!response.ok) throw new Error('Error al cargar perfil')

      const data = await response.json()
      setPerfil(data)
      
      // Llenar campos editables
      setNombres(data.usuario?.usuarioNom || '')
      setApellidoPaterno(data.usuario?.usuarioApePat || '')
      setApellidoMaterno(data.usuario?.usuarioApeMat || '')
      setTelefono(data.usuario?.usuarioTel || '')
      setUsername(data.arrendatarioUser || '')
      
    } catch (error) {
      setError('No se pudo cargar tu perfil')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const verificarUsername = async (usernameNuevo) => {
    if (usernameNuevo === perfil?.arrendatarioUser) {
      setUsernameDisponible(true)
      setUsernameError('')
      return
    }
    
    try {
      const response = await api.post('/auth/validar-campo', {
        campo: 'username',
        valor: usernameNuevo
      })
      
      if (response.data.existe) {
        setUsernameDisponible(false)
        setUsernameError('Este username ya está en uso')
      } else {
        setUsernameDisponible(true)
        setUsernameError('')
      }
    } catch (error) {
      console.error('Error al verificar username:', error)
    }
  }

  const handleUsernameChange = (e) => {
    const valor = e.target.value.replace(/\s/g, '').toLowerCase()
    setUsername(valor)
    if (valor.length >= 3) {
      verificarUsername(valor)
    } else {
      setUsernameError('Mínimo 3 caracteres')
      setUsernameDisponible(false)
    }
  }

  const handleGuardar = async () => {
    if (!usernameDisponible) {
      alert('Corrige los errores antes de guardar')
      return
    }

    try {
      setGuardando(true)
      const userId = localStorage.getItem('userId')
      const arrendatarioId = localStorage.getItem('arrendatarioId')

      const response = await fetch(`http://localhost:5000/api/usuarios/actualizar-perfil-arrendatario`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-arrendatario-id': arrendatarioId
        },
        body: JSON.stringify({
          usuarioNom: nombres,
          usuarioApePat: apellidoPaterno,
          usuarioApeMat: apellidoMaterno,
          usuarioTel: telefono,
          arrendatarioUser: username
        })
      })

      if (!response.ok) throw new Error('Error al guardar')

      const data = await response.json()
      setPerfil(data.perfil)
      setEditando(false)
      setMensajeExito('Perfil actualizado exitosamente')
      
      setTimeout(() => setMensajeExito(''), 3000)
    } catch (error) {
      alert('Error al guardar los cambios')
      console.error('Error:', error)
    } finally {
      setGuardando(false)
    }
  }

  const handleCancelar = () => {
    // Restaurar valores originales
    setNombres(perfil?.usuario?.usuarioNom || '')
    setApellidoPaterno(perfil?.usuario?.usuarioApePat || '')
    setApellidoMaterno(perfil?.usuario?.usuarioApeMat || '')
    setTelefono(perfil?.usuario?.usuarioTel || '')
    setUsername(perfil?.arrendatarioUser || '')
    setUsernameError('')
    setUsernameDisponible(true)
    setEditando(false)
  }

  const handleEliminarCuenta = async () => {
    try {
      const userId = localStorage.getItem('userId')
      const arrendatarioId = localStorage.getItem('arrendatarioId')

      if (!userId || !arrendatarioId) {
        alert('No has iniciado sesión')
        return
      }

      const response = await fetch(`http://localhost:5000/api/usuarios/eliminar-cuenta-arrendatario`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-arrendatario-id': arrendatarioId
        }
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || 'Cuenta eliminada exitosamente')
        localStorage.clear()
        navigate('/')
      } else {
        alert(data.error || 'Error al eliminar la cuenta')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la cuenta')
    }
  }

  // 🔐 Regenerar claves criptográficas
  const handleRegenerarClaves = async () => {
    try {
      const { publicKeyPem } = await generarParClaves()
      await registrarClavePublica(publicKeyPem)
      alert('✅ Claves criptográficas regeneradas correctamente')
      setMensajeExito('Claves regeneradas correctamente')
      setTimeout(() => setMensajeExito(''), 3000)
    } catch (err) {
      alert('❌ Error al regenerar claves: ' + err.message)
    }
  }

  const usuario = perfil?.usuario || {}
  const carrera = perfil?.carrera || {}

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavbarArrendatario />
        <div style={{ flex: 1, textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#666' }}>Cargando perfil...</p>
        </div>
        <FooterInicio />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarArrendatario />

      <div style={{ flex: 1, maxWidth: '700px', margin: '0 auto', padding: '20px', width: '100%' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>👤 Mi Perfil</h1>

        {/* Mensaje de éxito */}
        {mensajeExito && (
          <div style={{
            padding: '15px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '5px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            ✅ {mensajeExito}
          </div>
        )}

        {error ? (
          <div style={{
            padding: '20px',
            backgroundColor: '#ffe6e6',
            color: '#dc3545',
            borderRadius: '5px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        ) : perfil ? (
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '30px'
          }}>
            {/* Avatar */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#1a237e',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold'
              }}>
                {usuario.usuarioNom?.charAt(0) || '?'}
              </div>
              <h2 style={{ marginTop: '15px', color: '#333' }}>
                {usuario.usuarioNom} {usuario.usuarioApePat} {usuario.usuarioApeMat || ''}
              </h2>
              <p style={{ color: '#666', margin: '5px 0' }}>{perfil.arrendatarioUser}</p>
            </div>

            {/* Datos */}
            {!editando ? (
              <>
                <div style={infoSectionStyle}>
                  <h3 style={sectionTitleStyle}>📋 Información Personal</h3>
                  
                  <InfoRow label="Nombre" value={usuario.usuarioNom} />
                  <InfoRow label="Apellido Paterno" value={usuario.usuarioApePat} />
                  <InfoRow label="Apellido Materno" value={usuario.usuarioApeMat || '—'} />
                  <InfoRow label="Correo" value={usuario.usuarioCorreo} bloqueado />
                  <InfoRow label="Teléfono" value={usuario.usuarioTel || '—'} />
                  <InfoRow label="CURP" value={usuario.usuarioCurp} bloqueado />
                  <InfoRow label="Fecha de Nacimiento" value={usuario.usuarioFechaNac ? new Date(usuario.usuarioFechaNac).toLocaleDateString('es-MX') : '—'} bloqueado />
                </div>

                <div style={infoSectionStyle}>
                  <h3 style={sectionTitleStyle}>🎓 Información Académica</h3>
                  
                  <InfoRow label="Boleta" value={perfil.arrendatarioBoleta} bloqueado />
                  <InfoRow label="Username" value={`${perfil.arrendatarioUser}`} />
                  <InfoRow label="Carrera" value={carrera.carreraNombre || '—'} />
                  <InfoRow label="Verificado" value={perfil.arrendatarioVerificado ? '✅ Sí' : '❌ No'} />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button 
                    onClick={() => setEditando(true)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#1a237e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: 'bold'
                    }}
                  >
                    ✏️ Editar Perfil
                  </button>
                  <button
                    onClick={handleRegenerarClaves}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#ff9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: 'bold'
                    }}
                  >
                    🔐 Regenerar claves
                  </button>
                </div>

                {/* ✅ BOTÓN ELIMINAR CUENTA */}
                <div style={{ marginTop: '15px', borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
                  <button 
                    onClick={() => {
                      if (window.confirm('⚠️ ¿Estás seguro de eliminar tu cuenta?\n\nEsta acción no se puede deshacer. Tus datos personales serán eliminados, pero tus reseñas se conservarán de forma anónima.')) {
                        handleEliminarCuenta()
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    🗑️ Eliminar Cuenta
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={infoSectionStyle}>
                  <h3 style={sectionTitleStyle}>✏️ Editar Información</h3>
                  
                  <InputField label="Nombre" value={nombres} onChange={(e) => setNombres(e.target.value)} />
                  <InputField label="Apellido Paterno" value={apellidoPaterno} onChange={(e) => setApellidoPaterno(e.target.value)} />
                  <InputField label="Apellido Materno" value={apellidoMaterno} onChange={(e) => setApellidoMaterno(e.target.value)} />
                  <InputField label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} type="tel" />
                  
                  {/* Username con validación */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={handleUsernameChange}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '5px',
                        border: usernameError ? '2px solid #dc3545' : usernameDisponible ? '2px solid #28a745' : '1px solid #ddd',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                    {usernameError && <small style={{ color: '#dc3545' }}>{usernameError}</small>}
                    {!usernameError && username !== perfil?.arrendatarioUser && usernameDisponible && (
                      <small style={{ color: '#28a745' }}>✓ Disponible</small>
                    )}
                  </div>

                  {/* Campos bloqueados */}
                  <div style={{ marginTop: '20px' }}>
                    <p style={{ fontWeight: 'bold', color: '#666', fontSize: '13px', marginBottom: '10px' }}>
                       Información no editable:
                    </p>
                    <InfoRow label="Correo" value={usuario.usuarioCorreo} bloqueado />
                    <InfoRow label="CURP" value={usuario.usuarioCurp} bloqueado />
                    <InfoRow label="Boleta" value={perfil.arrendatarioBoleta} bloqueado />
                    <InfoRow label="Fecha de Nacimiento" value={usuario.usuarioFechaNac ? new Date(usuario.usuarioFechaNac).toLocaleDateString('es-MX') : '—'} bloqueado />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button 
                    onClick={handleCancelar}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#f0f0f0',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleGuardar}
                    disabled={guardando || !usernameDisponible}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: guardando || !usernameDisponible ? '#ccc' : '#1a237e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: guardando || !usernameDisponible ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    {guardando ? 'Guardando...' : '💾 Guardar Cambios'}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>

      <FooterInicio />
    </div>
  )
}

// Componentes auxiliares
const InfoRow = ({ label, value, bloqueado }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '14px'
  }}>
    <span style={{ color: '#666' }}>{label}</span>
    <span style={{ 
      color: bloqueado ? '#999' : '#333',
      fontWeight: '500'
    }}>
      {bloqueado ? ' ' : ''}{value}
    </span>
  </div>
)

const InputField = ({ label, value, onChange, type = 'text' }) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      style={{
        width: '100%',
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #ddd',
        fontSize: '14px',
        boxSizing: 'border-box'
      }}
    />
  </div>
)

const infoSectionStyle = {
  marginBottom: '25px',
  paddingBottom: '15px',
  borderBottom: '1px solid #e0e0e0'
}

const sectionTitleStyle = {
  fontSize: '16px',
  color: '#333',
  marginBottom: '15px'
}

export default PerfilArrendatario