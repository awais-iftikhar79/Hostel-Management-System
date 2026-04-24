import React, { useState, useEffect } from 'react';

export default function AllotRoomModal({ isOpen, onClose }) {
  const [students, setStudents] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [allRooms, setAllRooms] = useState([]); // Stores all rooms for the selected hostel
  
  // Form Selections
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedHostel, setSelectedHostel] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('All Floors'); // NEW: Floor filter
  const [selectedRoom, setSelectedRoom] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Students and Hostels when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialData = async () => {
      const token = localStorage.getItem('token');
      try {
        const [studentRes, hostelRes] = await Promise.all([
          fetch('http://localhost:8000/admin/students', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:8000/admin/hostels', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (studentRes.ok) {
          const studentData = await studentRes.json();
          // Filter out students that already have a room (Pending Allotment only)
          setStudents(studentData.filter(s => s.assigned_room === 'Pending Allotment' || s.assigned_room === null));
        }
        if (hostelRes.ok) setHostels(await hostelRes.json());
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchInitialData();
  }, [isOpen]);

  // 2. Fetch Rooms when a Hostel is selected
  useEffect(() => {
    if (!selectedHostel) {
      setAllRooms([]);
      setSelectedFloor('All Floors');
      setSelectedRoom('');
      return;
    }

    const fetchRooms = async () => {
      setLoadingRooms(true);
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`http://localhost:8000/admin/hostel-map/${selectedHostel}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          // Filter to show ONLY rooms that have space available
          const availableRooms = (data.rooms || []).filter(room => room.current_occupancy < room.capacity);
          setAllRooms(availableRooms);
          setSelectedFloor('All Floors'); // Reset floor when hostel changes
          setSelectedRoom('');
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [selectedHostel]);

  // Extract unique floors from available rooms
  const floors = [...new Set(allRooms.map(room => room.floor || 'Ground Floor'))].sort();

  // Filter rooms based on the selected floor dropdown
  const filteredRooms = selectedFloor === 'All Floors' 
    ? allRooms 
    : allRooms.filter(room => (room.floor || 'Ground Floor') === selectedFloor);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/admin/allot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: parseInt(selectedStudent),
          room_id: parseInt(selectedRoom),
          start_date: startDate
        })
      });

      if (response.ok) {
        alert("Room allotted successfully!");
        onClose();
        window.location.reload(); 
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Failed to allot room.");
      }
    } catch (error) {
      console.error('Error allotting room:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 border border-slate-200">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-h2 text-h2 text-on-surface">Allot Room to Student</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Select Student */}
          <div>
            <label className="block font-label-md text-on-surface mb-1">Select Student</label>
            <select 
              required
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-secondary/20 outline-none"
            >
              <option value="" disabled>-- Choose Unassigned Student --</option>
              {students.length === 0 ? (
                <option value="" disabled>No pending students found.</option>
              ) : (
                students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.student_id_str})</option>
                ))
              )}
            </select>
          </div>

          {/* Select Hostel */}
          <div>
            <label className="block font-label-md text-on-surface mb-1">Select Building</label>
            <select 
              required
              value={selectedHostel}
              onChange={(e) => setSelectedHostel(e.target.value)}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-secondary/20 outline-none"
            >
              <option value="" disabled>-- Choose Hostel --</option>
              {hostels.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* NEW: Floor Filter and Room Selection Grid */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Floor Filter */}
            <div>
              <label className="block font-label-md text-on-surface mb-1">Filter by Floor</label>
              <select 
                value={selectedFloor}
                onChange={(e) => {
                  setSelectedFloor(e.target.value);
                  setSelectedRoom(''); // Reset room when floor changes
                }}
                disabled={!selectedHostel || allRooms.length === 0}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-secondary/20 outline-none disabled:opacity-50"
              >
                <option value="All Floors">All Floors</option>
                {floors.map(floor => (
                  <option key={floor} value={floor}>{floor}</option>
                ))}
              </select>
            </div>

            {/* Room Selection */}
            <div>
              <label className="block font-label-md text-on-surface mb-1">Select Room</label>
              <select 
                required
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                disabled={!selectedHostel || loadingRooms || filteredRooms.length === 0}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-secondary/20 outline-none disabled:opacity-50"
              >
                <option value="" disabled>
                  {loadingRooms ? 'Loading...' : (filteredRooms.length === 0 && selectedHostel) ? 'No available rooms' : '-- Choose Room --'}
                </option>
                {filteredRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.room_number} ({r.capacity - r.current_occupancy} beds free)
                  </option>
                ))}
              </select>
            </div>
            
          </div>

          {/* Start Date */}
          <div>
            <label className="block font-label-md text-on-surface mb-1">Move-in Date</label>
            <input 
              type="date" 
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-secondary/20 outline-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-on-surface-variant font-label-md hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !selectedRoom || !selectedStudent}
              className="px-4 py-2 bg-primary text-white font-label-md rounded-lg hover:bg-primary-container transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Allotting...' : 'Confirm Allotment'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}