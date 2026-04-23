import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';

export default function AdminDashboard() {
  const [hostelData, setHostelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHostelData = async () => {
      try {
        const token = localStorage.getItem('token');
        // Let's assume we are viewing Hostel ID 1 for now
        const currentHostelId = localStorage.getItem('selectedHostelId') || 1;
        const response = await fetch(`http://localhost:8000/admin/hostel-map/${currentHostelId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch hostel data');
        }

        const data = await response.json();
        setHostelData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHostelData();
  }, []);

  // Helper function to determine room styling based on occupancy & complaints
  const getRoomStyle = (room) => {
    const hasComplaint = room.complaints && room.complaints.length > 0;
    
    if (hasComplaint) {
      return {
        borderColor: 'border-red-200',
        bgColor: 'bg-red-50/50',
        stripeColor: 'bg-red-500',
        iconColor: 'text-red-500',
        badgeBg: 'bg-red-100',
        badgeText: 'text-red-700',
        statusText: 'text-red-600/80',
        statusLabel: 'Issue Reported'
      };
    }
    
    if (room.current_occupancy === 0) {
      return {
        borderColor: 'border-slate-200',
        bgColor: 'bg-white',
        stripeColor: 'bg-slate-400',
        iconColor: 'text-slate-400',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-600',
        statusText: 'text-on-surface-variant',
        statusLabel: 'Occupancy'
      };
    }
    
    if (room.current_occupancy < room.capacity) {
      return {
        borderColor: 'border-emerald-200',
        bgColor: 'bg-white',
        stripeColor: 'bg-emerald-500',
        iconColor: 'text-emerald-500',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-600',
        statusText: 'text-on-surface-variant',
        statusLabel: 'Occupancy'
      };
    }

    // Full capacity
    return {
      borderColor: 'border-amber-200',
      bgColor: 'bg-white',
      stripeColor: 'bg-amber-500',
      iconColor: 'text-amber-500',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-600',
      statusText: 'text-on-surface-variant',
      statusLabel: 'Occupancy'
    };
  };

  if (loading) return <AdminLayout><div className="p-8">Loading dashboard data...</div></AdminLayout>;
  if (error) return <AdminLayout><div className="p-8 text-red-500">Error: {error}</div></AdminLayout>;
  if (!hostelData) return <AdminLayout><div className="p-8">No hostel found.</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-[1440px] mx-auto p-8 space-y-8">
        
        {/* Page Header & Legend */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-h2 text-h2 text-on-surface mb-1">Room Map: {hostelData.name}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Live overview of occupancy and status.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400"></div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Empty</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Full</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Issue</span>
            </div>
          </div>
        </div>

        {/* Bento Grid Room Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="col-span-full mb-2">
            <h3 className="font-h3 text-h3 text-on-surface border-b border-slate-200 pb-2">Ground Floor - All Rooms</h3>
          </div>

          {/* Map over the rooms from the database */}
          {hostelData.rooms.map((room) => {
            const style = getRoomStyle(room);
            const hasComplaint = room.complaints && room.complaints.length > 0;
            
            return (
              <div key={room.id} className={`${style.bgColor} rounded-xl border ${style.borderColor} p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-200 cursor-pointer group relative overflow-hidden`}>
                <div className={`absolute top-0 left-0 w-1 h-full ${style.stripeColor}`}></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-h2 text-h2 text-on-surface">{room.room_number}</span>
                    <span className={`px-2 py-0.5 rounded-full ${style.badgeBg} ${style.badgeText} font-label-sm text-label-sm flex items-center gap-1`}>
                      {hasComplaint && <span className="material-symbols-outlined text-[14px]">warning</span>}
                      {hasComplaint ? 'Maintenance' : 'Standard'}
                    </span>
                  </div>
                  <span className={`material-symbols-outlined ${style.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {hasComplaint ? 'build' : 'meeting_room'}
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className={`font-body-sm text-body-sm ${style.statusText} mb-1`}>{style.statusLabel}</p>
                    {hasComplaint ? (
                      <p className="font-label-md text-label-md text-red-700 truncate w-32">{room.complaints[0].category}</p>
                    ) : (
                      <p className={`font-h3 text-h3 ${room.current_occupancy > 0 ? (room.current_occupancy === room.capacity ? 'text-amber-600' : 'text-emerald-600') : 'text-slate-500'}`}>
                        {room.current_occupancy}/{room.capacity} <span className="font-body-sm text-body-sm font-normal">beds</span>
                      </p>
                    )}
                  </div>
                  
                  {/* Avatars or Bed Icon */}
                  {room.current_occupancy > 0 ? (
                    <div className="flex -space-x-2">
                      {[...Array(room.current_occupancy)].map((_, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                          <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 group-hover:bg-slate-100 transition-colors">
                      <span className="material-symbols-outlined text-slate-400" style={{ fontVariationSettings: "'FILL' 1" }}>bed</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </AdminLayout>
  );
}