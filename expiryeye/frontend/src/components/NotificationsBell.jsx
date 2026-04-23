import { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';

export default function NotificationsBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const load = () => {
    getNotifications()
      .then((r) => setItems(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    const onRefresh = () => load();
    window.addEventListener('expiryeye-notifications-refresh', onRefresh);
    return () => {
      clearInterval(id);
      window.removeEventListener('expiryeye-notifications-refresh', onRefresh);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  const onMarkOne = async (id) => {
    try {
      await markNotificationRead(id);
      load();
    } catch {
      toast.error('Could not update alert');
    }
  };

  const onMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      load();
      toast.success('All alerts marked read');
    } catch {
      toast.error('Could not clear alerts');
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/10 text-slate-200 hover:bg-white/15 hover:text-white transition"
        aria-label="Alerts"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] rounded-full bg-amber-500 text-[10px] font-bold text-slate-900 flex items-center justify-center px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(100vw-2rem,22rem)] max-h-[70vh] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-sm font-bold">Expiry alerts</p>
            {unread > 0 && (
              <button type="button" onClick={onMarkAll} className="text-xs font-semibold text-indigo-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {!items.length && <p className="px-4 py-8 text-center text-sm text-slate-500">No alerts yet. We notify when items enter the expiring-soon window.</p>}
            {items.slice(0, 40).map((n) => (
              <div
                key={n._id}
                className={`px-4 py-3 border-b border-slate-100 text-left ${n.read ? 'opacity-70' : 'bg-amber-50/50'}`}
              >
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Expiring soon</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{n.title}</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.body}</p>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                {!n.read && (
                  <button type="button" onClick={() => onMarkOne(n._id)} className="mt-2 text-xs font-semibold text-indigo-600 hover:underline">
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
