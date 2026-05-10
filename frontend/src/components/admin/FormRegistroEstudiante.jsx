import React, { useState, useEffect } from 'react'
import { getUnidadesAcademicas, getCarrerasByUnidad } from '../../services/catalogosService'
import { validarCampo } from '../../services/authService'
import { createArrendatario } from '../../services/adminService'
import './admin.css'

const FormRegistroEstudiante = ({ onClose, onSuccess }) => {
  const [unidades, setUnidades] = useState([])
  const [carreras, setCarreras] = useState([])
  const [loading, setLoading] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errors, setErrors] = useState({})
  const [validando, setValidando] = useState({})

  const [formData, setFormData] = useState({
    username: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '',
    correo: '', telefono: '', curp: '', fechaNacimiento: '',
    escuela: '', carreraId: '', boleta: '',
    password: '', confirmPassword: '',
  })

  useEffect(() => {
    const cargar = async () => {
      try { const data = await getUnidadesAcademicas(); setUnidades(data) } catch { }
    }
    cargar()
  }, [])

  useEffect(() => {
    const cargarCarreras = async () => {
      if (formData.escuela) {
        setLoading(true)
        try { const data = await getCarrerasByUnidad(formData.escuela); setCarreras(data) } catch { }
        finally { setLoading(false) }
      } else { setCarreras([]) }
    }
    cargarCarreras()
  }, [formData.escuela])

  const validarCampoUnico = async (campo, valor) => {
    if (!valor || valor.length < 3) return true
    setValidando(prev => ({ ...prev, [campo]: true }))
    try {
      const result = await validarCampo(campo, valor)
      if (result.existe) {
        const msgs = { username: 'El username ya está registrado', correo: 'El correo ya está registrado', curp: 'El CURP ya está registrado', boleta: 'La boleta ya está registrada' }
        setErrors(prev => ({ ...prev, [campo]: msgs[campo] }))
        return false
      } else { setErrors(prev => ({ ...prev, [campo]: null })); return true }
    } catch { return true }
    finally { setValidando(prev => ({ ...prev, [campo]: false })) }
  }

  const handleBlur = async (e) => {
    const { name, value } = e.target
    if (['username', 'correo', 'curp', 'boleta'].includes(name)) await validarCampoUnico(name, value)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let v = value
    if (['nombres', 'apellidoPaterno', 'apellidoMaterno'].includes(name)) {
      v = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '')
    }
    if (name === 'telefono') v = value.replace(/[^0-9]/g, '').slice(0, 10)
    if (name === 'curp') v = value.toUpperCase().slice(0, 18)
    if (name === 'boleta') v = value.replace(/[^0-9]/g, '').slice(0, 10)
    setFormData(prev => ({ ...prev, [name]: v }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validarPassword = (p) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(p)

  const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const cumpleEsteAnio = new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate())
    if (hoy < cumpleEsteAnio) edad--
    return edad
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!formData.username) errs.username = 'Obligatorio'
    if (!formData.nombres) errs.nombres = 'Obligatorio'
    if (!formData.apellidoPaterno) errs.apellidoPaterno = 'Obligatorio'
    if (!formData.apellidoMaterno) errs.apellidoMaterno = 'Obligatorio'
    if (!formData.correo) errs.correo = 'Obligatorio'
    if (!formData.telefono || formData.telefono.length !== 10) errs.telefono = 'Debe tener 10 dígitos'
    if (!formData.curp || formData.curp.length !== 18) errs.curp = 'Debe tener 18 caracteres'
    if (!formData.fechaNacimiento) errs.fechaNacimiento = 'Obligatorio'
    else if (calcularEdad(formData.fechaNacimiento) < 17) errs.fechaNacimiento = 'El estudiante debe tener al menos 17 años'
    if (!formData.escuela) errs.escuela = 'Selecciona una escuela'
    if (!formData.carreraId) errs.carreraId = 'Selecciona una carrera'
    if (!formData.boleta) errs.boleta = 'Obligatorio'
    if (!formData.password) errs.password = 'Obligatorio'
    else if (!validarPassword(formData.password)) errs.password = 'Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo'
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const checks = await Promise.all([
      validarCampoUnico('username', formData.username),
      validarCampoUnico('correo', formData.correo),
      validarCampoUnico('curp', formData.curp),
      validarCampoUnico('boleta', formData.boleta),
    ])
    if (checks.includes(false)) return

    setEnviando(true)
    try {
      await createArrendatario({
        username: formData.username, nombres: formData.nombres,
        apellidoPaterno: formData.apellidoPaterno, apellidoMaterno: formData.apellidoMaterno,
        correo: formData.correo, telefono: formData.telefono,
        curp: formData.curp, fechaNacimiento: formData.fechaNacimiento,
        carreraId: parseInt(formData.carreraId), boleta: formData.boleta,
        password: formData.password,
      })
      onSuccess()
    } catch (error) {
      alert(error.response?.data?.error || 'Error al registrar')
    } finally { setEnviando(false) }
  }

  return (
    <>
      <div className="admin-modal-header">
        <h2 className="admin-modal-title">Registrar Estudiante</h2>
        <button className="admin-modal-close" onClick={onClose}>×</button>
      </div>

      <div className="admin-modal-body">
        <form onSubmit={handleSubmit} noValidate>
          <p className="admin-form-section">Datos Personales</p>

          <div className="admin-form-field">
            <label className="admin-form-label">Username *</label>
            <input
              className={`admin-form-input${errors.username ? ' is-error' : ''}`}
              name="username" value={formData.username} onChange={handleChange} onBlur={handleBlur} maxLength={30}
            />
            {validando.username && <span className="admin-form-hint">Validando...</span>}
            {errors.username && <span className="admin-form-error">{errors.username}</span>}
          </div>

          <div className="grid-2">
            <div className="admin-form-field">
              <label className="admin-form-label">Nombres *</label>
              <input
                className={`admin-form-input${errors.nombres ? ' is-error' : ''}`}
                name="nombres" value={formData.nombres} onChange={handleChange} maxLength={80}
              />
              {errors.nombres && <span className="admin-form-error">{errors.nombres}</span>}
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Ap. Paterno *</label>
              <input
                className={`admin-form-input${errors.apellidoPaterno ? ' is-error' : ''}`}
                name="apellidoPaterno" value={formData.apellidoPaterno} onChange={handleChange} maxLength={60}
              />
              {errors.apellidoPaterno && <span className="admin-form-error">{errors.apellidoPaterno}</span>}
            </div>
          </div>

          <div className="admin-form-field">
            <label className="admin-form-label">Ap. Materno *</label>
            <input
              className={`admin-form-input${errors.apellidoMaterno ? ' is-error' : ''}`}
              name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} maxLength={60}
            />
            {errors.apellidoMaterno && <span className="admin-form-error">{errors.apellidoMaterno}</span>}
          </div>

          <div className="grid-2">
            <div className="admin-form-field">
              <label className="admin-form-label">Correo *</label>
              <input
                className={`admin-form-input${errors.correo ? ' is-error' : ''}`}
                type="email" name="correo" value={formData.correo} onChange={handleChange} onBlur={handleBlur} maxLength={100}
              />
              {validando.correo && <span className="admin-form-hint">Validando...</span>}
              {errors.correo && <span className="admin-form-error">{errors.correo}</span>}
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Teléfono * (10 dígitos)</label>
              <input
                className={`admin-form-input${errors.telefono ? ' is-error' : ''}`}
                type="tel" name="telefono" value={formData.telefono} onChange={handleChange} maxLength={10}
              />
              {errors.telefono && <span className="admin-form-error">{errors.telefono}</span>}
            </div>
          </div>

          <div className="grid-2">
            <div className="admin-form-field">
              <label className="admin-form-label">CURP * (18 car.)</label>
              <input
                className={`admin-form-input${errors.curp ? ' is-error' : ''}`}
                name="curp" value={formData.curp} onChange={handleChange} onBlur={handleBlur} maxLength={18}
              />
              {validando.curp && <span className="admin-form-hint">Validando...</span>}
              {errors.curp && <span className="admin-form-error">{errors.curp}</span>}
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Fecha de Nacimiento *</label>
              <input
                className={`admin-form-input${errors.fechaNacimiento ? ' is-error' : ''}`}
                type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange}
              />
              {errors.fechaNacimiento && <span className="admin-form-error">{errors.fechaNacimiento}</span>}
            </div>
          </div>

          <p className="admin-form-section">Datos Académicos</p>

          <div className="grid-2">
            <div className="admin-form-field">
              <label className="admin-form-label">Escuela *</label>
              <select
                className={`admin-form-input${errors.escuela ? ' is-error' : ''}`}
                name="escuela" value={formData.escuela} onChange={handleChange}
              >
                <option value="">Selecciona</option>
                {unidades.map(u => (
                  <option key={u.idUnidadAcademica} value={u.idUnidadAcademica}>{u.unidadAcademicaNombre}</option>
                ))}
              </select>
              {errors.escuela && <span className="admin-form-error">{errors.escuela}</span>}
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Carrera *</label>
              <select
                className={`admin-form-input${errors.carreraId ? ' is-error' : ''}`}
                name="carreraId" value={formData.carreraId} onChange={handleChange}
                disabled={!formData.escuela || loading}
              >
                <option value="">{loading ? 'Cargando...' : 'Selecciona'}</option>
                {carreras.map(c => (
                  <option key={c.idCarrera} value={c.idCarrera}>{c.carreraNombre}</option>
                ))}
              </select>
              {errors.carreraId && <span className="admin-form-error">{errors.carreraId}</span>}
            </div>
          </div>

          <div className="admin-form-field">
            <label className="admin-form-label">Boleta *</label>
            <input
              className={`admin-form-input${errors.boleta ? ' is-error' : ''}`}
              name="boleta" value={formData.boleta} onChange={handleChange} onBlur={handleBlur} maxLength={10}
            />
            {validando.boleta && <span className="admin-form-hint">Validando...</span>}
            {errors.boleta && <span className="admin-form-error">{errors.boleta}</span>}
          </div>

          <p className="admin-form-section">Contraseña</p>

          <div className="grid-2">
            <div className="admin-form-field">
              <label className="admin-form-label">Contraseña *</label>
              <input
                className={`admin-form-input${errors.password ? ' is-error' : ''}`}
                type="password" name="password" value={formData.password} onChange={handleChange} maxLength={64}
              />
              {errors.password && <span className="admin-form-error">{errors.password}</span>}
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Confirmar *</label>
              <input
                className={`admin-form-input${errors.confirmPassword ? ' is-error' : ''}`}
                type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} maxLength={64}
              />
              {errors.confirmPassword && <span className="admin-form-error">{errors.confirmPassword}</span>}
            </div>
          </div>
          <span className="admin-form-hint">Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo (@$!%*?&)</span>
        </form>
      </div>

      <div className="admin-modal-footer">
        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
        <button className="btn-save" onClick={handleSubmit} disabled={enviando}>
          {enviando ? 'Registrando...' : 'Registrar Estudiante'}
        </button>
      </div>
    </>
  )
}

export default FormRegistroEstudiante
