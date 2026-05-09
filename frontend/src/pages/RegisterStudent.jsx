import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';

export default function RegisterStudent() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  // Generates a random 10-character secure password
  const handleGeneratePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let newPassword = "";
    for (let i = 0; i < 10; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPassword);
    setShowPassword(true); // Automatically show it so the admin can copy it
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: email,
          password: password,
          role: 'student'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to register student.');
      }

      setStatus('success');
      setMessage(`Successfully registered ${email}!`);
      
      // Clear form on success
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-[800px] mx-auto p-8">
        
        {/* --- UPDATED HEADER WITH NEW TYPOGRAPHY --- */}
        <div className="mb-8">
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight mb-2">
            Register Student
          </h1>
          <p className="text-[16px] text-slate-500 font-medium">
            Create a new student profile and generate initial access credentials.
          </p>
        </div>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-emerald-100 text-emerald-800 rounded-lg flex items-center gap-2 border border-emerald-200">
             <span className="material-symbols-outlined">check_circle</span>
             {message}
          </div>
        )}
        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg flex items-center gap-2 border border-red-200">
             <span className="material-symbols-outlined">error</span>
             {message}
          </div>
        )}

        {/* Registration Form Surface */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Form Section: Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-label-sm text-label-sm text-on-surface" htmlFor="firstName">First Name</label>
                <input 
                  id="firstName" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Awais" 
                  type="text"
                  className="w-full px-4 py-2 rounded-md border border-slate-300 bg-slate-50 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all placeholder:text-slate-400" 
                />
              </div>
              <div className="space-y-2">
                <label className="block font-label-sm text-label-sm text-on-surface" htmlFor="lastName">Last Name</label>
                <input 
                  id="lastName" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Iftikhar" 
                  type="text"
                  className="w-full px-4 py-2 rounded-md border border-slate-300 bg-slate-50 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all placeholder:text-slate-400" 
                />
              </div>
            </div>

            {/* Divider */}
            <hr className="border-slate-200" />

            {/* Form Section: Credentials */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block font-label-sm text-label-sm text-on-surface" htmlFor="studentEmail">Student Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">mail</span>
                  </div>
                  <input 
                    id="studentEmail" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@giki.edu.pk" 
                    type="email"
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-300 bg-slate-50 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all placeholder:text-slate-400" 
                  />
                </div>
                <p className="font-body-sm text-body-sm text-slate-500 mt-1">This will be used as their primary login identifier.</p>
              </div>

              <div className="space-y-2">
                <label className="block font-label-sm text-label-sm text-on-surface" htmlFor="initialPassword">Initial Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">lock</span>
                  </div>
                  <input 
                    id="initialPassword" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-10 pr-10 py-2 rounded-md border border-slate-300 bg-slate-50 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all placeholder:text-slate-400" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button 
                    type="button" 
                    onClick={handleGeneratePassword}
                    className="font-label-sm text-label-sm text-secondary hover:text-secondary-container transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">autorenew</span> 
                    Generate Secure Password
                  </button>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-6 flex items-center justify-end gap-4 border-t border-slate-200">
              <button 
                type="button" 
                onClick={() => {
                  setFirstName(''); setLastName(''); setEmail(''); setPassword('');
                }}
                className="px-6 py-2 rounded-md border border-slate-300 bg-white text-on-surface font-label-md hover:bg-slate-50 transition-colors shadow-sm"
              >
                Clear Form
              </button>
              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="px-6 py-2 rounded-md bg-primary text-white font-label-md hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
              >
                {status === 'loading' ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                    Register Student
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Helper Context Card */}
        <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200 flex items-start gap-4">
          <span className="material-symbols-outlined text-secondary mt-0.5">info</span>
          <div>
            <h4 className="font-label-md text-label-md text-on-surface">Next Steps</h4>
            <p className="font-body-sm text-body-sm text-slate-600 mt-1">
              Once registered, the student will appear in the Student Directory. You can then proceed to Allot Room to assign them to a specific hostel and bed.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}