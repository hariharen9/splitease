import React from 'react';
import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import InstallPWA from './InstallPWA';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
      <InstallPWA />
      <Footer />
    </div>
  );
};

export default Layout;