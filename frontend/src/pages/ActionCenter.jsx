import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';

export default function ActionCenter() {
  const [activeTab, setActiveTab] = useState('payments'); 
  const [loading, setLoading] = useState(true);
  
  // States
  const [hostels, setHostels] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [payments, setPayments] = useState([]);
  
  // Filter States
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('All'); 
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [exchangeStatusFilter, setExchangeStatusFilter] = useState('All');
  
  // Payment Filter States
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [paymentHostelFilter, setPaymentHostelFilter] = useState('All');
  const [paymentFloorFilter, setPaymentFloorFilter] = useState('All');

  // Generate Bill Form States
  const [billTargetType, setBillTargetType] = useState('all');
  const [billHostelId, setBillHostelId] = useState('');
  const [billRoomNumber, setBillRoomNumber] = useState('');

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const hRes = await fetch('http://localhost:8000/admin/hostels', { headers: { 'Authorization': `Bearer ${token}` } });
      if (hRes.ok) {
          const hData = await hRes.json();
          setHostels(hData);
          if(hData.length > 0) setBillHostelId(hData[0].id);
      }

      const compRes = await fetch('http://localhost:8000/admin/complaints', { headers: { 'Authorization': `Bearer ${token}` } });
      if (compRes.ok) setComplaints(await compRes.json());

      const exchRes = await fetch('http://localhost:8000/admin/room-exchanges', { headers: { 'Authorization': `Bearer ${token}` } });
      if (exchRes.ok) setExchanges(await exchRes.json());

      const payRes = await fetch('http://localhost:8000/admin/payments', { headers: { 'Authorization': `Bearer ${token}` } });
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

  const handleUpdateComplaint = async (id, newStatus) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:8000/admin/complaints/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });
    fetchData();
    setOpenDropdownId(null);
  };

  const handleUpdateExchange = async (id, newStatus) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:8000/admin/room-exchanges/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });
    fetchData();
  };

  const handleUpdatePayment = async (id, newStatus) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:8000/admin/payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });
    fetchData();
  };

  // Generate Bills
  const handleGenerateBills = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch('http://localhost:8000/admin/generate-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          fee_type: fd.get('fee_type'), 
          total_amount: fd.get('total_amount'), 
          target_type: billTargetType,
          hostel_id: (billTargetType === 'hostel' || billTargetType === 'room') ? billHostelId : null,
          room_number: billTargetType === 'room' ? billRoomNumber : null
        })
      });
      if(res.ok) {
        e.target.reset();
        setBillRoomNumber('');
        fetchData();
        alert("Bills successfully generated and divided!");
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to generate bills");
      }
    } catch(err) {
      console.error(err);
    }
  };

  const viewReceipt = (base64String) => {
    if(!base64String) return;
    const image = new Image();
    image.src = base64String;
    const w = window.open("");
    w.document.write(image.outerHTML);
  };

  // Complaint & Exchange Filters
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

  // Payment Filters & Logic
  let uniquePaymentFloors = [...new Set(payments.map(p => p.floor).filter(f => f && f !== 'Unassigned'))].sort();
  // Fallback so the dropdown isn't completely empty if no payments exist yet
  if (uniquePaymentFloors.length === 0) {
      uniquePaymentFloors = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor"];
  }

  const filteredPayments = payments.filter(p => {
    const normalizedStatus = p.status === 'Open' ? 'Pending' : p.status;
    const matchesStatus = paymentStatusFilter === 'All' || normalizedStatus === paymentStatusFilter;
    const matchesHostel = paymentHostelFilter === 'All' || String(p.hostel_id) === String(paymentHostelFilter);
    const matchesFloor = paymentFloorFilter === 'All' || p.floor === paymentFloorFilter;
    return matchesStatus && matchesHostel && matchesFloor;
  });

  return (
    <AdminLayout>
      <div className="p-8 max-w-[1440px] mx-auto w-full overflow-x-hidden">
        
        {/* Page Header & Tabs */}
        <div className="mb-8">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-[32px] font-bold text-slate-900 tracking-tight mb-2">Action Center</h1>
              <p className="text-[16px] text-slate-500 font-medium">
                Manage student requests and financial records.
              </p>
            </div>

            <div className="flex justify-center border-b border-slate-200">
              <nav aria-label="Tabs" className="flex gap-8">
                <button onClick={() => setActiveTab('complaints')} className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'complaints' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Complaints</button>
                <button onClick={() => setActiveTab('exchanges')} className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'exchanges' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Room Exchange</button>
                <button onClick={() => setActiveTab('payments')} className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'payments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Payments & Billing</button>
              </nav>
            </div>
          </div>
        </div>

        {/* ================= COMPLAINTS TAB ================= */}
        {activeTab === 'complaints' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-h3 text-h3 text-slate-800">Complaints Queue</h3>
              <select value={complaintStatusFilter} onChange={(e) => setComplaintStatusFilter(e.target.value)} className="rounded-md border border-slate-300 px-4 py-2 bg-white text-sm">
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
                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{complaint.room_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><p className="text-sm font-medium text-slate-900">{complaint.student_name}</p></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full bg-slate-100">{complaint.category}</span></td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-md truncate">{complaint.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                        <button onClick={() => setOpenDropdownId(openDropdownId === complaint.id ? null : complaint.id)} className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white">
                          {complaint.status} <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                        </button>
                        {openDropdownId === complaint.id && (
                          <div className="absolute right-6 top-14 w-44 bg-white border border-slate-200 rounded-md shadow-lg z-[100] py-1 flex flex-col whitespace-normal">
                            <button onClick={() => handleUpdateComplaint(complaint.id, 'Pending')} className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Mark Pending</button>
                            <button onClick={() => handleUpdateComplaint(complaint.id, 'In Progress')} className="block w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-slate-50">Mark In Progress</button>
                            <button onClick={() => handleUpdateComplaint(complaint.id, 'Resolved')} className="block w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-slate-50">Mark Resolved</button>
                            <button onClick={() => handleUpdateComplaint(complaint.id, 'Rejected')} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 border-t border-slate-100">Mark Rejected</button>
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

        {/* ================= ROOM EXCHANGE TAB ================= */}
        {activeTab === 'exchanges' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-h3 text-h3 text-slate-800">Room Exchange Requests</h3>
              <select value={exchangeStatusFilter} onChange={(e) => setExchangeStatusFilter(e.target.value)} className="rounded-md border border-slate-300 px-4 py-2 bg-white text-sm">
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Room</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Room</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredExchanges.map((exchange) => (
                    <tr key={exchange.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium">{exchange.student_name}</td>
                      <td className="px-6 py-4">Room {exchange.current_room_number}</td>
                      <td className="px-6 py-4 font-medium text-blue-600">Room {exchange.target_room_number}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={exchange.reason}>{exchange.reason}</td>
                      <td className="px-6 py-4 text-right">
                        {exchange.status === 'Pending' || exchange.status === 'Open' ? (
                          <div className="flex justify-end space-x-2">
                            <button onClick={() => handleUpdateExchange(exchange.id, 'Approved')} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-200">Accept</button>
                            <button onClick={() => handleUpdateExchange(exchange.id, 'Rejected')} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200">Reject</button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${exchange.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{exchange.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= PAYMENTS TAB ================= */}
        {activeTab === 'payments' && (
          <div className="flex flex-col gap-8">
            
            {/* Generate Bills Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-h3 text-slate-800 mb-4">Generate Hostel Bills</h3>
              
              <form onSubmit={handleGenerateBills} className="flex flex-col gap-4">
                
                {/* Row 1: Main Config */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fee Type</label>
                    <select name="fee_type" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="Rent">Room Rent</option>
                      <option value="Mess">Mess Bill</option>
                      <option value="Electricity">Electricity</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Total Amount (Rs.)</label>
                    <input type="number" name="total_amount" required placeholder="e.g. 5000" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Target Audience</label>
                    <select value={billTargetType} onChange={(e) => setBillTargetType(e.target.value)} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="all">All Active Rooms</option>
                      <option value="hostel">Specific Hostel</option>
                      <option value="room">Specific Room</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Conditional Inputs based on Target */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  
                  {/* Show Hostel Dropdown if Target is Hostel OR Room */}
                  {(billTargetType === 'hostel' || billTargetType === 'room') && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Hostel</label>
                      <select value={billHostelId} onChange={(e) => setBillHostelId(e.target.value)} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                        {hostels.length === 0 && <option value="" disabled>No Hostels Available</option>}
                        {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Show Room Input ONLY if Target is Room */}
                  {billTargetType === 'room' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Enter Room Number</label>
                      <input type="text" value={billRoomNumber} onChange={(e) => setBillRoomNumber(e.target.value)} required placeholder="e.g. F1-05" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  )}

                  {/* Button stays nicely aligned to the right! */}
                  <div className={`${billTargetType === 'all' ? 'md:col-span-3' : billTargetType === 'hostel' ? 'md:col-span-2' : 'md:col-span-1'} flex justify-end`}>
                    <button type="submit" className="bg-slate-900 text-white font-medium text-sm px-6 py-2 rounded-md hover:bg-slate-800 transition-colors">
                      Generate & Split Bills
                    </button>
                  </div>
                </div>

              </form>
            </div>

            {/* Verification Queue Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
                <h3 className="font-h3 text-slate-800">Payment Verification Queue</h3>
                
                {/* Multi-Filter Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-2 py-1 shadow-sm">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">domain</span>
                    <select value={paymentHostelFilter} onChange={(e) => setPaymentHostelFilter(e.target.value)} className="bg-transparent border-none text-sm outline-none cursor-pointer pr-4 focus:ring-0 py-1 text-slate-700 font-medium">
                      <option value="All">All Hostels</option>
                      {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-2 py-1 shadow-sm">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">layers</span>
                    <select value={paymentFloorFilter} onChange={(e) => setPaymentFloorFilter(e.target.value)} className="bg-transparent border-none text-sm outline-none cursor-pointer pr-4 focus:ring-0 py-1 text-slate-700 font-medium">
                      <option value="All">All Floors</option>
                      {uniquePaymentFloors.map(floor => <option key={floor} value={floor}>{floor}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-2 py-1 shadow-sm">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">filter_list</span>
                    <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} className="bg-transparent border-none text-sm outline-none cursor-pointer pr-4 focus:ring-0 py-1 text-slate-700 font-medium">
                      <option value="All">All Statuses</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Verified (Paid)</option>
                    </select>
                  </div>
                </div>

              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-4 px-6">Student</th>
                      <th className="py-4 px-6">Fee Type</th>
                      <th className="py-4 px-6 text-right">Amount</th>
                      <th className="py-4 px-6 text-center">Receipt</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-800 divide-y divide-slate-100">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-500">No payments match your filters.</td>
                      </tr>
                    ) : (
                      filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-50">
                          <td className="py-4 px-6">
                              <p className="font-medium">{payment.student_name}</p>
                              {/* Safely display the floor if it exists */}
                              <p className="text-xs text-slate-500">
                                {payment.student_id_str} {payment.floor && payment.floor !== 'Unassigned' ? `• ${payment.floor}` : ''}
                              </p>
                          </td>
                          <td className="py-4 px-6 text-slate-600">{payment.fee_type}</td>
                          <td className="py-4 px-6 text-right font-medium text-slate-900">Rs. {payment.amount}</td>
                          <td className="py-4 px-6 text-center">
                            {payment.receipt_url ? (
                              <button 
                                  onClick={() => viewReceipt(payment.receipt_url)} 
                                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs flex items-center justify-center gap-1 mx-auto"
                              >
                                  <span className="material-symbols-outlined text-[16px]">image</span> View
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">No Receipt</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {payment.status === 'Under Review' ? (
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleUpdatePayment(payment.id, 'Approved')} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-200">Verify</button>
                                <button onClick={() => handleUpdatePayment(payment.id, 'Rejected')} className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200">Reject</button>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${payment.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : payment.status === 'Pending' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                                  {payment.status === 'Approved' ? 'Verified' : payment.status}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}