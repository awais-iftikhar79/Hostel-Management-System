import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import StudentLayout from '../components/StudentLayout';

export default function StudentMaintenance() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch full complaint history
  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const email = jwtDecode(token).sub;
      
      const response = await fetch(`http://localhost:8000/student/complaints/${email}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setComplaints(await response.json());
      }
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const email = jwtDecode(token).sub;
      
      // We combine subject and description so the Admin sees exactly what the issue is
      const fullDescription = subject ? `${subject} - ${description}` : description;
      
      const res = await fetch('http://localhost:8000/student/complaints', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          email, 
          category, 
          description: fullDescription 
        })
      });
      
      if(res.ok) {
        // Clear form and refresh history
        setCategory('');
        setSubject('');
        setDescription('');
        fetchComplaints();
      } else {
         const err = await res.json();
         alert(err.detail || "Failed to lodge complaint.");
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for status badge styling
  const getStatusBadge = (status) => {
    const s = status === 'Open' ? 'Pending' : status;
    if (s === 'Pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-error"></span> Pending
        </span>
      );
    }
    if (s === 'Resolved' || s === 'Approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6] font-label-sm text-label-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span> Resolved
        </span>
      );
    }
    if (s === 'In Progress') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-label-sm text-label-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> In Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-label-sm text-label-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> {s}
      </span>
    );
  };

  return (
    <StudentLayout>
      <div className="mb-8">
        <h1 className="font-h1 text-h1 text-on-background mb-2">My Complaints</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Report issues and track your maintenance requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Card: Lodge a New Complaint */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-outline-variant/30 p-6">
          <div className="mb-6 flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">add_task</span>
            </div>
            <h2 className="font-h3 text-h3 text-on-surface">Lodge a New Complaint</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="category">Category</label>
              <div className="relative">
                <select 
                  id="category" 
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                >
                  <option disabled value="">Select an issue type</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Furniture">Furniture / Fixtures</option>
                  <option value="Internet">Internet / Wi-Fi</option>
                  <option value="Other">Other</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>
            
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="subject">Subject / Title</label>
              <input 
                id="subject" 
                required
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of the issue" 
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
              />
            </div>
            
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="description">Description</label>
              <textarea 
                id="description" 
                required
                rows="4" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed information about the problem..." 
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        </div>

        {/* Right Card: My Complaint History */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-outline-variant/30 overflow-hidden">
          <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest">
            <h2 className="font-h3 text-h3 text-on-surface">My Complaint History</h2>
            <button className="text-primary hover:bg-surface-container-low px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">filter_list</span> Filter
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                  <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Complaint ID</th>
                  <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Category</th>
                  <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Description</th>
                  <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                
                {loading && (
                  <tr><td colSpan="4" className="py-8 text-center text-on-surface-variant">Loading history...</td></tr>
                )}
                
                {!loading && complaints.length === 0 && (
                  <tr><td colSpan="4" className="py-8 text-center text-on-surface-variant">No complaints found.</td></tr>
                )}

                {complaints.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="py-4 px-6 font-body-sm text-body-sm text-outline font-mono">
                        {ticket.ticket_id.replace('TK-', 'CMP-')}
                    </td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface font-medium">{ticket.category}</td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface max-w-[200px] truncate" title={ticket.description}>
                        {ticket.description}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {getStatusBadge(ticket.status)}
                    </td>
                  </tr>
                ))}
                
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </StudentLayout>
  );
}