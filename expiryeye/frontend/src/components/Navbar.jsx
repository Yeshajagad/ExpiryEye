import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pill, LogOut, LayoutDashboard, Package } from 'lucide-react';
import NotificationsBell from './NotificationsBell';

function roleLabel(role) {
  if (role === 'store_owner') return 'Store';
  if (role === 'admin') return 'Admin';
  return 'Customer';
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (['/login', '/register'].includes(pathname)) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-md text-white shadow-lg shadow-slate-900/20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-lg font-bold tracking-tight hover:opacity-90 transition"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-inner">
            <Pill className="w-5 h-5 text-white" />
          </span>
          <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">ExpiryEye</span>
        </button>
        {user && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
              {roleLabel(user.role)}
            </span>
            <NotificationsBell />
            <nav className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  pathname === '/dashboard' ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  pathname === '/products' ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" /> Medicines
              </button>
            </nav>
            <span className="text-sm text-slate-400 max-w-[120px] truncate hidden md:inline" title={user.name}>
              {user.name}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl bg-red-500/90 hover:bg-red-500 px-3 py-2 text-sm font-semibold transition"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
