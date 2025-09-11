// Layout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useTheme } from '../App';
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext';

const LayoutContent: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebar();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Header with mobile margin-bottom */}
      <div className="mb-10 lg:mb-0">
        <Header 
          isSidebarCollapsed={isSidebarCollapsed}
          onMobileSidebarToggle={() => setIsMobileSidebarOpen((prev) => !prev)}
        />
      </div>
      
      <div className="flex">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <Sidebar 
          onCollapseChange={setIsSidebarCollapsed}
          isMobile={false}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
          isOpen={isMobileSidebarOpen}
        />
        
        {/* Main Content */}
        <main className={`
          flex-1 transition-all duration-300
          pt-16 p-4 lg:pt-20 lg:p-6
          ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80'}
          ml-0
          ${isMobileSidebarOpen ? 'opacity-50 pointer-events-none lg:opacity-100 lg:pointer-events-auto' : ''}
        `}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const Layout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default Layout;