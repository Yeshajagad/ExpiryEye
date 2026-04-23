import { useEffect, useState } from 'react';
import { getLiveFeed } from '../services/api';
import { Activity, ShieldCheck, Clock, RefreshCw } from 'lucide-react';
import { resolveMediaUrl } from '../utils/mediaUrl';

export default function LiveEvaluationFeed({ embedded = true }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [pulse, setPulse] = useState(false);

  const load = () => {
    getLiveFeed()
      .then((r) => {
        setData(r.data);
        setErr(null);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      })
      .catch(() => setErr('Could not load live feed'));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 12000);
    return () => clearInterval(id);
  }, []);

  if (err && !data) {
    return (
      <div className={`rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 ${embedded ? '' : ''}`}>
        {err}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-slate-500 text-sm">
        <RefreshCw className="w-4 h-4 animate-spin" /> Loading live medicine checks…
      </div>
    );
  }

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl ${
        embedded ? '' : 'mx-auto max-w-7xl'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
      <div className="relative px-5 py-5 md:px-8 md:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
              <Activity className={`w-4 h-4 ${pulse ? 'text-emerald-400' : ''}`} />
              Live dataset
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight mt-1">{data.headline}</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">{data.subline}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium border border-white/10">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              Pending review: <strong>{data.stats?.pendingReview ?? 0}</strong>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium border border-emerald-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Verified: <strong>{data.stats?.verifiedPipeline ?? 0}</strong>
            </span>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
          {(data.items || []).map((item) => (
            <article
              key={item._id}
              className="snap-start shrink-0 w-[220px] md:w-[260px] rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-3 flex flex-col gap-2"
            >
              <div className="flex gap-3">
                <div className="h-14 w-14 rounded-xl bg-slate-800/80 border border-white/10 overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <img src={resolveMediaUrl(item.imageUrl)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[10px] text-slate-500 px-1 text-center leading-tight">
                      No photo
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-snug line-clamp-2">{item.name}</p>
                  {item.medicineId && (
                    <p className="text-[11px] text-indigo-200 font-mono truncate mt-0.5">{item.medicineId}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${
                    item.status === 'expired'
                      ? 'bg-red-500/25 text-red-200'
                      : item.status === 'near-expiry'
                        ? 'bg-amber-500/25 text-amber-100'
                        : 'bg-emerald-500/20 text-emerald-100'
                  }`}
                >
                  {String(item.status || '').replace(/-/g, ' ')}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${
                    item.reviewStatus === 'pending' ? 'bg-violet-500/30 text-violet-100 animate-pulse' : 'bg-white/10 text-slate-200'
                  }`}
                >
                  {item.reviewStatus === 'pending' ? 'Evaluating' : 'Verified'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Expiry {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '—'}
              </p>
            </article>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1">
          <RefreshCw className="w-3 h-3 opacity-70" /> Refreshes every 12s · Demo medicines only
        </p>
      </div>
    </section>
  );
}
