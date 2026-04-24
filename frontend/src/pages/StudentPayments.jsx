import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import StudentLayout from '../components/StudentLayout';

export default function StudentPayments() {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Helper for status badge styling
  const getStatusBadge = (status) => {
    const s = status === 'Open' ? 'Pending' : status;
    if (s === 'Paid' || s === 'Approved') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
          Paid
        </span>
      );
    }
    if (s === 'Pending') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          Pending
        </span>
      );
    }
    if (s === 'Overdue') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          Overdue
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {s}
      </span>
    );
  };

  if (loading) return <StudentLayout><div className="p-8 text-on-surface">Loading financial records...</div></StudentLayout>;
  if (error) return <StudentLayout><div className="p-8 text-error">Error: {error}</div></StudentLayout>;

  return (
    <StudentLayout>
      <header className="mb-8">
        <h1 className="font-h1 text-h1 text-primary">Fee &amp; Payments</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Manage your hostel dues and view payment history.</p>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Current Balance Card (Bento-style layout) */}
        <section className="col-span-12">
          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row">
            
            {/* Left: Total Balance */}
            <div className="bg-primary p-8 md:w-1/3 flex flex-col justify-center items-start">
              <div className="flex items-center gap-2 text-on-primary/70 mb-2">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                <span className="font-label-md text-label-md uppercase tracking-wider">Total Outstanding</span>
              </div>
              <div className="text-white">
                <span className="text-[36px] font-bold block tracking-tight">Rs. {paymentData.total_outstanding}</span>
                <span className="font-body-sm text-on-primary/70">Due by 15th of the month</span>
              </div>
              <button 
                disabled={paymentData.total_outstanding === 0}
                className="mt-6 bg-secondary text-white font-label-md px-6 py-3 rounded-lg hover:bg-secondary/90 transition-all duration-200 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{paymentData.total_outstanding === 0 ? 'All Settled' : 'Pay Now'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

            {/* Right: Breakdown */}
            <div className="p-8 md:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-surface rounded-lg border border-outline-variant/30">
                <div className="flex items-center gap-2 mb-2 text-secondary">
                  <span className="material-symbols-outlined text-[20px]">restaurant</span>
                  <h3 className="font-label-md text-label-md">Mess Bill</h3>
                </div>
                <p className="font-h2 text-h2 text-primary">Rs. {paymentData.breakdown.Mess || 0}</p>
                <p className="text-body-sm text-on-surface-variant mt-1">Pending Amount</p>
              </div>
              <div className="p-4 bg-surface rounded-lg border border-outline-variant/30">
                <div className="flex items-center gap-2 mb-2 text-secondary">
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                  <h3 className="font-label-md text-label-md">Electricity</h3>
                </div>
                <p className="font-h2 text-h2 text-primary">Rs. {paymentData.breakdown.Electricity || 0}</p>
                <p className="text-body-sm text-on-surface-variant mt-1">Pending Amount</p>
              </div>
              <div className="p-4 bg-surface rounded-lg border border-outline-variant/30">
                <div className="flex items-center gap-2 mb-2 text-secondary">
                  <span className="material-symbols-outlined text-[20px]">meeting_room</span>
                  <h3 className="font-label-md text-label-md">Room Rent</h3>
                </div>
                <p className="font-h2 text-h2 text-primary">Rs. {paymentData.breakdown.Rent || 0}</p>
                <p className="text-body-sm text-on-surface-variant mt-1">Pending Amount</p>
              </div>
            </div>
            
          </div>
        </section>

        {/* Payment History Table */}
        <section className="col-span-12">
          <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-outline-variant flex justify-between items-center">
              <h2 className="font-h3 text-h3 text-primary">Payment History</h2>
              <div className="flex gap-4">
                <button className="flex items-center gap-1 px-4 py-2 bg-surface text-primary rounded-lg font-label-md border border-outline-variant hover:bg-outline-variant/20 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">filter_list</span>
                  Filter
                </button>
                <button className="flex items-center gap-1 px-4 py-2 bg-surface text-primary rounded-lg font-label-md border border-outline-variant hover:bg-outline-variant/20 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  Export
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface text-on-surface-variant">
                  <tr>
                    <th className="px-8 py-4 font-label-md uppercase tracking-wider text-[11px] border-b border-outline-variant">Invoice ID</th>
                    <th className="px-8 py-4 font-label-md uppercase tracking-wider text-[11px] border-b border-outline-variant">Date</th>
                    <th className="px-8 py-4 font-label-md uppercase tracking-wider text-[11px] border-b border-outline-variant">Fee Type</th>
                    <th className="px-8 py-4 font-label-md uppercase tracking-wider text-[11px] border-b border-outline-variant">Amount</th>
                    <th className="px-8 py-4 font-label-md uppercase tracking-wider text-[11px] border-b border-outline-variant">Status</th>
                    <th className="px-8 py-4 font-label-md uppercase tracking-wider text-[11px] border-b border-outline-variant text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {paymentData.history.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-8 py-8 text-center text-on-surface-variant">No payment records found.</td>
                    </tr>
                  ) : (
                    paymentData.history.map((record) => (
                      <tr key={record.id} className="hover:bg-surface/50 transition-colors group">
                        <td className="px-8 py-4 font-label-md text-primary font-mono">{record.invoice_id}</td>
                        <td className="px-8 py-4 font-body-md text-on-surface-variant">{record.date}</td>
                        <td className="px-8 py-4 font-body-md">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-secondary"></span>
                            {record.fee_type}
                          </div>
                        </td>
                        <td className="px-8 py-4 font-label-md text-primary">Rs. {record.amount}</td>
                        <td className="px-8 py-4">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button className="text-on-surface-variant hover:text-primary transition-colors" title="Download Receipt">
                            <span className="material-symbols-outlined">receipt_long</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            <div className="px-8 py-4 bg-white border-t border-outline-variant flex items-center justify-between">
              <p className="font-body-sm text-on-surface-variant">Showing {paymentData.history.length} records</p>
              <div className="flex items-center gap-2">
                <button className="p-1 rounded-md border border-outline-variant hover:bg-surface disabled:opacity-50" disabled>
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="font-label-md text-primary px-2">1</span>
                <button className="p-1 rounded-md border border-outline-variant hover:bg-surface disabled:opacity-50" disabled>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Supportive Info Section */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-2">
          <span className="material-symbols-outlined text-secondary">info</span>
          <h4 className="font-label-md text-primary">Payment Support</h4>
          <p className="text-body-sm text-on-surface-variant leading-relaxed">Having issues with your transaction? Contact the hostel warden or finance office.</p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-2">
          <span className="material-symbols-outlined text-secondary">verified_user</span>
          <h4 className="font-label-md text-primary">Secure Payments</h4>
          <p className="text-body-sm text-on-surface-variant leading-relaxed">All transactions are encrypted and processed through our verified payment gateway partner.</p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-2">
          <span className="material-symbols-outlined text-secondary">schedule</span>
          <h4 className="font-label-md text-primary">Late Fees</h4>
          <p className="text-body-sm text-on-surface-variant leading-relaxed">A late fee of 2% per week will be applied to any outstanding balance after the 15th.</p>
        </div>
      </section>
    </StudentLayout>
  );
}