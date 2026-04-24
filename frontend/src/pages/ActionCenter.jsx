import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';

export default function ActionCenter() {
  const [activeTab, setActiveTab] = useState('complaints');
  const [loading, setLoading] = useState(true);
  
  // Complaints State
  const [complaints, setComplaints] = useState([]);
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('All'); 
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Room Exchanges State
  const [exchanges, setExchanges] = useState([]);
  const [exchangeStatusFilter, setExchangeStatusFilter] = useState('All');

  // Payments State
  const [payments, setPayments] = useState([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('Pending');

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch Complaints
      const compRes = await fetch('http://localhost:8000/admin/complaints', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (compRes.ok) setComplaints(await compRes.json());

      // Fetch Exchanges
      const exchRes = await fetch('http://localhost:8000/admin/room-exchanges', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (exchRes.ok) setExchanges(await exchRes.json());

      // Fetch Payments
      const payRes = await fetch('http://localhost:8000/admin/payments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (payRes.ok) setPayments(await payRes.json());
      
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Updates
  const handleUpdateComplaint = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8000/admin/complaints/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
      setOpenDropdownId(null);
    } catch (err) { console.error("Failed to update status:", err); }
  };

  const handleUpdateExchange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8000/admin/room-exchanges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err) { console.error("Failed to update exchange status:", err); }
  };

  const handleUpdatePayment = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8000/admin/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err) { console.error("Failed to update payment status:", err); }
  };

  // Filter Logic
  const globalHostelId = localStorage.getItem('selectedHostelId') || 'all';
  
  const filteredComplaints = complaints.filter(c => {
    const matchesHostel = globalHostelId === 'all' || String(c.hostel_id) === String(globalHostelId);
    const normalizedStatus = c.status === 'Open' ? 'Pending' : c.status;
    const matchesStatus = complaintStatusFilter === 'All' || normalizedStatus === complaintStatusFilter;
    return matchesHostel && matchesStatus;
  });

  const filteredExchanges = exchanges.filter(e => {
    const matchesHostel = globalHostelId === 'all' || String(e.hostel_id) === String(globalHostelId);
    const normalizedStatus = e.status === 'Open' ? 'Pending' : e.status;
    const matchesStatus = exchangeStatusFilter === 'All' || normalizedStatus === exchangeStatusFilter;
    return matchesHostel && matchesStatus;
  });

  const filteredPayments = payments.filter(p => {
    // Payments are usually global to the student, so we filter mainly by status
    const normalizedStatus = p.status === 'Open' ? 'Pending' : p.status;
    const matchesStatus = paymentStatusFilter === 'All' || normalizedStatus === paymentStatusFilter;
    return matchesStatus;
  });

  const getCategoryBadgeStyle = (category) => {
    switch (category?.toLowerCase()) {
      case 'plumbing': return 'bg-blue-100 text-blue-800';
      case 'internet': return 'bg-purple-100 text-purple-800';
      case 'electrical': return 'bg-orange-100 text-orange-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-[1440px] mx-auto w-full overflow-x-hidden">
        
        {/* Page Header & Tabs */}
        <div className="mb-8">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-h2 text-h2 text-slate-900">Action Center</h2>
              <p className="font-body-md text-body-md text-slate-500 mt-1">
                Manage and resolve student requests across all active facilities.
              </p>
            </div>

            <div className="flex justify-center border-b border-slate-200">
              <nav aria-label="Tabs" className="flex gap-8">
                <button 
                  onClick={() => setActiveTab('complaints')}
                  className={`py-4 px-1 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === 'complaints' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  Complaints
                </button>
                <button 
                  onClick={() => setActiveTab('exchanges')}
                  className={`py-4 px-1 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === 'exchanges' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  Room Exchange
                </button>
                <button 
                  onClick={() => setActiveTab('payments')}
                  className={`py-4 px-1 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === 'payments' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  Payment Request
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* ================= COMPLAINTS TAB ================= */}
        {activeTab === 'complaints' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-h3 text-h3 text-slate-800">Complaints Queue</h3>
              <select 
                value={complaintStatusFilter}
                onChange={(e) => setComplaintStatusFilter(e.target.value)}
                className="rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Room</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  
                  {loading && (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading complaints...</td></tr>
                  )}
                  {!loading && filteredComplaints.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No complaints found.</td></tr>
                  )}

                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{complaint.room_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-xs">
                            {complaint.student_initials}
                          </div>
                          <div className="ml-3"><p className="text-sm font-medium text-slate-900">{complaint.student_name}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryBadgeStyle(complaint.category)}`}>
                          {complaint.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-md truncate">{complaint.description}</td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                        <button 
                          onClick={() => setOpenDropdownId(openDropdownId === complaint.id ? null : complaint.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {complaint.status === 'Open' ? 'Pending' : complaint.status}
                          <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                        </button>

                        {openDropdownId === complaint.id && (
                          <div className="absolute right-6 top-14 w-44 bg-white border border-slate-200 rounded-md shadow-[0_10px_25px_rgba(0,0,0,0.15)] z-[100] py-1 flex flex-col whitespace-normal">
                            <button onClick={() => handleUpdateComplaint(complaint.id, 'Pending')} className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">Mark Pending</button>
                            <button onClick={() => handleUpdateComplaint(complaint.id, 'In Progress')} className="block w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-slate-50 transition-colors">Mark In Progress</button>
                            <button onClick={() => handleUpdateComplaint(complaint.id, 'Resolved')} className="block w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-slate-50 transition-colors">Mark Resolved</button>
                            <div className="h-px bg-slate-200 my-1 w-full shrink-0"></div>
                            <button onClick={() => handleUpdateComplaint(complaint.id, 'Rejected')} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 transition-colors">Mark Rejected</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  
                </tbody>
              </table>
              <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between rounded-b-xl">
                <div className="text-sm text-slate-500">
                  Showing <span className="font-medium text-slate-900">{filteredComplaints.length}</span> complaints
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= ROOM EXCHANGE TAB ================= */}
        {activeTab === 'exchanges' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-h2 text-on-surface">Room Exchange Requests</h2>
                <p className="font-body-sm text-on-surface-variant mt-1">Manage student requests for room transfers across hostels.</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-body-sm text-on-surface-variant">Filter by Status:</span>
                <div className="relative">
                  <select 
                    value={exchangeStatusFilter}
                    onChange={(e) => setExchangeStatusFilter(e.target.value)}
                    className="appearance-none bg-surface-container-lowest border border-outline-variant text-on-surface font-body-sm rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary shadow-sm cursor-pointer"
                  >
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">expand_more</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="font-label-sm text-on-surface-variant px-6 py-4 font-semibold uppercase tracking-wider">Student ID</th>
                    <th className="font-label-sm text-on-surface-variant px-6 py-4 font-semibold uppercase tracking-wider">Current Room</th>
                    <th className="font-label-sm text-on-surface-variant px-6 py-4 font-semibold uppercase tracking-wider">Target Room</th>
                    <th className="font-label-sm text-on-surface-variant px-6 py-4 font-semibold uppercase tracking-wider">Reason</th>
                    <th className="font-label-sm text-on-surface-variant px-6 py-4 font-semibold uppercase tracking-wider text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-on-surface divide-y divide-outline-variant">
                  
                  {loading && (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading exchange requests...</td></tr>
                  )}
                  {!loading && filteredExchanges.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No room exchange requests found.</td></tr>
                  )}

                  {filteredExchanges.map((exchange) => (
                    <tr key={exchange.id} className="hover:bg-surface transition-colors duration-150 group">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-secondary-fixed-dim text-on-secondary-fixed flex items-center justify-center font-label-sm mr-3">
                            {exchange.student_initials}
                          </div>
                          <span className="font-medium text-primary">{exchange.student_id_str}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-container-high text-on-surface">
                          Room {exchange.current_room_number}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-[16px] mr-1">arrow_forward</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container">
                            Room {exchange.target_room_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-on-surface-variant max-w-xs truncate" title={exchange.reason}>{exchange.reason}</p>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        
                        {exchange.status === 'Pending' || exchange.status === 'Open' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => handleUpdateExchange(exchange.id, 'Rejected')}
                              className="inline-flex items-center justify-center px-3 py-1.5 border border-outline-variant rounded-md font-label-sm text-error bg-surface-container-lowest hover:bg-error-container transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error shadow-sm"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => handleUpdateExchange(exchange.id, 'Approved')}
                              className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent rounded-md font-label-sm text-on-primary bg-secondary hover:bg-secondary-fixed-dim hover:text-on-secondary-fixed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary shadow-sm"
                            >
                              Accept / Verify
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${exchange.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {exchange.status}
                          </span>
                        )}

                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
              <div className="bg-surface-container-lowest px-6 py-4 border-t border-outline-variant flex items-center justify-between">
                <span className="font-body-sm text-on-surface-variant">Showing {filteredExchanges.length} requests</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= PAYMENTS TAB ================= */}
        {activeTab === 'payments' && (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="font-h3 text-on-background">Payment Requests</h2>
              <div className="flex items-center gap-3">
                <label className="font-label-sm text-on-surface-variant">Filter by Status:</label>
                <div className="relative">
                  <select 
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    className="appearance-none bg-surface border border-outline-variant/40 text-on-background font-body-md rounded-lg pl-4 pr-10 py-2 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none cursor-pointer"
                  >
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface text-on-surface-variant font-label-sm uppercase tracking-wider border-b border-outline-variant/20">
                    <th className="py-4 px-6 font-semibold">Student ID</th>
                    <th className="py-4 px-6 font-semibold">Student Name</th>
                    <th className="py-4 px-6 font-semibold">Fee Type</th>
                    <th className="py-4 px-6 font-semibold text-right">Amount</th>
                    <th className="py-4 px-6 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-on-background divide-y divide-outline-variant/10">
                  
                  {loading && (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading payments...</td></tr>
                  )}
                  {!loading && filteredPayments.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No payment requests found.</td></tr>
                  )}

                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-surface-dim/30 transition-colors">
                      <td className="py-4 px-6 font-medium text-on-surface">{payment.student_id_str}</td>
                      <td className="py-4 px-6">{payment.student_name}</td>
                      <td className="py-4 px-6 text-on-surface-variant">{payment.fee_type}</td>
                      <td className="py-4 px-6 text-right font-medium">${payment.amount.toFixed(2)}</td>
                      <td className="py-4 px-6">
                        
                        {payment.status === 'Pending' || payment.status === 'Open' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleUpdatePayment(payment.id, 'Approved')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-on-secondary rounded font-label-sm hover:bg-secondary/90 transition-colors"
                            >
                              <span className="material-symbols-outlined" style={{fontSize: '16px'}}>check</span>
                              Accept / Verify
                            </button>
                            <button 
                              onClick={() => handleUpdatePayment(payment.id, 'Rejected')}
                              className="flex items-center gap-1 px-3 py-1.5 border border-error text-error rounded font-label-sm hover:bg-error/10 transition-colors"
                            >
                              <span className="material-symbols-outlined" style={{fontSize: '16px'}}>close</span>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${payment.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {payment.status}
                            </span>
                          </div>
                        )}

                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}