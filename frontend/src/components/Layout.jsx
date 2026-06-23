import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'
import Topbar from './Topbar'

function Layout() {
  return (
    <div className="app-shell notranslate" translate="no">
      <Sidebar />
      <div className="main-shell">
        <Topbar />
        <main className="content-shell">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout


