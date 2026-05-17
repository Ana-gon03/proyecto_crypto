import React, { useState, useEffect } from 'react'
import NavbarAdmin from '../../components/common/NavbarAdmin'
import FooterAdmin from '../../components/common/FooterAdmin'
import { getArrendadores, deleteArrendador } from '../../services/adminService'
import FormArrendador from '../../components/admin/FormArrendador'
import FormRegistroArrendador from '../../components/admin/FormRegistroArrendador'
import '../../components/admin/admin.css'

const AdminArrendadoresPage = () => {
  const [arrendadores, setArrendadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedArrendador, setSelectedArrendador] = useState(null)
  const [modalType, setModalType] = useState('')
  const [error, setError] = useState('')
  const [alerta, setAlerta] = useState({ open: false, mensaje: '' })

  const loadArrendadores = async () => {
    setLoading(true)
    try {
      const data = await getArrendadores(search)
      console.log('Primer arrendador:', JSON.stringify(data[0], null, 2))
      setArrendadores(data)
    } catch (error) {
      console.error('Error cargando arrendadores:', error)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadArrendadores() }, [search])

  const handleView = (a) => { setSelectedArrendador(a); setModalType('view'); setShowModal(true) }
  const handleEdit = (a) => { setSelectedArrendador(a); setModalType('edit'); setShowModal(true) }
  const handleDelete = (a) => {
    if (a.tienePropiedadesConRentas) { setAlerta({ open: true, mensaje: 'No se puede eliminar: este arrendador tiene propiedades con rentas activas.' }); return }
    setSelectedArrendador(a); setModalType('delete'); setShowModal(true)
  }
  const confirmDelete = async () => {
    try { await deleteArrendador(selectedArrendador.idArrendador); setShowModal(false); loadArrendadores() }
    catch (error) { setShowModal(false); setAlerta({ open: true, mensaje: error.response?.data?.error || 'Error al eliminar' }) }
  }

  const modalWidth = (modalType === 'edit' || modalType === 'create') ? '860px' : '520px'

  return (
    <div className="admin-layout">
      <NavbarAdmin />

      <main className="admin-main">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Arrendadores</h1>
          <button
            className="btn-add"
            onClick={() => { setSelectedArrendador(null); setModalType('create'); setShowModal(true) }}
          >
            + Agregar Arrendador
          </button>
        </div>

        <div className="admin-search-wrap">
          <input
            className="admin-search-input"
            type="text"
            placeholder="Buscar por RFC, correo o CURP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="admin-state">Cargando arrendadores...</p>
        ) : error ? (
          <p className="admin-state-error">{error}</p>
        ) : arrendadores.length === 0 ? (
          <p className="admin-state">No hay arrendadores registrados.</p>
        ) : (
          <div className="admin-table-card" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Completo</th>
                  <th>RFC</th>
                  <th>Correo</th>
                  <th>CURP</th>
                  <th className="center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {arrendadores.map((a) => (
                  <tr key={a.idArrendador}>
                    <td className="muted">{a.idArrendador}</td>
                    <td style={{ fontWeight: 500 }}>
                      {a.usuario?.usuarioApePat} {a.usuario?.usuarioApeMat || ''} {a.usuario?.usuarioNom}
                    </td>
                    <td>{a.arrendadorRFC || '-'}</td>
                    <td>{a.usuario?.usuarioCorreo || '-'}</td>
                    <td className="muted">{a.usuario?.usuarioCurp || '-'}</td>
                    <td className="center">
                      <div className="admin-actions">
                        <button className="btn-action btn-view" onClick={() => handleView(a)}>👁 Ver</button>
                        <button className="btn-action btn-edit" onClick={() => handleEdit(a)}>✏️ Editar</button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(a)}
                          disabled={a.tienePropiedadesConRentas}
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

            {modalType === 'view' && selectedArrendador && (
              <>
                <div className="admin-modal-header">
                  <h2 className="admin-modal-title">Información del Arrendador</h2>
                  <button className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
                </div>
                <div className="admin-modal-body">
                  <div className="admin-info-grid">
                    <div className="admin-info-item">
                      <div className="admin-info-label">ID</div>
                      <div className="admin-info-value">{selectedArrendador.idArrendador}</div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">RFC</div>
                      <div className="admin-info-value">{selectedArrendador.arrendadorRFC || '-'}</div>
                    </div>
                    <div className="admin-info-item admin-info-full">
                      <div className="admin-info-label">Nombre Completo</div>
                      <div className="admin-info-value">
                        {selectedArrendador.usuario?.usuarioApePat} {selectedArrendador.usuario?.usuarioApeMat || ''} {selectedArrendador.usuario?.usuarioNom}
                      </div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Correo</div>
                      <div className="admin-info-value">{selectedArrendador.usuario?.usuarioCorreo || '-'}</div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Teléfono</div>
                      <div className="admin-info-value">{selectedArrendador.usuario?.usuarioTel || '-'}</div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">CURP</div>
                      <div className="admin-info-value">{selectedArrendador.usuario?.usuarioCurp || '-'}</div>
                    </div>
                    <div className="admin-info-item">
                      <div className="admin-info-label">Fecha de Nacimiento</div>
                      <div className="admin-info-value">{selectedArrendador.usuario?.usuarioFechaNac || '-'}</div>
                    </div>
                    <div className="admin-info-item admin-info-full">
                      <div className="admin-info-label">Domicilio</div>
                      <div className="admin-info-value">
                        {selectedArrendador.direccion?.direccionCalle} {selectedArrendador.direccion?.direccionNumExt},{' '}
                        {selectedArrendador.direccion?.cp?.d_asenta}, {selectedArrendador.direccion?.cp?.D_mnpio},{' '}
                        {selectedArrendador.direccion?.cp?.d_estado}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button className="btn-close-modal" onClick={() => setShowModal(false)}>Cerrar</button>
                </div>
              </>
            )}

            {modalType === 'edit' && selectedArrendador && (
              <FormArrendador
                arrendador={selectedArrendador}
                onClose={() => setShowModal(false)}
                onSuccess={() => { setShowModal(false); loadArrendadores() }}
              />
            )}

            {modalType === 'create' && (
              <FormRegistroArrendador
                onClose={() => setShowModal(false)}
                onSuccess={() => { setShowModal(false); loadArrendadores() }}
              />
            )}

            {modalType === 'delete' && selectedArrendador && (
              <>
                <div className="admin-modal-header">
                  <h2 className="admin-modal-title danger">Eliminar Arrendador</h2>
                  <button className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
                </div>
                <div className="admin-modal-body">
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: 0 }}>
                    ¿Eliminar a <strong>{selectedArrendador.usuario?.usuarioNom} {selectedArrendador.usuario?.usuarioApePat}</strong>?{' '}
                    <span style={{ color: 'var(--text-light)' }}>(RFC: {selectedArrendador.arrendadorRFC})</span>
                  </p>
                  <div className="admin-delete-warning">
                    <span>⚠️</span>
                    <span>Esta acción también eliminará todas sus propiedades y no se puede deshacer.</span>
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
      {alerta.open && (
        <div className="admin-modal-overlay" onClick={() => setAlerta({ open: false, mensaje: '' })}>
          <div className="admin-modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Aviso</h2>
              <button className="admin-modal-close" onClick={() => setAlerta({ open: false, mensaje: '' })}>×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)', margin: 0 }}>{alerta.mensaje}</p>
            </div>
            <div className="admin-modal-footer">
              <button className="btn-save" onClick={() => setAlerta({ open: false, mensaje: '' })}>Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminArrendadoresPage
