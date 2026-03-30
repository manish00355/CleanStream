import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerApi } from "../api/auth.api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await registerApi({ ...form, role });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
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
          <div className="text-brand-400 text-xs font-display font-600 tracking-widest uppercase mb-4">Join CleanStream</div>
          <h2 className="font-display font-700 text-3xl text-white leading-tight mb-6">
            Post freely. <br />
            We handle the rest.
          </h2>
          <div className="space-y-4">
            {[
              { icon: "✍️", text: "Post text and images" },
              { icon: "🤖", text: "AI reviews your post in seconds" },
              { icon: "✅", text: "Clean posts appear in the public feed" },
              { icon: "🛡️", text: "Moderators handle edge cases" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-3 border border-border flex items-center justify-center flex-shrink-0" style={{ fontSize: "14px" }}>
                  {item.icon}
                </div>
                <span className="text-gray-500 text-sm">{item.text}</span>
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

          <h1 className="font-display font-700 text-2xl text-white mb-1">Create account</h1>
          <p className="text-gray-500 text-sm mb-6">
            Already have one?{" "}
            <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
          </p>

          {/* Role toggle */}
          <div className="flex gap-1 p-1 bg-surface-3 rounded-xl border border-border mb-6">
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

          {role === "moderator" && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-brand-400/10 border border-brand-400/20 mb-4">
              <span style={{ fontSize: "14px" }}>🛡️</span>
              <p className="text-xs text-brand-400 leading-relaxed">
                Registering as moderator — you'll have access to the review dashboard after login.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 font-display mb-1.5">Username</label>
              <input
                type="text"
                required
                placeholder="sumit_dev"
                minLength={3}
                maxLength={30}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input-field"
              />
              <p className="text-xs text-gray-700 mt-1">3–30 characters, letters/numbers/underscores only</p>
            </div>

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
                placeholder="min 6 characters"
                minLength={6}
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
              {loading ? "Creating account..." : `Create ${role} account`}
            </button>
          </form>

          <p className="text-xs text-gray-700 text-center mt-6">
            All posts are subject to AI moderation regardless of role.
          </p>
        </div>
      </div>
    </div>
  );
}