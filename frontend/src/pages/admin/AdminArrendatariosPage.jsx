import React, { useState, useEffect } from 'react'
import NavbarAdmin from '../../components/common/NavbarAdmin'
import FooterAdmin from '../../components/common/FooterAdmin'
import { getArrendatarios, deleteArrendatario } from '../../services/adminService'
import FormEstudiante from '../../components/admin/FormEstudiante'
import FormRegistroEstudiante from '../../components/admin/FormRegistroEstudiante'
import '../../components/admin/admin.css'

const AdminArrendatariosPage = () => {
  const [arrendatarios, setArrendatarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedArrendatario, setSelectedArrendatario] = useState(null)
  const [modalType, setModalType] = useState('')
  const [error, setError] = useState('')

  const loadArrendatarios = async () => {
    setLoading(true)
    try {
      const data = await getArrendatarios(search)
      setArrendatarios(data.filter(a => a.idUsuario !== 10))
    } catch (error) {
      console.error('Error cargando arrendatarios:', error)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadArrendatarios() }, [search])

  const handleView = (a) => { setSelectedArrendatario(a); setModalType('view'); setShowModal(true) }
  const handleEdit = (a) => { setSelectedArrendatario(a); setModalType('edit'); setShowModal(true) }
  const handleDelete = (a) => {
    if (a.tieneRentasActivas) { alert('❌ No se puede eliminar: tiene rentas activas'); return }
    setSelectedArrendatario(a); setModalType('delete'); setShowModal(true)
  }
  const confirmDelete = async () => {
    try { await deleteArrendatario(selectedArrendatario.idArrendatario); setShowModal(false); loadArrendatarios() }
    catch (error) { alert(error.response?.data?.error || 'Error al eliminar') }
  }

  const modalWidth = (modalType === 'edit' || modalType === 'create') ? '860px' : '520px'

  return (
    <div className="admin-layout">
      <NavbarAdmin />

      <main className="admin-main">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Estudiantes (Arrendatarios)</h1>
          <button
            className="btn-add"
            onClick={() => { setSelectedArrendatario(null); setModalType('create'); setShowModal(true) }}
          >
            + Agregar Estudiante
          </button>
        </div>

        <div className="admin-search-wrap">
          <input
            className="admin-search-input"
            type="text"
            placeholder="Buscar por boleta, username, correo o CURP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="admin-state">Cargando estudiantes...</p>
        ) : error ? (
          <p className="admin-state-error">{error}</p>
        ) : arrendatarios.length === 0 ? (
          <p className="admin-state">No hay estudiantes registrados.</p>
        ) : (
          <div className="admin-table-card" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Nombre Completo</th>
                  <th>Boleta</th>
                  <th>Correo</th>
                  <th>CURP</th>
                  <th className="center">Verificado</th>
                  <th className="center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {arrendatarios.map((a) => (
                  <tr key={a.idArrendatario}>
                    <td className="muted">{a.idArrendatario}</td>
                    <td>{a.arrendatarioUser || '-'}</td>
                    <td style={{ fontWeight: 500 }}>
                      {a.usuario?.usuarioApePat} {a.usuario?.usuarioApeMat || ''} {a.usuario?.usuarioNom}
                    </td>
                    <td>{a.arrendatarioBoleta || '-'}</td>
                    <td>{a.usuario?.usuarioCorreo || '-'}</td>
                    <td className="muted">{a.usuario?.usuarioCurp || '-'}</td>
                    <td className="center">
                      <span className={`admin-badge ${a.arrendatarioVerificado === 1 ? 'badge-success' : 'badge-warning'}`}>
                        {a.arrendatarioVerificado === 1 ? '✓ Verificado' : '⏳ Pendiente'}
                      </span>
                    </td>
                    <td className="center">
                      <div className="admin-actions">
                        <button className="btn-action btn-view" onClick={() => handleView(a)}>👁 Ver</button>
                        <button className="btn-action btn-edit" onClick={() => handleEdit(a)}>✏️ Editar</button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(a)}
                          disabled={a.tieneRentasActivas}
                        >
                          🗑 Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <FooterAdmin />

      {showModal && (
        <div
          className="admin-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="admin-modal" style={{ maxWidth: modalWidth }}>

            {modalType === 'view' && selectedArrendatario && (
              <>
                <div className="admin-modal-header">
                  <h2 className="admin-modal-title">Información del Estudiante</h2>
                  <button className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
                </div>
                <div className="admin-modal-body">
                  <div className="admin-info-grid">
                    <div className="admin-info-item">
                      <div className="admin-info-label">ID</div>
                      <div className="admin-info-value">{selectedArrendatario.idArrendatario}</div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Username</div>
                      <div className="admin-info-value">{selectedArrendatario.arrendatarioUser || '-'}</div>
                    </div>
                    <div className="admin-info-item admin-info-full">
                      <div className="admin-info-label">Nombre Completo</div>
                      <div className="admin-info-value">
                        {selectedArrendatario.usuario?.usuarioApePat} {selectedArrendatario.usuario?.usuarioApeMat || ''} {selectedArrendatario.usuario?.usuarioNom}
                      </div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Boleta</div>
                      <div className="admin-info-value">{selectedArrendatario.arrendatarioBoleta || '-'}</div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Correo</div>
                      <div className="admin-info-value">{selectedArrendatario.usuario?.usuarioCorreo || '-'}</div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Teléfono</div>
                      <div className="admin-info-value">{selectedArrendatario.usuario?.usuarioTel || '-'}</div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">CURP</div>
                      <div className="admin-info-value">{selectedArrendatario.usuario?.usuarioCurp || '-'}</div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Fecha de Nacimiento</div>
                      <div className="admin-info-value">{selectedArrendatario.usuario?.usuarioFechaNac || '-'}</div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Escuela</div>
                      <div className="admin-info-value">{selectedArrendatario.carrera?.unidadAcademica?.unidadAcademicaNombre || '-'}</div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Carrera</div>
                      <div className="admin-info-value">{selectedArrendatario.carrera?.carreraNombre || '-'}</div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Verificado</div>
                      <div className="admin-info-value">
                        <span className={`admin-badge ${selectedArrendatario.arrendatarioVerificado === 1 ? 'badge-success' : 'badge-warning'}`}>
                          {selectedArrendatario.arrendatarioVerificado === 1 ? '✓ Sí' : '⏳ No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button className="btn-close-modal" onClick={() => setShowModal(false)}>Cerrar</button>
                </div>
              </>
            )}

            {modalType === 'edit' && selectedArrendatario && (
              <FormEstudiante
                arrendatario={selectedArrendatario}
                onClose={() => setShowModal(false)}
                onSuccess={() => { setShowModal(false); loadArrendatarios() }}
              />
            )}

            {modalType === 'create' && (
              <FormRegistroEstudiante
                onClose={() => setShowModal(false)}
                onSuccess={() => { setShowModal(false); loadArrendatarios() }}
              />
            )}

            {modalType === 'delete' && selectedArrendatario && (
              <>
                <div className="admin-modal-header">
                  <h2 className="admin-modal-title danger">Eliminar Estudiante</h2>
                  <button className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
                </div>
                <div className="admin-modal-body">
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: 0 }}>
                    ¿Eliminar a <strong>{selectedArrendatario.usuario?.usuarioNom} {selectedArrendatario.usuario?.usuarioApePat}</strong>?{' '}
                    <span style={{ color: 'var(--text-light)' }}>(Boleta: {selectedArrendatario.arrendatarioBoleta})</span>
                  </p>
                  <div className="admin-delete-warning">
                    <span>⚠️</span>
                    <span>Esta acción no se puede deshacer. Las reseñas serán redirigidas al usuario por defecto.</span>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button className="btn-danger" onClick={confirmDelete}>Sí, eliminar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminArrendatariosPage
