import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Users, Building, UserPlus, ClipboardList, X, CheckCircle, XCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('map');
  const [hostel, setHostel] = useState(null);
  const [allHostels, setAllHostels] = useState([]); // NEW: List of all hostels
  const [loading, setLoading] = useState(true);
  const [currentHostelId, setCurrentHostelId] = useState(1);
  
  // Student Form State
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');

  // Modal States
  const [showHostelModal, setShowHostelModal] = useState(false);
  const [hostelName, setHostelName] = useState('');
  const [totalRooms, setTotalRooms] = useState('');
  const [showAllotModal, setShowAllotModal] = useState(false);
  const [allotStudentId, setAllotStudentId] = useState('');
  const [allotRoomId, setAllotRoomId] = useState('');

  // Fetch all hostels for the dropdown
  const fetchAllHostels = async () => {
    try {
      const response = await api.get('/admin/hostels');
      setAllHostels(response.data);
      if (response.data.length > 0 && !currentHostelId) {
        setCurrentHostelId(response.data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch hostels list.");
    }
  };

  const fetchHostelData = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.get(`/admin/hostel-map/${id}`);
      setHostel(response.data);
    } catch (err) {
      setHostel(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllHostels();
  }, []);

  useEffect(() => {
    fetchHostelData(currentHostelId);
  }, [currentHostelId]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/students', { email: newStudentEmail, password: newStudentPassword, role: "student" });
      alert("Student Registered Successfully!");
      setNewStudentEmail('');
      setNewStudentPassword('');
    } catch (err) {
      alert("Failed to register student.");
    }
  };

  const handleAddHostel = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/hostels', { name: hostelName, total_rooms: parseInt(totalRooms) });
      alert("Hostel Created Successfully!");
      setShowHostelModal(false);
      setHostelName('');
      setTotalRooms('');
      fetchAllHostels(); // Refresh dropdown
      setCurrentHostelId(res.data.id);
    } catch (err) {
      alert("Error creating hostel.");
    }
  };

  const handleAllotRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/allot', { 
        student_id: parseInt(allotStudentId), 
        room_id: parseInt(allotRoomId),
        start_date: new Date().toISOString()
      });
      alert("Room Allotted Successfully!");
      setShowAllotModal(false);
      setAllotStudentId('');
      setAllotRoomId('');
      fetchHostelData(currentHostelId); 
    } catch (err) {
      alert(err.response?.data?.detail || "Error allotting room.");
    }
  };

  if (loading && !hostel && allHostels.length === 0) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-bold">Loading...</div>;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 relative">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-950 flex flex-col shadow-2xl border-r border-slate-800 z-10">
        <div className="p-6">
          <h2 className="text-2xl font-black text-white">Hostel ERP</h2>
          <p className="text-blue-400 text-sm mt-1">Admin Portal</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button onClick={() => setActiveTab('map')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'map' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Building className="mr-3" size={20} /> Room Map
          </button>
          <button onClick={() => setActiveTab('students')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'students' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <UserPlus className="mr-3" size={20} /> Manage Students
          </button>
          <button onClick={() => setActiveTab('requests')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'requests' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <ClipboardList className="mr-3" size={20} /> Action Center
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg font-bold transition">Logout</button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        
        {/* --- TAB 1: THE HOSTEL MAP --- */}
        {activeTab === 'map' && (
          <div>
            <header className="mb-8 flex justify-between items-center border-b border-slate-700 pb-4">
              
              {/* NEW: Hostel Dropdown Switcher */}
              <div className="flex items-center space-x-4">
                <select 
                  value={currentHostelId} 
                  onChange={(e) => setCurrentHostelId(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-600 text-white text-2xl font-bold rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-slate-700 transition"
                >
                  {allHostels.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <p className="text-slate-400 font-medium">Total Rooms: {hostel?.total_rooms || 0}</p>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setShowHostelModal(true)} className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/20">
                  + Add Hostel
                </button>
                <button onClick={() => setShowAllotModal(true)} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-500/20">
                  + Allot Room
                </button>
              </div>
            </header>

            {hostel ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {hostel.rooms.map((room) => {
                  
                  // NEW: Updated Color Hierarchy
                  const isEmpty = room.current_occupancy === 0;
                  const isFull = room.current_occupancy >= room.capacity;
                  const hasComplaints = room.complaints && room.complaints.length > 0;
                  
                  let cardStyle = "bg-slate-800 border-slate-600"; 
                  let dotStyle = "bg-slate-500 shadow-slate-500";
                  let statusText = "Empty";

                  // COMPLAINT = RED (Highest Priority)
                  if (hasComplaints) {
                    cardStyle = "bg-red-900/30 border-red-500/60";
                    dotStyle = "bg-red-500 shadow-red-500";
                    statusText = "Complaint Logged";
                  } 
                  // FULL = ORANGE
                  else if (isFull) {
                    cardStyle = "bg-orange-900/30 border-orange-500/50";
                    dotStyle = "bg-orange-500 shadow-orange-500";
                    statusText = "Full";
                  } 
                  // PARTIAL = GREEN
                  else if (!isEmpty) {
                    cardStyle = "bg-emerald-900/30 border-emerald-500/50";
                    dotStyle = "bg-emerald-400 shadow-emerald-400";
                    statusText = "Available Space";
                  }
                  
                  return (
                    <div key={room.id} className={`relative p-5 rounded-xl border-2 transition-all hover:scale-105 ${cardStyle}`}>
                      {hasComplaints && (
                        <div className="absolute -top-3 -right-3 bg-red-500 p-1.5 rounded-full shadow-lg animate-pulse">
                          <AlertTriangle size={16} className="text-white" />
                        </div>
                      )}
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-2xl font-black text-white">{room.room_number}</span>
                        <div className={`w-3 h-3 rounded-full shadow-[0_0_8px] ${dotStyle}`}></div>
                      </div>
                      <div className="flex items-center text-slate-300 text-sm font-medium mb-1">
                        <Users size={16} className="mr-2 opacity-70" />
                        <span>{room.current_occupancy} / {room.capacity} Occupied</span>
                      </div>
                      <p className="text-xs font-bold opacity-75">{statusText}</p>
                      <p className="text-xs text-slate-500 mt-2">Room ID: {room.id}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400">No hostel data available to map.</p>
            )}
          </div>
        )}

        {/* --- TAB 2: MANAGE STUDENTS --- */}
        {activeTab === 'students' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Student Management</h1>
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border-t-4 border-blue-500 max-w-3xl">
              <h2 className="text-xl font-bold text-white mb-4">Register New Student</h2>
              <form onSubmit={handleRegisterStudent} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Student Email</label>
                  <input type="email" required className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg outline-none focus:border-blue-500" value={newStudentEmail} onChange={(e) => setNewStudentEmail(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Initial Password</label>
                  <input type="password" required className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg outline-none focus:border-blue-500" value={newStudentPassword} onChange={(e) => setNewStudentPassword(e.target.value)} />
                </div>
                <button type="submit" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-500 transition">Register</button>
              </form>
            </div>
          </div>
        )}

        {/* --- TAB 3: ACTION CENTER (Complaints & Requests) --- */}
        {activeTab === 'requests' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Action Center</h1>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Complaints Table UI */}
              <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                <div className="bg-red-900/50 p-4 border-b border-slate-700">
                  <h2 className="text-lg font-bold text-red-400 flex items-center"><AlertTriangle className="mr-2" size={20}/> Pending Complaints</h2>
                </div>
                <div className="p-4">
                  <p className="text-slate-400 text-sm mb-4">Click resolve to clear the red warning from the map.</p>
                  <div className="bg-slate-700/30 p-4 rounded-lg flex justify-between items-center border border-slate-600">
                    <div>
                      <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold mr-2">Plumbing</span>
                      <span className="font-bold text-white">Room 102</span>
                      <p className="text-slate-300 text-sm mt-1">"The sink is leaking water everywhere."</p>
                    </div>
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition"><CheckCircle size={20}/></button>
                  </div>
                </div>
              </div>

              {/* Room Change Requests Table UI */}
              <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                <div className="bg-blue-900/50 p-4 border-b border-slate-700">
                  <h2 className="text-lg font-bold text-blue-400 flex items-center"><ClipboardList className="mr-2" size={20}/> Room Change Requests</h2>
                </div>
                <div className="p-4">
                  <p className="text-slate-400 text-sm mb-4">Approve or deny student relocation requests.</p>
                  <div className="bg-slate-700/30 p-4 rounded-lg flex justify-between items-center border border-slate-600">
                    <div>
                      <span className="font-bold text-white">Student ID: 2</span>
                      <p className="text-slate-300 text-sm mt-1">Wants to move from <span className="font-bold text-blue-400">Room 102</span> to <span className="font-bold text-emerald-400">Room 105</span></p>
                      <p className="text-slate-500 text-xs mt-1 italic">Reason: "Too noisy near the stairs."</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg transition"><XCircle size={20}/></button>
                      <button className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition"><CheckCircle size={20}/></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* --- MODALS (POPUPS) --- */}
      {showHostelModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-96 border border-slate-700 relative">
            <button onClick={() => setShowHostelModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-bold text-white mb-6">Create New Hostel</h2>
            <form onSubmit={handleAddHostel} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Hostel Name (e.g., Block B)</label>
                <input type="text" required className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded focus:ring-2 focus:ring-emerald-500 outline-none" value={hostelName} onChange={(e) => setHostelName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Total Rooms</label>
                <input type="number" required min="1" className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded focus:ring-2 focus:ring-emerald-500 outline-none" value={totalRooms} onChange={(e) => setTotalRooms(e.target.value)} />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded hover:bg-emerald-500 transition mt-4">Generate Building</button>
            </form>
          </div>
        </div>
      )}

      {showAllotModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-96 border border-slate-700 relative">
            <button onClick={() => setShowAllotModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-bold text-white mb-6">Allot Room</h2>
            <form onSubmit={handleAllotRoom} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Student ID</label>
                <input type="number" required min="1" className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded focus:ring-2 focus:ring-blue-500 outline-none" value={allotStudentId} onChange={(e) => setAllotStudentId(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Room ID</label>
                <input type="number" required min="1" className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded focus:ring-2 focus:ring-blue-500 outline-none" value={allotRoomId} onChange={(e) => setAllotRoomId(e.target.value)} />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-500 transition mt-4">Confirm Allotment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}