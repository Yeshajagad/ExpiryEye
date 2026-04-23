import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getStats,
  getProducts,
  updateProfile,
  seedRawSamples,
  triggerExpiryAlerts,
} from '../services/api';
import toast from 'react-hot-toast';
import StatCard from '../components/StatCard';
import LiveEvaluationFeed from '../components/LiveEvaluationFeed';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Store,
  UserCircle,
  Bell,
  Database,
  Send,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#22c55e', '#facc15', '#ef4444'];

function effectiveRole(user) {
  if (!user) return 'customer';
  if (user.role === 'user') return 'customer';
  return user.role;
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const role = effectiveRole(user);
  const isOwner = role === 'store_owner' || role === 'admin';

  const [stats, setStats] = useState({ total: 0, safe: 0, nearExpiry: 0, expired: 0, pendingReview: 0 });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [busy, setBusy] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, productsRes] = await Promise.all([getStats(), getProducts()]);
      setStats(statsRes.data);
      setProducts(productsRes.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    setPhoneInput(user?.phone || '');
  }, [user?.phone]);

  const savePhone = async () => {
    setBusy(true);
    try {
      await updateProfile({ phone: phoneInput });
      await refreshUser();
      toast.success('Phone number saved for SMS alerts');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save phone');
    } finally {
      setBusy(false);
    }
  };

  const onSeedRaw = async () => {
    setBusy(true);
    try {
      const { data } = await seedRawSamples();
      toast.success(data.message || 'Samples loaded');
      await loadDashboard();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load samples');
    } finally {
      setBusy(false);
    }
  };

  const onTriggerAlerts = async () => {
    setBusy(true);
    try {
      const { data } = await triggerExpiryAlerts();
      toast.success(data.message || 'Alerts sent');
      await loadDashboard();
      window.dispatchEvent(new Event('expiryeye-notifications-refresh'));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not run alerts');
    } finally {
      setBusy(false);
    }
  };

  const pieData = [
    { name: 'In date', value: stats.safe },
    { name: 'Expiring soon', value: stats.nearExpiry },
    { name: 'Expired', value: stats.expired },
  ];

  const recentExpiring = products
    .filter((p) => p.status !== 'safe')
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
    .slice(0, 6);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center gap-3 text-slate-500">
        <div className="h-10 w-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" aria-hidden />
        <p className="text-sm font-medium">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 mb-3 shadow-sm">
            {isOwner ? <Store className="w-3.5 h-3.5 text-indigo-600" /> : <UserCircle className="w-3.5 h-3.5 text-emerald-600" />}
            {isOwner ? 'Store owner console' : 'Customer home'}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Hi {user?.name?.split(' ')[0] || 'there'}, here is your expiry picture
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            {isOwner
              ? 'Shelf risk, verification queue, and a live feed of anonymised demo checks so your team sees the product in action.'
              : 'See what is still safe, what is expiring soon, and what should leave your cabinet. Email alerts fire when items approach expiry.'}
          </p>
        </div>
      </header>

      <section className="rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/50 p-6 shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              Alerts & sample data
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Scheduled checks run twice daily. Use <strong>Run check now</strong> to test email, and the bell icon. Add <strong>sample medicines</strong> to this account (replaces previous RAW-DEMO rows).
            </p>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide"></label>
            <div className="mt-1 flex flex-wrap gap-2">
              <input
                type="tel"
                className="flex-1 min-w-[200px] border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+919876543210"
              />
              <button
                type="button"
                disabled={busy}
                onClick={savePhone}
                className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
              >
                Save phone
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              disabled={busy}
              onClick={onSeedRaw}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 disabled:opacity-50"
            >
              <Database className="w-4 h-4" /> Load sample medicines
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onTriggerAlerts}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> Run check now
            </button>
          </div>
        </div>
      </section>

      <LiveEvaluationFeed />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Tracked items" value={stats.total} color="blue" icon={Package} />
        <StatCard title="In date" value={stats.safe} color="green" icon={CheckCircle} />
        <StatCard title="Expiring soon" value={stats.nearExpiry} color="yellow" icon={AlertTriangle} />
        <StatCard title="Expired" value={stats.expired} color="red" icon={XCircle} />
        <StatCard title="Your review queue" value={stats.pendingReview ?? 0} color="violet" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/30 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Status mix</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/30 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Volumes</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pieData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {recentExpiring.length > 0 && (
        <div className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50/90 to-white p-6 shadow-md">
          <h2 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Needs attention
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-red-100/80 bg-white/80">
            <table className="w-full text-sm">
              <thead className="bg-red-50/90 text-red-900">
                <tr>
                  {['Medicine', 'Pack ID', 'Expiry', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentExpiring.map((p) => (
                  <tr key={p._id} className="border-t border-red-50">
                    <td className="px-4 py-2 font-medium text-slate-900">{p.name}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-600">{p.medicineId || '—'}</td>
                    <td className="px-4 py-2">{new Date(p.expiryDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          p.status === 'expired' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {String(p.status || '').replace(/-/g, ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
