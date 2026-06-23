import ProveedorForm from './ProveedorForm'

function ProveedorModal({ initialData, isOpen, isSubmitting, onClose, onSubmit }) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel modal-panel-small" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Proveedores</p>
            <h3>{initialData ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <ProveedorForm
          initialData={initialData}
          isSubmitting={isSubmitting}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </section>
    </div>
  )
}

export default ProveedorModal


