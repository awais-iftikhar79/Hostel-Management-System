import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AllotRoomModal from './AllotRoomModal';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add Hostel Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hostelName, setHostelName] = useState('');
  const [totalRooms, setTotalRooms] = useState('');
  const [totalFloors, setTotalFloors] = useState('1'); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Allot Room Modal state
  const [isAllotModalOpen, setIsAllotModalOpen] = useState(false);

  // DROPDOWN STATES
  const [hostels, setHostels] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Safely get the selected ID, defaulting to 'all'
  const storedId = localStorage.getItem('selectedHostelId') || 'all';
  const currentHostelId = storedId === 'all' ? 'all' : parseInt(storedId);
  const currentHostel = hostels.find(h => h.id === currentHostelId);

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/admin/hostels', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setHostels(data);
          if (!localStorage.getItem('selectedHostelId')) {
            localStorage.setItem('selectedHostelId', 'all');
          }
        }
      } catch (error) {
        console.error("Failed to fetch hostels", error);
      }
    };
    fetchHostels();
  }, []);

  const handleSelectHostel = (hostelId) => {
    localStorage.setItem('selectedHostelId', hostelId);
    setIsDropdownOpen(false);
    window.location.reload(); 
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleCreateHostel = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/admin/hostels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: hostelName,
          total_rooms: parseInt(totalRooms),
          total_floors: parseInt(totalFloors)
        })
      });

      if (response.ok) {
        setIsModalOpen(false);
        setHostelName('');
        setTotalRooms('');
        setTotalFloors('1');
        window.location.reload(); 
      } else {
        alert('Failed to create hostel. Make sure the name is unique.');
      }
    } catch (error) {
      console.error('Error creating hostel:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navLinks = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Overview' },
    { path: '/admin/directory', icon: 'group', label: 'Student Directory' },
    { path: '/admin/register', icon: 'person_add', label: 'Register Student' },
    { path: '/admin/action-center', icon: 'analytics', label: 'Action Center' },
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
          
          {/* Desktop Hostel Dropdown */}
          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-slate-500 text-[18px]">domain</span>
              <span className="font-semibold text-sm text-slate-700">
                {localStorage.getItem('selectedHostelId') === 'all' || !localStorage.getItem('selectedHostelId') 
                  ? 'All Hostels' 
                  : currentHostel ? currentHostel.name : 'Loading...'}
              </span>
              <span className="material-symbols-outlined text-slate-500 text-[18px]">
                {isDropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* The Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-10 left-0 mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1">
                <button
                  onClick={() => handleSelectHostel('all')}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                    localStorage.getItem('selectedHostelId') === 'all' || !localStorage.getItem('selectedHostelId') 
                      ? 'bg-slate-100 font-semibold text-blue-600' 
                      : 'text-slate-700'
                  }`}
                >
                  All Hostels
                </button>
                <div className="w-full h-px bg-slate-100 my-1"></div>
                {hostels.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-slate-500">No buildings found</div>
                ) : (
                  hostels.map(hostel => (
                    <button
                      key={hostel.id}
                      onClick={() => handleSelectHostel(hostel.id)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                        String(localStorage.getItem('selectedHostelId')) === String(hostel.id) 
                          ? 'bg-slate-100 font-semibold text-blue-600' 
                          : 'text-slate-700'
                      }`}
                    >
                      {hostel.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Action Buttons & Premium Profile Pill */}
        <div className="flex items-center gap-3">
          <button onClick={() => setIsModalOpen(true)} className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors shadow-sm hidden sm:block">
            + Add Hostel
          </button>
          
          <button onClick={() => setIsAllotModalOpen(true)} className="text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-md transition-colors shadow-sm hidden sm:block">
            + Allot Room
          </button>

          <div className="flex items-center gap-3 px-2 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md transition-shadow ml-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              AD
            </div>
            <span className="text-sm font-semibold text-slate-700 hidden lg:block pr-2">Admin Portal</span>
            <div className="w-px h-5 bg-slate-200 hidden lg:block"></div>
            <button onClick={handleLogout} className="flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors pr-2 lg:pr-1" title="Logout">
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
            <p className="text-slate-400 text-xs font-medium tracking-wide mt-0.5">ADMIN PORTAL</p>
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

        {/* Bottom Settings Section */}
        <div className="mt-auto px-6 pt-6 border-t border-slate-800/50">
          <div className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-sm font-medium">System Settings</span>
          </div>
        </div>
      </nav>

      {/* --- MAIN PAGE CONTENT --- */}
      <main className="md:ml-[260px] pt-[64px] min-h-screen bg-slate-50">
        {children}
      </main>

      {/* --- ADD HOSTEL MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-xl text-slate-900 tracking-tight">Create New Hostel</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateHostel} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Hostel Name</label>
                <input type="text" required value={hostelName} onChange={(e) => setHostelName(e.target.value)} placeholder="e.g. North Campus Hostel" className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Total Rooms</label>
                  <input type="number" required min="1" max="1000" value={totalRooms} onChange={(e) => setTotalRooms(e.target.value)} placeholder="e.g. 100" className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Total Floors</label>
                  <input type="number" required min="1" max="50" value={totalFloors} onChange={(e) => setTotalFloors(e.target.value)} placeholder="e.g. 4" className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create Hostel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ALLOT ROOM MODAL --- */}
      <AllotRoomModal isOpen={isAllotModalOpen} onClose={() => setIsAllotModalOpen(false)} />
    </div>
  );
}