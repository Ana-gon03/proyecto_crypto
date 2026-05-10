import React, { useState, useEffect } from 'react'
import NavbarAdmin from '../../components/common/NavbarAdmin'
import FooterAdmin from '../../components/common/FooterAdmin'
import { getPropiedades, deletePropiedad } from '../../services/adminService'
import FormPropiedad from '../../components/admin/FormPropiedad'
import '../../components/admin/admin.css'

const AdminPropiedadesPage = () => {
  const [propiedades, setPropiedades] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedPropiedad, setSelectedPropiedad] = useState(null)
  const [modalType, setModalType] = useState('')
  const [error, setError] = useState('')

  const loadPropiedades = async () => {
    setLoading(true)
    try {
      const data = await getPropiedades(search)
      setPropiedades(data)
    } catch (error) {
      console.error('Error cargando propiedades:', error)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPropiedades() }, [search])

  const handleView = (p) => { setSelectedPropiedad(p); setModalType('view'); setShowModal(true) }
  const handleEdit = (p) => { setSelectedPropiedad(p); setModalType('edit'); setShowModal(true) }
  const handleDelete = (p) => {
    if (p.rentasActivas > 0) { alert(`❌ No se puede eliminar: tiene ${p.rentasActivas} renta(s) activa(s)`); return }
    setSelectedPropiedad(p); setModalType('delete'); setShowModal(true)
  }
  const confirmDelete = async () => {
    try { await deletePropiedad(selectedPropiedad.idPropiedad); setShowModal(false); loadPropiedades() }
    catch (error) { alert(error.response?.data?.error || 'Error al eliminar') }
  }

  const modalWidth = modalType === 'edit' ? '600px' : '520px'

  const estatusBadgeClass = (estatus) => {
    if (estatus === 'Disponible') return 'badge-success'
    if (estatus === 'Sin Disponibilidad') return 'badge-warning'
    return 'badge-danger'
  }

  return (
    <div className="admin-layout">
      <NavbarAdmin />

      <main className="admin-main">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Propiedades</h1>
          <span className="admin-page-hint">Las propiedades se crean desde el perfil del arrendador</span>
        </div>

        <div className="admin-search-wrap">
          <input
            className="admin-search-input"
            type="text"
            placeholder="Buscar por título, descripción o calle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="admin-state">Cargando propiedades...</p>
        ) : error ? (
          <p className="admin-state-error">{error}</p>
        ) : propiedades.length === 0 ? (
          <p className="admin-state">No hay propiedades registradas.</p>
        ) : (
          <div className="admin-table-card" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Arrendador</th>
                  <th>Precio</th>
                  <th>Tipo</th>
                  <th className="center">Rentas Activas</th>
                  <th className="center">Reseñas</th>
                  <th className="center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {propiedades.map((p) => (
                  <tr key={p.idPropiedad}>
                    <td className="muted">{p.idPropiedad}</td>
                    <td style={{ fontWeight: 500 }}>{p.propiedadTitulo}</td>
                    <td>{p.arrendador?.usuario?.usuarioApePat} {p.arrendador?.usuario?.usuarioNom}</td>
                    <td style={{ fontWeight: 600, color: 'var(--purple-600)' }}>${p.propiedadPrecio}</td>
                    <td>
                      <span className="admin-badge badge-info">{p.propiedadTipo}</span>
                    </td>
                    <td className="center">
                      <span className={`admin-badge ${p.rentasActivas > 0 ? 'badge-danger' : 'badge-success'}`}>
                        {p.rentasActivas}
                      </span>
                    </td>
                    <td className="center muted">{p.reseñas}</td>
                    <td className="center">
                      <div className="admin-actions">
                        <button className="btn-action btn-view" onClick={() => handleView(p)}>👁 Ver</button>
                        <button className="btn-action btn-edit" onClick={() => handleEdit(p)}>✏️ Editar</button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(p)}
                          disabled={p.rentasActivas > 0}
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

            {modalType === 'view' && selectedPropiedad && (
              <>
                <div className="admin-modal-header">
                  <h2 className="admin-modal-title">Información de la Propiedad</h2>
                  <button className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
                </div>
                <div className="admin-modal-body">
                  <div className="admin-info-grid">
                    <div className="admin-info-item">
                      <div className="admin-info-label">ID</div>
                      <div className="admin-info-value">{selectedPropiedad.idPropiedad}</div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Tipo</div>
                      <div className="admin-info-value">
                        <span className="admin-badge badge-info">{selectedPropiedad.propiedadTipo}</span>
                      </div>
                    </div>
                    <div className="admin-info-item admin-info-full">
                      <div className="admin-info-label">Título</div>
                      <div className="admin-info-value">{selectedPropiedad.propiedadTitulo}</div>
                    </div>
                    <div className="admin-info-item admin-info-full">
                      <div className="admin-info-label">Descripción</div>
                      <div className="admin-info-value">{selectedPropiedad.propiedadDescripcion || '-'}</div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Precio mensual</div>
                      <div className="admin-info-value" style={{ color: 'var(--purple-600)', fontWeight: 700 }}>
                        ${selectedPropiedad.propiedadPrecio}
                      </div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Lugares</div>
                      <div className="admin-info-value">{selectedPropiedad.propiedadLugares}</div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Estatus</div>
                      <div className="admin-info-value">
                        <span className={`admin-badge ${estatusBadgeClass(selectedPropiedad.propiedadEstatus)}`}>
                          {selectedPropiedad.propiedadEstatus}
                        </span>
                      </div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Arrendador</div>
                      <div className="admin-info-value">
                        {selectedPropiedad.arrendador?.usuario?.usuarioApePat} {selectedPropiedad.arrendador?.usuario?.usuarioNom}
                      </div>
                    </div>
                    <div className="admin-info-item admin-info-full">
                      <div className="admin-info-label">Dirección</div>
                      <div className="admin-info-value">
                        {selectedPropiedad.direccion?.direccionCalle} {selectedPropiedad.direccion?.direccionNumExt},{' '}
                        {selectedPropiedad.direccion?.cp?.d_asenta}, {selectedPropiedad.direccion?.cp?.D_mnpio},{' '}
                        {selectedPropiedad.direccion?.cp?.d_estado}
                      </div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Rentas activas</div>
                      <div className="admin-info-value">
                        <span className={`admin-badge ${selectedPropiedad.rentasActivas > 0 ? 'badge-danger' : 'badge-success'}`}>
                          {selectedPropiedad.rentasActivas}
                        </span>
                      </div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Reseñas</div>
                      <div className="admin-info-value">{selectedPropiedad.reseñas ?? '-'}</div>
                    </div>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button className="btn-close-modal" onClick={() => setShowModal(false)}>Cerrar</button>
                </div>
              </>
            )}

            {modalType === 'edit' && selectedPropiedad && (
              <FormPropiedad
                propiedad={selectedPropiedad}
                onClose={() => setShowModal(false)}
                onSuccess={() => { setShowModal(false); loadPropiedades() }}
              />
            )}

            {modalType === 'delete' && selectedPropiedad && (
              <>
                <div className="admin-modal-header">
                  <h2 className="admin-modal-title danger">Eliminar Propiedad</h2>
                  <button className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
                </div>
                <div className="admin-modal-body">
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: 0 }}>
                    ¿Eliminar la propiedad <strong>{selectedPropiedad.propiedadTitulo}</strong>?
                  </p>
                  <div className="admin-delete-warning">
                    <span>⚠️</span>
                    <span>Esta acción no se puede deshacer.</span>
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

export default AdminPropiedadesPage
