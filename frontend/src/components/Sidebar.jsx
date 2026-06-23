import { NavLink } from 'react-router-dom'
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  ShoppingCart,
  TriangleAlert,
  Truck,
  Users,
  Wallet,
} from 'lucide-react'

const menuSections = [
  {
    title: 'Inicio',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ],
  },
  {
    title: 'Operación',
    items: [
      { icon: ShoppingCart, label: 'Ventas', path: '/ventas' },
      { icon: Wallet, label: 'Caja', path: '/caja' },
      { icon: Truck, label: 'Compras', path: '/compras' },
    ],
  },
  {
    title: 'Stock',
    items: [
      { icon: Package, label: 'Catálogo', path: '/productos' },
      { icon: Boxes, label: 'Inventario', path: '/inventario' },
      { featured: true, icon: TriangleAlert, label: 'Pérdidas y Mermas', path: '/mermas' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { icon: Users, label: 'Equipo y permisos', path: '/usuarios' },
      { icon: ClipboardList, label: 'Auditoría', path: '/auditoria' },
    ],
  },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">AF</div>
        <div>
          <strong>AxisFood</strong>
          <span>Gestión gastronómica</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegación principal">
        {menuSections.map((section) => (
          <section className="nav-section" key={section.title}>
            <p className="nav-section-title">{section.title}</p>
            <div className="nav-section-items">
              {section.items.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    className={({ isActive }) =>
                      [
                        'nav-item',
                        item.featured ? 'nav-item-featured' : '',
                        isActive ? 'nav-item-active' : '',
                      ].filter(Boolean).join(' ')
                    }
                    key={item.path}
                    to={item.path}
                  >
                    <span className="nav-item-icon">
                      <Icon size={18} strokeWidth={2.1} />
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar


