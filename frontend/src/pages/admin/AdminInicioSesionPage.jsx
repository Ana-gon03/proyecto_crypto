import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginAdmin } from '../../services/authService'
import burroLogo from '../../assets/burro.png'
import '../../styles/Login.css'
import '../../components/admin/admin.css'

const AdminInicioSesionPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ adminUser: '', adminContra: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    try {
      const response = await loginAdmin(formData.adminUser, formData.adminContra)
      localStorage.setItem('adminUser', response.adminUser)
      localStorage.setItem('adminId', response.adminId)
      navigate('/admin/arrendatarios')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-page">
      <header className="admin-login-header">
        <img src={burroLogo} alt="Blockhoom" className="admin-nav-logo" onError={e => { e.target.style.display = 'none' }} />
        <span className="admin-nav-title">Blockhoom</span>
      </header>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">
              <img src={burroLogo} alt="Blockhoom" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            </div>
            <h2>Panel Administrador</h2>
            <p>Inicia sesión para gestionar Blockhoom</p>
          </div>

          <div className="login-body">
            <form onSubmit={handleSubmit}>
              <div className="login-group">
                <label className="login-label">Usuario</label>
                <div className="login-input-wrapper">
                  <input
                    className="login-input"
                    type="text"
                    name="adminUser"
                    value={formData.adminUser}
                    onChange={handleChange}
                    placeholder="Ej: admin_root"
                    required
                  />
                </div>
              </div>

              <div className="login-group">
                <label className="login-label">Contraseña</label>
                <div className="login-input-wrapper">
                  <input
                    className="login-input login-input-icon"
                    type={mostrarPassword ? 'text' : 'password'}
                    name="adminContra"
                    value={formData.adminContra}
                    onChange={handleChange}
                    placeholder="Ingresa tu contraseña"
                    required
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                  >
                    {mostrarPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-error">
                  <span className="login-error-icon">⚠️</span>
                  <span className="login-error-text">{error}</span>
                </div>
              )}

              <button type="submit" className="login-btn" disabled={cargando}>
                {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión →'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <Link to="/" style={{ color: 'var(--text-light)', fontSize: '0.82rem', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--purple-600)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-light)'}
                >
                  ← Volver al inicio
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <footer className="admin-login-footer">
        Blockhoom — Panel de Administración
      </footer>
    </div>
  )
}

export default AdminInicioSesionPage
