import React, { useState, useEffect } from 'react'
import { getUnidadesAcademicas, getCarrerasByUnidad } from '../../services/catalogosService'
import { updateArrendatario } from '../../services/adminService'
import './admin.css'

const FormEstudiante = ({ arrendatario, onClose, onSuccess }) => {
  const [unidades, setUnidades] = useState([])
  const [carreras, setCarreras] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  const isVerified = arrendatario?.arrendatarioVerificado === 1

  const [formData, setFormData] = useState({
    usuarioNom: '', usuarioApePat: '', usuarioApeMat: '',
    usuarioCorreo: '', usuarioTel: '', usuarioCurp: '',
    usuarioFechaNac: '', arrendatarioBoleta: '',
    carrera_idCarrera: '', escuelaId: ''
  })

  useEffect(() => {
    if (arrendatario) {
      setFormData({
        usuarioNom: arrendatario.usuario?.usuarioNom || '',
        usuarioApePat: arrendatario.usuario?.usuarioApePat || '',
        usuarioApeMat: arrendatario.usuario?.usuarioApeMat || '',
        usuarioCorreo: arrendatario.usuario?.usuarioCorreo || '',
        usuarioTel: arrendatario.usuario?.usuarioTel || '',
        usuarioCurp: arrendatario.usuario?.usuarioCurp || '',
        usuarioFechaNac: arrendatario.usuario?.usuarioFechaNac || '',
        arrendatarioBoleta: arrendatario.arrendatarioBoleta || '',
        carrera_idCarrera: arrendatario.carrera_idCarrera || '',
        escuelaId: arrendatario.carrera?.unidadAcademica?.idUnidadAcademica || ''
      })
      if (arrendatario.carrera?.unidadAcademica?.idUnidadAcademica) cargarCarreras(arrendatario.carrera.unidadAcademica.idUnidadAcademica)
    }
  }, [arrendatario])

  useEffect(() => {
    const cargar = async () => {
      try { const data = await getUnidadesAcademicas(); setUnidades(data) } catch { }
    }
    cargar()
  }, [])

  const cargarCarreras = async (id) => {
    setLoading(true)
    try { const data = await getCarrerasByUnidad(id); setCarreras(data) } catch { }
    finally { setLoading(false) }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let v = value
    if (['usuarioNom', 'usuarioApePat', 'usuarioApeMat'].includes(name)) {
      v = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '')
    }
    if (name === 'usuarioTel') v = value.replace(/[^0-9]/g, '').slice(0, 10)
    if (name === 'usuarioCurp') v = value.toUpperCase().slice(0, 18)
    if (name === 'arrendatarioBoleta') v = value.replace(/[^0-9]/g, '').slice(0, 10)
    setFormData(prev => ({ ...prev, [name]: v }))
    if (name === 'escuelaId') {
      setFormData(prev => ({ ...prev, escuelaId: v, carrera_idCarrera: '' }))
      cargarCarreras(v)
      return
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!formData.usuarioNom) errs.usuarioNom = 'Obligatorio'
    if (!formData.usuarioApePat) errs.usuarioApePat = 'Obligatorio'
    if (formData.usuarioTel && formData.usuarioTel.length !== 10) errs.usuarioTel = 'Debe tener 10 dígitos'
    if (!isVerified && formData.usuarioCurp && formData.usuarioCurp.length !== 18) errs.usuarioCurp = 'Debe tener 18 caracteres'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSaving(true); setError('')
    const usuarioData = {
      usuarioNom: formData.usuarioNom, usuarioApePat: formData.usuarioApePat,
      usuarioApeMat: formData.usuarioApeMat, usuarioTel: formData.usuarioTel,
      usuarioFechaNac: formData.usuarioFechaNac,
      ...(!isVerified && { usuarioCurp: formData.usuarioCurp })
    }
    const arrendatarioData = {
      arrendatarioBoleta: formData.arrendatarioBoleta,
      carrera_idCarrera: formData.carrera_idCarrera
    }
    try {
      await updateArrendatario(arrendatario.idArrendatario, usuarioData, arrendatarioData)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <>
      <div className="admin-modal-header">
        <h2 className="admin-modal-title">
          {arrendatario ? 'Editar Estudiante' : 'Registrar Estudiante'}
        </h2>
        <button className="admin-modal-close" onClick={onClose}>×</button>
      </div>

      <div className="admin-modal-body">
        {error && <div className="admin-form-notice error">{error}</div>}
        {isVerified && (
          <div className="admin-form-notice verified">
            ✓ Estudiante verificado — CURP, boleta, correo y username no se pueden editar.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <p className="admin-form-section">Datos Personales</p>

          <div className="grid-2">
            <div className="admin-form-field">
              <label className="admin-form-label">Nombres *</label>
              <input
                className={`admin-form-input${errors.usuarioNom ? ' is-error' : ''}`}
                name="usuarioNom" value={formData.usuarioNom} onChange={handleChange} maxLength={80}
              />
              {errors.usuarioNom && <span className="admin-form-error">{errors.usuarioNom}</span>}
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Ap. Paterno *</label>
              <input
                className={`admin-form-input${errors.usuarioApePat ? ' is-error' : ''}`}
                name="usuarioApePat" value={formData.usuarioApePat} onChange={handleChange} maxLength={60}
              />
              {errors.usuarioApePat && <span className="admin-form-error">{errors.usuarioApePat}</span>}
            </div>
          </div>

          <div className="admin-form-field">
            <label className="admin-form-label">Ap. Materno</label>
            <input className="admin-form-input" name="usuarioApeMat" value={formData.usuarioApeMat} onChange={handleChange} maxLength={60} />
          </div>

          <div className="grid-2">
            <div className="admin-form-field">
              <label className="admin-form-label">Correo</label>
              <input className="admin-form-input" value={formData.usuarioCorreo} disabled />
              <span className="admin-form-hint">No modificable</span>
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Teléfono (10 dígitos)</label>
              <input
                className={`admin-form-input${errors.usuarioTel ? ' is-error' : ''}`}
                type="tel" name="usuarioTel" value={formData.usuarioTel} onChange={handleChange} maxLength={10}
              />
              {errors.usuarioTel && <span className="admin-form-error">{errors.usuarioTel}</span>}
            </div>
          </div>

          <div className="grid-2">
            <div className="admin-form-field">
              <label className="admin-form-label">CURP (18 car.)</label>
              <input
                className={`admin-form-input${errors.usuarioCurp ? ' is-error' : ''}`}
                name="usuarioCurp" value={formData.usuarioCurp} onChange={handleChange} disabled={isVerified} maxLength={18}
              />
              {errors.usuarioCurp && <span className="admin-form-error">{errors.usuarioCurp}</span>}
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Fecha de Nacimiento</label>
              <input
                className="admin-form-input"
                type="date" name="usuarioFechaNac" value={formData.usuarioFechaNac} onChange={handleChange}
              />
            </div>
          </div>

          <p className="admin-form-section">Datos Académicos</p>

          <div className="grid-2">
            <div className="admin-form-field">
              <label className="admin-form-label">Escuela</label>
              <select className="admin-form-input" name="escuelaId" value={formData.escuelaId} onChange={handleChange}>
                <option value="">Selecciona</option>
                {unidades.map(u => (
                  <option key={u.idUnidadAcademica} value={u.idUnidadAcademica}>{u.unidadAcademicaNombre}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Carrera</label>
              <select
                className="admin-form-input"
                name="carrera_idCarrera" value={formData.carrera_idCarrera} onChange={handleChange}
                disabled={!formData.escuelaId || loading}
              >
                <option value="">{loading ? 'Cargando...' : 'Selecciona'}</option>
                {carreras.map(c => (
                  <option key={c.idCarrera} value={c.idCarrera}>{c.carreraNombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-form-field">
            <label className="admin-form-label">Boleta</label>
            <input
              className="admin-form-input"
              name="arrendatarioBoleta" value={formData.arrendatarioBoleta} onChange={handleChange}
              disabled={isVerified} maxLength={10}
            />
          </div>
        </form>
      </div>

      <div className="admin-modal-footer">
        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
        <button className="btn-save" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </>
  )
}

export default FormEstudiante
