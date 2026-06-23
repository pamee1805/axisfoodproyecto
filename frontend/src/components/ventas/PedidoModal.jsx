import PedidoForm from './PedidoForm'

function PedidoModal({
  clientes,
  initialData,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  productos,
  sucursales,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel modal-panel-wide" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Ventas</p>
            <h3>{initialData ? 'Editar pedido' : 'Nuevo pedido'}</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <PedidoForm
          clientes={clientes}
          initialData={initialData}
          isSubmitting={isSubmitting}
          onCancel={onClose}
          onSubmit={onSubmit}
          productos={productos}
          sucursales={sucursales}
        />
      </section>
    </div>
  )
}

export default PedidoModal


