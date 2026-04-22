import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user, logout } = useContext(AuthContext); // Bring in the global user and logout
  const navigate = useNavigate();

  const [allocation, setAllocation] = useState(null);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('Plumbing');

  // We get the studentId straight from the React Context now! No messy decoding.
  const studentId = user?.id;

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const roomRes = await api.get(`/student/my-room/${studentId}`);
        setAllocation(roomRes.data);
        const feesRes = await api.get(`/student/my-fees/${studentId}`);
        setFees(feesRes.data);
      } catch (err) {
        console.error("No active room found.");
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchStudentData();
  }, [studentId]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleComplaint = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/student/complaint?student_id=${studentId}&room_id=${allocation.room_id}&category=${complaintCategory}&description=${complaintDesc}`);
      alert("Complaint submitted successfully!");
      setComplaintDesc('');
    } catch (err) {
      alert("Failed to submit complaint.");
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex justify-center items-center font-bold text-xl">Loading Portal...</div>;

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-100">
      <header className="mb-8 border-b border-slate-700 pb-4 flex justify-between items-center">
        <h1 className="text-3xl font-black text-white">My Student Portal</h1>
        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-lg font-bold transition shadow-lg shadow-red-500/20">
          Logout
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* ROOM DETAILS */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl border-t-4 border-blue-500">
          <h2 className="text-xl font-bold text-white mb-4">My Room</h2>
          {allocation ? (
            <div>
              <p className="text-slate-400">You are currently allotted to:</p>
              <p className="text-5xl font-black text-white my-3">Room {allocation.room_number || allocation.room_id}</p>
              <span className="inline-block px-3 py-1 bg-emerald-900/50 text-emerald-400 rounded-full text-sm font-bold border border-emerald-500/30">Status: Active</span>
            </div>
          ) : (
            <p className="text-red-400 font-bold bg-red-900/20 p-4 rounded-lg border border-red-500/20">No room has been allotted to you yet.</p>
          )}
        </div>

        {/* FEES SECTION */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl border-t-4 border-yellow-500">
          <h2 className="text-xl font-bold text-white mb-4">My Dues</h2>
          {fees.length > 0 ? (
            <ul className="space-y-3">
              {fees.map((fee) => (
                <li key={fee.id} className="flex justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <span className="font-medium text-slate-200 capitalize">{fee.fee_type}</span>
                  <span className="font-bold text-red-400 tracking-wide">Rs. {fee.amount}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-emerald-400 font-bold bg-emerald-900/20 p-4 rounded-lg border border-emerald-500/20">All clear! No pending dues.</p>
          )}
        </div>

        {/* COMPLAINT FORM */}
        {allocation && (
          <div className="bg-slate-800 p-6 rounded-xl shadow-xl md:col-span-2 border-t-4 border-red-500">
            <h2 className="text-xl font-bold text-white mb-4">Lodge a Complaint</h2>
            <form onSubmit={handleComplaint} className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                <select 
                  className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                >
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>Furniture</option>
                  <option>Cleaning</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea 
                  required
                  rows="4"
                  className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  placeholder="Describe the issue in detail..."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                ></textarea>
              </div>
              <button type="submit" className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-500 transition shadow-lg shadow-red-500/20">
                Submit Issue
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}