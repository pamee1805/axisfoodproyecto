import PagoForm from './PagoForm'

function PagoModal({
  initialData,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  pedido,
  pedidos,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel modal-panel-small" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Pagos</p>
            <h3>{initialData ? 'Editar pago' : 'Registrar pago'}</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <PagoForm
          initialData={initialData}
          isSubmitting={isSubmitting}
          onCancel={onClose}
          onSubmit={onSubmit}
          pedido={pedido}
          pedidos={pedidos}
        />
      </section>
    </div>
  )
}

export default PagoModal


