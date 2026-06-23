import { useCallback, useEffect, useMemo, useState } from 'react'
import { Package, Search } from 'lucide-react'

import EmptyState from '../components/common/EmptyState'
import StatusBadge from '../components/common/StatusBadge'
import CategoriaModal from '../components/productos/CategoriaModal'
import ProductoModal from '../components/productos/ProductoModal'
import {
  createCategoria,
  createProducto,
  deleteProducto,
  getCategorias,
  getProductos,
  updateProducto,
} from '../services/productosService'
import { formatCurrency as formatMoney } from '../utils/formatters'

function normalizeList(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.results)) {
    return data.results
  }

  return []
}

function getErrorMessage(error) {
  if (error.response?.status === 401) {
    return 'Tu sesión expiró. Iniciá sesión nuevamente.'
  }

  if (error.response?.status === 403) {
    return 'No tenés permisos para realizar esta acción.'
  }

  const data = error.response?.data
  if (!data) {
    return 'No se pudo conectar con el servidor. Revisá que el backend esté activo.'
  }

  if (typeof data === 'string') {
    return data
  }

  if (data.detail) {
    return data.detail
  }

  return Object.entries(data)
    .map(([field, messages]) => {
      const text = Array.isArray(messages) ? messages.join(' ') : String(messages)
      return `${field}: ${text}`
    })
    .join(' ')
}

function Productos() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productoModalOpen, setProductoModalOpen] = useState(false)
  const [categoriaModalOpen, setCategoriaModalOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState(null)

  const filteredProductos = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) {
      return productos
    }

    return productos.filter((producto) => {
      const nombre = producto.nombre?.toLowerCase() || ''
      const categoria = producto.categoria_nombre?.toLowerCase() || ''
      return nombre.includes(term) || categoria.includes(term)
    })
  }, [productos, search])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const params = {}
      if (estado) {
        params.estado = estado
      }

      const [productosResponse, categoriasResponse] = await Promise.all([
        getProductos(params),
        getCategorias(),
      ])

      setProductos(normalizeList(productosResponse.data))
      setCategorias(normalizeList(categoriasResponse.data))
    } catch (requestError) {
      setProductos([])
      setError(getErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }, [estado])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleNewProducto() {
    setEditingProducto(null)
    setProductoModalOpen(true)
  }

  function handleEditProducto(producto) {
    setEditingProducto(producto)
    setProductoModalOpen(true)
  }

  async function handleSubmitProducto(data) {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (editingProducto) {
        await updateProducto(editingProducto.id, data)
        setSuccess('Producto actualizado.')
      } else {
        await createProducto(data)
        setSuccess('Producto creado.')
      }

      setProductoModalOpen(false)
      setEditingProducto(null)
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmitCategoria(data, resetForm) {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await createCategoria(data)
      setSuccess('Categoría creada.')
      resetForm()
      setCategoriaModalOpen(false)
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteProducto(producto) {
    const confirmed = window.confirm(`¿Eliminar "${producto.nombre}"?`)
    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await deleteProducto(producto.id)
      setSuccess('Producto eliminado.')
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="products-page">
      <div className="page-heading">
        <div className="page-title-block">
          <span className="page-title-icon">
            <Package size={32} />
          </span>
          <div>
            <p className="eyebrow">Catálogo</p>
            <h2>Catálogo</h2>
          </div>
        </div>
        <div className="page-actions">
          <button
            className="button button-secondary"
            onClick={() => setCategoriaModalOpen(true)}
            type="button"
          >
            Nueva categoría
          </button>
          <button className="button button-primary" onClick={handleNewProducto} type="button">
            Nuevo producto
          </button>
        </div>
      </div>

      <section className="panel products-toolbar">
        <label>
          Buscar
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre o categoría"
            type="search"
            value={search}
          />
        </label>

        <label>
          Estado
          <select onChange={(event) => setEstado(event.target.value)} value={estado}>
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="agotado">Agotado</option>
          </select>
        </label>
      </section>

      {success && !error ? (
        <div className="state-panel state-panel-success">{success}</div>
      ) : null}

      {error ? (
        <div className="state-panel state-panel-error">{error}</div>
      ) : (
        <section className="panel products-table-panel">
          {isLoading ? (
            <EmptyState text="Cargando productos..." title="Catálogo" />
          ) : filteredProductos.length ? (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Precio de venta</th>
                    <th>Costo por unidad</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProductos.map((producto) => (
                    <tr key={producto.id}>
                      <td>
                        <strong>{producto.nombre}</strong>
                        {producto.descripcion ? <small>{producto.descripcion}</small> : null}
                      </td>
                      <td>{producto.categoria_nombre || 'Sin categoría'}</td>
                      <td className="table-cell-money">{formatMoney(producto.precio)}</td>
                      <td className="table-cell-money">{formatMoney(producto.costo)}</td>
                      <td>
                        <StatusBadge label={producto.estado} value={producto.estado} />
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="button button-secondary button-small"
                            onClick={() => handleEditProducto(producto)}
                            type="button"
                          >
                            Editar
                          </button>
                          <button
                            className="button button-danger button-small"
                            onClick={() => handleDeleteProducto(producto)}
                            type="button"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Search} text="No hay productos para mostrar." title="Sin resultados" />
          )}
        </section>
      )}

      <ProductoModal
        categorias={categorias}
        initialData={editingProducto}
        isOpen={productoModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          setProductoModalOpen(false)
          setEditingProducto(null)
        }}
        onSubmit={handleSubmitProducto}
      />

      <CategoriaModal
        isOpen={categoriaModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setCategoriaModalOpen(false)}
        onSubmit={handleSubmitCategoria}
      />
    </section>
  )
}

export default Productos



