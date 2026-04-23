import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Pill, Store, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', accountType: 'customer' });
  const [submitting, setSubmitting] = useState(false);
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [loading, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await registerUser(form);
      login(data, data.token);
      toast.success('Welcome to ExpiryEye.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/95 shadow-2xl shadow-indigo-900/40 backdrop-blur-xl p-8 md:p-10">
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 mb-4 shadow-lg shadow-indigo-500/30">
            <Pill className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Create your ExpiryEye account</h1>
          <p className="text-slate-500 text-sm mt-2 text-center max-w-sm">
            Pick how you use the product — you can always add another account later for the other role.
          </p>
        </div>

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Account type</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <button
            type="button"
            onClick={() => setForm({ ...form, accountType: 'customer' })}
            className={`text-left rounded-2xl border-2 p-4 transition ${
              form.accountType === 'customer'
                ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-200'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <UserCircle className={`w-8 h-8 mb-2 ${form.accountType === 'customer' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <p className="font-bold text-slate-900">Customer</p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">Track medicines you bring home. Photos or pack IDs, daily expiry checks.</p>
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, accountType: 'store_owner' })}
            className={`text-left rounded-2xl border-2 p-4 transition ${
              form.accountType === 'store_owner'
                ? 'border-violet-500 bg-violet-50/80 ring-2 ring-violet-200'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <Store className={`w-8 h-8 mb-2 ${form.accountType === 'store_owner' ? 'text-violet-600' : 'text-slate-400'}`} />
            <p className="font-bold text-slate-900">Medical store</p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">Owner workspace for larger inventories, tables, and faster audits.</p>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            ['name', 'Full name', 'text', 'Your name'],
            ['email', 'Email', 'email', 'you@email.com'],
            ['password', 'Password', 'password', 'At least 6 characters'],
          ].map(([field, label, type, ph]) => (
            <div key={field}>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
              <input
                type={type}
                required
                minLength={field === 'password' ? 6 : undefined}
                className="mt-1.5 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                placeholder={ph}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Mobile for SMS alerts (optional)</label>
            <input
              type="tel"
              className="mt-1.5 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+919876543210 (E.164, with country code)"
            />
            <p className="text-[11px] text-slate-500 mt-1">Used only if Twilio is configured on the server.</p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/25 transition"
          >
            {submitting ? 'Creating account…' : 'Continue'}
          </button>
        </form>
        <p className="text-center text-sm mt-6 text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
