/** Resolve stored `/uploads/...` paths for display (works with Vite dev proxy). */
export function resolveMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const envApi = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  if (envApi) {
    const base = envApi.replace(/\/api$/, '');
    return `${base}${path}`;
  }
  if (typeof window !== 'undefined') return `${window.location.origin}${path}`;
  return path;
}
