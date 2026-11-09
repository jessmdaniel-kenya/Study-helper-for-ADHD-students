import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  // Theme, fonts and low-stimulation mode live in the preferences store (src/lib/preferences.ts).

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="layout-wrapper">
      <Sidebar isOpen={isSidebarOpen} isCollapsed={isSidebarCollapsed} closeMenu={closeSidebar} />
      
      <div className="main-content">
        <Topbar 
          toggleSidebar={toggleSidebar} 
          sidebarOpen={isSidebarOpen}
          sidebarCollapsed={isSidebarCollapsed}
          toggleSidebarCollapsed={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        />
        
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}