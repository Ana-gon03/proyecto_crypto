import React from 'react'
import { descargarContratoPDF } from '../../services/arrendamientoService'

const ModalDetalleArrendamiento = ({ arrendamiento, onClose }) => {
  const formatearDireccion = () => {
    const dir = arrendamiento.propiedad?.direccion
    if (!dir) return 'Dirección no disponible'
    let direccion = `${dir.direccionCalle} #${dir.direccionNumExt}`
    if (dir.direccionNumInt) direccion += ` Int. ${dir.direccionNumInt}`
    if (dir.cp) {
      direccion += `, Col. ${dir.cp.d_asenta}, ${dir.cp.D_mnpio}, ${dir.cp.d_estado}, CP ${dir.cp.d_codigo}`
    }
    return direccion
  }

  const handleDescargarPDF = () => {
    descargarContratoPDF(arrendamiento.idArrendamiento)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Detalle del Arrendamiento</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Información de la vivienda */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>📋 Vivienda</h4>
          <p><strong>Título:</strong> {arrendamiento.propiedad?.propiedadTitulo}</p>
          <p><strong>Tipo:</strong> {arrendamiento.propiedad?.propiedadTipo}</p>
          <p><strong>📍 Dirección:</strong> {formatearDireccion()}</p>
          <p><strong>Precio:</strong> ${arrendamiento.arrendamientoRenta}/mes</p>
        </div>

        {/* Información del estudiante */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>👤 Estudiante</h4>
          <p><strong>Nombre:</strong> {arrendamiento.arrendatario?.usuario?.usuarioNom} {arrendamiento.arrendatario?.usuario?.usuarioApePat} {arrendamiento.arrendatario?.usuario?.usuarioApeMat}</p>
          <p><strong>Username:</strong> {arrendamiento.arrendatario?.arrendatarioUser}</p>
          <p><strong>Correo:</strong> {arrendamiento.arrendatario?.usuario?.usuarioCorreo}</p>
          <p><strong>Teléfono:</strong> {arrendamiento.arrendatario?.usuario?.usuarioTel}</p>
        </div>

        {/* Datos del arrendamiento */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fff3e0', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>📝 Datos del Arrendamiento</h4>
          <p><strong>Fecha de inicio:</strong> {new Date(arrendamiento.arrendamientoFechaInicio).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>
            <strong>Precio:</strong> ${arrendamiento.arrendamientoRenta}/mes
            {arrendamiento.propiedad?.propiedadPrecioPor === 'Propiedad' && ' (Propiedad completa)'}
            {arrendamiento.propiedad?.propiedadPrecioPor === 'Persona' && ' (Por persona)'}
            {arrendamiento.propiedad?.propiedadPrecioPor === 'Habitación' && ' (Por habitación)'}
          </p>
          <p><strong>Descripción:</strong> {arrendamiento.arrendamientoDescrip || 'Sin descripción'}</p>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => descargarContratoPDF(arrendamiento.idArrendamiento)}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            📄 Ver PDF
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '0.5rem', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalDetalleArrendamiento