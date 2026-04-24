import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import StudentLayout from '../components/StudentLayout';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Complaint Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('Electrical');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Room Exchange Modal States
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState('');
  const [exchangeReason, setExchangeReason] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const decoded = jwtDecode(token);
        const email = decoded.sub; // Fastapi OAuth2 uses 'sub' for the username/email

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

  // Handle lodging a complaint
  const handleLodgeComplaint = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const email = jwtDecode(token).sub;
      
      const res = await fetch('http://localhost:8000/student/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email, category, description })
      });
      
      if(res.ok) {
        setIsModalOpen(false);
        setDescription('');
        window.location.reload(); // Refresh to see the new complaint in Recent Activity!
      } else {
         const err = await res.json();
         alert(err.detail || "Failed to lodge complaint.");
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle requesting a room exchange
  const handleRoomExchange = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const email = jwtDecode(token).sub;
      
      const res = await fetch('http://localhost:8000/student/exchange-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          email, 
          requested_room_id: targetRoomId, 
          reason: exchangeReason 
        })
      });
      
      if(res.ok) {
        setIsExchangeModalOpen(false);
        setTargetRoomId('');
        setExchangeReason('');
        window.location.reload(); // Refresh to see request in Recent Activity
      } else {
         const err = await res.json();
         alert(err.detail || "Failed to submit request.");
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <StudentLayout><div className="p-8">Loading your portal...</div></StudentLayout>;
  if (error) return <StudentLayout><div className="p-8 text-error">Error: {error}</div></StudentLayout>;

  return (
    <StudentLayout>
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="font-h1 text-h1 text-on-surface">Good morning, {data.student_name.split(' ')[0]}</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Here is your hostel overview.</p>
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
          <button disabled={data.financials.total_balance === 0} className="relative z-10 w-full py-3 bg-surface-container-lowest text-primary font-label-md rounded-lg hover:bg-surface transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {data.financials.total_balance === 0 ? 'All Settled' : 'Pay Now'}
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
            <button onClick={() => setIsModalOpen(true)} className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-outline-variant bg-surface-bright hover:border-secondary hover:bg-surface-container-low transition-all group text-center h-full">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-secondary-fixed group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                <span className="material-symbols-outlined text-[24px]">report_problem</span>
              </div>
              <span className="font-label-md text-on-surface">Lodge Complaint</span>
            </button>
            <button onClick={() => setIsExchangeModalOpen(true)} className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-outline-variant bg-surface-bright hover:border-secondary hover:bg-surface-container-low transition-all group text-center h-full">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-secondary-fixed group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                <span className="material-symbols-outlined text-[24px]">move_up</span>
              </div>
              <span className="font-label-md text-on-surface">Request Change</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* LODGE COMPLAINT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-h2 text-on-surface">Lodge a Complaint</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleLodgeComplaint} className="space-y-4">
              <div>
                <label className="block font-label-md text-on-surface mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-secondary/20 outline-none">
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Internet">Internet</option>
                  <option value="Furniture">Furniture</option>
                </select>
              </div>
              <div>
                <label className="block font-label-md text-on-surface mb-1">Description</label>
                <textarea required rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail..." className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-secondary/20 outline-none"></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-on-surface-variant font-label-md hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-error text-white font-label-md rounded-lg hover:bg-error/90 disabled:opacity-50">
                  {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROOM EXCHANGE MODAL */}
      {isExchangeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-h2 text-on-surface">Request Room Exchange</h2>
              <button onClick={() => setIsExchangeModalOpen(false)} className="text-slate-400 hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleRoomExchange} className="space-y-4">
              <div>
                <label className="block font-label-md text-on-surface mb-1">Target Room ID</label>
                <input 
                  type="number" 
                  required 
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  placeholder="Enter the ID of the room you want" 
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-secondary/20 outline-none"
                />
              </div>
              <div>
                <label className="block font-label-md text-on-surface mb-1">Reason for Change</label>
                <textarea 
                  required 
                  rows="3" 
                  value={exchangeReason}
                  onChange={(e) => setExchangeReason(e.target.value)}
                  placeholder="Why do you want to switch rooms?" 
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-secondary/20 outline-none"
                ></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsExchangeModalOpen(false)} className="px-4 py-2 text-on-surface-variant font-label-md hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-secondary text-white font-label-md rounded-lg hover:bg-secondary/90 disabled:opacity-50">
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}