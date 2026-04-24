import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import StudentLayout from '../components/StudentLayout';

export default function StudentRoom() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const token = localStorage.getItem('token');
        const decoded = jwtDecode(token);
        const email = decoded.sub;

        // We can reuse the dashboard endpoint because it already contains room & roommate data!
        const response = await fetch(`http://localhost:8000/student/dashboard/${email}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch room details');
        
        setData(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRoomData();
  }, []);

  if (loading) return <StudentLayout><div className="p-8 text-on-surface">Loading room details...</div></StudentLayout>;
  if (error) return <StudentLayout><div className="p-8 text-error">Error: {error}</div></StudentLayout>;

  // Filter recent activity to only show Complaints for the Maintenance Log section
  const maintenanceLogs = data.recent_activity?.filter(act => act.type === 'Complaint') || [];

  return (
    <StudentLayout>
      {/* --- UPDATED HEADER WITH NEW TYPOGRAPHY --- */}
      <div className="mb-8">
        <h1 className="text-[32px] font-bold text-slate-900 tracking-tight mb-2">
          My Room Details
        </h1>
        <p className="text-[16px] text-slate-500 font-medium">
          View your current accommodation and roommate information.
        </p>
      </div>

      {/* Check if student actually has a room assigned */}
      {!data.room ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-outline mb-4">bed</span>
            <h2 className="font-h2 text-h2 text-on-surface mb-2">No Room Assigned</h2>
            <p className="font-body-md text-on-surface-variant max-w-md mx-auto">
                You have not been allotted a room yet. Please wait for the administrator to process your allocation, or check the Action Center.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          
          {/* Room Info Card (Featured) */}
          <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm relative overflow-hidden group min-h-[320px] flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-[160px]">bed</span>
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm mb-4">
                    CURRENT ASSIGNMENT
                  </span>
                  <h2 className="font-h1 text-[48px] leading-tight text-primary mb-2">
                    Room {data.room.room_number}
                  </h2>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span className="font-label-md text-label-md">{data.room.hostel_name}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <div className="bg-surface-container-low px-4 py-3 rounded-lg flex items-center gap-3 border border-outline-variant/50">
                    <span className="material-symbols-outlined text-secondary">layers</span>
                    <span className="font-label-md text-label-md">Standard Level</span>
                  </div>
                  
                  {/* --- DYNAMIC OCCUPANCY BADGE --- */}
                  <div className="bg-surface-container-low px-4 py-3 rounded-lg flex items-center gap-3 border border-outline-variant/50">
                    <span className="material-symbols-outlined text-secondary">group</span>
                    <span className="font-label-md text-label-md font-medium text-slate-800">
                      {data.room.roommates.length + 1} / {data.room.capacity || 4} Beds Filled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Roommates Card */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-h3 text-h3 text-primary">Roommates</h3>
              <span className="material-symbols-outlined text-on-surface-variant">group</span>
            </div>
            
            <div className="space-y-6 flex-grow">
              {data.room.roommates.length === 0 ? (
                  <p className="text-on-surface-variant text-sm text-center py-4">No other roommates assigned to this room yet.</p>
              ) : (
                  data.room.roommates.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-4 group p-2 -m-2 rounded-lg hover:bg-surface-container-low transition-colors">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary-container text-on-primary text-xl font-bold shadow-sm">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-primary">{name}</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Hostel Resident</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Recent Activity / Maintenance Logs */}
          <div className="col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-h3 text-h3 text-primary mb-1">Maintenance Logs</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Recent service requests for your room</p>
              </div>
              <a href="/student/maintenance" className="text-secondary font-label-md text-label-md flex items-center gap-1 hover:underline cursor-pointer">
                Raise Request <span className="material-symbols-outlined text-sm">add</span>
              </a>
            </div>
            
            <div className="space-y-0 border border-outline-variant rounded-lg overflow-hidden">
              {maintenanceLogs.length === 0 ? (
                 <div className="p-6 text-center text-on-surface-variant">No recent maintenance requests for this room.</div>
              ) : (
                  maintenanceLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white hover:bg-surface-container-low transition-colors border-b border-outline-variant last:border-b-0">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-outline-variant">
                          <span className="material-symbols-outlined text-primary text-[20px]">{log.icon}</span>
                        </div>
                        <div>
                          <p className="font-label-md text-label-md text-primary">{log.title}</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-xs md:max-w-md">{log.desc}</p>
                        </div>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-label-sm font-label-sm border ${
                          log.status === 'Resolved' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : log.status === 'In Progress'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-surface-container-highest text-on-surface-variant border-outline-variant/30'
                      }`}>
                        {log.status === 'Open' ? 'Pending' : log.status}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
          
        </div>
      )}
    </StudentLayout>
  );
}