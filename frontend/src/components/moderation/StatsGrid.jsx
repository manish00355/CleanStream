import Spinner from "../ui/Spinner";

const cards = [
  { key: "total",    label: "Total posts",     color: "text-white" },
  { key: "approved", label: "Approved",         color: "text-green-400" },
  { key: "flagged",  label: "Flagged",          color: "text-red-400" },
  { key: "pending",  label: "Pending",          color: "text-amber-400" },
  { key: "rejected", label: "Rejected",         color: "text-gray-500" },
  { key: "avg_processing_ms", label: "Avg processing", color: "text-brand-400", suffix: "ms" },
];

export default function StatsGrid({ stats, loading }) {
  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      {cards.map(({ key, label, color, suffix }) => (
        <div key={key} className="bg-surface-2 border border-border rounded-xl p-4">
          <div className="text-xs text-gray-600 font-display mb-1">{label}</div>
          <div className={`text-2xl font-display font-700 ${color}`}>
            {stats?.[key] ?? "—"}{suffix || ""}
          </div>
        </div>
      ))}
    </div>
  );
}