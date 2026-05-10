// src/pages/bienvenida/BienvenidaPage.jsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavbarRegistro from '../../components/common/NavbarRegistro';
import FooterRegistro from '../../components/common/FooterRegistro';
import { generarParClaves } from '../../services/cryptoService';
import { registrarClavePublica } from '../../services/contratoService';

const BienvenidaPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const rol = location.state?.rol;
  const verificadoConDocumento = location.state?.verificadoConDocumento;
  const pendiente = rol === 'estudiante' && verificadoConDocumento === false;

  // Generar y registrar claves criptográficas al llegar a la bienvenida
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      const existingKey = sessionStorage.getItem(`privKey_${userId}`);
      if (!existingKey) {
        generarParClaves()
          .then(async ({ publicKeyPem }) => {
            await registrarClavePublica(publicKeyPem);
            console.log('Claves generadas y registradas correctamente');
          })
          .catch(err => console.error('Error generando claves:', err));
      }
    }
  }, []);

  // ── Estudiante con verificación pendiente ──────────────────────────────────
  if (pendiente) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavbarRegistro />
        <main style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            textAlign: 'center',
            padding: '2.5rem',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            backgroundColor: '#fff'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              ¡Bienvenid@ a RentIPN!
            </h2>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
              Tu cuenta ha sido creada exitosamente.
            </p>

            <div style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fcd34d',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
                <div>
                  <p style={{ fontWeight: 700, color: '#92400e', margin: '0 0 0.3rem' }}>
                    Verificación de identidad pendiente
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#78350f', margin: 0, lineHeight: 1.6 }}>
                    Tienes <strong>2 meses</strong> para subir tu constancia de estudios y verificar tu identidad.
                    Si no lo haces antes de esa fecha, <strong>tu cuenta será eliminada automáticamente</strong>.
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#92400e', marginTop: '0.5rem', marginBottom: 0 }}>
                    Puedes hacerlo desde tu perfil en cualquier momento.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/usuarios/inicio-sesion')}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Iniciar Sesión
            </button>
          </div>
        </main>
        <FooterRegistro />
      </div>
    )
  }

  // ── Cuenta verificada (arrendador o estudiante con constancia) ─────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarRegistro />
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          padding: '2.5rem',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          backgroundColor: '#fff'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            ¡Bienvenid@ a RentIPN!
          </h2>
          <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
            Tu cuenta ha sido creada y verificada exitosamente.
            {rol === 'arrendador'
              ? ' Ya puedes publicar tus inmuebles.'
              : ' Ya puedes buscar opciones de arrendamiento.'}
          </p>

          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '0.75rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#15803d',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            <span>✔</span>
            Identidad verificada
          </div>

          <button
            onClick={() => navigate('/usuarios/inicio-sesion')}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'block'
            }}
          >
            Iniciar Sesión
          </button>
        </div>
      </main>
      <FooterRegistro />
    </div>
  );
};

export default BienvenidaPage;