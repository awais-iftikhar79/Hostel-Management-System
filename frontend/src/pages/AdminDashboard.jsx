import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';

export default function AdminDashboard() {
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(localStorage.getItem('selectedHostelId') || null);
  const [roomData, setRoomData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Floor filter state
  const [selectedFloor, setSelectedFloor] = useState('All Floors');

  // Fetch initial hostel data
  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/admin/hostels', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHostels(data);
          if (data.length > 0 && !selectedHostel) {
            setSelectedHostel(data[0].id);
            localStorage.setItem('selectedHostelId', data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHostels();
  }, []);

  // Fetch the map data for the selected hostel
  useEffect(() => {
    if (!selectedHostel) return;
    
    const fetchMap = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8000/admin/hostel-map/${selectedHostel}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRoomData(data.rooms || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMap();
    
    // Poll for changes from the Top Nav (in case AdminLayout updates the local storage)
    const interval = setInterval(() => {
        const currentId = localStorage.getItem('selectedHostelId');
        if(currentId && currentId !== selectedHostel) {
            setSelectedHostel(currentId);
        }
    }, 1000);
    return () => clearInterval(interval);
    
  }, [selectedHostel]);

  // Group rooms by their floor
  const roomsByFloor = roomData.reduce((acc, room) => {
    const floor = room.floor || 'Ground Floor';
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {});

  const selectedHostelName = hostels.find(h => String(h.id) === String(selectedHostel))?.name || "Loading...";

  // Determine which floors to render based on the new dropdown
  const floorsToRender = selectedFloor === 'All Floors' 
    ? Object.keys(roomsByFloor).sort() 
    : [selectedFloor].filter(f => roomsByFloor[f]);

  // Delete Hostel Handler
  const handleDeleteHostel = async () => {
    if (!selectedHostel) return;
    
    const confirmDelete = window.confirm(`Are you absolutely sure you want to delete ${selectedHostelName}? This will permanently erase all its rooms and current allocations!`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/admin/hostels/${selectedHostel}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        alert("Hostel deleted successfully!");
        localStorage.removeItem('selectedHostelId');
        window.location.reload(); // Refresh page to load remaining hostels
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to delete hostel.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-[1440px] mx-auto w-full">
        
        {/* Page Title & Controls Layer */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-[32px] font-bold text-slate-900 tracking-tight">Room Map: {selectedHostelName}</h1>
                <button 
                  onClick={handleDeleteHostel}
                  className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                  title="Delete this Hostel"
                >
                  <span className="material-symbols-outlined text-[24px]">delete</span>
                </button>
            </div>
            <p className="text-[16px] text-slate-500 font-medium">Live overview of occupancy and status.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Floor Filter Dropdown */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
              <span className="material-symbols-outlined text-slate-400 mr-2 text-[20px]">layers</span>
              <select 
                value={selectedFloor} 
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="bg-transparent border-none text-slate-700 font-medium text-sm focus:ring-0 cursor-pointer outline-none w-full"
              >
                <option value="All Floors">All Floors</option>
                {Object.keys(roomsByFloor).sort().map(floor => (
                  <option key={floor} value={floor}>{floor}</option>
                ))}
              </select>
            </div>

            {/* Status Legend */}
            <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm text-sm font-medium text-slate-600">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300"></span> Empty</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-400"></span> Partial</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400"></span> Full</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> Issue</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
             <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
             <p className="font-medium text-lg">Loading room map...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {floorsToRender.map((floorName) => (
              <div key={floorName}>
                {/* Floor Header */}
                <h2 className="text-xl font-bold text-slate-800 mb-6 pb-2 border-b border-slate-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400">layers</span>
                  {floorName} - {selectedFloor === 'All Floors' ? 'All Rooms' : 'Filtered'}
                </h2>

                {/* Rooms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {roomsByFloor[floorName].map((room) => {
                    // Logic for Status and Issues
                    const activeOccupants = room.allocations ? room.allocations.length : 0;
                    const openComplaints = room.complaints ? room.complaints.filter(c => c.status !== 'Resolved') : [];
                    const hasIssue = openComplaints.length > 0;
                    
                    // Thematically correct styling
                    let cardClasses = "bg-white border-slate-200 shadow-sm";
                    let occupancyColor = "text-emerald-600";
                    let bedIconColor = "text-slate-400";
                    let bedBgColor = "bg-slate-50 border-slate-100";
                    
                    if (hasIssue) {
                      cardClasses = "bg-red-50/10 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.15)]";
                      bedIconColor = "text-red-400";
                      bedBgColor = "bg-red-50 border-red-100";
                    } else if (activeOccupants === room.capacity) {
                      cardClasses = "bg-white border-amber-300 shadow-sm border-l-4 border-l-amber-400";
                      occupancyColor = "text-amber-600";
                      bedIconColor = "text-amber-500";
                      bedBgColor = "bg-amber-50 border-amber-100";
                    } else if (activeOccupants > 0) {
                      cardClasses = "bg-white border-emerald-300 shadow-sm border-l-4 border-l-emerald-400";
                    }

                    return (
                      <div key={room.id} className={`rounded-xl p-6 border-2 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between min-h-[160px] ${cardClasses}`}>
                        
                        {/* Top Row: Room Number & Issue Badge */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{room.room_number}</span>
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider rounded-full">Standard</span>
                          </div>
                          
                          {/* Top Right Icon / Issue Badge */}
                          {hasIssue ? (
                            <div className="flex items-center gap-1 text-red-600 bg-red-100 px-2.5 py-1 rounded-md border border-red-200 shadow-sm">
                              <span className="material-symbols-outlined text-[16px]">build</span>
                              <span className="text-xs font-bold tracking-wide">Maintenance</span>
                            </div>
                          ) : (
                            <span className="material-symbols-outlined text-slate-300">door_front</span>
                          )}
                        </div>

                        {/* Middle Row: Issue Description (If exists) */}
                        {hasIssue && (
                          <div className="mb-4">
                            <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-0.5">Issue Reported</p>
                            <p className="text-sm font-medium text-red-700 truncate" title={openComplaints[0].description}>
                                {openComplaints[0].category}: {openComplaints[0].description}
                            </p>
                          </div>
                        )}

                        {/* Bottom Row: Occupancy & Avatars */}
                        <div className="flex justify-between items-end mt-auto">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Occupancy</p>
                            <p className="text-lg font-bold text-slate-800">
                              <span className={activeOccupants > 0 && !hasIssue ? occupancyColor : "text-slate-800"}>{activeOccupants}</span>
                              <span className="text-slate-400 font-medium">/{room.capacity} beds</span>
                            </p>
                          </div>

                          {/* Render Avatars if occupied, else empty bed icon */}
                          {activeOccupants > 0 ? (
                            <div className="flex -space-x-2">
                              {[...Array(activeOccupants)].map((_, i) => (
                                <div key={i} className="w-9 h-9 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm relative z-10">
                                  U
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center border ${bedBgColor}`}>
                              <span className={`material-symbols-outlined ${bedIconColor}`}>bed</span>
                            </div>
                          )}
                        </div>
                        
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {roomData.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">meeting_room</span>
                <p className="text-slate-600 font-medium text-lg">No rooms found.</p>
                <p className="text-slate-500 text-sm">Please create rooms or check your database.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}