import { useState, useEffect, useRef } from 'react';
import { X, Camera, Hash, Loader2 } from 'lucide-react';
import { uploadMedicinePhoto } from '../services/api';
import { resolveMediaUrl } from '../utils/mediaUrl';

const emptyForm = {
  name: '',
  batchNumber: '',
  category: 'Medicine',
  expiryDate: '',
  quantity: '',
  medicineId: '',
  imageUrl: '',
};

function toFormState(initial) {
  if (!initial) return { ...emptyForm };
  const d = initial.expiryDate ? new Date(initial.expiryDate) : null;
  return {
    name: initial.name ?? '',
    batchNumber: initial.batchNumber ?? '',
    category: initial.category || 'Medicine',
    expiryDate: d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '',
    quantity: initial.quantity ?? '',
    medicineId: initial.medicineId ?? '',
    imageUrl: initial.imageUrl ?? '',
  };
}

export default function ProductModal({ onClose, onSubmit, initial }) {
  const [form, setForm] = useState(() => toFormState(initial));
  const [tab, setTab] = useState('details');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    setForm(toFormState(initial));
    setPhotoFile(null);
    setPhotoPreview(null);
    setTab('details');
    setLocalError('');
  }, [initial]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const displayImage = photoPreview || (form.imageUrl ? resolveMediaUrl(form.imageUrl) : null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    const trimmedName = form.name.trim();
    const trimmedId = form.medicineId.trim();
    if (!trimmedName && !trimmedId) {
      setLocalError('Add a medicine name or a pack / barcode ID.');
      return;
    }
    if (!form.expiryDate || form.quantity === '' || Number(form.quantity) < 0) {
      setLocalError('Expiry date and quantity are required.');
      return;
    }

    setBusy(true);
    try {
      let imageUrl = form.imageUrl || undefined;
      if (photoFile) {
        const { data } = await uploadMedicinePhoto(photoFile);
        imageUrl = data.url;
      }
      let entryMethod = 'manual';
      if (photoFile || imageUrl) entryMethod = 'photo';
      else if (trimmedId) entryMethod = 'medicine_id';

      await onSubmit({
        name: trimmedName || trimmedId,
        batchNumber: form.batchNumber?.trim() || undefined,
        category: form.category,
        expiryDate: form.expiryDate,
        quantity: Number(form.quantity),
        medicineId: trimmedId || undefined,
        imageUrl,
        entryMethod,
      });
    } catch (err) {
      setLocalError(err.response?.data?.message || err.message || 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-slate-200/80">
        <div className="sticky top-0 z-10 flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur rounded-t-3xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{initial ? 'Edit medicine' : 'Add to your tracker'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Photo or pack ID — expiry is always saved.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 flex gap-2 p-1 bg-slate-100 rounded-2xl mx-6 mt-2">
          {[
            ['details', 'Details'],
            ['photo', 'Photo'],
            ['id', 'Pack ID'],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                tab === k ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {tab === 'photo' && (
            <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-6 text-center">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setPhotoFile(f || null);
                }}
              />
              <div className="mx-auto mb-3 h-36 w-full max-w-[200px] rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
                {displayImage ? (
                  <img src={displayImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="w-10 h-10 text-slate-300" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-sm font-semibold text-indigo-700 hover:underline"
              >
                {photoFile || form.imageUrl ? 'Change photo' : 'Upload pack photo'}
              </button>
              <p className="text-xs text-slate-500 mt-2">Clear photo of the strip, bottle, or invoice line — helps your records.</p>
            </div>
          )}

          {tab === 'id' && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" /> Medicine / barcode / batch ID
              </label>
              <input
                type="text"
                className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-3 font-mono text-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-white"
                placeholder="e.g. RX-AMX-500-8821"
                value={form.medicineId}
                onChange={(e) => setForm({ ...form, medicineId: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-2">You can still add a display name under Details if you like.</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-600">Display name (optional if ID set)</label>
            <input
              type="text"
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              placeholder="e.g. Paracetamol 650mg"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Quantity</label>
              <input
                type="number"
                required
                min={0}
                step={1}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Expiry</label>
              <input
                type="date"
                required
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Category</label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-white"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {['Medicine', 'Food', 'Cosmetic', 'Chemical', 'General'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Batch (optional)</label>
            <input
              type="text"
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              value={form.batchNumber}
              onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
            />
          </div>

          {localError && <p className="text-sm text-red-600 font-medium">{localError}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/25 transition"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : initial ? (
              'Save changes'
            ) : (
              'Save to my medicines'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
