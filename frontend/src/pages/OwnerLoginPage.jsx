import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function OwnerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      setError('Please enter valid owner credentials.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await login(email, password, 'owner');
      navigate('/owner/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid owner credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-ivory flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(197,155,67,0.16),_transparent_55%)]" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold-300 hover:text-gold-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Maison Aurum
        </Link>

        <div className="bg-charcoal border border-gold-500/25 rounded-3xl p-8 sm:p-10 shadow-luxury">
          <div className="w-12 h-12 rounded-2xl bg-gold-500/15 border border-gold-400/40 flex items-center justify-center mb-5">
            <ShieldCheck className="w-6 h-6 text-gold-400" />
          </div>

          <h1 className="font-serif text-3xl font-semibold text-white">Salon Owner Portal</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Secure management access for appointments, services, clients, payments, and analytics.
          </p>

          {error && (
            <div className="mt-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Owner Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter registered owner email"
                className="w-full px-4 py-3 rounded-xl bg-obsidian border border-zinc-700 text-white focus:border-gold-400 outline-none text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-obsidian border border-zinc-700 text-white focus:border-gold-400 outline-none text-sm pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-obsidian font-semibold text-sm shadow-gold transition disabled:opacity-60"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Owner Dashboard'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-500">
            Looking to book a salon appointment?{' '}
            <Link to="/login" className="text-gold-300 hover:underline">
              Customer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
