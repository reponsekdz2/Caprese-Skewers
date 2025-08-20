
import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom'; // Changed import
import Navbar from '../common/Navbar';
import Sidebar from '../common/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { CallModal } from '../calling/CallModal'; // Import CallModal

const AdminLayout: React.FC = () => { // This will become a more generic AuthenticatedUserLayout
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  if (!user) {
    return <Navigate to="/" />; // Changed usage
  }

  return (
    <div className="flex h-screen bg-secondary-100 dark:bg-dark-secondary transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-secondary-100 dark:bg-dark-secondary p-6 transition-colors duration-300">
          <div className="animate-fadeIn"> {/* Added fade-in for main content area */}
            <Outlet /> {/* Content for the specific authenticated route will render here */} {/* Changed usage */}
          </div>
        </main>
      </div>
      <CallModal /> {/* Add CallModal here for global access */}
    </div>
  );
};

export default AdminLayout;
