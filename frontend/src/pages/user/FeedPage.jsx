import { useEffect, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import PostCard from "../../components/post/PostCard";
import Spinner from "../../components/ui/Spinner";
import { getFeedApi } from "../../api/posts.api";
import { Link } from "react-router-dom";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFeed = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await getFeedApi(p);
      setPosts(data.posts);
      setTotalPages(data.totalPages || 1);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFeed(page); }, [page]);

  return (
    <div className="min-h-screen bg-surface font-body">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-16">
        <div className="flex items-center justify-between mb-6 pt-4">
          <div>
            <h1 className="font-display font-700 text-xl text-white">Feed</h1>
            <p className="text-xs text-gray-600 mt-0.5">AI-approved posts only</p>
          </div>
          <Link
            to="/create"
            className="bg-brand-400 hover:bg-brand-600 text-white text-xs font-display font-500 px-4 py-2 rounded-xl transition-all duration-200 active:scale-95"
          >
            New post
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-700 text-sm mb-4">No approved posts yet.</div>
            <Link to="/create" className="text-brand-400 text-sm hover:underline">Be the first to post →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} showStatus={false} />
            ))}
          </div>
        )}

        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-lg border border-border text-xs text-gray-500 hover:border-border-2 hover:text-gray-300 disabled:opacity-30 font-display transition-colors">
              Previous
            </button>
            <span className="text-xs text-gray-600 font-display">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg border border-border text-xs text-gray-500 hover:border-border-2 hover:text-gray-300 disabled:opacity-30 font-display transition-colors">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}