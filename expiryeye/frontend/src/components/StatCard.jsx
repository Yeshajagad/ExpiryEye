export default function StatCard({ title, value, color, icon }) {
  const Icon = icon;
  const colors = {
    blue: 'from-blue-500 to-blue-700',
    green: 'from-green-500 to-green-700',
    yellow: 'from-yellow-400 to-yellow-600',
    red: 'from-red-500 to-red-700',
    violet: 'from-violet-500 to-purple-700',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-2xl p-5 shadow-lg flex items-center gap-4`}>
      <div className="bg-white/20 rounded-full p-3">
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-sm opacity-80">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}