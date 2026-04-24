import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import StudentLayout from '../components/StudentLayout';

export default function StudentExchange() {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [targetRoomId, setTargetRoomId] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch full exchange history
  const fetchExchanges = async () => {
    try {
      const token = localStorage.getItem('token');
      const email = jwtDecode(token).sub;
      
      const response = await fetch(`http://localhost:8000/student/exchanges/${email}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setExchanges(await response.json());
      }
    } catch (err) {
      console.error("Failed to fetch exchanges:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchanges();
  }, []);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const email = jwtDecode(token).sub;
      
      const res = await fetch('http://localhost:8000/student/exchange-request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          email, 
          requested_room_id: targetRoomId, 
          reason: reason 
        })
      });
      
      if(res.ok) {
        setTargetRoomId('');
        setReason('');
        fetchExchanges(); // Refresh the table automatically
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

  // Helper for status badge styling
  const getStatusBadge = (status) => {
    const s = status === 'Open' ? 'Pending' : status;
    if (s === 'Pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 font-label-sm text-label-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Pending Review
        </span>
      );
    }
    if (s === 'Approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-label-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Approved
        </span>
      );
    }
    if (s === 'Rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-label-sm text-label-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-label-sm text-label-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> {s}
      </span>
    );
  };

  return (
    <StudentLayout>
      <div className="mb-8">
        <h2 className="font-h1 text-h1 text-on-surface mb-2">Room Exchange</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Request a relocation or track your pending exchange requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Section: Request Form */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
            <h3 className="font-h3 text-h3 text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">swap_calls</span>
              Request Room Relocation
            </h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Target Room ID</label>
                <div className="relative">
                  <input 
                    type="number"
                    required
                    value={targetRoomId}
                    onChange={(e) => setTargetRoomId(e.target.value)}
                    placeholder="Enter the ID of the room you want"
                    className="w-full bg-surface border border-outline-variant/50 rounded-lg py-3 px-4 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Reason for Move</label>
                <textarea 
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/50 rounded-lg py-3 px-4 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all resize-none" 
                  placeholder="Please provide details to help us process your request..." 
                  rows="4"
                ></textarea>
              </div>
              
              <div className="mt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-on-primary font-label-md text-label-md py-3 px-6 rounded-lg shadow-sm hover:bg-primary/90 hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
              </div>
            </form>
          </div>

          {/* Info Card */}
          <div className="bg-surface-container-low rounded-xl border border-secondary-fixed/50 p-5 flex gap-4 items-start">
            <span className="material-symbols-outlined text-secondary mt-0.5">info</span>
            <div>
              <h4 className="font-label-md text-label-md text-on-surface mb-1">Exchange Policy</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Room exchanges are subject to availability and administrative approval. Requests are processed within 3-5 business days.</p>
            </div>
          </div>
        </div>

        {/* Right Section: Past Requests Table */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-bright">
              <h3 className="font-h3 text-h3 text-on-surface">Past Exchange Requests</h3>
              <button className="text-secondary font-label-sm text-label-sm flex items-center gap-1 hover:bg-secondary-fixed/20 px-3 py-1.5 rounded-md transition-colors">
                <span className="material-symbols-outlined text-sm">filter_list</span> Filter
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container/50 border-b border-outline-variant/30">
                    <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Request ID</th>
                    <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Target Room Requested</th>
                    <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md divide-y divide-outline-variant/20">
                  
                  {loading && (
                    <tr><td colSpan="3" className="py-8 text-center text-on-surface-variant">Loading requests...</td></tr>
                  )}
                  
                  {!loading && exchanges.length === 0 && (
                    <tr><td colSpan="3" className="py-8 text-center text-on-surface-variant">No exchange requests found.</td></tr>
                  )}

                  {exchanges.map((exchange) => (
                    <tr key={exchange.id} className="hover:bg-surface-bright transition-colors group cursor-default">
                      <td className="py-4 px-6 text-on-surface font-mono">REQ-{String(exchange.id).padStart(4, '0')}</td>
                      <td className="py-4 px-6 text-on-surface font-medium">Room ID: {exchange.target_room}</td>
                      <td className="py-4 px-6 text-right">
                        {getStatusBadge(exchange.status)}
                      </td>
                    </tr>
                  ))}
                  
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </StudentLayout>
  );
}