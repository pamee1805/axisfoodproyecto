import InventarioMovimientoForm from './InventarioMovimientoForm'

function InventarioMovimientoModal({
  defaultSucursalId,
  initialData,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  productos,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Inventario</p>
            <h3>{initialData ? 'Editar movimiento' : 'Nuevo movimiento'}</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <InventarioMovimientoForm
          defaultSucursalId={defaultSucursalId}
          initialData={initialData}
          isSubmitting={isSubmitting}
          onCancel={onClose}
          onSubmit={onSubmit}
          productos={productos}
        />
      </section>
    </div>
  )
}

export default InventarioMovimientoModal


