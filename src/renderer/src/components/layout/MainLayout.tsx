import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

function MainLayout(): React.ReactElement {
  return (
    <div className="flex h-screen w-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
