import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Menu, X, Calendar, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Services', href: '#services' },
    { label: 'About', href: '#about' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Contact', href: '#contact' },
  ];

  const isOwnerRole = ['owner', 'demo_owner'].includes(user?.role);
  const portalPath = isOwnerRole ? '/owner/dashboard' : '/customer/dashboard';

  return (
    <header className="sticky top-0 z-50 bg-obsidian/95 backdrop-blur-md border-b border-gold-500/20 text-ivory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full border border-gold-400/50 bg-gold-500/10 flex items-center justify-center group-hover:bg-gold-500/20 transition">
              <Scissors className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <span className="font-serif text-2xl tracking-wide font-semibold text-white block leading-none">
                MAISON AURUM
              </span>
              <span className="text-[10px] uppercase tracking-[0.28em] text-gold-400">
                Salon & Grooming Atelier
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-zinc-300 hover:text-gold-300 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <Link
                to={portalPath}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold-400/40 text-gold-300 hover:bg-gold-500/10 text-sm font-medium transition"
              >
                {isOwnerRole ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                {isOwnerRole ? 'Owner Dashboard' : 'My Dashboard'}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-zinc-200 hover:text-gold-300 px-3 py-2 transition"
                >
                  Login
                </Link>
                <Link
                  to="/owner-login"
                  className="text-xs font-medium text-zinc-400 hover:text-gold-300 border border-zinc-700 hover:border-gold-500/40 rounded-full px-3 py-1.5 transition"
                >
                  Owner Portal
                </Link>
              </>
            )}

            <Link
              to={['customer', 'user'].includes(user?.role) ? '/customer/dashboard?tab=book' : '/login'}
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-obsidian font-semibold text-sm px-5 py-2.5 rounded-full shadow-gold transition"
            >
              <Calendar className="w-4 h-4" />
              Book Appointment
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800"
            aria-label="Toggle Menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="lg:hidden bg-charcoal border-t border-zinc-800 px-4 py-5 space-y-3">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-zinc-200 hover:text-gold-300"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2.5">
            {user ? (
              <Link
                to={portalPath}
                onClick={() => setOpen(false)}
                className="w-full text-center py-2.5 rounded-full border border-gold-400/50 text-gold-300 text-sm font-medium"
              >
                Go to {isOwnerRole ? 'Owner Dashboard' : 'Customer Dashboard'}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="w-full text-center py-2.5 rounded-full border border-zinc-700 text-zinc-200 text-sm font-medium"
                >
                  Customer Login
                </Link>
                <Link
                  to="/owner-login"
                  onClick={() => setOpen(false)}
                  className="w-full text-center py-2.5 rounded-full border border-zinc-700 text-zinc-400 text-sm font-medium"
                >
                  Owner Portal Login
                </Link>
              </>
            )}
            <Link
              to={['customer', 'user'].includes(user?.role) ? '/customer/dashboard?tab=book' : '/login'}
              onClick={() => setOpen(false)}
              className="w-full text-center py-2.5 rounded-full bg-gold-500 text-obsidian font-semibold text-sm"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
