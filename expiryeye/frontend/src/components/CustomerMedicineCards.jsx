import { Pencil, Trash2, Calendar, Hash, ImageIcon } from 'lucide-react';
import { resolveMediaUrl } from '../utils/mediaUrl';

const statusStyle = {
  safe: 'bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-500/30',
  'near-expiry': 'bg-amber-500/20 text-amber-900 ring-1 ring-amber-500/40',
  expired: 'bg-red-500/15 text-red-800 ring-1 ring-red-500/35',
};

export default function CustomerMedicineCards({ products, onEdit, onDelete, hasActiveFilters }) {
  if (!products.length) {
    const msg = hasActiveFilters
      ? 'Nothing matches your search. Try another name or ID.'
      : 'No medicines yet. Add a photo or pack ID — we will track the expiry for you.';
    return <p className="text-center text-slate-500 py-16 text-sm font-medium max-w-md mx-auto">{msg}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {products.map((p) => (
        <div
          key={p._id}
          className="group relative rounded-3xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:border-indigo-200/80 transition-all duration-300"
        >
          <div className="aspect-[16/9] bg-gradient-to-br from-slate-100 to-indigo-50 relative">
            {p.imageUrl ? (
              <img src={resolveMediaUrl(p.imageUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                <ImageIcon className="w-10 h-10 opacity-40" />
                <span className="text-xs font-medium">No photo on file</span>
              </div>
            )}
            <div className="absolute top-3 right-3 flex gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(p)}
                className="rounded-full bg-white/95 p-2 text-indigo-600 shadow-md hover:bg-indigo-50"
                aria-label="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(p._id)}
                className="rounded-full bg-white/95 p-2 text-red-600 shadow-md hover:bg-red-50"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <span className={`absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-bold ${statusStyle[p.status]}`}>
              {String(p.status || '').replace(/-/g, ' ').toUpperCase()}
            </span>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-slate-900 text-lg leading-snug">{p.name}</h3>
            {p.medicineId && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <Hash className="w-3.5 h-3.5 shrink-0" />
                {p.medicineId}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                {new Date(p.expiryDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </span>
              <span className="text-slate-400">·</span>
              <span>Qty <strong className="text-slate-800">{p.quantity}</strong></span>
            </div>
            {p.reviewStatus === 'pending' && (
              <p className="mt-3 text-xs font-medium text-violet-700 bg-violet-50 rounded-xl px-3 py-2 border border-violet-100">
                Your entry is in the verification queue — expiry tracking is already active.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
