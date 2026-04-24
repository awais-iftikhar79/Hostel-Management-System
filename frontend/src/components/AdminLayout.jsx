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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Allot Room Modal state
  const [isAllotModalOpen, setIsAllotModalOpen] = useState(false);

  // NEW DROPDOWN STATES
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
            localStorage.setItem('selectedHostelId', 'all'); // Set default to All Hostels
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
    window.location.reload(); // Quick refresh to update the dashboard data
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Function to actually create the hostel in your database
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
          total_rooms: parseInt(totalRooms)
        })
      });

      if (response.ok) {
        setIsModalOpen(false);
        setHostelName('');
        setTotalRooms('');
        // Refresh the page to show the new data
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
    <div className="bg-background text-on-background font-body-md antialiased overflow-x-hidden">
      
      {/* SideNavBar */}
      <nav className="fixed left-0 top-0 h-full w-[260px] z-40 bg-[#1E293B] border-r border-slate-700 shadow-xl flex flex-col py-6 transition-all duration-200 ease-in-out">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
          </div>
          <div>
            <h1 className="font-h3 text-h3 text-white tracking-tight">DormFlow</h1>
            <p className="font-body-sm text-body-sm text-slate-400">Hostel Management</p>
          </div>
        </div>
        
        <div className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = location.pathname.includes(link.path);
            return (
              <button 
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  isActive 
                    ? 'text-white bg-slate-800/50 border-l-4 border-white rounded-l-none' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/30 border-l-4 border-transparent'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{link.icon}</span>
                <span className="font-label-md text-label-md">{link.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto px-3 pt-6 border-t border-slate-700/50 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800/30 rounded-md transition-colors">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="font-label-md text-label-md">Settings</span>
          </button>
        </div>
      </nav>

      {/* TopAppBar */}
      <header className="fixed top-0 right-0 h-16 left-[260px] z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm flex justify-between items-center px-8 transition-transform">
        
        {/* DROPDOWN AREA */}
        <div className="flex items-center gap-4 relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
          >
            <span className="material-symbols-outlined text-[#1E293B] text-[20px]">domain</span>
            <span className="font-label-md text-label-md text-[#1E293B]">
              {/* Dynamic Title Logic */}
              {localStorage.getItem('selectedHostelId') === 'all' || !localStorage.getItem('selectedHostelId') 
                ? 'All Hostels' 
                : currentHostel ? currentHostel.name : 'Loading...'}
            </span>
            <span className="material-symbols-outlined text-[#1E293B] text-[20px]">
              {isDropdownOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {/* The Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-12 left-0 mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1">
              
              {/* All Hostels Option */}
              <button
                onClick={() => handleSelectHostel('all')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  localStorage.getItem('selectedHostelId') === 'all' || !localStorage.getItem('selectedHostelId') 
                    ? 'bg-slate-100 font-semibold text-primary' 
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
                        ? 'bg-slate-100 font-semibold text-primary' 
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
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="font-label-md text-label-md text-[#1E293B] bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-md transition-colors shadow-sm"
          >
              + Add Hostel
          </button>
          
          <button 
            onClick={() => setIsAllotModalOpen(true)}
            className="font-label-md text-label-md text-white bg-primary-container hover:bg-slate-800 px-4 py-2 rounded-md transition-colors shadow-sm"
          >
              + Allot Room
          </button>
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50" title="Logout">
             <span className="material-symbols-outlined text-[28px]">logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="ml-[260px] pt-16 min-h-screen bg-background">
        {children}
      </main>

      {/* --- ADD HOSTEL MODAL (POPUP) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-h2 text-h2 text-on-surface">Create New Hostel</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateHostel} className="space-y-4">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Hostel Name</label>
                <input 
                  type="text" 
                  required
                  value={hostelName}
                  onChange={(e) => setHostelName(e.target.value)}
                  placeholder="e.g. North Campus Hostel" 
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none"
                />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1">Total Rooms</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  max="500"
                  value={totalRooms}
                  onChange={(e) => setTotalRooms(e.target.value)}
                  placeholder="e.g. 50" 
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-on-surface-variant font-label-md hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white font-label-md rounded-lg hover:bg-primary-container transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Hostel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ALLOT ROOM MODAL --- */}
      <AllotRoomModal 
        isOpen={isAllotModalOpen} 
        onClose={() => setIsAllotModalOpen(false)} 
      />
    </div>
  );
}