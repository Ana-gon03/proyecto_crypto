import React, { useState } from 'react'
import NavbarInicio from '../../components/common/NavbarInicio'
import FooterRegistro from '../../components/common/FooterRegistro'
import RegistroEstudiante from '../../components/registro/RegistroEstudiante'
import RegistroArrendador from '../../components/registro/RegistroArrendador'

const RegistroUsuarioPage = () => {
  const [tipoUsuario, setTipoUsuario] = useState(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarInicio />
      <main style={{ flex: 1, padding: '2rem' }}>
        {!tipoUsuario ? (
          <div style={{ textAlign: 'center' }}>
            <h1>Registro de Usuario</h1>
            <p>Selecciona el tipo de cuenta que deseas crear</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              <button onClick={() => setTipoUsuario('estudiante')} style={{ padding: '1rem 2rem' }}>
                🎓 Estudiante IPN
              </button>
              <button onClick={() => setTipoUsuario('arrendador')} style={{ padding: '1rem 2rem' }}>
                🏠 Arrendador
              </button>
            </div>
          </div>
        ) : tipoUsuario === 'estudiante' ? (
          <RegistroEstudiante volver={() => setTipoUsuario(null)} />
        ) : (
          <RegistroArrendador volver={() => setTipoUsuario(null)} />
        )}
      </main>
      <FooterRegistro />
    </div>
  )
}

export default RegistroUsuarioPage