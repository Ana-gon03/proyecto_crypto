import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAvisoPrivacidad, getTerminosUso } from '../../services/legalContent'

// ─── Estilos del modal ───────────────────────────────────────────────────────

const estilos = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    backdropFilter: 'blur(2px)',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    maxWidth: '680px',
    width: '100%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  header: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    flexShrink: 0,
  },
  titulo: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#111827',
  },
  cerrar: {
    background: 'none',
    border: 'none',
    fontSize: '1.4rem',
    cursor: 'pointer',
    color: '#6b7280',
    lineHeight: 1,
    padding: '0.2rem 0.4rem',
    borderRadius: '4px',
  },
  cuerpo: {
    overflowY: 'auto',
    padding: '1.5rem',
    flex: 1,
  },
  seccion: {
    marginBottom: '1.25rem',
  },
  subtitulo: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#374151',
    marginBottom: '0.4rem',
  },
  parrafo: {
    fontSize: '0.85rem',
    color: '#4b5563',
    lineHeight: 1.7,
    whiteSpace: 'pre-line',
    margin: 0,
  },
  footer: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  enlaceCompleto: {
    fontSize: '0.78rem',
    color: '#2563eb',
    textDecoration: 'underline',
  },
  btnCerrar: {
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1.25rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
  }
}

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * LegalModal — muestra Aviso de Privacidad o Términos y Condiciones.
 *
 * Props:
 *   tipo     → 'privacidad' | 'terminos'
 *   rol      → 'estudiante' | 'arrendador'  (default: 'estudiante')
 *   onCerrar → función para cerrar el modal
 */
const LegalModal = ({ tipo, rol = 'estudiante', onCerrar }) => {
  const doc = tipo === 'privacidad'
    ? getAvisoPrivacidad(rol)
    : getTerminosUso(rol)

  const rutaCompleta = tipo === 'privacidad'
    ? `/legal/aviso-privacidad?rol=${rol}`
    : `/legal/terminos-uso?rol=${rol}`

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCerrar])

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div style={estilos.overlay} onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}>
      <div style={estilos.modal} role="dialog" aria-modal="true" aria-labelledby="modal-titulo">

        {/* Cabecera */}
        <div style={estilos.header}>
          <h2 id="modal-titulo" style={estilos.titulo}>{doc.titulo}</h2>
          <button style={estilos.cerrar} onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>

        {/* Contenido */}
        <div style={estilos.cuerpo}>
          {doc.contenido.map((seccion, i) => (
            <div key={i} style={estilos.seccion}>
              <div style={estilos.subtitulo}>{seccion.subtitulo}</div>
              <p style={estilos.parrafo}>{seccion.texto}</p>
            </div>
          ))}
        </div>

        {/* Pie — enlace a página completa + botón cerrar */}
        <div style={estilos.footer}>
          <Link
            to={rutaCompleta}
            style={estilos.enlaceCompleto}
            onClick={onCerrar}
          >
            Ver versión completa ↗
          </Link>
          <button style={estilos.btnCerrar} onClick={onCerrar}>Entendido</button>
        </div>

      </div>
    </div>
  )
}

export default LegalModal