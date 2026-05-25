import React from 'react'
import NavbarArrendador from '../../components/common/NavbarArrendador'
import FooterInicio from '../../components/common/FooterInicio'
import GestionLlaves from '../../components/common/GestionLlaves'
import '../../styles/Arrendador.css'

const MiCertificadoArrendadorPage = () => {
  const nombre = localStorage.getItem('usuarioNom') || ''

  return (
    <div className="arr-page">
      <NavbarArrendador />
      <div className="arr-main" style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 className="arr-page-title" style={{ marginBottom: '1.5rem' }}>Mi Certificado Digital</h1>
        <GestionLlaves nombreUsuario={nombre} />
      </div>
      <FooterInicio />
    </div>
  )
}

export default MiCertificadoArrendadorPage
