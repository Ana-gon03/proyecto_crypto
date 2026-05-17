import React, { useState, useCallback, useRef } from 'react'
import { buscarCP } from '../../services/cpService'
import { validarCampo } from '../../services/authService'
import { useNavigate, Link } from 'react-router-dom'
import SubirDocumento from '../ui/SubirDocumento'
import LegalModal from '../ui/LegalModal'
import burroLogo from '../../assets/burro.png'
import '../../styles/Registro.css'


// ─── Estilos para la sección de términos ─────────────────────────────────────
const terminosStyles = {
  fila: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.6rem',
    padding: '0.75rem 0',
  },
  checkbox: {
    marginTop: '2px',
    width: '16px',
    height: '16px',
    flexShrink: 0,
    cursor: 'pointer',
    accentColor: '#2563eb',
  },
  texto: {
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: 1.5,
  },
  enlace: {
    color: '#2563eb',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontWeight: 600,
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: 'inherit',
    fontFamily: 'inherit',
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────
const RegistroArrendador = ({ volver }) => {
  const navigate = useNavigate()
  const [enviando, setEnviando] = useState(false)
  const [buscandoCP, setBuscandoCP] = useState(false)
  const [sugerenciasCP, setSugerenciasCP] = useState([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [curpFile, setCurpFile] = useState(null)

  const [modalLegal, setModalLegal] = useState(null)
  const [mostrarPassword, setMostrarPassword] = useState(false)

  const [formData, setFormData] = useState({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    correo: '',
    telefono: '',
    curp: '',
    fechaNacimiento: '',
    rfc: '',
    cp: '',
    calle: '',
    numExt: '',
    numInt: '',
    colonia: '',
    municipio: '',
    estado: '',
    password: '',
    confirmPassword: '',
    aceptaTerminos: false,
  })

  const [errors, setErrors] = useState({})
  const [unicidad, setUnicidad] = useState({ correo: null, curp: null, rfc: null })
  const debounceTimers = useRef({})

  // ── Restricciones ──────────────────────────────────────────────────────────
  const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--
    return edad
  }

  const restringirNombre = (v) => v.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/g, '').slice(0, 50)
  const restringirTelefono = (v) => v.replace(/[^0-9]/g, '').slice(0, 10)
  const restringirCURP = (v) => v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 18)
  const restringirRFC = (v) => v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 13)
  const restringirCP = (v) => v.replace(/[^0-9]/g, '').slice(0, 5)
  const restringirCorreo = (v) => v.replace(/[^a-zA-Z0-9@._-]/g, '').slice(0, 60)
  const restringirNumero = (v) => v.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)

  const handleChange = (e) => {
    const { name, value } = e.target
    let v = value
    switch (name) {
      case 'nombres':
      case 'apellidoPaterno':
      case 'apellidoMaterno': v = restringirNombre(value); break
      case 'telefono': v = restringirTelefono(value); break
      case 'curp': v = restringirCURP(value); break
      case 'rfc': v = restringirRFC(value); break
      case 'cp': v = restringirCP(value); break
      case 'correo': v = restringirCorreo(value); break
      case 'numExt':
      case 'numInt': v = restringirNumero(value); break
      default: break
    }
    setFormData({ ...formData, [name]: v })
    if (errors[name]) setErrors({ ...errors, [name]: null })
    if (name in CAMPOS_UNICOS) verificarCampoEnTiempoReal(name, v)
  }

  const handleCheckbox = (e) => {
    setFormData({ ...formData, aceptaTerminos: e.target.checked })
    if (errors.aceptaTerminos) setErrors({ ...errors, aceptaTerminos: null })
  }

  // ── Verificación en tiempo real ────────────────────────────────────────────
  const CAMPOS_UNICOS = {
    correo: { minLen: 5, regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    curp: { minLen: 18, regex: /^[A-Z]{4}[0-9]{6}[A-Z]{6}[A-Z0-9]{2}$/ },
    rfc: { minLen: 13, regex: /^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$/ },
  }

  const verificarCampoEnTiempoReal = useCallback((campo, valor) => {
    const regla = CAMPOS_UNICOS[campo]
    if (!regla) return
    if (debounceTimers.current[campo]) clearTimeout(debounceTimers.current[campo])
    if (!valor || valor.length < regla.minLen || !regla.regex.test(valor)) {
      setUnicidad(prev => ({ ...prev, [campo]: null }))
      return
    }
    setUnicidad(prev => ({ ...prev, [campo]: 'checking' }))
    debounceTimers.current[campo] = setTimeout(async () => {
      try {
        const r = await validarCampo(campo, valor)
        setUnicidad(prev => ({ ...prev, [campo]: r.existe ? 'taken' : 'ok' }))
      } catch {
        setUnicidad(prev => ({ ...prev, [campo]: null }))
      }
    }, 600)
  }, [])

  // ── Búsqueda de CP ─────────────────────────────────────────────────────────
  const handleCPChange = async (e) => {
    const cpNumeros = restringirCP(e.target.value)
    setFormData({ ...formData, cp: cpNumeros, colonia: '', municipio: '', estado: '' })

    if (cpNumeros.length === 5) {
      setBuscandoCP(true)
      try {
        const resultados = await buscarCP(cpNumeros)
        if (resultados.length > 0) {
          setSugerenciasCP(resultados)
          setMostrarSugerencias(true)
        } else {
          setSugerenciasCP([])
          setErrors(prev => ({ ...prev, cp: 'No se encontraron direcciones para este CP' }))
        }
      } catch (error) {
        console.error('Error al buscar CP:', error)
      } finally {
        setBuscandoCP(false)
      }
    } else {
      setSugerenciasCP([])
      setMostrarSugerencias(false)
    }
  }

  const seleccionarDireccion = (direccion) => {
    setFormData({
      ...formData,
      cp: direccion.d_codigo,
      colonia: direccion.d_asenta,
      municipio: direccion.D_mnpio,
      estado: direccion.d_estado
    })
    setMostrarSugerencias(false)
    setSugerenciasCP([])
    if (errors.cp) setErrors({ ...errors, cp: null })
  }

  // ── Validaciones ───────────────────────────────────────────────────────────
  const validacionesFormato = () => {
    const e = {}
    if (!formData.nombres) e.nombres = 'Los nombres son obligatorios'
    else if (formData.nombres.length < 2) e.nombres = 'Mínimo 2 caracteres'
    if (!formData.apellidoPaterno) e.apellidoPaterno = 'El apellido paterno es obligatorio'
    else if (formData.apellidoPaterno.length < 2) e.apellidoPaterno = 'Mínimo 2 caracteres'
    if (formData.apellidoMaterno && formData.apellidoMaterno.length < 2)
      e.apellidoMaterno = 'Mínimo 2 caracteres'
    if (!formData.correo) e.correo = 'El correo es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) e.correo = 'Correo no válido'
    if (!formData.telefono) e.telefono = 'El teléfono es obligatorio'
    else if (formData.telefono.length !== 10) e.telefono = 'Debe tener 10 dígitos'
    if (!formData.curp) e.curp = 'El CURP es obligatorio'
    else if (!/^[A-Z]{4}[0-9]{6}[A-Z]{6}[A-Z0-9]{2}$/.test(formData.curp))
      e.curp = 'CURP no válido (4 letras, 6 números, 6 letras, 2 alfanuméricos)'
    if (!formData.rfc) e.rfc = 'El RFC es obligatorio'
    else if (!/^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$/.test(formData.rfc))
      e.rfc = 'RFC no válido (4 letras, 6 números, 3 alfanuméricos)'
    if (!formData.fechaNacimiento) e.fechaNacimiento = 'La fecha de nacimiento es obligatoria'
    else if (calcularEdad(formData.fechaNacimiento) < 18)
      e.fechaNacimiento = 'Debes ser mayor de 18 años para registrarte como arrendador'
    if (!formData.cp) e.cp = 'El código postal es obligatorio'
    else if (formData.cp.length !== 5) e.cp = 'El código postal debe tener 5 dígitos'
    if (!formData.calle) e.calle = 'La calle es obligatoria'
    else if (formData.calle.length < 3) e.calle = 'Mínimo 3 caracteres'
    if (!formData.numExt) e.numExt = 'El número exterior es obligatorio'
    if (!formData.colonia) e.colonia = 'La colonia es obligatoria'
    if (!formData.municipio) e.municipio = 'El municipio es obligatorio'
    if (!formData.estado) e.estado = 'El estado es obligatorio'
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!formData.password) e.password = 'La contraseña es obligatoria'
    else if (!pwRegex.test(formData.password))
      e.password = 'Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo (@$!%*?&)'
    if (formData.password !== formData.confirmPassword)
      e.confirmPassword = 'Las contraseñas no coinciden'
    if (!formData.aceptaTerminos)
      e.aceptaTerminos = 'Debes aceptar el aviso de privacidad y los términos de uso'
    return e
  }

  const validarUnicidad = async () => {
    const campos = [
      { campo: 'correo', valor: formData.correo, nombre: 'Correo' },
      { campo: 'curp', valor: formData.curp, nombre: 'CURP' },
    ]
    for (const item of campos) {
      try {
        const r = await validarCampo(item.campo, item.valor)
        if (r.existe) return { existe: true, mensaje: `${item.nombre} ya está registrado`, campo: item.campo }
      } catch {
        return { existe: true, mensaje: `Error al validar ${item.nombre}`, campo: item.campo }
      }
    }
    return { existe: false }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    const erroresFormato = validacionesFormato()
    if (Object.keys(erroresFormato).length > 0) { setErrors(erroresFormato); return }
    if (!curpFile) { setErrors({ ...errors, curpFile: 'Es obligatorio subir el documento CURP' }); return }
    setEnviando(true)
    const unicidad = await validarUnicidad()
    if (unicidad.existe) {
      setErrors({ ...errors, [unicidad.campo]: unicidad.mensaje })
      setEnviando(false)
      return
    }
    const fd = new FormData()
    fd.append('nombres', formData.nombres)
    fd.append('apellidoPaterno', formData.apellidoPaterno)
    fd.append('apellidoMaterno', formData.apellidoMaterno)
    fd.append('correo', formData.correo)
    fd.append('telefono', formData.telefono)
    fd.append('curp', formData.curp)
    fd.append('fechaNacimiento', formData.fechaNacimiento)
    fd.append('rfc', formData.rfc)
    fd.append('calle', formData.calle)
    fd.append('numExt', formData.numExt)
    fd.append('numInt', formData.numInt)
    fd.append('cp', formData.cp)
    fd.append('colonia', formData.colonia)
    fd.append('municipio', formData.municipio)
    fd.append('estado', formData.estado)
    fd.append('password', formData.password)
    fd.append('documentoCURP', curpFile)
    try {
      const response = await fetch('http://localhost:5000/api/auth/registro-arrendador', { method: 'POST', body: fd })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al registrar')
      navigate('/verificar-correo', {
        state: {
          correo: formData.correo,
          rol: 'arrendador',
          verificadoConDocumento: true,
        }
      })
    } catch (error) {
      alert(error.message || 'Error al registrar. Intenta de nuevo')
    } finally {
      setEnviando(false)
    }
  }

  const IndicadorUnicidad = ({ campo }) => {
    const estado = unicidad[campo]
    if (!estado) return null
    if (estado === 'checking') return <span style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.2rem', display: 'block' }}>⏳ Verificando...</span>
    if (estado === 'ok') return <span style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: '0.2rem', display: 'block' }}>✓ Disponible</span>
    if (estado === 'taken') return <span style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '0.2rem', display: 'block' }}>✗ Ya está registrado</span>
    return null
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {modalLegal && <LegalModal tipo={modalLegal} onCerrar={() => setModalLegal(null)} />}

      <div className="registro-layout">
        {/* SIDEBAR */}
        <aside className="registro-sidebar">
          {/* Botón Regresar - ARRIBA del logo */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: '0.5rem' }}>
            <button 
              type="button" 
              className="btn-regresar-sidebar"
              onClick={() => window.location.href = '/registro'}
            >
              ← Regresar
            </button>
          </div>

          <img src={burroLogo} alt="Mascota" className="sidebar-mascot" />
          <div className="sidebar-welcome">
            <h3>¡Bienvenido!</h3>
            <p>Regístrate como arrendador y comienza a rentar tus propiedades</p>
          </div>
          <div className="sidebar-perks">
            {[
              { title: 'Publica tus propiedades', desc: 'Llega a cientos de estudiantes' },
              { title: 'Verificación de identidad', desc: 'Seguridad para ambas partes' },
              { title: 'Contratos digitales', desc: 'Plantillas guía' },
              { title: 'Calificaciones', desc: 'Construye confianza' },
            ].map(p => (
              <div className="sidebar-perk" key={p.title}>
                <div className="sidebar-perk-icon">{p.icon}</div>
                <div className="sidebar-perk-text">
                  <strong>{p.title}</strong>
                  {p.desc}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN FORM */}
        <main className="registro-main">
          {/* Tabs */}
          <div className="tipo-tabs">
            <span className="tipo-tab active"> Arrendador</span>
          </div>

          {/* Cabecera */}
          <div className="form-header">
            <div className="form-header-icon">🏠</div>
            <div className="form-header-text">
              <h2>Regístrate como Arrendador</h2>
              <p>Completa tus datos para publicar propiedades y conectar con estudiantes.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* DATOS GENERALES */}
            <div className="form-section">
              <div className="form-section-title">
                <div className="form-section-icon">👤</div>
                <div>
                  <h3>Datos Generales</h3>
                  <p>Información del titular de la cuenta</p>
                </div>
              </div>

              <div className="form-grid form-grid-3">
                <div className="form-group">
                  <label className="form-label">Nombres <span>*</span></label>
                  <input className="form-input" type="text" name="nombres" value={formData.nombres} onChange={handleChange} placeholder="Ej: Juan Carlos" />
                  {errors.nombres && <div className="form-error">{errors.nombres}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Apellido paterno <span>*</span></label>
                  <input className="form-input" type="text" name="apellidoPaterno" value={formData.apellidoPaterno} onChange={handleChange} placeholder="Ej: Hernández" />
                  {errors.apellidoPaterno && <div className="form-error">{errors.apellidoPaterno}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Apellido materno</label>
                  <input className="form-input" type="text" name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} placeholder="Ej: López (opcional)" />
                  {errors.apellidoMaterno && <div className="form-error">{errors.apellidoMaterno}</div>}
                </div>
              </div>

              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Correo electrónico <span>*</span></label>
                  <div className="form-input-icon">
                    <span className="icon">✉️</span>
                    <input className="form-input" type="email" name="correo" value={formData.correo} onChange={handleChange} placeholder="Ej: juan@ejemplo.com" />
                  </div>
                  {errors.correo && <div className="form-error">{errors.correo}</div>}
                  <IndicadorUnicidad campo="correo" />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono <span>*</span></label>
                  <div className="form-input-icon">
                    <span className="icon">📱</span>
                    <input className="form-input" type="tel" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej: 5512345678" />
                  </div>
                  <span className="form-hint">10 dígitos, solo números</span>
                  {errors.telefono && <div className="form-error">{errors.telefono}</div>}
                </div>
              </div>

              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">CURP <span>*</span></label>
                  <input className="form-input" type="text" name="curp" value={formData.curp} onChange={handleChange} placeholder="Ej: HERS850101MDFRRN09" />
                  <span className="form-hint">18 caracteres</span>
                  {errors.curp && <div className="form-error">{errors.curp}</div>}
                  <IndicadorUnicidad campo="curp" />
                </div>
                <div className="form-group">
                  <label className="form-label">RFC <span>*</span></label>
                  <input className="form-input" type="text" name="rfc" value={formData.rfc} onChange={handleChange} placeholder="Ej: HERS850101XXX" />
                  <span className="form-hint">13 caracteres</span>
                  {errors.rfc && <div className="form-error">{errors.rfc}</div>}
                  <IndicadorUnicidad campo="rfc" />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Fecha de nacimiento <span>*</span></label>
                  <input className="form-input" type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} />
                  <span className="form-hint">Debes ser mayor de 18 años</span>
                  {errors.fechaNacimiento && <div className="form-error">{errors.fechaNacimiento}</div>}
                </div>
              </div>
            </div>

            <hr className="form-divider" />

            {/* DOMICILIO */}
            <div className="form-section">
              <div className="form-section-title">
                <div className="form-section-icon">📍</div>
                <div>
                  <h3>Domicilio Actual</h3>
                  <p>Dirección donde resides actualmente</p>
                </div>
              </div>

              <div className="form-grid form-grid-2">
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Código Postal <span>*</span></label>
                  <input className="form-input" type="text" name="cp" value={formData.cp} onChange={handleCPChange} placeholder="Ej: 07300" />
                  {buscandoCP && <span className="form-hint">Buscando...</span>}
                  {mostrarSugerencias && sugerenciasCP.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      {sugerenciasCP.map((sug, i) => (
                        <div key={i} onClick={() => seleccionarDireccion(sug)} style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #eee' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'} onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}>
                          <strong>CP: {sug.d_codigo}</strong><br />
                          {sug.d_asenta}, {sug.D_mnpio}, {sug.d_estado}
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.cp && <div className="form-error">{errors.cp}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Calle <span>*</span></label>
                  <input className="form-input" type="text" name="calle" value={formData.calle} onChange={handleChange} placeholder="Ej: Av. Insurgentes" />
                  {errors.calle && <div className="form-error">{errors.calle}</div>}
                </div>
              </div>

              <div className="form-grid form-grid-3">
                <div className="form-group">
                  <label className="form-label">Número exterior <span>*</span></label>
                  <input className="form-input" type="text" name="numExt" value={formData.numExt} onChange={handleChange} placeholder="Ej: 123" />
                  {errors.numExt && <div className="form-error">{errors.numExt}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Número interior</label>
                  <input className="form-input" type="text" name="numInt" value={formData.numInt} onChange={handleChange} placeholder="Ej: 3B (opcional)" />
                </div>
                <div className="form-group">
                  <label className="form-label">Colonia <span>*</span></label>
                  <input className="form-input" type="text" name="colonia" value={formData.colonia} onChange={handleChange} readOnly placeholder="Se autocompleta con el CP" />
                  {errors.colonia && <div className="form-error">{errors.colonia}</div>}
                </div>
              </div>

              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Municipio <span>*</span></label>
                  <input className="form-input" type="text" name="municipio" value={formData.municipio} onChange={handleChange} readOnly placeholder="Se autocompleta con el CP" />
                  {errors.municipio && <div className="form-error">{errors.municipio}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Estado <span>*</span></label>
                  <input className="form-input" type="text" name="estado" value={formData.estado} onChange={handleChange} readOnly placeholder="Se autocompleta con el CP" />
                  {errors.estado && <div className="form-error">{errors.estado}</div>}
                </div>
              </div>
            </div>

            <hr className="form-divider" />

            {/* CONTRASEÑA */}
            <div className="form-section">
              <div className="form-section-title">
                <div className="form-section-icon">🔒</div>
                <div>
                  <h3>Contraseña</h3>
                  <p>Crea una contraseña segura para tu cuenta</p>
                </div>
              </div>

              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Contraseña <span>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type={mostrarPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} style={{ paddingRight: '2.5rem' }} />
                    <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6b7280' }}>
                      {mostrarPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <span className="form-hint">Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo (@$!%*?&)</span>
                  {errors.password && <div className="form-error">{errors.password}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Confirmar contraseña <span>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type={mostrarPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} style={{ paddingRight: '2.5rem' }} />
                    <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6b7280' }}>
                      {mostrarPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
                </div>
              </div>
            </div>

            <hr className="form-divider" />

            {/* DOCUMENTACIÓN */}
            <div className="form-section">
              <div className="form-section-title">
                <div className="form-section-icon">📄</div>
                <div>
                  <h3>Documentación Oficial</h3>
                  <p>Sube tu documento CURP para verificar tu identidad</p>
                </div>
              </div>

              <SubirDocumento
                tipo="curp"
                onFileSelect={(file) => setCurpFile(file)}
                file={curpFile}
                setFile={setCurpFile}
                required={true}
                label="Documento CURP (PDF) - Obligatorio"
              />
              {errors.curpFile && <div className="form-error">{errors.curpFile}</div>}
            </div>

            <hr className="form-divider" />

            {/* TÉRMINOS Y CONDICIONES */}
            <div className="form-section" style={{ marginBottom: '0' }}>
              <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '1rem' }}>
                <div style={terminosStyles.fila}>
                  <input type="checkbox" id="aceptaTerminos" checked={formData.aceptaTerminos} onChange={handleCheckbox} style={terminosStyles.checkbox} />
                  <label htmlFor="aceptaTerminos" style={{ ...terminosStyles.texto, cursor: 'pointer' }}>
                    He leído y acepto el{' '}
                    <button type="button" style={terminosStyles.enlace} onClick={() => setModalLegal('privacidad')}>
                      Aviso de Privacidad
                    </button>
                    {' '}y los{' '}
                    <button type="button" style={terminosStyles.enlace} onClick={() => setModalLegal('terminos')}>
                      Términos y Condiciones de Uso
                    </button>.
                  </label>
                </div>
                {errors.aceptaTerminos && <div className="form-error">{errors.aceptaTerminos}</div>}
              </div>
            </div>

            {/* SUBMIT */}
            <div className="form-submit-row">
              <span className="form-login-link">
                ¿Ya tienes cuenta? <Link to="/usuarios/inicio-sesion">Inicia sesión</Link>
              </span>
              <button type="submit" className="btn btn-primary" disabled={enviando}>
                {enviando ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </>
  )
}

export default RegistroArrendador