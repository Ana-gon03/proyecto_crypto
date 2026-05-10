import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginAdmin } from '../../services/authService'
import '../../components/admin/admin.css'

const AdminInicioSesionPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    adminUser: '',
    adminContra: ''
  })
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
    <div className="admin-login-bg">
      {/* Mini navbar solo marca */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 40px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #f0e6f5',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'linear-gradient(135deg, #7B2D6E, #6B3FA0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', color: '#fff',
          boxShadow: '0 3px 10px rgba(123,45,110,0.25)',
          flexShrink: 0,
        }}>
          👑
        </div>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#7B2D6E' }}>
          Burroomies Admin
        </span>
      </header>

      <main className="admin-login-main">
        <div className="admin-login-card">
          <div className="admin-login-icon">👑</div>
          <h1 className="admin-login-title">Panel Administrador</h1>
          <p className="admin-login-sub">Inicia sesión para gestionar Burroomies</p>

          <form onSubmit={handleSubmit}>
            <div>
              <label className="admin-login-label">Usuario</label>
              <div className="admin-login-input-wrap">
                <input
                  className="admin-login-input"
                  type="text"
                  name="adminUser"
                  value={formData.adminUser}
                  onChange={handleChange}
                  placeholder="Ej: admin_root"
                  required
                />
              </div>
            </div>

            <div>
              <label className="admin-login-label">Contraseña</label>
              <div className="admin-login-input-wrap">
                <input
                  className="admin-login-input with-toggle"
                  type={mostrarPassword ? 'text' : 'password'}
                  name="adminContra"
                  value={formData.adminContra}
                  onChange={handleChange}
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <button
                  type="button"
                  className="admin-login-toggle"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                >
                  {mostrarPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && <div className="admin-login-error">{error}</div>}

            <button
              type="submit"
              className="admin-login-btn"
              disabled={cargando}
            >
              {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <Link to="/" className="admin-login-back">
            ← Volver al inicio
          </Link>
        </div>
      </main>

      <footer className="admin-login-footer">
        Burroomies — Panel de Administración
      </footer>
    </div>
  )
}

export default AdminInicioSesionPage
