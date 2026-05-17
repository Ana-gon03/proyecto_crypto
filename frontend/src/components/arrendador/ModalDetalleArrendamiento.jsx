import React from 'react'
import { descargarContratoPDF } from '../../services/arrendamientoService'
import '../../styles/Arrendador.css'

const ModalDetalleArrendamiento = ({ arrendamiento, onClose }) => {
  const formatearDireccion = () => {
    const dir = arrendamiento.propiedad?.direccion
    if (!dir) return 'Dirección no disponible'
    let d = `${dir.direccionCalle} #${dir.direccionNumExt}`
    if (dir.direccionNumInt) d += ` Int. ${dir.direccionNumInt}`
    if (dir.cp) d += `, Col. ${dir.cp.d_asenta}, ${dir.cp.D_mnpio}, ${dir.cp.d_estado}, CP ${dir.cp.d_codigo}`
    return d
  }

  const precioPor = arrendamiento.propiedad?.propiedadPrecioPor
  const labelPrecio = precioPor === 'Propiedad' ? 'Propiedad completa' : precioPor === 'Persona' ? 'Por persona' : 'Por habitación'

  return (
    <div className="arr-modal-overlay">
      <div className="arr-modal arr-modal-md">
        <div className="arr-modal-header">
          <h3 className="arr-modal-title">Detalle del Arrendamiento</h3>
          <button className="arr-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="arr-modal-body">
          {/* Vivienda */}
          <div className="arr-info-section">
            <p className="arr-info-section-title">🏠 Vivienda</p>
            <div className="arr-info-grid">
              <div className="arr-info-item">
                <p className="arr-info-label">Título</p>
                <p className="arr-info-value">{arrendamiento.propiedad?.propiedadTitulo}</p>
              </div>
              <div className="arr-info-item">
                <p className="arr-info-label">Tipo</p>
                <p className="arr-info-value">{arrendamiento.propiedad?.propiedadTipo}</p>
              </div>
              <div className="arr-info-item">
                <p className="arr-info-label">Renta</p>
                <p className="arr-info-value price">${arrendamiento.arrendamientoRenta}/mes</p>
              </div>
              <div className="arr-info-item">
                <p className="arr-info-label">Precio por</p>
                <p className="arr-info-value">{labelPrecio}</p>
              </div>
            </div>
            <div className="arr-info-item" style={{ marginTop: '0.5rem' }}>
              <p className="arr-info-label">Dirección</p>
              <p className="arr-info-value">{formatearDireccion()}</p>
            </div>
          </div>

          {/* Estudiante */}
          <div className="arr-info-section">
            <p className="arr-info-section-title">👤 Estudiante</p>
            <div className="arr-info-grid">
              <div className="arr-info-item">
                <p className="arr-info-label">Nombre</p>
                <p className="arr-info-value">
                  {arrendamiento.arrendatario?.usuario?.usuarioNom}{' '}
                  {arrendamiento.arrendatario?.usuario?.usuarioApePat}{' '}
                  {arrendamiento.arrendatario?.usuario?.usuarioApeMat}
                </p>
              </div>
              <div className="arr-info-item">
                <p className="arr-info-label">Username</p>
                <p className="arr-info-value">@{arrendamiento.arrendatario?.arrendatarioUser}</p>
              </div>
              <div className="arr-info-item">
                <p className="arr-info-label">Correo</p>
                <p className="arr-info-value">{arrendamiento.arrendatario?.usuario?.usuarioCorreo}</p>
              </div>
              <div className="arr-info-item">
                <p className="arr-info-label">Teléfono</p>
                <p className="arr-info-value">{arrendamiento.arrendatario?.usuario?.usuarioTel || '—'}</p>
              </div>
            </div>
          </div>

          {/* Datos del contrato */}
          <div className="arr-info-section">
            <p className="arr-info-section-title">📝 Datos del Contrato</p>
            <div className="arr-info-grid">
              <div className="arr-info-item">
                <p className="arr-info-label">Fecha de inicio</p>
                <p className="arr-info-value">
                  {new Date(arrendamiento.arrendamientoFechaInicio).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="arr-info-item">
                <p className="arr-info-label">Estado</p>
                <p className="arr-info-value">
                  {arrendamiento.arrendamientoValArrendador === 1
                    ? <span className="arr-badge arr-badge-warning">⏳ Pendiente estudiante</span>
                    : <span className="arr-badge arr-badge-success">✓ Activo</span>
                  }
                </p>
              </div>
            </div>
            <div className="arr-info-item" style={{ marginTop: '0.5rem' }}>
              <p className="arr-info-label">Descripción</p>
              <p className="arr-info-value">{arrendamiento.arrendamientoDescrip || <span className="muted">Sin descripción</span>}</p>
            </div>
          </div>
        </div>

        <div className="arr-modal-footer">
          <button className="arr-btn-ghost arr-btn-sm" onClick={onClose}>Cerrar</button>
          <button
            className="arr-btn-primary arr-btn-sm"
            onClick={() => descargarContratoPDF(arrendamiento.idArrendamiento)}
          >
            📄 Ver PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalDetalleArrendamiento
