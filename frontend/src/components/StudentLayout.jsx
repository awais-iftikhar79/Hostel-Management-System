import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function StudentLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navLinks = [
    { path: '/student/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/student/room', icon: 'bed', label: 'My Room' },
    { path: '/student/payments', icon: 'payments', label: 'Payments' },
    { path: '/student/maintenance', icon: 'handyman', label: 'Maintenance' },
    { path: '/student/exchange', icon: 'swap_horiz', label: 'Room Exchange' },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen font-body-md overflow-x-hidden">
      {/* TopNavBar */}
      <header className="fixed top-0 right-0 w-full md:w-[calc(100%-260px)] h-[64px] z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-surface-container shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center justify-between px-8 text-on-surface">
        <div className="flex items-center gap-2 p-2 rounded-lg">
          <span className="material-symbols-outlined text-outline">location_city</span>
          <span className="font-label-md text-on-surface">Hostel Management System</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-4 border-l border-surface-container">
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold">
              S
            </div>
            <button onClick={handleLogout} className="material-symbols-outlined text-on-surface-variant hover:text-error rounded-full p-1 transition-colors" title="Logout">logout</button>
          </div>
        </div>
      </header>

      {/* SideNavBar */}
      <nav className="fixed left-0 top-0 h-screen w-[260px] z-50 bg-primary-container text-on-primary border-r border-primary-fixed-dim/20 shadow-2xl flex flex-col py-6 gap-2 hidden md:flex">
        <div className="px-6 mb-6">
          <h1 className="text-2xl font-black tracking-tighter text-on-primary">Hostel ERP</h1>
          <p className="text-on-primary-container text-xs mt-1">Resident Portal</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1">
          {navLinks.map(link => {
            const isActive = location.pathname.includes(link.path);
            return (
              <a 
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors ${
                  isActive ? 'text-on-primary bg-on-surface/50 border-l-4 border-secondary-container font-semibold' : 'text-on-primary-container hover:text-on-primary hover:bg-on-surface/20 border-l-4 border-transparent'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{link.icon}</span>
                {link.label}
              </a>
            );
          })}
        </div>
      </nav>

      <main className="md:ml-[260px] pt-[64px] min-h-screen p-8 max-w-[1440px] mx-auto bg-background">
        {children}
      </main>
    </div>
  );
}