import ClienteForm from './ClienteForm'

function ClienteModal({ initialData, isOpen, isSubmitting, onClose, onSubmit }) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel modal-panel-small" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Clientes</p>
            <h3>{initialData ? 'Editar cliente' : 'Nuevo cliente'}</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <ClienteForm
          initialData={initialData}
          isSubmitting={isSubmitting}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </section>
    </div>
  )
}

export default ClienteModal


