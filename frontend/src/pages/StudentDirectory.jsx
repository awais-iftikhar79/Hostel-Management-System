import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';

export default function StudentDirectory() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all students on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/admin/students', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch student directory');
        }

        const data = await response.json();
        setStudents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Grab the globally selected hostel ID from the top navigation
  const globalHostelId = localStorage.getItem('selectedHostelId') || 'all';

  // Filter students based on BOTH search input AND the selected Hostel
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id_str.toLowerCase().includes(searchTerm.toLowerCase());
                          
    // If 'all' is selected, show everyone. Otherwise, only show students matching the hostel_id.
    const matchesHostel = globalHostelId === 'all' || String(student.hostel_id) === String(globalHostelId);

    return matchesSearch && matchesHostel;
  });

  // Helper to get initials for the avatar
  const getInitials = (name) => {
    return name.substring(0, 2).toUpperCase();
  };

 // Update Student Function
  const handleEditStudent = async (studentId) => {
    const newName = window.prompt("Enter the new name for this student:");
    if (!newName) return; // Exit if the admin cancelled or left it blank

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/admin/students/${studentId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ name: newName })
      });
      
      if (res.ok) {
        alert("Student updated successfully!");
        window.location.reload(); // Refresh the table
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to update student.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Student Function
  const handleDeleteStudent = async (studentId) => {
    // Show a strict warning since this deletes everything
    const confirmDelete = window.confirm("Are you sure you want to completely remove this student? This will permanently delete their fee records, complaints, and room allocations. This cannot be undone.");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        alert("Student completely deleted from the system!");
        window.location.reload(); // Refresh the table
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to delete student.");
      }
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <AdminLayout>
      <div className="p-8 max-w-[1440px] mx-auto w-full overflow-x-hidden">
        
        {/* --- HEADER WITH NEW TYPOGRAPHY --- */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[32px] font-bold text-slate-900 tracking-tight">
              Registered Students Directory
            </h1>
            
            {/* The blue badge styling */}
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {filteredStudents.length} {globalHostelId === 'all' ? 'Total' : 'in this Hostel'}
            </span>
          </div>
          <p className="text-[16px] text-slate-500 font-medium">
            Manage and view all students currently assigned to or awaiting room allotment in the Hostel Management System.
          </p>
        </div>

        {/* Filter & Search Bar (Export Button Removed) */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, ID, or email..." 
              className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 transition-all" 
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="py-4 px-6 font-label-md text-label-md text-on-surface font-semibold w-16"></th>
                  <th className="py-4 px-6 font-label-md text-label-md text-on-surface font-semibold">Student</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-on-surface font-semibold">Student ID</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-on-surface font-semibold">Email Address</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-on-surface font-semibold">Assigned Room</th>
                  <th className="py-4 px-6 font-label-md text-label-md text-on-surface font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                
                {loading && (
                  <tr><td colSpan="6" className="py-8 text-center text-on-surface-variant">Loading students...</td></tr>
                )}
                
                {!loading && filteredStudents.length === 0 && (
                  <tr><td colSpan="6" className="py-8 text-center text-on-surface-variant">No students found.</td></tr>
                )}

                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-surface-bright transition-colors group">
                    <td className="py-4 px-6">
                      <input type="checkbox" className="rounded border-outline-variant text-secondary focus:ring-secondary cursor-pointer" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-label-md text-label-md font-bold">
                          {getInitials(student.name)}
                        </div>
                        <span className="font-body-md text-body-md font-medium text-on-surface">{student.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-body-sm text-body-sm text-on-surface-variant font-mono">
                      {student.student_id_str}
                    </td>
                    <td className="py-4 px-6 font-body-sm text-body-sm text-on-surface-variant">
                      {student.email}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-label-sm ${student.assigned_room === 'Pending Allotment' ? 'bg-surface-container-high text-on-surface' : 'bg-secondary-fixed text-on-secondary-fixed'}`}>
                        {student.assigned_room}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {/* ACTION BUTTONS (Appear on Hover) */}
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditStudent(student.id)} 
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                          title="Edit Student"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)} 
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                          title="Delete Student"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-surface border-t border-outline-variant px-6 py-4 flex items-center justify-between">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Showing {filteredStudents.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded text-outline hover:bg-surface-variant transition-colors disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="w-8 h-8 rounded bg-primary text-on-primary font-label-sm text-label-sm flex items-center justify-center">1</button>
              <button className="p-1.5 rounded text-on-surface hover:bg-surface-variant transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}