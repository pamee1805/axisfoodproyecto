import OrdenCompraForm from './OrdenCompraForm'

function OrdenCompraModal({
  initialData,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  productos,
  proveedores,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel modal-panel-wide" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Compras</p>
            <h3>{initialData ? 'Editar orden' : 'Nueva orden'}</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <OrdenCompraForm
          initialData={initialData}
          isSubmitting={isSubmitting}
          onCancel={onClose}
          onSubmit={onSubmit}
          productos={productos}
          proveedores={proveedores}
        />
      </section>
    </div>
  )
}

export default OrdenCompraModal


