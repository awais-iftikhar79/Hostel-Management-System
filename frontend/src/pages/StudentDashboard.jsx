import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../components/StudentLayout';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // <-- This lets us navigate between pages!

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const decoded = jwtDecode(token);
        const email = decoded.sub;

        const response = await fetch(`http://localhost:8000/student/dashboard/${email}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        
        setData(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <StudentLayout><div className="p-8">Loading your portal...</div></StudentLayout>;
  if (error) return <StudentLayout><div className="p-8 text-error">Error: {error}</div></StudentLayout>;

  return (
    <StudentLayout>
      {/* --- UPDATED HEADER WITH NEW TYPOGRAPHY --- */}
      <div className="mb-8">
        <h1 className="text-[32px] font-bold text-slate-900 tracking-tight mb-2">
          Good morning, <span className="text-blue-600">{data.student_name.split(' ')[0]}</span>
        </h1>
        <p className="text-[16px] text-slate-500 font-medium">
          Here is your hostel overview.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-[minmax(200px,auto)]">
        
        {/* Widget A (My Room) */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl p-8 border border-surface-container shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">My Room</h3>
              <div className="flex items-center gap-3">
                <span className="font-h1 text-h1 text-on-surface">{data.room ? data.room.room_number : 'Pending Allocation'}</span>
                {data.room && <span className="px-2.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] font-label-sm border border-[#CEEAD6]">Occupied</span>}
              </div>
            </div>
            {data.room && <div className="font-label-sm text-secondary bg-secondary/10 px-3 py-1 rounded-full">{data.room.hostel_name}</div>}
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant mb-2">Roommates</p>
            <div className="flex items-center gap-3">
              {data.room && data.room.roommates.length > 0 ? (
                data.room.roommates.map((name, i) => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-primary-container text-on-primary flex items-center justify-center font-label-md shadow-sm ${i > 0 ? '-ml-4' : ''}`} title={name}>
                    {name.substring(0, 1).toUpperCase()}
                  </div>
                ))
              ) : (
                <span className="text-on-surface-variant text-sm">No roommates assigned yet.</span>
              )}
            </div>
          </div>
        </div>

        {/* Widget B (Current Balance) */}
        <div className="md:col-span-4 bg-primary text-on-primary rounded-xl p-8 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary-container/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-label-sm text-label-sm text-on-primary/70 uppercase tracking-wider">Current Balance</h3>
              <span className="material-symbols-outlined text-on-primary/70">account_balance_wallet</span>
            </div>
            <div className="font-h1 text-[36px] font-bold tracking-tight mb-4">Rs. {data.financials.total_balance}</div>
            
            <div className="space-y-2 mb-8 border-t border-on-primary/10 pt-4">
              {data.financials.details.length === 0 && <div className="text-on-primary/70 text-sm">No pending fees.</div>}
              {data.financials.details.map((fee, i) => (
                <div key={i} className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-primary/70">{fee.type}</span>
                  <span className="font-medium text-on-primary">Rs. {fee.amount}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Changed this button to navigate to payments page */}
          <button onClick={() => navigate('/student/payments')} className="relative z-10 w-full py-3 bg-surface-container-lowest text-primary font-label-md rounded-lg hover:bg-surface transition-colors flex items-center justify-center gap-2">
            View Payments
          </button>
        </div>

        {/* Widget C (Recent Activity) */}
        <div className="md:col-span-7 bg-surface-container-lowest rounded-xl p-8 border border-surface-container shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-h3 text-h3 text-on-surface">Recent Activity</h3>
          </div>
          <div className="space-y-0">
            {data.recent_activity.length === 0 ? (
              <div className="text-on-surface-variant text-sm py-4">No recent activity found.</div>
            ) : (
              data.recent_activity.map((act, i) => (
                <div key={i} className="flex items-start gap-4 py-3 border-b border-surface-container last:border-0 hover:bg-surface/50 rounded-lg -mx-2 px-2 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 ${act.type === 'Complaint' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                    <span className="material-symbols-outlined text-[20px]">{act.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label-md text-label-md text-on-surface truncate">{act.title}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{act.desc}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-md font-label-sm text-[10px] border ${act.status === 'Resolved' || act.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {act.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget D (Quick Actions) */}
        <div className="md:col-span-5 bg-surface-container-lowest rounded-xl p-8 border border-surface-container shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h3 className="font-h3 text-h3 text-on-surface mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 h-[calc(100%-48px)]">
            
            {/* Navigates directly to the maintenance page */}
            <button onClick={() => navigate('/student/maintenance')} className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-outline-variant bg-surface-bright hover:border-secondary hover:bg-surface-container-low transition-all group text-center h-full">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-secondary-fixed group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                <span className="material-symbols-outlined text-[24px]">report_problem</span>
              </div>
              <span className="font-label-md text-on-surface">Lodge Complaint</span>
            </button>
            
            {/* Navigates directly to the room exchange page */}
            <button onClick={() => navigate('/student/exchange')} className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-outline-variant bg-surface-bright hover:border-secondary hover:bg-surface-container-low transition-all group text-center h-full">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-secondary-fixed group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                <span className="material-symbols-outlined text-[24px]">move_up</span>
              </div>
              <span className="font-label-md text-on-surface">Request Change</span>
            </button>
            
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}