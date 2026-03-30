export default function Spinner({ size = "md" }) {
  const s = size === "sm" ? "w-4 h-4 border-2" : "w-8 h-8 border-2";
  return (
    <div className={`${s} rounded-full border-brand-400 border-t-transparent animate-spin`} />
  );
}