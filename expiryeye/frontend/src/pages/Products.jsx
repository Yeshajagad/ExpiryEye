import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../services/api';
import ProductTable from '../components/ProductTable';
import ProductModal from '../components/ProductModal';
import CustomerMedicineCards from '../components/CustomerMedicineCards';
import { Plus, Search, Store, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function effectiveRole(user) {
  if (!user) return 'customer';
  if (user.role === 'user') return 'customer';
  return user.role;
}

export default function Products() {
  const { user } = useAuth();
  const role = effectiveRole(user);
  const isOwner = role === 'store_owner' || role === 'admin';
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await getProducts();
      setProducts(data);
      setFiltered(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    let result = products;
    if (filterStatus !== 'all') result = result.filter(p => p.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          (p.medicineId && p.medicineId.toLowerCase().includes(q)) ||
          (p.batchNumber && p.batchNumber.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }, [search, filterStatus, products]);

  const handleSubmit = async (form) => {
    try {
      if (editing) {
        await updateProduct(editing._id, form);
        toast.success('Medicine updated');
      } else {
        await addProduct(form);
        toast.success('Saved to your tracker');
      }
      setShowModal(false); setEditing(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save');
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      await deleteProduct(id);
      toast.success('Product removed');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete product');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 mb-3 shadow-sm">
            {isOwner ? <Store className="w-3.5 h-3.5 text-indigo-600" /> : <UserCircle className="w-3.5 h-3.5 text-emerald-600" />}
            {isOwner ? 'Store inventory workspace' : 'Personal medicine routine'}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            {isOwner ? 'Pharmacy inventory' : 'My medicines'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-xl">
            {isOwner
              ? 'High-volume shelf tracking. Use pack IDs and photos for faster audits. Customers never see your private stock.'
              : 'Track what you buy from the chemist. Add a quick photo or the ID printed on the pack — expiry alerts keep your family safe.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="inline-flex items-center justify-center gap-2 shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-indigo-500/25 transition"
        >
          <Plus className="w-5 h-5" /> Add medicine
        </button>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-md p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 flex-1 min-w-[200px] bg-slate-50/50">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            className="outline-none text-sm w-full bg-transparent placeholder:text-slate-400"
            placeholder={isOwner ? 'Search name, pack ID, batch…' : 'Search your medicines…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium bg-white min-w-[140px]"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All shelf states</option>
          <option value="safe">In date</option>
          <option value="near-expiry">Expiring soon</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
          <div className="h-10 w-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" aria-hidden />
          <p className="text-sm font-medium">Loading…</p>
        </div>
      ) : isOwner ? (
        <ProductTable
          products={filtered}
          hasActiveFilters={search.trim() !== '' || filterStatus !== 'all'}
          onEdit={(p) => { setEditing(p); setShowModal(true); }}
          onDelete={handleDelete}
        />
      ) : (
        <CustomerMedicineCards
          products={filtered}
          hasActiveFilters={search.trim() !== '' || filterStatus !== 'all'}
          onEdit={(p) => { setEditing(p); setShowModal(true); }}
          onDelete={handleDelete}
        />
      )}

      {showModal && (
        <ProductModal
          key={editing?._id || 'new'}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSubmit={handleSubmit}
          initial={editing}
        />
      )}
    </div>
  );
}