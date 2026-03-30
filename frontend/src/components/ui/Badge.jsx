const variants = {
  pending:  "bg-amber-950/50 text-amber-400 border-amber-900/40",
  approved: "bg-green-950/50 text-green-400 border-green-900/40",
  flagged:  "bg-red-950/50 text-red-400 border-red-900/40",
  rejected: "bg-surface-4 text-gray-500 border-border",
  toxic_text:    "bg-red-950/40 text-red-400 border-red-900/30",
  nsfw_image:    "bg-orange-950/40 text-orange-400 border-orange-900/30",
  misinformation:"bg-yellow-950/40 text-yellow-500 border-yellow-900/30",
  manual_review: "bg-surface-4 text-gray-400 border-border",
};

export default function Badge({ label }) {
  const cls = variants[label] || "bg-surface-4 text-gray-400 border-border";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md border text-xs font-display font-500 ${cls}`}>
      {label?.replace(/_/g, " ")}
    </span>
  );
}