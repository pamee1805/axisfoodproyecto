import ProductoForm from './ProductoForm'

function ProductoModal({
  categorias,
  initialData,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-panel" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Productos</p>
            <h3>{initialData ? 'Editar producto' : 'Nuevo producto'}</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <ProductoForm
          categorias={categorias}
          initialData={initialData}
          isSubmitting={isSubmitting}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </section>
    </div>
  )
}

export default ProductoModal


