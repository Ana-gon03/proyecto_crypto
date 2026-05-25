import React from 'react'
import NavbarArrendatario from '../../components/common/NavbarArrendatario'
import FooterInicio from '../../components/common/FooterInicio'
import GestionLlaves from '../../components/common/GestionLlaves'
import '../../styles/Arrendatario.css'

const MiCertificadoPage = () => {
  const nombre = localStorage.getItem('usuarioNom') || ''

  return (
    <div className="atr-page">
      <NavbarArrendatario />
      <div className="atr-main" style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 className="atr-page-title" style={{ marginBottom: '1.5rem' }}>Mi Certificado Digital</h1>
        <GestionLlaves nombreUsuario={nombre} />
      </div>
      <FooterInicio />
    </div>
  )
}

export default MiCertificadoPage
