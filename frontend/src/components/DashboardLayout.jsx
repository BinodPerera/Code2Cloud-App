import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

function DashboardLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#0a0a0f', color: '#fff' }}>
      {/* Global Animated Background Orbs */}
      <div className="bg-orb bg-orb-1" style={{ top: '-10%', right: '10%', position: 'fixed' }}></div>
      <div className="bg-orb bg-orb-2" style={{ bottom: '-10%', left: '-10%', position: 'fixed' }}></div>

      {/* Persistent Left Navigation */}
      <Sidebar />

      {/* Main Page Content injected by the Router */}
      <main style={{ flex: 1, padding: '4rem', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
