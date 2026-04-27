"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, LogIn, Lock, X } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [targetPortal, setTargetPortal] = useState<'admin' | 'murabbi' | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handlePortalClick = (portal: 'admin' | 'murabbi') => {
    setTargetPortal(portal);
    setPassword('');
    setError('');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetPortal === 'admin') {
      if (password === 'JI2026JI') {
        router.push('/dashboard');
      } else {
        setError('Incorrect password for Admin Portal.');
      }
    } else if (targetPortal === 'murabbi') {
      if (password === 'Marhaba') {
        router.push('/attendance');
      } else {
        setError('Incorrect password for Murabbi Portal.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-emerald-800 bg-gradient-to-br from-emerald-800 to-emerald-900 p-8 text-center border-b border-emerald-950/50">
          <div className="w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg">
            <BookOpen className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200">Dawat-e-Quran</h1>
          <p className="text-xs uppercase font-black tracking-[0.25em] text-emerald-200/80 mt-2">Zone 5 Management System</p>
        </div>
        
        <div className="p-8 space-y-6">
          <p className="text-gray-600 text-center text-sm">
            Select your portal to continue. Access requires authorization.
          </p>

          <button type="button" onClick={() => handlePortalClick('murabbi')} className="flex text-left items-center gap-4 w-full p-4 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
            <div className="bg-emerald-100 p-3 rounded-lg group-hover:bg-emerald-200 transition-colors flex-shrink-0">
              <LogIn className="text-emerald-700 w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">Murabbi Portal <Lock className="w-3 h-3 text-gray-400" /></h2>
              <p className="text-gray-500 text-sm">Log Jaiza & Attendance (Mobile)</p>
            </div>
          </button>

          <button type="button" onClick={() => handlePortalClick('admin')} className="flex text-left items-center gap-4 w-full p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group">
            <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
              <LogIn className="text-blue-700 w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">Admin Portal <Lock className="w-3 h-3 text-gray-400" /></h2>
              <p className="text-gray-500 text-sm">Zone Nazim Dashboard (Desktop)</p>
            </div>
          </button>

          <Link href="/portal" className="flex text-left items-center gap-4 w-full p-4 rounded-xl border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group">
            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors flex-shrink-0">
              <BookOpen className="text-purple-700 w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg">Attendee Portal</h2>
              <p className="text-gray-500 text-sm">View Schedule & Syllabus</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-4 text-white flex justify-between items-center ${targetPortal === 'admin' ? 'bg-blue-700' : 'bg-emerald-700'}`}>
              <h3 className="font-bold flex items-center gap-2">
                <Lock className="w-5 h-5" /> 
                {targetPortal === 'admin' ? 'Admin Login' : 'Murabbi Login'}
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Enter Password</label>
                <input 
                  type="password" 
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full p-3 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl outline-none focus:ring-2 ${targetPortal === 'admin' ? 'focus:ring-blue-500' : 'focus:ring-emerald-500'}`}
                  placeholder="Password..."
                />
                {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}
              </div>
              <button 
                type="submit" 
                className={`w-full py-3 text-white font-bold rounded-xl transition-all ${targetPortal === 'admin' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                Access Portal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}