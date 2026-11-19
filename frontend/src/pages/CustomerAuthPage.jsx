import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scissors, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CustomerAuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    if (mode === 'register') {
      if (form.name.trim().length < 2) return 'Please enter your full name.';
      if (form.phone.trim().length < 10) return 'Please enter a valid 10-digit mobile number.';
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email address.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErr = validate();
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password, 'customer');
      } else {
        await register(form);
      }
      navigate('/customer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col lg:flex-row">
      {/* Left Brand Panel */}
      <div className="lg:w-1/2 bg-obsidian text-ivory p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80"
            alt="Salon styling"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold-300 hover:text-gold-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Website
          </Link>
          <div className="mt-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full border border-gold-400/50 bg-gold-500/10 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-semibold text-white">MAISON AURUM</h1>
              <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">
                Client Concierge Portal
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 my-12 lg:my-0">
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-white leading-tight">
            Reserve Your Chair in Seconds.
          </h2>
          <p className="text-zinc-300 mt-4 max-w-md text-sm leading-relaxed">
            Sign in to browse services, choose your preferred master stylist, manage upcoming visits, and track your appointment history.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800 pt-6">
          <span>Are you the salon owner?</span>
          <Link to="/owner-login" className="text-gold-300 hover:underline font-medium">
            Go to Owner Login →
          </Link>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-luxury border border-zinc-200/80">
          <div className="flex rounded-full bg-zinc-100 p-1 mb-7">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-full transition ${
                mode === 'login' ? 'bg-obsidian text-gold-300 shadow-sm' : 'text-zinc-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-full transition ${
                mode === 'register' ? 'bg-obsidian text-gold-300 shadow-sm' : 'text-zinc-600'
              }`}
            >
              Create Account
            </button>
          </div>

          <h3 className="font-serif text-3xl font-semibold text-obsidian">
            {mode === 'login' ? 'Welcome Back' : 'Join Maison Aurum'}
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            {mode === 'login'
              ? 'Access your personal salon dashboard.'
              : 'Create your profile to book appointments online.'}
          </p>

          {error && (
            <div className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none text-sm"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none text-sm pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-obsidian hover:bg-zinc-800 text-gold-300 font-semibold text-sm transition disabled:opacity-60"
            >
              {submitting
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In to Customer Portal'
                : 'Create Account & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
