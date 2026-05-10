import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarArrendador from '../../components/common/NavbarArrendador'
import FooterInicio from '../../components/common/FooterInicio'
import { getPerfilArrendador, actualizarPerfilArrendador } from '../../services/authService'
import ECDHKeyManager from '../../components/common/ECDHKeyManager'

const PerfilArrendador = () => {
  const navigate = useNavigate()
  const [cargando, setCargando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [perfil, setPerfil] = useState({
    usuario: {
      usuarioNom: '',
      usuarioApePat: '',
      usuarioApeMat: '',
      usuarioCorreo: '',
      usuarioTel: '',
      usuarioCurp: '',
      usuarioFechaNac: ''
    },
    arrendadorRFC: '',
    direccion: {
      direccionCalle: '',
      direccionNumExt: '',
      direccionNumInt: '',
      cp: {
        d_codigo: '',
        d_asenta: '',
        D_mnpio: '',
        d_estado: ''
      }
    }
  })

  // Campos editables
  const [nombres, setNombres] = useState('')
  const [apellidoPaterno, setApellidoPaterno] = useState('')
  const [apellidoMaterno, setApellidoMaterno] = useState('')
  const [telefono, setTelefono] = useState('')
  const [calle, setCalle] = useState('')
  const [numExt, setNumExt] = useState('')
  const [numInt, setNumInt] = useState('')
  const [cp, setCP] = useState('')
  const [colonia, setColonia] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [estado, setEstado] = useState('')

  useEffect(() => {
    cargarPerfil()
  }, [])

  const cargarPerfil = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem('userId')
      if (!userId) {
        navigate('/usuarios/inicio-sesion')
        return
      }
      const data = await getPerfilArrendador(userId)
      setPerfil(data)
      
      // Llenar campos
      setNombres(data.usuario?.usuarioNom || '')
      setApellidoPaterno(data.usuario?.usuarioApePat || '')
      setApellidoMaterno(data.usuario?.usuarioApeMat || '')
      setTelefono(data.usuario?.usuarioTel || '')
      setCalle(data.direccion?.direccionCalle || '')
      setNumExt(data.direccion?.direccionNumExt || '')
      setNumInt(data.direccion?.direccionNumInt || '')
      setCP(data.direccion?.cp?.d_codigo || '')
      setColonia(data.direccion?.cp?.d_asenta || '')
      setMunicipio(data.direccion?.cp?.D_mnpio || '')
      setEstado(data.direccion?.cp?.d_estado || '')
      
    } catch (err) {
      setError('Error al cargar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleCPChange = async (e) => {
    const valorCP = e.target.value.replace(/\D/g, '').slice(0, 5)
    setCP(valorCP)
    
    if (valorCP.length === 5) {
      try {
        const { buscarCP } = await import('../../services/propiedadService')
        const data = await buscarCP(valorCP)
        setColonia(data.colonia || '')
        setMunicipio(data.municipio || '')
        setEstado(data.estado || '')
      } catch (err) {
        setColonia('')
        setMunicipio('')
        setEstado('')
      }
    }
  }

  const handleGuardar = async () => {
    setGuardando(true)
    setError('')
    setMensajeExito('')

    try {
      const userId = localStorage.getItem('userId')
      const datos = {
        usuarioNom: nombres,
        usuarioApePat: apellidoPaterno,
        usuarioApeMat: apellidoMaterno,
        usuarioTel: telefono,
        direccionCalle: calle,
        direccionNumExt: numExt,
        direccionNumInt: numInt,
        cp: cp
      }

      await actualizarPerfilArrendador(userId, datos)
      
      // Recargar perfil
      const dataActualizada = await getPerfilArrendador(userId)
      setPerfil(dataActualizada)
      
      setMensajeExito('Perfil actualizado exitosamente')
      setEditando(false)
      setTimeout(() => setMensajeExito(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar perfil')
    } finally {
      setGuardando(false)
    }
  }

  const handleCancelar = () => {
    setNombres(perfil.usuario?.usuarioNom || '')
    setApellidoPaterno(perfil.usuario?.usuarioApePat || '')
    setApellidoMaterno(perfil.usuario?.usuarioApeMat || '')
    setTelefono(perfil.usuario?.usuarioTel || '')
    setCalle(perfil.direccion?.direccionCalle || '')
    setNumExt(perfil.direccion?.direccionNumExt || '')
    setNumInt(perfil.direccion?.direccionNumInt || '')
    setCP(perfil.direccion?.cp?.d_codigo || '')
    setColonia(perfil.direccion?.cp?.d_asenta || '')
    setMunicipio(perfil.direccion?.cp?.D_mnpio || '')
    setEstado(perfil.direccion?.cp?.d_estado || '')
    setEditando(false)
  }

  const handleEliminarCuenta = async () => {
    try {
      const userId = localStorage.getItem('userId')
      const arrendadorId = localStorage.getItem('arrendadorId')

      if (!userId || !arrendadorId) {
        alert('No has iniciado sesión')
        return
      }

      const response = await fetch(`http://localhost:5000/api/usuarios/eliminar-cuenta-arrendador`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-arrendador-id': arrendadorId
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

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavbarArrendador />
        <div style={{ flex: 1, textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#666' }}>Cargando perfil...</p>
        </div>
        <FooterInicio />
      </div>
    )
  }

  const usuario = perfil?.usuario || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarArrendador />

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

        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: '#ffe6e6',
            color: '#dc3545',
            borderRadius: '5px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

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
          </div>

          {!editando ? (
            <>
              {/* Datos Personales */}
              <div style={infoSectionStyle}>
                <h3 style={sectionTitleStyle}>📋 Datos Personales</h3>
                <InfoRow label="Nombre" value={usuario.usuarioNom} />
                <InfoRow label="Apellido Paterno" value={usuario.usuarioApePat} />
                <InfoRow label="Apellido Materno" value={usuario.usuarioApeMat || '—'} />
                <InfoRow label="Correo" value={usuario.usuarioCorreo} bloqueado />
                <InfoRow label="Teléfono" value={usuario.usuarioTel || '—'} />
                <InfoRow label="CURP" value={usuario.usuarioCurp} bloqueado />
                <InfoRow label="RFC" value={perfil.arrendadorRFC} bloqueado />
                <InfoRow label="Fecha de Nacimiento" value={usuario.usuarioFechaNac ? new Date(usuario.usuarioFechaNac).toLocaleDateString('es-MX') : '—'} bloqueado />
              </div>

              {/* Dirección */}
              <div style={infoSectionStyle}>
                <h3 style={sectionTitleStyle}>📍 Dirección</h3>
                <InfoRow label="Calle" value={perfil.direccion?.direccionCalle || '—'} />
                <InfoRow label="Número Exterior" value={perfil.direccion?.direccionNumExt || '—'} />
                <InfoRow label="Número Interior" value={perfil.direccion?.direccionNumInt || '—'} />
                <InfoRow label="Código Postal" value={perfil.direccion?.cp?.d_codigo || '—'} />
                <InfoRow label="Colonia" value={perfil.direccion?.cp?.d_asenta || '—'} />
                <InfoRow label="Municipio" value={perfil.direccion?.cp?.D_mnpio || '—'} />
                <InfoRow label="Estado" value={perfil.direccion?.cp?.d_estado || '—'} />
              </div>

              <button 
                onClick={() => setEditando(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#1a237e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  marginTop: '20px'
                }}
              >
                ✏️ Editar Perfil
              </button>

              {/* Módulo de claves criptográficas */}
              <div style={{ marginTop: '25px' }}>
                <ECDHKeyManager />
              </div>

              {/* Botón Eliminar Cuenta */}
              <div style={{ marginTop: '15px', borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
                <button 
                  onClick={() => {
                    if (window.confirm('⚠️ ¿Estás seguro de eliminar tu cuenta?\n\nEsta acción no se puede deshacer. Se eliminarán tus propiedades, arrendamientos y datos personales.')) {
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
              {/* Editar Datos Personales */}
              <div style={infoSectionStyle}>
                <h3 style={sectionTitleStyle}>✏️ Editar Datos Personales</h3>
                <InputField label="Nombre" value={nombres} onChange={(e) => setNombres(e.target.value)} />
                <InputField label="Apellido Paterno" value={apellidoPaterno} onChange={(e) => setApellidoPaterno(e.target.value)} />
                <InputField label="Apellido Materno" value={apellidoMaterno} onChange={(e) => setApellidoMaterno(e.target.value)} />
                <InputField label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} type="tel" />

                <div style={{ marginTop: '20px' }}>
                  <p style={{ fontWeight: 'bold', color: '#666', fontSize: '13px', marginBottom: '10px' }}>
                     Información no editable:
                  </p>
                  <InfoRow label="Correo" value={usuario.usuarioCorreo} bloqueado />
                  <InfoRow label="CURP" value={usuario.usuarioCurp} bloqueado />
                  <InfoRow label="RFC" value={perfil.arrendadorRFC} bloqueado />
                  <InfoRow label="Fecha de Nacimiento" value={usuario.usuarioFechaNac ? new Date(usuario.usuarioFechaNac).toLocaleDateString('es-MX') : '—'} bloqueado />
                </div>
              </div>

              {/* Editar Dirección */}
              <div style={infoSectionStyle}>
                <h3 style={sectionTitleStyle}>✏️ Editar Dirección</h3>
                <InputField label="Calle" value={calle} onChange={(e) => setCalle(e.target.value)} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <InputField label="Número Exterior" value={numExt} onChange={(e) => setNumExt(e.target.value)} />
                  <InputField label="Número Interior" value={numInt} onChange={(e) => setNumInt(e.target.value)} />
                </div>

                <InputField label="Código Postal" value={cp} onChange={handleCPChange} />
                
                <div style={{ marginTop: '20px' }}>
                  <p style={{ fontWeight: 'bold', color: '#666', fontSize: '13px', marginBottom: '10px' }}>
                     Autocompletado por CP:
                  </p>
                  <InfoRow label="Colonia" value={colonia || '—'} bloqueado />
                  <InfoRow label="Municipio" value={municipio || '—'} bloqueado />
                  <InfoRow label="Estado" value={estado || '—'} bloqueado />
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
                  disabled={guardando}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: guardando ? '#ccc' : '#1a237e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: guardando ? 'not-allowed' : 'pointer',
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

export default PerfilArrendador