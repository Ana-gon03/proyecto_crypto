import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import NavbarInicio from '../../components/common/NavbarInicio'
import FooterRegistro from '../../components/common/FooterRegistro'
import { getAvisoPrivacidad } from '../../services/legalContent'

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  main: {
    flex: 1,
    maxWidth: '800px',
    width: '100%',
    margin: '0 auto',
    padding: '2rem 1.5rem',
  },
  titulo: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#111827',
    marginBottom: '0.25rem',
  },
  subtituloGris: {
    fontSize: '0.9rem',
    color: '#6b7280',
    marginBottom: '1.5rem',
  },
  selectorWrap: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
    backgroundColor: '#e5e7eb',
    borderRadius: '10px',
    padding: '4px',
    width: 'fit-content',
  },
  tabBase: {
    padding: '0.45rem 1.25rem',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActivo: {
    backgroundColor: '#fff',
    color: '#1a3a4a',
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  },
  tabInactivo: {
    backgroundColor: 'transparent',
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '1rem',
  },
  seccion: {
    marginBottom: '1.5rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #f3f4f6',
  },
  seccionUltima: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottom: 'none',
  },
  seccionTitulo: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#1a3a4a',
    marginBottom: '0.5rem',
  },
  seccionTexto: {
    fontSize: '0.875rem',
    color: '#4b5563',
    lineHeight: 1.75,
    whiteSpace: 'pre-line',
    margin: 0,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
    borderRadius: '999px',
    padding: '0.25rem 0.75rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    marginBottom: '1.5rem',
  },
  fechaActualizacion: {
    fontSize: '0.78rem',
    color: '#9ca3af',
    marginTop: '1.5rem',
    textAlign: 'right',
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

const AvisoPrivacidadPage = () => {
  const [searchParams] = useSearchParams()
  const rolInicial = searchParams.get('rol') === 'arrendador' ? 'arrendador' : 'estudiante'
  const [rol, setRol] = useState(rolInicial)

  const doc = getAvisoPrivacidad(rol)

  return (
    <div style={s.page}>
      <NavbarInicio />

      <main style={s.main}>
        <h1 style={s.titulo}>{doc.titulo}</h1>
        <p style={s.subtituloGris}>
          Conoce cómo tratamos tus datos personales según tu rol en la plataforma.
        </p>

        {/* Selector de rol */}
        <div style={s.selectorWrap}>
          <button
            style={{ ...s.tabBase, ...(rol === 'estudiante' ? s.tabActivo : s.tabInactivo) }}
            onClick={() => setRol('estudiante')}
          >
            🎓 Estudiante
          </button>
          <button
            style={{ ...s.tabBase, ...(rol === 'arrendador' ? s.tabActivo : s.tabInactivo) }}
            onClick={() => setRol('arrendador')}
          >
            🏠 Arrendador
          </button>
        </div>

        {/* Badge rol */}
        <div style={s.badge}>
          {rol === 'estudiante' ? '🎓 Versión para Estudiantes IPN' : '🏠 Versión para Arrendadores'}
        </div>

        {/* Contenido */}
        <div style={s.card}>
          {doc.contenido.map((seccion, i) => (
            <div
              key={i}
              style={i === doc.contenido.length - 1 ? s.seccionUltima : s.seccion}
            >
              <div style={s.seccionTitulo}>{seccion.subtitulo}</div>
              <p style={s.seccionTexto}>{seccion.texto}</p>
            </div>
          ))}
        </div>

        <p style={s.fechaActualizacion}>Última actualización: mayo 2026</p>
      </main>

      <FooterRegistro />
    </div>
  )
}

export default AvisoPrivacidadPage