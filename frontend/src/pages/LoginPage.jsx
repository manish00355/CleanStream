import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginApi } from "../api/auth.api";
import useAuthStore from "../store/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [role, setRole] = useState("user");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await loginApi(form);
      setAuth(data.user, data.accessToken);
      if (data.user.role === "moderator") {
        navigate("/mod/dashboard");
      } else {
        navigate("/feed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 border-r border-border bg-surface-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-400" />
          <span className="font-display font-700 text-white text-lg tracking-tight">CleanStream</span>
        </Link>
        <div>
          <div className="text-brand-400 text-xs font-display font-600 tracking-widest uppercase mb-4">AI Content Moderation</div>
          <h2 className="font-display font-700 text-3xl text-white leading-tight mb-6">
            Welcome back to <br /> a cleaner internet.
          </h2>
          <div className="space-y-3">
            {[
              "Multi-layer ML toxicity detection",
              "NSFW image classification",
              "Async queue processing with BullMQ",
              "Human moderator review dashboard",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-gray-500 text-sm">
                <div className="w-1 h-1 rounded-full bg-brand-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-700 text-xs">BERLIN · HBTU Campus Drive · Ampcus Cyber</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-16 py-12">
        <div className="w-full max-w-md mx-auto">
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-2 h-2 rounded-full bg-brand-400" />
            <span className="font-display font-700 text-white text-lg">CleanStream</span>
          </Link>

          <h1 className="font-display font-700 text-2xl text-white mb-1">Sign in</h1>
          <p className="text-gray-500 text-sm mb-8">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand-400 hover:underline">Create one</Link>
          </p>

          {/* Role toggle — just UI hint, actual role comes from server */}
          <div className="flex gap-1 p-1 bg-surface-3 rounded-xl border border-border mb-8">
            {["user", "moderator"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-display font-500 transition-all duration-200 ${
                  role === r ? "bg-brand-400 text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {r === "user" ? "User" : "Moderator"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 font-display mb-1.5">Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 font-display mb-1.5">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-950/40 border border-red-900/40 text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-400 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-600 py-3 rounded-xl transition-all duration-200 active:scale-95 text-sm mt-2"
            >
              {loading ? "Signing in..." : `Sign in as ${role}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}