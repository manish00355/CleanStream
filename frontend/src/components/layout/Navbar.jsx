import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { logoutApi } from "../../api/auth.api";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isMod = user?.role === "moderator";

  const userLinks = [
    { to: "/feed", label: "Feed" },
    { to: "/create", label: "Post" },
    { to: "/my-posts", label: "My Posts" },
  ];

  const modLinks = [
    { to: "/mod/dashboard", label: "Dashboard" },
    { to: "/mod/flagged", label: "Flagged" },
  ];

  const links = isMod ? modLinks : userLinks;

  const handleLogout = async () => {
    try { await logoutApi(); } catch (_) {}
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 md:px-10 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <Link to={isMod ? "/mod/dashboard" : "/feed"} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-400" />
          <span className="font-display font-700 text-white text-base tracking-tight">CleanStream</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-display transition-colors duration-150 ${
                location.pathname === l.to
                  ? "bg-surface-3 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isMod && (
          <span className="hidden md:inline-block text-xs px-2 py-1 rounded-md bg-brand-400/10 border border-brand-400/20 text-brand-400 font-display">
            moderator
          </span>
        )}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-surface-3 border border-border flex items-center justify-center text-xs font-display font-600 text-brand-400">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <span className="hidden md:inline text-xs text-gray-500 font-display">{user?.username}</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-600 hover:text-gray-400 font-display transition-colors px-2 py-1"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}