import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // FastAPI OAuth2PasswordRequestForm expects form-urlencoded data, using 'username' for the email.
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Invalid credentials. Please try again.');
      }

      const data = await response.json();
      const token = data.access_token;

      // Save token to localStorage
      localStorage.setItem('token', token);

      // Decode the JWT to find out if the user is an admin or student
      const decodedToken = jwtDecode(token);
      const userRole = decodedToken.role;

      // Route the user to the correct dashboard based on your DB role
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex font-sans antialiased">
      
      {/* --- LEFT SIDE: BRANDING & PROFESSIONAL COPY --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center p-12 shadow-2xl z-10">
        
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0 opacity-30">
          <img 
            alt="Modern architecture background" 
            className="w-full h-full object-cover grayscale mix-blend-overlay" 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-blue-900/80 z-10"></div>
        
        {/* Content */}
        <div className="relative z-20 flex flex-col max-w-lg w-full">
          
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
            </div>
            <span className="text-[28px] font-bold text-white tracking-tight">Hostel</span>
          </div>
          
          {/* New Professional Copy */}
          <div className="space-y-6">
            <h1 className="text-[42px] font-extrabold text-white leading-[1.15] tracking-tight">
              Centralized <br/><span className="text-blue-400">Campus Management</span>
            </h1>
            <p className="text-[18px] text-slate-300 font-medium leading-relaxed max-w-md">
              Experience the next generation of student housing. HostelHub streamlines room allocations, financial tracking, and facility maintenance into one powerful platform.
            </p>
          </div>
          
          {/* Decorative Progress Bar */}
          <div className="mt-20 flex gap-3">
            <div className="h-1.5 w-12 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            <div className="h-1.5 w-4 bg-slate-600 rounded-full"></div>
            <div className="h-1.5 w-4 bg-slate-600 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: LOGIN FORM --- */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6 lg:p-12 relative">
        <div className="w-full max-w-[420px] bg-white p-8 md:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          
          <div className="mb-10 text-center lg:text-left">
            {/* Mobile Only Logo */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
              </div>
              <span className="text-[24px] font-bold text-slate-900 tracking-tight">HostelHub</span>
            </div>
            
            <h2 className="text-[28px] font-bold text-slate-900 tracking-tight mb-2">Welcome back</h2>
            <p className="text-[15px] text-slate-500 font-medium">Please enter your credentials to access your portal.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">mail</span>
                </div>
                <input 
                  id="email" 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu" 
                  className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-[15px] placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-bold text-slate-700">Password</label>
                <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">Forgot Password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">lock</span>
                </div>
                <input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="block w-full pl-11 pr-12 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-[15px] placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                />
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors rounded-md hover:bg-slate-100"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center pt-2">
              <input 
                id="remember-me" 
                type="checkbox" 
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-slate-600 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 rounded-lg shadow-sm font-bold text-[15px] text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Secure Enterprise Access © 2026 HostelHub
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}