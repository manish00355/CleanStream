import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  useEffect(() => {
    const els = document.querySelectorAll(".anim-up");
    els.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      setTimeout(() => {
        el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, i * 150);
    });
  }, []);

  return (
    <div className="min-h-screen bg-surface font-body flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-16 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse2" />
          <span className="font-display font-700 text-white text-lg tracking-tight">CleanStream</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2 font-display">
            Sign in
          </Link>
          <Link to="/register" className="text-sm bg-brand-400 hover:bg-brand-600 text-white px-4 py-2 rounded-xl font-display font-500 transition-all duration-200 active:scale-95">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero — centered, takes full remaining height */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        {/* subtle grid bg */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(#1D9E75 1px, transparent 1px), linear-gradient(90deg, #1D9E75 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
        {/* glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-brand-400/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-2xl mx-auto">
          <div className="anim-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-400/30 bg-brand-400/10 text-brand-100 text-xs font-display mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 inline-block" />
            BERLIN · HBTU Campus Drive · Ampcus Cyber
          </div>

          <h1 className="anim-up font-display font-800 text-5xl md:text-6xl text-white leading-[1.05] tracking-tight mb-6">
            AI-powered<br />
            <span className="text-brand-400">content moderation</span>
          </h1>

          <p className="anim-up text-gray-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10">
            CleanStream automatically detects toxic text, NSFW images, and misinformation — keeping your feed clean before content ever goes public.
          </p>

          {/* Features — 3 pills */}
          <div className="anim-up flex flex-wrap items-center justify-center gap-2 mb-10">
            {[
              { icon: "🧠", label: "Toxicity detection" },
              { icon: "🖼️", label: "NSFW image filter" },
              { icon: "📰", label: "Misinformation check" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface-2 text-xs text-gray-400 font-display">
                <span style={{ fontSize: "13px" }}>{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>

          <div className="anim-up flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register"
              className="w-full sm:w-auto text-center bg-brand-400 hover:bg-brand-600 text-white font-display font-600 px-8 py-3.5 rounded-xl transition-all duration-200 active:scale-95 text-sm">
              Get started
            </Link>
            <Link to="/login"
              className="w-full sm:w-auto text-center border border-border-2 hover:border-brand-400 text-gray-400 hover:text-brand-400 font-display px-8 py-3.5 rounded-xl transition-all duration-200 text-sm">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-5 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
          <span className="font-display text-sm text-gray-600">CleanStream</span>
        </div>
        <span className="text-gray-700 text-xs">HBTU Campus Drive · Ampcus Cyber</span>
      </footer>
    </div>
  );
}