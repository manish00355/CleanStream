import { useEffect, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import PostCard from "../../components/post/PostCard";
import Spinner from "../../components/ui/Spinner";
import { getMyPostsApi } from "../../api/posts.api.js";
import { Link } from "react-router-dom";

const FILTERS = ["all", "pending", "approved", "flagged", "rejected"];

export default function MyPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await getMyPostsApi(1);
        setPosts(data.posts);
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "all" ? posts.length : posts.filter((p) => p.status === f).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-surface font-body">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-16">
        <div className="flex items-center justify-between pt-4 mb-6">
          <div>
            <h1 className="font-display font-700 text-xl text-white">My Posts</h1>
            <p className="text-xs text-gray-600 mt-0.5">{posts.length} total posts</p>
          </div>
          <Link
            to="/create"
            className="bg-brand-400 hover:bg-brand-600 text-white text-xs font-display font-500 px-4 py-2 rounded-xl transition-all active:scale-95"
          >
            New post
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-surface-2 border border-border rounded-xl mb-6 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-display font-500 transition-all duration-150 ${
                filter === f
                  ? "bg-brand-400 text-white"
                  : "text-gray-600 hover:text-gray-300"
              }`}
            >
              {f} {counts[f] > 0 && <span className="ml-1 opacity-60">{counts[f]}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-700 text-sm">No {filter !== "all" ? filter : ""} posts yet.</p>
            {filter === "all" && (
              <Link to="/create" className="text-brand-400 text-sm hover:underline mt-2 inline-block">
                Create your first post →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                showStatus={true}
                onDelete={(id) => setPosts((prev) => prev.filter((p) => p._id !== id))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}