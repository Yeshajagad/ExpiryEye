import { Pencil, Trash2 } from 'lucide-react';
import { resolveMediaUrl } from '../utils/mediaUrl';

const statusStyle = {
  safe: 'bg-green-100 text-green-800',
  'near-expiry': 'bg-amber-100 text-amber-900',
  expired: 'bg-red-100 text-red-800',
};

const reviewStyle = {
  pending: 'bg-violet-100 text-violet-800',
  verified: 'bg-slate-100 text-slate-600',
};

export default function ProductTable({ products, onEdit, onDelete, hasActiveFilters }) {
  if (!products.length) {
    const msg = hasActiveFilters
      ? 'No rows match your filters.'
      : 'Inventory is empty. Add medicines with photo or pack ID to populate shelves.';
    return <p className="text-center text-slate-500 py-14 text-sm font-medium">{msg}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/40">
      <table className="w-full text-sm min-w-[860px]">
        <thead className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <tr>
            {[
              ['thumb', ''],
              ['name', 'Name'],
              ['id', 'Pack ID'],
              ['batch', 'Batch'],
              ['cat', 'Category'],
              ['exp', 'Expiry'],
              ['qty', 'Qty'],
              ['shelf', 'Shelf'],
              ['rev', 'Review'],
              ['act', ''],
            ].map(([k, h]) => (
              <th key={k} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-indigo-100">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr key={p._id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
              <td className="px-3 py-2 w-14">
                <div className="h-11 w-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                  {p.imageUrl ? (
                    <img src={resolveMediaUrl(p.imageUrl)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[9px] text-slate-400 text-center leading-tight px-0.5">
                      —
                    </div>
                  )}
                </div>
              </td>
              <td className="px-3 py-2 font-semibold text-slate-900 max-w-[160px]">{p.name}</td>
              <td className="px-3 py-2 font-mono text-xs text-slate-600">{p.medicineId || '—'}</td>
              <td className="px-3 py-2 text-slate-500">{p.batchNumber || '—'}</td>
              <td className="px-3 py-2 text-slate-600">{p.category}</td>
              <td className="px-3 py-2 whitespace-nowrap">{new Date(p.expiryDate).toLocaleDateString()}</td>
              <td className="px-3 py-2">{p.quantity}</td>
              <td className="px-3 py-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle[p.status]}`}>
                  {String(p.status || '').replace(/-/g, ' ')}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${reviewStyle[p.reviewStatus] || reviewStyle.verified}`}>
                  {p.reviewStatus === 'pending' ? 'Queue' : 'OK'}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <button type="button" onClick={() => onEdit(p)} className="text-indigo-600 hover:text-indigo-800 p-1.5" aria-label="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => onDelete(p._id)} className="text-red-500 hover:text-red-700 p-1.5" aria-label="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
