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
    // Ensure we convert both to strings for a safe comparison!
    const matchesHostel = globalHostelId === 'all' || String(student.hostel_id) === String(globalHostelId);

    return matchesSearch && matchesHostel;
  });

  // Helper to get initials for the avatar
  const getInitials = (name) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-[1440px] mx-auto w-full overflow-x-hidden">
        
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-h1 text-h1 text-on-surface mb-2 flex items-center gap-3">
              Registered Students Directory
              <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-2.5 py-1 rounded-full">
                {filteredStudents.length} {globalHostelId === 'all' ? 'Total' : 'in this Hostel'}
              </span>
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Manage and view all students currently assigned to or awaiting room allotment in the Hostel Management System.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
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
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="px-4 py-2.5 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-variant transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined">file_download</span>
              Export List
            </button>
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
                  <th className="py-4 px-6 font-label-md text-label-md text-on-surface font-semibold text-right">Action</th>
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
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-on-surface-variant hover:text-secondary hover:bg-secondary-fixed/50 rounded-md transition-colors" title="Edit Student">
                          <span className="material-symbols-outlined text-sm">edit</span>
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