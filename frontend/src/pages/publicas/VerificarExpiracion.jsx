import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import NavbarInicio from '../../components/common/NavbarInicio'
import FooterInicio from '../../components/common/FooterInicio'
import { verificarExpiracion } from '../../services/authService'

const VerificarExpiracion = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [estado, setEstado] = useState('cargando') // 'cargando' | 'eliminado' | 'activo' | 'error'
  const [diasRestantes, setDiasRestantes] = useState(null)

  useEffect(() => {
    const userId = location.state?.userId
    if (!userId) {
      navigate('/usuarios/inicio-sesion')
      return
    }

    const verificar = async () => {
      try {
        const data = await verificarExpiracion(userId)
        if (data.expirado) {
          localStorage.clear()
          setEstado('eliminado')
        } else {
          setDiasRestantes(data.diasRestantes)
          setEstado('activo')
          // Ya NO redirige automático, el usuario decide cuándo continuar
        }
      } catch {
        setEstado('error')
      }
    }

    verificar()
  }, [location, navigate])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarInicio />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>

          {estado === 'cargando' && (
            <div>
              <h2>Verificando tu cuenta...</h2>
              <p style={{ color: '#666' }}>Estamos revisando el estado de tu verificación.</p>
            </div>
          )}

          {estado === 'eliminado' && (
            <div>
              <h2 style={{ color: '#cc0000' }}>Cuenta eliminada ❌</h2>
              <div style={{ padding: '1.5rem', border: '1px solid #cc0000', borderRadius: '6px', marginBottom: '1.5rem', backgroundColor: '#fff5f5' }}>
                <p>
                  No cumpliste con verificar tu identidad dentro del plazo de <strong>60 días</strong> desde tu registro.
                </p>
                <p>
                  Por esta razón, tu cuenta ha sido <strong>eliminada del sistema</strong>.
                </p>
                <p style={{ marginTop: '1rem' }}>
                  Si deseas continuar usando la plataforma, deberás <strong>registrarte nuevamente</strong>.
                </p>
              </div>
              <button
                onClick={() => navigate('/registro')}
                style={{ padding: '0.75rem 2rem', marginRight: '0.5rem', cursor: 'pointer', backgroundColor: '#1a3a4a', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1rem' }}
              >
                Registrarme de nuevo
              </button>
              <button
                onClick={() => navigate('/')}
                style={{ padding: '0.75rem 2rem', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1rem' }}
              >
                Ir al inicio
              </button>
            </div>
          )}

          {estado === 'activo' && (
            <div>
              <h2 style={{ color: '#16a34a' }}>Cuenta activa ✅</h2>
              <div style={{ padding: '1.5rem', border: '2px solid #16a34a', borderRadius: '6px', marginBottom: '1.5rem', backgroundColor: '#f0fdf4' }}>
                <p style={{ fontSize: '1.1rem', color: '#166534' }}>
                  Tu cuenta está activa y puedes usar la plataforma.
                </p>
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#dcfce7', borderRadius: '6px' }}>
                  <p style={{ fontSize: '1.2rem', color: '#15803d', fontWeight: 'bold' }}>
                    ⏰ Te quedan <span style={{ fontSize: '1.5rem' }}>{diasRestantes}</span> días
                  </p>
                  <p style={{ color: '#166534', marginTop: '0.5rem' }}>
                    para verificar tu identidad subiendo tu constancia de estudios.
                  </p>
                </div>
                <p style={{ marginTop: '1rem', color: '#166534', fontSize: '0.9rem' }}>
                  Si no verificas tu identidad en el plazo establecido, tu cuenta será eliminada automáticamente.
                </p>
              </div>
              <button
                onClick={() => navigate('/arrendatario/buscar-vivienda')}
                style={{ padding: '0.75rem 2rem', marginRight: '0.5rem', cursor: 'pointer', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1rem', fontWeight: 'bold' }}
              >
                🏠 Buscar vivienda
              </button>
              <button
                onClick={() => navigate('/arrendatario/perfil')}
                style={{ padding: '0.75rem 2rem', cursor: 'pointer', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1rem' }}
              >
                📤 Verificar ahora
              </button>
            </div>
          )}

          {estado === 'error' && (
            <div>
              <h2>Ocurrió un error</h2>
              <p>No se pudo verificar el estado de tu cuenta. Intenta iniciar sesión nuevamente.</p>
              <button
                onClick={() => navigate('/usuarios/inicio-sesion')}
                style={{ padding: '0.75rem 2rem', marginTop: '1rem', cursor: 'pointer' }}
              >
                Volver al login
              </button>
            </div>
          )}

        </div>
      </main>
      <FooterInicio />
    </div>
  )
}

export default VerificarExpiracion