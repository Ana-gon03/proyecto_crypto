import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import ModalContacto from './ModalContacto'
import '../admin/admin.css'

const FooterAdmin = () => {
  const [modalAbierto, setModalAbierto] = useState(false)

  return (
    <>
      <footer className="admin-footer">
        <div className="admin-footer-content">
          <div className="admin-footer-brand">Burroomies — Panel de Administración</div>
          <div className="admin-footer-links">
            <Link to="/legal/aviso-privacidad" className="admin-footer-link">
              Aviso de Privacidad
            </Link>
            <span className="admin-footer-dot">·</span>
            <Link to="/legal/terminos-uso" className="admin-footer-link">
              Términos y Condiciones
            </Link>
            <span className="admin-footer-dot">·</span>
            <button
              className="admin-footer-link"
              onClick={() => setModalAbierto(true)}
            >
              Contacto
            </button>
          </div>
        </div>
      </footer>

      {modalAbierto && <ModalContacto onClose={() => setModalAbierto(false)} />}
    </>
  )
}

export default FooterAdmin
