import React, { useState, useEffect } from 'react';

export default function AllotRoomModal({ isOpen, onClose }) {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [startDate, setStartDate] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch data when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
      // Set default start date to today
      setStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const hostelId = localStorage.getItem('selectedHostelId') || 1;

      // 1. Fetch Students & filter only those pending allotment
      const studentRes = await fetch('http://localhost:8000/admin/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (studentRes.ok) {
        const studentData = await studentRes.json();
        setStudents(studentData.filter(s => s.assigned_room === 'Pending Allotment'));
      }

      // 2. Fetch Rooms for current hostel & filter only those with available beds
      if (hostelId !== 'all') {
        const roomRes = await fetch(`http://localhost:8000/admin/hostel-map/${hostelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (roomRes.ok) {
          const roomData = await roomRes.json();
          setRooms(roomData.rooms.filter(r => r.current_occupancy < r.capacity));
        }
      }
    } catch (err) {
      console.error("Failed to fetch data for modal", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

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
          start_date: new Date(startDate).toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to allot room');
      }

      // Success! Close modal and refresh to show the new data
      onClose();
      window.location.reload(); 
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentHostelId = localStorage.getItem('selectedHostelId') || 'all';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-h2 text-h2 text-on-surface">Allot Room</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {currentHostelId === 'all' ? (
          <div className="p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 font-body-sm mb-4">
            <span className="material-symbols-outlined align-middle mr-2 text-sm">warning</span>
            Please select a specific Hostel from the top dropdown before allotting a room.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">Select Student</label>
              <select 
                required
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none appearance-none"
              >
                <option value="" disabled>Choose an unallocated student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.student_id_str})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">Select Available Room</label>
              <select 
                required
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none appearance-none"
              >
                <option value="" disabled>Choose a room...</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    Room {r.room_number} ({r.capacity - r.current_occupancy} beds available)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">Move-in Date</label>
              <input 
                type="date" 
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-on-surface-variant font-label-md hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting || !selectedStudent || !selectedRoom}
                className="px-4 py-2 bg-primary text-white font-label-md rounded-lg hover:bg-primary-container transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Allotment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}