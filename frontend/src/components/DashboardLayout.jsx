import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, LogOut, Menu, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function DashboardLayout({
  portalLabel,
  navItems,
  activeTab,
  onTabChange,
  children,
}) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-obsidian text-ivory border-r border-zinc-800/80">
      {/* Brand */}
      <div className="p-6 border-b border-zinc-800/80">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-gold-400/50 bg-gold-500/10 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-gold-400" />
          </div>
          <div>
            <p className="font-serif text-xl font-semibold tracking-wide text-white leading-none">
              MAISON AURUM
            </p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold-400 mt-1">
              {portalLabel}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-gold-500 text-obsidian shadow-gold font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                {item.label}
              </span>
              {item.badge > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    active ? 'bg-obsidian text-gold-300' : 'bg-gold-500/20 text-gold-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Card */}
      <div className="p-4 border-t border-zinc-800/80 space-y-3">
        <div className="px-3 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
          <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
          <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Website
          </Link>
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-rose-900/50 text-xs text-rose-300 hover:bg-rose-950/50 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 h-full">
            <SidebarContent />
          </div>
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-zinc-200 px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-zinc-700 hover:bg-zinc-100"
              aria-label="Open sidebar"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="font-serif text-2xl font-semibold text-obsidian">
              {navItems.find((n) => n.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-champagne text-gold-700 border border-gold-200">
              {portalLabel}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
