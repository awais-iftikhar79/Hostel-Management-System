import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import StudentLayout from '../components/StudentLayout';

export default function StudentPayments() {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State for uploading screenshot
  const [selectedFeeId, setSelectedFeeId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Filter States for the table
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

  // --- UPDATED: Send the actual file using FormData ---
  const handleUploadScreenshot = async (e) => {
    e.preventDefault();
    const file = e.target.receipt.files[0];
    if (!file) return;

    setIsUploading(true);

    // Create FormData to send the file correctly
    const formData = new FormData();
    formData.append('file', file); // The name 'file' must match the backend parameter

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/student/pay-bill/${selectedFeeId}`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}` 
                // Note: We DO NOT set 'Content-Type' here. The browser automatically 
                // sets it to 'multipart/form-data' when it sees the FormData object!
            },
            body: formData
        });

        if(response.ok) {
            setSelectedFeeId(null);
            window.location.reload(); // Refresh to show "Under Review"
        } else {
            const err = await response.json();
            alert(err.detail || "Failed to upload screenshot.");
        }
    } catch(err) {
        console.error(err);
        alert("An error occurred during upload.");
    } finally {
        setIsUploading(false);
    }
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

  if (loading) return <StudentLayout><div className="p-8 text-slate-500 font-medium">Loading financial records...</div></StudentLayout>;
  if (error) return <StudentLayout><div className="p-8 text-red-500 font-medium">Error: {error}</div></StudentLayout>;

  // Apply filters to the payment history
  const filteredHistory = paymentData.history.filter(record => {
    const recordStatus = getNormalizedStatus(record.status);
    const matchesFeeType = feeTypeFilter === 'All' || record.fee_type === feeTypeFilter;
    const matchesStatus = statusFilter === 'All' || recordStatus === statusFilter;
    return matchesFeeType && matchesStatus;
  });

  return (
    <StudentLayout>
      
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
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row">
            <div className="bg-slate-900 p-8 md:w-1/3 flex flex-col justify-center items-start">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                <span className="text-sm font-bold uppercase tracking-wider">Total Outstanding</span>
              </div>
              <div className="text-white">
                <span className="text-[36px] font-bold block tracking-tight">Rs. {paymentData.total_outstanding}</span>
                <span className="text-sm font-medium text-slate-400">Due by 15th of the month</span>
              </div>
              <button disabled={paymentData.total_outstanding === 0} className="mt-6 bg-blue-600 text-white text-sm font-bold px-6 py-3 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:bg-slate-700 shadow-sm">
                <span>{paymentData.total_outstanding === 0 ? 'All Settled' : 'Pay Pending Bills Below'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
              </button>
            </div>

            <div className="p-8 md:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-blue-600"><span className="material-symbols-outlined text-[20px]">restaurant</span><h3 className="font-bold text-slate-700">Mess Bill</h3></div>
                <p className="text-2xl font-bold text-slate-900">Rs. {paymentData.breakdown.Mess || 0}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Pending Amount</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-blue-600"><span className="material-symbols-outlined text-[20px]">bolt</span><h3 className="font-bold text-slate-700">Electricity</h3></div>
                <p className="text-2xl font-bold text-slate-900">Rs. {paymentData.breakdown.Electricity || 0}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Pending Amount</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-blue-600"><span className="material-symbols-outlined text-[20px]">meeting_room</span><h3 className="font-bold text-slate-700">Room Rent</h3></div>
                <p className="text-2xl font-bold text-slate-900">Rs. {paymentData.breakdown.Rent || 0}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Pending Amount</p>
              </div>
            </div>
          </div>
        </section>

        {/* Payment History Table */}
        <section className="col-span-12">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            
            <div className="px-8 py-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">Payment History & Pending Bills</h2>
              
              <div className="flex flex-wrap items-center gap-3">
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
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">Invoice ID</th>
                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">Fee Type</th>
                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">Amount</th>
                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 text-center">Status</th>
                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.length === 0 ? (
                    <tr><td colSpan="5" className="px-8 py-12 text-center text-slate-500 font-medium">No matching payment records found.</td></tr>
                  ) : (
                    filteredHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-4 text-sm font-semibold text-slate-800 font-mono">{record.invoice_id}</td>
                        <td className="px-8 py-4 text-sm font-medium text-slate-700"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>{record.fee_type}</div></td>
                        <td className="px-8 py-4 text-sm font-bold text-slate-900">Rs. {record.amount}</td>
                        <td className="px-8 py-4 text-center">{getStatusBadge(record.status)}</td>
                        <td className="px-8 py-4 text-right">
                            {(record.status === 'Pending' || record.status === 'Open' || record.status === 'Rejected') ? (
                                <button 
                                    onClick={() => setSelectedFeeId(record.id)} 
                                    className="px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-end gap-1 ml-auto shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[16px]">upload</span> Pay Now
                                </button>
                            ) : record.status === 'Under Review' ? (
                                <span className="text-blue-600 text-sm font-semibold">Waiting for Admin</span>
                            ) : (
                                <span className="text-emerald-600 text-sm font-semibold flex items-center justify-end gap-1"><span className="material-symbols-outlined text-[16px]">check_circle</span> Verified</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">cloud_upload</span>
                Upload Receipt
            </h2>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">Please transfer the due amount to the hostel bank account and upload a clear screenshot of the successful transaction.</p>
            
            <form onSubmit={handleUploadScreenshot} className="space-y-5">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-blue-400 transition-all cursor-pointer">
                <input 
                    type="file" 
                    name="receipt" 
                    accept="image/png, image/jpeg, image/jpg" 
                    required 
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer outline-none" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedFeeId(null)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isUploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50">
                    {isUploading ? (
                        <>Uploading...</>
                    ) : (
                        <>
                            Submit for Verification
                            <span className="material-symbols-outlined text-[18px]">send</span>
                        </>
                    )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}