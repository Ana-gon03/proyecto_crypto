import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NavbarInicio from '../../components/common/NavbarInicio';
import FooterInicio from '../../components/common/FooterInicio';
import { loginUsuario, reenviarCodigo } from '../../services/authService';
import { generarParClaves } from '../../services/cryptoService';
import { registrarClavePublica } from '../../services/contratoService';

const UsuariosInicioSesionPage = () => {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      const data = await loginUsuario(correo, password);
      const userId = data.userId;

      // Función auxiliar para generar claves si no existen
      const asegurarClaves = async (id) => {
        const existingKey = sessionStorage.getItem(`privKey_${id}`);
        if (!existingKey) {
          try {
            const { publicKeyPem } = await generarParClaves();
            await registrarClavePublica(publicKeyPem);
            console.log('Claves generadas y registradas correctamente');
          } catch (err) {
            console.error('Error generando claves:', err);
          }
        }
      };

      // ── ARRENDADOR ──────────────────────────────────────────────
      if (data.rol === 'arrendador') {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('rol', data.rol);
        localStorage.setItem('correo', data.correo);
        localStorage.setItem('arrendadorId', data.arrendadorId);
        await asegurarClaves(userId);

        if (!data.correoVerificado) {
          await reenviarCodigo(data.correo);
          navigate('/verificar-correo-login', {
            state: {
              correo: data.correo,
              userId: data.userId,
              rol: 'arrendador',
              arrendadorId: data.arrendadorId
            }
          });
          return;
        }
        localStorage.setItem('correoVerificado', '1');
        navigate('/arrendador/mis-arrendamientos');
        return;
      }

      // ── ARRENDATARIO ─────────────────────────────────────────────
      if (data.rol === 'arrendatario') {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('rol', data.rol);
        localStorage.setItem('correo', data.correo);
        localStorage.setItem('arrendatarioId', data.arrendatarioId);
        localStorage.setItem('fechaRegistro', data.fechaRegistro);
        localStorage.setItem('arrendatarioVerificado', data.arrendatarioVerificado);
        await asegurarClaves(userId);

        if (!data.correoVerificado) {
          await reenviarCodigo(data.correo);
          navigate('/verificar-correo-login', {
            state: {
              correo: data.correo,
              userId: data.userId,
              rol: 'arrendatario',
              arrendatarioId: data.arrendatarioId,
              fechaRegistro: data.fechaRegistro,
              arrendatarioVerificado: data.arrendatarioVerificado
            }
          });
          return;
        }

        localStorage.setItem('correoVerificado', '1');
        if (data.arrendatarioVerificado) {
          navigate('/arrendatario/buscar-vivienda');
          return;
        }
        navigate('/verificar-expiracion', { state: { userId: data.userId } });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarInicio />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Iniciar Sesión</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label>Correo electrónico</label><br />
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Contraseña</label><br />
              <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  style={{ width: '100%', padding: '0.5rem', paddingRight: '40px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  style={{
                    position: 'absolute',
                    right: '5px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem'
                  }}
                >
                  {mostrarPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {error && (
              <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', border: '1px solid red', borderRadius: '4px' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={cargando}
              style={{ width: '100%', padding: '0.75rem', cursor: cargando ? 'not-allowed' : 'pointer' }}
            >
              {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>
          <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
          </p>
        </div>
      </main>
      <FooterInicio />
    </div>
  );
};

export default UsuariosInicioSesionPage;