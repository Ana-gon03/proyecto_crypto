import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getUnidadesAcademicas, getCarrerasByUnidad } from '../../services/catalogosService'
import { validarCampo, registrarEstudiante } from '../../services/authService'
import { useNavigate } from 'react-router-dom'
import SubirDocumento from '../ui/SubirDocumento'
import LegalModal from '../ui/LegalModal'

// ─── Estilos del toggle "postergar" ─────────────────────────────────────────

const toggleStyles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    backgroundColor: '#f9fafb',
    marginBottom: '1rem',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'border-color 0.2s',
  },
  wrapperActivo: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  wrapperDeshabilitado: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  track: (activo) => ({
    position: 'relative',
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    backgroundColor: activo ? '#f59e0b' : '#d1d5db',
    transition: 'background-color 0.25s',
    flexShrink: 0,
  }),
  thumb: (activo) => ({
    position: 'absolute',
    top: '3px',
    left: activo ? '23px' : '3px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    transition: 'left 0.25s',
  }),
  textos: {
    flex: 1,
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#374151',
    display: 'block',
  },
  descripcion: {
    fontSize: '0.78rem',
    color: '#6b7280',
    marginTop: '0.15rem',
    display: 'block',
  },
  badge: (activo) => ({
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.15rem 0.5rem',
    borderRadius: '999px',
    backgroundColor: activo ? '#fef3c7' : '#f3f4f6',
    color: activo ? '#92400e' : '#9ca3af',
    border: `1px solid ${activo ? '#fcd34d' : '#e5e7eb'}`,
    flexShrink: 0,
    letterSpacing: '0.04em',
  })
}

// ─── Toggle de postergar verificación ────────────────────────────────────────

const PostergarToggle = ({ activo, onChange, deshabilitado }) => {
  const handleClick = () => {
    if (!deshabilitado) onChange(!activo)
  }

  return (
    <div
      style={{
        ...toggleStyles.wrapper,
        ...(activo ? toggleStyles.wrapperActivo : {}),
        ...(deshabilitado ? toggleStyles.wrapperDeshabilitado : {}),
      }}
      onClick={handleClick}
      role="switch"
      aria-checked={activo}
      aria-disabled={deshabilitado}
      tabIndex={deshabilitado ? -1 : 0}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleClick() }}
    >
      {/* Track del toggle */}
      <div style={toggleStyles.track(activo)}>
        <div style={toggleStyles.thumb(activo)} />
      </div>

      {/* Textos */}
      <div style={toggleStyles.textos}>
        <span style={toggleStyles.label}>Verificar mi identidad después</span>
        <span style={toggleStyles.descripcion}>
          {deshabilitado
            ? 'Desactivado: ya subiste tu constancia de estudios'
            : activo
              ? 'Tendrás 2 meses para subir tu constancia de estudios'
              : 'Puedes verificar ahora subiendo tu constancia o hacerlo después'}
        </span>
      </div>

      {/* Badge de estado */}
      <span style={toggleStyles.badge(activo)}>
        {activo ? 'ACTIVO' : 'INACTIVO'}
      </span>
    </div>
  )
}

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

const RegistroEstudiante = ({ volver }) => {
  const navigate = useNavigate()
  const [unidades, setUnidades] = useState([])
  const [carreras, setCarreras] = useState([])
  const [loading, setLoading] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [constanciaFile, setConstanciaFile] = useState(null)
  const [postergarSeleccionado, setPostergarSeleccionado] = useState(false)

  // Modal legal: null | 'privacidad' | 'terminos'
  const [modalLegal, setModalLegal] = useState(null)
  const [mostrarPassword, setMostrarPassword] = useState(false)

  const [formData, setFormData] = useState({
    username: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    correo: '',
    telefono: '',
    curp: '',
    fechaNacimiento: '',
    escuela: '',
    carreraId: '',
    boleta: '',
    password: '',
    confirmPassword: '',
    aceptaTerminos: false,
  })

  const [errors, setErrors] = useState({})

  // Estado de verificación en tiempo real por campo
  // null = sin verificar | 'checking' = consultando | 'ok' = disponible | 'taken' = ya existe
  const [unicidad, setUnicidad] = useState({
    username: null, correo: null, curp: null, boleta: null
  })
  const debounceTimers = useRef({})

  // Si sube constancia, desactivar el toggle de postergar
  const handleConstanciaSelect = (file) => {
    setConstanciaFile(file)
    if (file) setPostergarSeleccionado(false)
  }

  // ── Verificación en tiempo real ────────────────────────────────────────────
  const CAMPOS_UNICOS = {
    username: { minLen: 3, regex: /^[a-zA-Z0-9_]+$/ },
    correo:   { minLen: 5, regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    curp:     { minLen: 18, regex: /^[A-Z]{4}[0-9]{6}[A-Z]{6}[A-Z0-9]{2}$/ },
    boleta:   { minLen: 10, regex: /^[0-9]{10}$/ },
  }

  const verificarCampoEnTiempoReal = useCallback((campo, valor) => {
    const regla = CAMPOS_UNICOS[campo]
    if (!regla) return

    // Limpiar timer anterior
    if (debounceTimers.current[campo]) clearTimeout(debounceTimers.current[campo])

    // Si el valor no cumple el formato mínimo, resetear sin consultar
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

  // ── Restricciones ──────────────────────────────────────────────────────────
  const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--
    return edad
  }

  const restringirUsername    = (v) => v.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20)
  const restringirNombre      = (v) => v.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/g, '').slice(0, 50)
  const restringirTelefono    = (v) => v.replace(/[^0-9]/g, '').slice(0, 10)
  const restringirCURP        = (v) => v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 18)
  const restringirBoleta      = (v) => v.replace(/[^0-9]/g, '').slice(0, 10)
  const restringirCorreo      = (v) => v.replace(/[^a-zA-Z0-9@._-]/g, '').slice(0, 60)

  const handleChange = (e) => {
    const { name, value } = e.target
    let v = value
    switch (name) {
      case 'username':                               v = restringirUsername(value); break
      case 'nombres':
      case 'apellidoPaterno':
      case 'apellidoMaterno':                        v = restringirNombre(value); break
      case 'telefono':                               v = restringirTelefono(value); break
      case 'curp':                                   v = restringirCURP(value); break
      case 'boleta':                                 v = restringirBoleta(value); break
      case 'correo':                                 v = restringirCorreo(value); break
      default: break
    }
    setFormData({ ...formData, [name]: v })
    if (errors[name]) setErrors({ ...errors, [name]: null })
    // Verificar unicidad en tiempo real para campos únicos
    if (name in CAMPOS_UNICOS) verificarCampoEnTiempoReal(name, v)
  }

  const handleCheckbox = (e) => {
    setFormData({ ...formData, aceptaTerminos: e.target.checked })
    if (errors.aceptaTerminos) setErrors({ ...errors, aceptaTerminos: null })
  }

  // ── Validaciones ───────────────────────────────────────────────────────────
  const validacionesFormato = () => {
    const e = {}
    if (!formData.username) e.username = 'El username es obligatorio'
    else if (formData.username.length < 3) e.username = 'Mínimo 3 caracteres'
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) e.username = 'Solo letras, números y guión bajo'

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

    if (!formData.fechaNacimiento) e.fechaNacimiento = 'La fecha de nacimiento es obligatoria'
    else if (calcularEdad(formData.fechaNacimiento) < 17)
      e.fechaNacimiento = 'Debes ser mayor o igual a 17 años'

    if (!formData.escuela) e.escuela = 'Debes seleccionar una escuela'
    if (!formData.carreraId) e.carreraId = 'Debes seleccionar una carrera'

    if (!formData.boleta) e.boleta = 'La boleta es obligatoria'
    else if (formData.boleta.length !== 10) e.boleta = 'La boleta debe tener 10 dígitos'

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
      { campo: 'username', valor: formData.username, nombre: 'Username' },
      { campo: 'correo',   valor: formData.correo,   nombre: 'Correo' },
      { campo: 'curp',     valor: formData.curp,     nombre: 'CURP' },
      { campo: 'boleta',   valor: formData.boleta,   nombre: 'Boleta' },
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

    setEnviando(true)
    const unicidad = await validarUnicidad()
    if (unicidad.existe) {
      setErrors({ ...errors, [unicidad.campo]: unicidad.mensaje })
      setEnviando(false)
      return
    }

    const fd = new FormData()
    fd.append('username', formData.username)
    fd.append('nombres', formData.nombres)
    fd.append('apellidoPaterno', formData.apellidoPaterno)
    fd.append('apellidoMaterno', formData.apellidoMaterno)
    fd.append('correo', formData.correo)
    fd.append('telefono', formData.telefono)
    fd.append('curp', formData.curp)
    fd.append('fechaNacimiento', formData.fechaNacimiento)
    fd.append('carreraId', formData.carreraId)
    fd.append('boleta', formData.boleta)
    fd.append('password', formData.password)
    // Si subió constancia → verificado; si no → pendiente (postergar)
    const verificadoConDocumento = !!constanciaFile
    fd.append('postergarVerificacion', verificadoConDocumento ? 'false' : 'true')
    if (constanciaFile) fd.append('constancia', constanciaFile)

    try {
      const response = await fetch('http://localhost:5000/api/auth/registro-estudiante', { method: 'POST', body: fd })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al registrar')
      navigate('/verificar-correo', {
        state: {
          correo: formData.correo,
          rol: 'estudiante',
          verificadoConDocumento,  // true si subió constancia, false si postergó
        }
      })
    } catch (error) {
      alert(error.message || 'Error al registrar. Intenta de nuevo')
    } finally {
      setEnviando(false)
    }
  }

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    getUnidadesAcademicas().then(setUnidades).catch(console.error)
  }, [])

  useEffect(() => {
    if (formData.escuela) {
      setLoading(true)
      getCarrerasByUnidad(formData.escuela)
        .then(setCarreras)
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setCarreras([])
    }
  }, [formData.escuela])

  // ── Helper: indicador visual de unicidad ──────────────────────────────────
  const IndicadorUnicidad = ({ campo }) => {
    const estado = unicidad[campo]
    if (!estado) return null
    if (estado === 'checking') return (
      <span style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.2rem', display: 'block' }}>
        ⏳ Verificando...
      </span>
    )
    if (estado === 'ok') return (
      <span style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: '0.2rem', display: 'block' }}>
        ✓ Disponible
      </span>
    )
    if (estado === 'taken') return (
      <span style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '0.2rem', display: 'block' }}>
        ✗ Ya está registrado
      </span>
    )
    return null
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Modal legal (renderiza encima de todo) */}
      {modalLegal && (
        <LegalModal tipo={modalLegal} onCerrar={() => setModalLegal(null)} />
      )}

      <button onClick={volver} style={{ marginBottom: '1rem' }}>← Volver</button>
      <h2>Registro de Estudiante IPN</h2>

      <form onSubmit={handleSubmit}>
        <h3>Datos Generales</h3>

        <div style={{ marginBottom: '1rem' }}>
          <label>Username (nombre de usuario):</label><br />
          <input type="text" name="username" value={formData.username} onChange={handleChange}
            placeholder="Ej: juan_perez" style={{ width: '100%', padding: '0.5rem' }} />
          <small>Solo letras, números y guión bajo. Máximo 20 caracteres</small>
          {errors.username && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.username}</div>}
          <IndicadorUnicidad campo="username" />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Nombres:</label><br />
          <input type="text" name="nombres" value={formData.nombres} onChange={handleChange}
            placeholder="Ej: Juan Carlos" style={{ width: '100%', padding: '0.5rem' }} />
          <small>Solo letras y espacios</small>
          {errors.nombres && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.nombres}</div>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Apellido Paterno:</label><br />
          <input type="text" name="apellidoPaterno" value={formData.apellidoPaterno} onChange={handleChange}
            placeholder="Ej: Hernández" style={{ width: '100%', padding: '0.5rem' }} />
          <small>Solo letras y espacios</small>
          {errors.apellidoPaterno && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.apellidoPaterno}</div>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Apellido Materno:</label><br />
          <input type="text" name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange}
            placeholder="Ej: López" style={{ width: '100%', padding: '0.5rem' }} />
          <small>(Opcional) Solo letras y espacios</small>
          {errors.apellidoMaterno && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.apellidoMaterno}</div>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Correo Electrónico:</label><br />
          <input type="email" name="correo" value={formData.correo} onChange={handleChange}
            placeholder="Ej: juan@ejemplo.com" style={{ width: '100%', padding: '0.5rem' }} />
          {errors.correo && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.correo}</div>}
          <IndicadorUnicidad campo="correo" />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Teléfono:</label><br />
          <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
            placeholder="Ej: 5512345678" style={{ width: '100%', padding: '0.5rem' }} />
          <small>10 dígitos, solo números</small>
          {errors.telefono && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.telefono}</div>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>CURP:</label><br />
          <input type="text" name="curp" value={formData.curp} onChange={handleChange}
            placeholder="Ej: HERS850101MDFRRN09" style={{ width: '100%', padding: '0.5rem' }} />
          <small>18 caracteres: 4 letras, 6 números, 6 letras, 2 alfanuméricos</small>
          {errors.curp && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.curp}</div>}
          <IndicadorUnicidad campo="curp" />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Fecha de Nacimiento:</label><br />
          <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }} />
          <small>Debes ser mayor de 17 años</small>
          {errors.fechaNacimiento && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.fechaNacimiento}</div>}
        </div>

        <h3>Datos Académicos</h3>

        <div style={{ marginBottom: '1rem' }}>
          <label>Escuela (Unidad Académica):</label><br />
          <select name="escuela" value={formData.escuela} onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}>
            <option value="">Selecciona tu escuela</option>
            {unidades.map(u => (
              <option key={u.idUnidadAcademica} value={u.idUnidadAcademica}>
                {u.unidadAcademicaNombre} ({u.unidadAcademicaClave})
              </option>
            ))}
          </select>
          {errors.escuela && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.escuela}</div>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Carrera:</label><br />
          <select name="carreraId" value={formData.carreraId} onChange={handleChange}
            disabled={!formData.escuela || loading} style={{ width: '100%', padding: '0.5rem' }}>
            <option value="">Selecciona tu carrera</option>
            {carreras.map(c => (
              <option key={c.idCarrera} value={c.idCarrera}>
                {c.carreraNombre} ({c.carreraClave})
              </option>
            ))}
          </select>
          {loading && <small>Cargando carreras...</small>}
          {errors.carreraId && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.carreraId}</div>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Boleta:</label><br />
          <input type="text" name="boleta" value={formData.boleta} onChange={handleChange}
            placeholder="Ej: 2024030001" style={{ width: '100%', padding: '0.5rem' }} />
          <small>10 dígitos, solo números</small>
          {errors.boleta && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.boleta}</div>}
          <IndicadorUnicidad campo="boleta" />
        </div>

        <h3>Contraseña</h3>

        <div style={{ marginBottom: '1rem' }}>
          <label>Contraseña:</label><br />
          <div style={{ position: 'relative' }}>
            <input type={mostrarPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', paddingRight: '2.5rem', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)}
              style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6b7280' }}>
              {mostrarPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <small>Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo (@$!%*?&)</small>
          {errors.password && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.password}</div>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Confirmar Contraseña:</label><br />
          <div style={{ position: 'relative' }}>
            <input type={mostrarPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', paddingRight: '2.5rem', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)}
              style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6b7280' }}>
              {mostrarPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.confirmPassword && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.confirmPassword}</div>}
        </div>

        {/* ── Verificación de identidad ─────────────────────────────────── */}
        <h3>Verificación de Identidad</h3>

        {/* Toggle siempre visible — al activarlo oculta el campo de subir */}
        <PostergarToggle
          activo={postergarSeleccionado}
          onChange={(valor) => {
            setPostergarSeleccionado(valor)
            // Si activa postergar, limpiar constancia si la había subido
            if (valor) {
              setConstanciaFile(null)
            }
          }}
          deshabilitado={false}
        />

        {/* Campo de subir constancia — solo visible si NO está postergando */}
        {!postergarSeleccionado && (
          <>
            <SubirDocumento
              tipo="constancia"
              onFileSelect={handleConstanciaSelect}
              file={constanciaFile}
              setFile={setConstanciaFile}
              required={false}
              label="Constancia de Estudios (PDF) - Opcional"
            />
            {constanciaFile && (
              <div style={{
                fontSize: '0.8rem', color: '#15803d', backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0', borderRadius: '8px',
                padding: '0.6rem 0.9rem', marginBottom: '1rem'
              }}>
                ✓ Tu identidad se verificará automáticamente con la constancia subida.
              </div>
            )}
          </>
        )}

        {/* ── Aviso legal y términos ────────────────────────────────────── */}
        <div style={{ marginBottom: '1.25rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
          <div style={terminosStyles.fila}>
            <input
              type="checkbox"
              id="aceptaTerminos"
              checked={formData.aceptaTerminos}
              onChange={handleCheckbox}
              style={terminosStyles.checkbox}
            />
            <label htmlFor="aceptaTerminos" style={{ ...terminosStyles.texto, cursor: 'pointer' }}>
              He leído y acepto el{' '}
              <button type="button" style={terminosStyles.enlace}
                onClick={() => setModalLegal('privacidad')}>
                Aviso de Privacidad
              </button>
              {' '}y los{' '}
              <button type="button" style={terminosStyles.enlace}
                onClick={() => setModalLegal('terminos')}>
                Términos y Condiciones de Uso
              </button>
              .
            </label>
          </div>
          {errors.aceptaTerminos && (
            <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              {errors.aceptaTerminos}
            </div>
          )}
        </div>

        <button type="submit" disabled={enviando}
          style={{ padding: '0.75rem 1.5rem', marginTop: '0.5rem' }}>
          {enviando ? 'Registrando...' : 'Registrarme'}
        </button>
      </form>
    </div>
  )
}

export default RegistroEstudiante