import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import StudentLayout from '../components/StudentLayout';

export default function StudentPayments() {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State for uploading screenshot
  const [selectedFeeId, setSelectedFeeId] = useState(null);

  // NEW: Filter States for the table
  const [feeTypeFilter, setFeeTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem('token');
        const email = jwtDecode(token).sub;

        const response = await fetch(`http://localhost:8000/student/payments/${email}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch payment data');
        setPaymentData(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  // Upload Screenshot Handler
  const handleUploadScreenshot = async (e) => {
    e.preventDefault();
    const file = e.target.receipt.files[0];
    if (!file) return;

    // Convert image to Base64 string for database storage
    const reader = new FileReader();
    reader.onloadend = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/student/pay-bill/${selectedFeeId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ receipt_url: reader.result })
            });

            if(response.ok) {
                setSelectedFeeId(null);
                window.location.reload(); // Refresh to show "Under Review"
            } else {
                alert("Failed to upload screenshot.");
            }
        } catch(err) {
            console.error(err);
        }
    };
    reader.readAsDataURL(file);
  };

  // Helper to normalize status for the UI badges
  const getNormalizedStatus = (status) => {
    if (status === 'Open' || status === 'Pending') return 'Pending';
    if (status === 'Paid' || status === 'Approved') return 'Verified';
    return status;
  };

  const getStatusBadge = (status) => {
    const s = getNormalizedStatus(status);
    if (s === 'Verified') return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>;
    if (s === 'Pending') return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">Pending</span>;
    if (s === 'Under Review') return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Under Review</span>;
    if (s === 'Rejected') return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">Rejected</span>;
    
    return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{s}</span>;
  };

  if (loading) return <StudentLayout><div className="p-8">Loading financial records...</div></StudentLayout>;
  if (error) return <StudentLayout><div className="p-8 text-error">Error: {error}</div></StudentLayout>;

  // Apply filters to the payment history
  const filteredHistory = paymentData.history.filter(record => {
    const recordStatus = getNormalizedStatus(record.status);
    const matchesFeeType = feeTypeFilter === 'All' || record.fee_type === feeTypeFilter;
    const matchesStatus = statusFilter === 'All' || recordStatus === statusFilter;
    return matchesFeeType && matchesStatus;
  });

  return (
    <StudentLayout>
      
      {/* --- UPDATED HEADER WITH NEW TYPOGRAPHY --- */}
      <div className="mb-8">
        <h1 className="text-[32px] font-bold text-slate-900 tracking-tight mb-2">
          Fee &amp; Payments
        </h1>
        <p className="text-[16px] text-slate-500 font-medium">
          Manage your hostel dues and upload payment screenshots.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Outstanding Balance Banner */}
        <section className="col-span-12">
          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row">
            <div className="bg-primary p-8 md:w-1/3 flex flex-col justify-center items-start">
              <div className="flex items-center gap-2 text-on-primary/70 mb-2">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                <span className="font-label-md text-label-md uppercase tracking-wider">Total Outstanding</span>
              </div>
              <div className="text-white">
                <span className="text-[36px] font-bold block tracking-tight">Rs. {paymentData.total_outstanding}</span>
                <span className="font-body-sm text-on-primary/70">Due by 15th of the month</span>
              </div>
              <button disabled={paymentData.total_outstanding === 0} className="mt-6 bg-secondary text-white font-label-md px-6 py-3 rounded-lg hover:bg-secondary/90 transition-all flex items-center gap-2 disabled:opacity-50">
                <span>{paymentData.total_outstanding === 0 ? 'All Settled' : 'Pay Pending Bills Below'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
              </button>
            </div>

            <div className="p-8 md:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-surface rounded-lg border border-outline-variant/30">
                <div className="flex items-center gap-2 mb-2 text-secondary"><span className="material-symbols-outlined text-[20px]">restaurant</span><h3 className="font-label-md">Mess Bill</h3></div>
                <p className="font-h2 text-h2 text-primary">Rs. {paymentData.breakdown.Mess || 0}</p>
                <p className="text-body-sm text-on-surface-variant mt-1">Pending Amount</p>
              </div>
              <div className="p-4 bg-surface rounded-lg border border-outline-variant/30">
                <div className="flex items-center gap-2 mb-2 text-secondary"><span className="material-symbols-outlined text-[20px]">bolt</span><h3 className="font-label-md">Electricity</h3></div>
                <p className="font-h2 text-h2 text-primary">Rs. {paymentData.breakdown.Electricity || 0}</p>
                <p className="text-body-sm text-on-surface-variant mt-1">Pending Amount</p>
              </div>
              <div className="p-4 bg-surface rounded-lg border border-outline-variant/30">
                <div className="flex items-center gap-2 mb-2 text-secondary"><span className="material-symbols-outlined text-[20px]">meeting_room</span><h3 className="font-label-md">Room Rent</h3></div>
                <p className="font-h2 text-h2 text-primary">Rs. {paymentData.breakdown.Rent || 0}</p>
                <p className="text-body-sm text-on-surface-variant mt-1">Pending Amount</p>
              </div>
            </div>
          </div>
        </section>

        {/* Payment History Table */}
        <section className="col-span-12">
          <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            
            {/* NEW: Filter Header */}
            <div className="px-8 py-6 border-b border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
              <h2 className="font-h3 text-h3 text-primary">Payment History & Pending Bills</h2>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Fee Type Dropdown */}
                <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-2 py-1 shadow-sm">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">category</span>
                  <select 
                    value={feeTypeFilter} 
                    onChange={(e) => setFeeTypeFilter(e.target.value)} 
                    className="bg-transparent border-none text-sm outline-none cursor-pointer pr-4 focus:ring-0 py-1 text-slate-700 font-medium"
                  >
                    <option value="All">All Fee Types</option>
                    <option value="Rent">Rent</option>
                    <option value="Mess">Mess</option>
                    <option value="Electricity">Electricity</option>
                  </select>
                </div>

                {/* Status Dropdown */}
                <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-2 py-1 shadow-sm">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">filter_list</span>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)} 
                    className="bg-transparent border-none text-sm outline-none cursor-pointer pr-4 focus:ring-0 py-1 text-slate-700 font-medium"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface text-on-surface-variant">
                  <tr>
                    <th className="px-8 py-4 font-label-md uppercase tracking-wider text-[11px] border-b border-outline-variant">Invoice ID</th>
                    <th className="px-8 py-4 font-label-md uppercase tracking-wider text-[11px] border-b border-outline-variant">Fee Type</th>
                    <th className="px-8 py-4 font-label-md uppercase tracking-wider text-[11px] border-b border-outline-variant">Amount</th>
                    <th className="px-8 py-4 font-label-md uppercase tracking-wider text-[11px] border-b border-outline-variant text-center">Status</th>
                    <th className="px-8 py-4 font-label-md uppercase tracking-wider text-[11px] border-b border-outline-variant text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {filteredHistory.length === 0 ? (
                    <tr><td colSpan="5" className="px-8 py-8 text-center text-on-surface-variant">No matching payment records found.</td></tr>
                  ) : (
                    filteredHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-surface/50 transition-colors group">
                        <td className="px-8 py-4 font-label-md text-primary font-mono">{record.invoice_id}</td>
                        <td className="px-8 py-4 font-body-md"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-secondary"></span>{record.fee_type}</div></td>
                        <td className="px-8 py-4 font-label-md text-primary">Rs. {record.amount}</td>
                        <td className="px-8 py-4 text-center">{getStatusBadge(record.status)}</td>
                        <td className="px-8 py-4 text-right">
                            {/* UPLOAD SCREENSHOT LOGIC */}
                            {(record.status === 'Pending' || record.status === 'Open' || record.status === 'Rejected') ? (
                                <button 
                                    onClick={() => setSelectedFeeId(record.id)} 
                                    className="px-3 py-1.5 bg-secondary text-white rounded font-label-sm hover:bg-secondary/90 transition-colors flex items-center justify-end gap-1 ml-auto shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[16px]">upload</span> Pay Now
                                </button>
                            ) : record.status === 'Under Review' ? (
                                <span className="text-blue-600 text-sm font-medium">Waiting for Admin</span>
                            ) : (
                                <span className="text-emerald-600 text-sm font-medium flex items-center justify-end gap-1"><span className="material-symbols-outlined text-[16px]">check_circle</span> Verified</span>
                            )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL: Upload Screenshot */}
      {selectedFeeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 border border-slate-200">
            <h2 className="font-h3 text-slate-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">cloud_upload</span>
                Upload Payment Screenshot
            </h2>
            <p className="text-sm text-slate-500 mb-6">Please transfer the due amount to the hostel bank account and upload a clear screenshot of the successful transaction.</p>
            
            <form onSubmit={handleUploadScreenshot} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                <input 
                    type="file" 
                    name="receipt" 
                    accept="image/png, image/jpeg" 
                    required 
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 cursor-pointer" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedFeeId(null)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary/90 flex items-center gap-1 shadow-sm transition-colors">
                    Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}