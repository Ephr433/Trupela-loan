import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2, Shield } from 'lucide-react';
import { adminLogin } from '../lib/firebase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await adminLogin(email, password);
      navigate('/admin/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      if (errorMessage.includes('user-not-found') || errorMessage.includes('wrong-password') || errorMessage.includes('invalid-credential')) {
        setError('Invalid email or password');
      } else if (errorMessage.includes('too-many-requests')) {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1419] flex items-center justify-center px-6">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#008080]/20 flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-[#008080]" />
          </div>
          <h1 className="font-display text-[28px] font-medium text-white mb-1">Admin Login</h1>
          <p className="text-[14px] font-body text-white/50">Trupela Loan Organisation</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-lg text-[14px] font-body text-[#DC2626]">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[13px] font-medium font-body text-white/70 mb-1.5 block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@trupela.com"
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-lg text-[16px] font-body text-white placeholder-white/30 outline-none transition-all duration-200 focus:border-[#008080] focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)]"
              />
            </div>

            <div>
              <label className="text-[13px] font-medium font-body text-white/70 mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-lg text-[16px] font-body text-white placeholder-white/30 outline-none transition-all duration-200 focus:border-[#008080] focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#008080] text-white text-[16px] font-medium font-body rounded-lg hover:bg-[#006666] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} /> Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <a href="/" className="text-[14px] font-body text-white/40 hover:text-white/70 transition-colors">
            ← Back to Website
          </a>
        </div>
      </div>
    </div>
  );
          }

