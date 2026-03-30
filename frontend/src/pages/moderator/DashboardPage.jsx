import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import StatsGrid from "../../components/moderation/StatsGrid";
import { getStatsApi } from "../../api/moderation.api";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStatsApi()
      .then(({ data }) => setStats(data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-surface font-body">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-16">
        <div className="pt-4 mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display font-700 text-xl text-white">Moderator dashboard</h1>
            <p className="text-xs text-gray-600 mt-0.5">Overview of all posts and ML processing</p>
          </div>
          <Link
            to="/mod/flagged"
            className="bg-brand-400 hover:bg-brand-600 text-white text-xs font-display font-500 px-4 py-2 rounded-xl transition-all active:scale-95"
          >
            Review flagged
          </Link>
        </div>

        <StatsGrid stats={stats} loading={loading} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-surface-2 border border-border rounded-2xl p-5">
            <h2 className="font-display font-600 text-sm text-white mb-4">Quick actions</h2>
            <div className="space-y-2">
              <Link to="/mod/flagged"
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-border-2 hover:bg-surface-3 transition-all group">
                <div>
                  <div className="text-sm font-display text-white group-hover:text-brand-400 transition-colors">Review flagged posts</div>
                  <div className="text-xs text-gray-600 mt-0.5">Approve or reject AI-flagged content</div>
                </div>
                <span className="text-gray-700 group-hover:text-brand-400 transition-colors text-xs">→</span>
              </Link>
              <Link to="/mod/flagged?filter=pending"
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-border-2 hover:bg-surface-3 transition-all group">
                <div>
                  <div className="text-sm font-display text-white group-hover:text-brand-400 transition-colors">View pending queue</div>
                  <div className="text-xs text-gray-600 mt-0.5">Posts still being processed by ML worker</div>
                </div>
                <span className="text-gray-700 group-hover:text-brand-400 transition-colors text-xs">→</span>
              </Link>
            </div>
          </div>

          <div className="bg-surface-2 border border-border rounded-2xl p-5">
            <h2 className="font-display font-600 text-sm text-white mb-4">ML pipeline</h2>
            <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
              {[
                { label: "Text toxicity", model: "Detoxify → Gemini" },
                { label: "Image NSFW", model: "NudeNet → Gemini Vision" },
                { label: "Misinformation", model: "Gemini fact-check" },
                { label: "Queue", model: "BullMQ + Redis" },
              ].map(({ label, model }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-700 font-display">{model}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}