import MermaForm from './MermaForm'

function MermaModal({
  defaultSucursalId,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  productos,
  sucursalPrincipal,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Control de pérdidas</p>
            <h3>Registrar pérdida</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <MermaForm
          defaultSucursalId={defaultSucursalId}
          isSubmitting={isSubmitting}
          onCancel={onClose}
          onSubmit={onSubmit}
          productos={productos}
          sucursalPrincipal={sucursalPrincipal}
        />
      </section>
    </div>
  )
}

export default MermaModal


