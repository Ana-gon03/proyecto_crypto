import React from 'react'
import '../../styles/Arrendador.css'

const ModalConfirmacion = ({
  titulo,
  mensaje,
  onConfirmar,
  onCancelar,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  peligro = false
}) => {
  return (
    <div className="arr-modal-overlay">
      <div className="arr-modal arr-modal-sm">
        <div className="arr-modal-header">
          <h3 className="arr-modal-title">
            {peligro ? '⚠️ ' : 'ℹ️ '}{titulo}
          </h3>
        </div>

        <div className="arr-modal-body">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-mid)', lineHeight: 1.6, margin: 0 }}>
            {mensaje}
          </p>
        </div>

        <div className="arr-modal-footer">
          {onCancelar && (
            <button className="arr-btn-ghost arr-btn-sm" onClick={onCancelar}>
              {textoCancelar}
            </button>
          )}
          <button
            className={peligro ? 'arr-btn-danger arr-btn-sm' : 'arr-btn-primary arr-btn-sm'}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalConfirmacion
