import { useState, createContext, useContext } from 'react';
import React from 'react';
import Sidebar from './Sidebar';

// Create a context for sidebar state
const SidebarContext = createContext();

// Custom hook to use the sidebar context
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

const AppLayout = ({ children }) => {
  const [showSidebar, setShowSidebar] = useState(false);

  const handleMenuClick = () => {
    setShowSidebar(true);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
  };

  const sidebarValue = {
    showSidebar,
    handleMenuClick,
    closeSidebar
  };

  return (
    <SidebarContext.Provider value={sidebarValue}>
      {/* Sidebar */}
      <Sidebar isOpen={showSidebar} onClose={closeSidebar} />
      
      {/* Main Content */}
      {children}
    </SidebarContext.Provider>
  );
};

export default AppLayout;