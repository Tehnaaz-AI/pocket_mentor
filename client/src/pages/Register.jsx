import React, { useState } from 'react';
import { User, Mail, Lock, UserPlus, ArrowRight, AlertCircle, Zap } from 'lucide-react';
import { api } from '../services/api';

export default function Register({ onRegisterSuccess, onSwitchToLogin, onGuestDemo }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await api.register(name, email, password);
      onRegisterSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#f7f8fa]">
      <div className="card-miro max-w-md w-full p-8 sm:p-10 border-[#e0e2e8] bg-white shadow-card space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#fff8e0] border border-[#ffd02f]/50 flex items-center justify-center text-[#1c1c1e]">
            <UserPlus className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-[#1c1c1e] tracking-tight">Create an Account</h2>
          <p className="text-xs text-[#555a6a]">Join Pocket Mentor to transform your class notes</p>
        </div>

        {/* Instant Demo Option */}
        <button
          onClick={onGuestDemo}
          type="button"
          className="btn-yellow w-full py-3 text-xs font-semibold flex items-center justify-center space-x-2 shadow-sm"
        >
          <Zap className="w-4 h-4 text-[#1c1c1e] fill-[#1c1c1e]" />
          <span>Launch 1-Click Guest Demo</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#eef0f3] w-full" />
          <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-[#8e91a0] font-semibold absolute">
            Or sign up
          </span>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#ffc6c6]/40 border border-[#ff9999] text-[#600000] text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2c2c34] mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8e91a0] absolute left-3.5 top-3" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="input-miro w-full pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2c2c34] mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8e91a0] absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@university.edu"
                className="input-miro w-full pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2c2c34] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8e91a0] absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input-miro w-full pl-10"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 text-xs font-semibold flex items-center justify-center space-x-2"
          >
            <span>{isLoading ? 'Creating Account…' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-1 border-t border-[#eef0f3]">
          <p className="text-xs text-[#555a6a]">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-[#1c1c1e] font-bold hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
