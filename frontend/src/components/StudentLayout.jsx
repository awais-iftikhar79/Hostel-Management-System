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
    <div className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased overflow-x-hidden">
      
      {/* --- TOP APP BAR --- */}
      <header className="fixed top-0 right-0 w-full md:w-[calc(100%-260px)] h-16 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm flex items-center justify-between px-6 transition-all">
        
        {/* Left side: System Badge & Mobile Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile Only Brand Logo */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]">apartment</span>
            </div>
            <span className="font-bold text-[18px] text-slate-800 tracking-tight">HostelHub</span>
            <div className="w-px h-5 bg-slate-300 mx-2"></div>
          </div>
          
          {/* Desktop System Context Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200">
            <span className="material-symbols-outlined text-slate-500 text-[18px]">school</span>
            <span className="font-semibold text-sm text-slate-700">Hostel Management System</span>
          </div>
        </div>

        {/* Right side: Premium Profile Pill */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-2 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md transition-shadow">
            
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              ST
            </div>
            
            <span className="text-sm font-semibold text-slate-700 hidden sm:block pr-2">Student Portal</span>
            
            <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>
            
            <button 
              onClick={handleLogout} 
              className="flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors pr-2 sm:pr-1" 
              title="Logout"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- SIDE NAVIGATION BAR --- */}
      <nav className="fixed left-0 top-0 h-screen w-[260px] z-50 bg-[#0F172A] text-white border-r border-slate-800 shadow-2xl flex flex-col py-6 gap-2 hidden md:flex">
        
        {/* Brand Header */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
          </div>
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-white leading-tight">Hostel</h1>
            <p className="text-slate-400 text-xs font-medium tracking-wide mt-0.5">RESIDENT PORTAL</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-1.5">
          {navLinks.map(link => {
            const isActive = location.pathname.includes(link.path);
            return (
              <a 
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  isActive 
                    ? 'text-white bg-blue-600 shadow-md shadow-blue-600/20 font-medium' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{link.icon}</span>
                {link.label}
              </a>
            );
          })}
        </div>

        {/* Bottom Help Section */}
        <div className="mt-auto px-6 pt-6 border-t border-slate-800/50">
          <div className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">help</span>
            <span className="text-sm font-medium">Help & Support</span>
          </div>
        </div>
      </nav>

      {/* --- MAIN PAGE CONTENT --- */}
      <main className="md:ml-[260px] pt-[64px] min-h-screen p-8 max-w-[1440px] mx-auto bg-slate-50">
        {children}
      </main>

    </div>
  );
}