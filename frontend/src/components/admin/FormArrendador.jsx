import React, { useState, useEffect } from 'react'
import { buscarCP } from '../../services/cpService'
import { updateArrendador } from '../../services/adminService'
import './admin.css'

const FormArrendador = ({ arrendador, onClose, onSuccess }) => {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [sugerenciasCP, setSugerenciasCP] = useState([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [buscandoCP, setBuscandoCP] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    usuarioApePat: '', usuarioApeMat: '', usuarioNom: '',
    usuarioCorreo: '', usuarioTel: '', usuarioCurp: '',
    usuarioFechaNac: '', arrendadorRFC: '',
    direccionCalle: '', direccionNumExt: '', direccionNumInt: '',
    cp: '', colonia: '', municipio: '', estado: ''
  })

  const isVerified = arrendador?.arrendadorFechaVerificacion !== null

  useEffect(() => {
    if (arrendador) {
      setFormData({
        usuarioApePat: arrendador.usuario?.usuarioApePat || '',
        usuarioApeMat: arrendador.usuario?.usuarioApeMat || '',
        usuarioNom: arrendador.usuario?.usuarioNom || '',
        usuarioCorreo: arrendador.usuario?.usuarioCorreo || '',
        usuarioTel: arrendador.usuario?.usuarioTel || '',
        usuarioCurp: arrendador.usuario?.usuarioCurp || '',
        usuarioFechaNac: arrendador.usuario?.usuarioFechaNac || '',
        arrendadorRFC: arrendador.arrendadorRFC || '',
        direccionCalle: arrendador.direccion?.direccionCalle || '',
        direccionNumExt: arrendador.direccion?.direccionNumExt || '',
        direccionNumInt: arrendador.direccion?.direccionNumInt || '',
        cp: arrendador.direccion?.cp?.d_codigo || '',
        colonia: arrendador.direccion?.cp?.d_asenta || '',
        municipio: arrendador.direccion?.cp?.D_mnpio || '',
        estado: arrendador.direccion?.cp?.d_estado || ''
      })
    }
  }, [arrendador])

  const handleChange = (e) => {
    const { name, value } = e.target
    let v = value
    if (['usuarioNom', 'usuarioApePat', 'usuarioApeMat'].includes(name)) {
      v = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '')
    }
    if (name === 'usuarioTel') v = value.replace(/[^0-9]/g, '').slice(0, 10)
    if (name === 'usuarioCurp') v = value.toUpperCase().slice(0, 18)
    if (name === 'arrendadorRFC') v = value.toUpperCase().slice(0, 13)
    setFormData(prev => ({ ...prev, [name]: v }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const handleCPChange = async (e) => {
    const cpNumeros = e.target.value.replace(/[^0-9]/g, '').slice(0, 5)
    setFormData(prev => ({ ...prev, cp: cpNumeros, colonia: '', municipio: '', estado: '' }))
    if (cpNumeros.length === 5) {
      setBuscandoCP(true)
      try {
        const resultados = await buscarCP(cpNumeros)
        if (resultados.length > 0) { setSugerenciasCP(resultados); setMostrarSugerencias(true) }
      } catch { } finally { setBuscandoCP(false) }
    } else { setSugerenciasCP([]); setMostrarSugerencias(false) }
  }

  const seleccionarDireccion = (d) => {
    setFormData(prev => ({ ...prev, cp: d.d_codigo, colonia: d.d_asenta, municipio: d.D_mnpio, estado: d.d_estado }))
    setMostrarSugerencias(false); setSugerenciasCP([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!formData.usuarioNom) errs.usuarioNom = 'Obligatorio'
    if (!formData.usuarioApePat) errs.usuarioApePat = 'Obligatorio'
    if (formData.usuarioTel && formData.usuarioTel.length !== 10) errs.usuarioTel = 'Debe tener 10 dígitos'
    if (!isVerified && formData.usuarioCurp && formData.usuarioCurp.length !== 18) errs.usuarioCurp = 'Debe tener 18 caracteres'
    if (!isVerified && formData.arrendadorRFC && formData.arrendadorRFC.length < 12) errs.arrendadorRFC = 'RFC inválido (12-13 car.)'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSaving(true); setError('')
    const usuarioData = {
      usuarioNom: formData.usuarioNom, usuarioApePat: formData.usuarioApePat,
      usuarioApeMat: formData.usuarioApeMat, usuarioTel: formData.usuarioTel,
      usuarioFechaNac: formData.usuarioFechaNac,
      ...(!isVerified && { usuarioCurp: formData.usuarioCurp })
    }
    const arrendadorData = { arrendadorRFC: formData.arrendadorRFC }
    const direccionData = {
      calle: formData.direccionCalle, numExt: formData.direccionNumExt,
      numInt: formData.direccionNumInt, cp: formData.cp,
      colonia: formData.colonia, municipio: formData.municipio, estado: formData.estado
    }
    try {
      await updateArrendador(arrendador.idArrendador, usuarioData, arrendadorData, direccionData)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <>
      <div className="admin-modal-header">
        <h2 className="admin-modal-title">Editar Arrendador</h2>
        <button className="admin-modal-close" onClick={onClose}>×</button>
      </div>

      <div className="admin-modal-body">
        {error && <div className="admin-form-notice error">{error}</div>}
        {isVerified && (
          <div className="admin-form-notice verified">
            ✓ Arrendador verificado — CURP, RFC y correo no se pueden editar.
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
              <label className="admin-form-label">RFC (12-13 car.)</label>
              <input
                className={`admin-form-input${errors.arrendadorRFC ? ' is-error' : ''}`}
                name="arrendadorRFC" value={formData.arrendadorRFC} onChange={handleChange} disabled={isVerified} maxLength={13}
              />
              {errors.arrendadorRFC && <span className="admin-form-error">{errors.arrendadorRFC}</span>}
            </div>
          </div>

          <div className="admin-form-field">
            <label className="admin-form-label">Fecha de Nacimiento</label>
            <input
              className="admin-form-input"
              type="date" name="usuarioFechaNac" value={formData.usuarioFechaNac} onChange={handleChange}
              style={{ width: 'auto' }}
            />
          </div>

          <p className="admin-form-section">Domicilio</p>

          <div className="grid-cp">
            <div className="admin-form-field" style={{ position: 'relative' }}>
              <label className="admin-form-label">C.P.</label>
              <input className="admin-form-input" name="cp" value={formData.cp} onChange={handleCPChange} maxLength={5} />
              {buscandoCP && <span className="admin-form-hint">Buscando...</span>}
              {mostrarSugerencias && sugerenciasCP.length > 0 && (
                <div className="cp-dropdown">
                  {sugerenciasCP.map((s, i) => (
                    <div key={i} className="cp-dropdown-item" onClick={() => seleccionarDireccion(s)}>
                      {s.d_asenta}, {s.D_mnpio}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Calle</label>
              <input className="admin-form-input" name="direccionCalle" value={formData.direccionCalle} onChange={handleChange} maxLength={100} />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">No. Ext</label>
              <input className="admin-form-input" name="direccionNumExt" value={formData.direccionNumExt} onChange={handleChange} maxLength={10} />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">No. Int</label>
              <input className="admin-form-input" name="direccionNumInt" value={formData.direccionNumInt} onChange={handleChange} maxLength={10} />
            </div>
          </div>

          <div className="grid-3">
            {[['Colonia', 'colonia'], ['Municipio', 'municipio'], ['Estado', 'estado']].map(([lbl, key]) => (
              <div key={key} className="admin-form-field">
                <label className="admin-form-label">{lbl}</label>
                <input className="admin-form-input" value={formData[key]} disabled />
              </div>
            ))}
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

export default FormArrendador
