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
    <div className="bg-background text-on-background font-body-md min-h-screen flex antialiased">
      {/* Left Side: Branding & Value Proposition */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-container overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            alt="Decorative background" 
            className="w-full h-full object-cover grayscale mix-blend-overlay" 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-container/90 to-primary/95 z-10"></div>
        
        <div className="relative z-20 flex flex-col max-w-lg w-full">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>domain</span>
            </div>
            <span className="font-h2 text-h2 text-on-primary">DormFlow</span>
          </div>
          <div className="space-y-6">
            <h1 className="font-h1 text-h1 text-on-primary leading-tight">Institutional Reliability</h1>
            <p className="font-body-lg text-body-lg text-primary-fixed-dim max-w-md">
              Effortless Hostel Management. Streamline your property operations with our premium enterprise resource planning solution.
            </p>
          </div>
          <div className="mt-20 flex gap-4">
            <div className="h-1 w-12 bg-secondary rounded-full"></div>
            <div className="h-1 w-4 bg-surface-tint opacity-30 rounded-full"></div>
            <div className="h-1 w-4 bg-surface-tint opacity-30 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center bg-surface-container-lowest p-6 lg:p-12 relative">
        <div className="w-full max-w-[420px]">
          
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-md bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>domain</span>
              </div>
              <span className="font-h3 text-h3 text-primary-container">DormFlow</span>
            </div>
            <h2 className="font-h2 text-h2 text-on-surface mb-2">Welcome back</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Please enter your credentials to access your portal.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg font-body-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block font-label-md text-label-md text-on-surface">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline">mail</span>
                </div>
                <input 
                  id="email" 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu" 
                  className="block w-full pl-10 pr-3 py-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors duration-200 outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block font-label-md text-label-md text-on-surface">Password</label>
                <a href="#" className="font-label-sm text-label-sm text-secondary hover:text-secondary-container transition-colors">Forgot Password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline">lock</span>
                </div>
                <input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="block w-full pl-10 pr-10 py-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors duration-200 outline-none"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-outline hover:text-on-surface-variant focus:outline-none transition-colors"
                  >
                    <span className="material-symbols-outlined">
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
                className="h-4 w-4 rounded border-outline-variant text-secondary focus:ring-secondary/20 bg-surface-container-lowest cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block font-body-sm text-body-sm text-on-surface-variant cursor-pointer">
                Remember me
              </label>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-label-md text-label-md text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
          
          <div className="mt-10 text-center">
            <p className="font-body-sm text-body-sm text-outline">
              Secure Enterprise Access © 2026 DormFlow
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}