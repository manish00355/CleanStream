import { useState } from "react";
import Badge from "../ui/Badge";
import { deletePostApi } from "../../api/posts.api";
import useAuthStore from "../../store/authStore";

function ImageModal({ url, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <img
          src={url}
          alt="full"
          className="max-w-full max-h-[85vh] object-contain rounded-xl border border-border"
        />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/80 border border-border text-gray-400 hover:text-white text-sm flex items-center justify-center transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function PostCard({ post, onDelete, showStatus = false }) {
  const { user } = useAuthStore();
  const [deleting, setDeleting] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);

  const isOwner = user?.id === post?.user_id?._id || user?.id === post?.user_id;

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await deletePostApi(post._id);
      onDelete?.(post._id);
    } catch (_) {
      alert("Could not delete post.");
    } finally {
      setDeleting(false);
    }
  };

  const username =
    typeof post.user_id === "object" ? post.user_id?.username : user?.username;
  const initial = username?.[0]?.toUpperCase() || "?";
  const timeAgo = new Date(post.created_at).toLocaleDateString();

  // show misinfo warning if post is approved but had misinformation flagged
  const hadMisinfo = post.flag_reasons?.includes("misinformation");

  return (
    <>
      {imgOpen && <ImageModal url={post.image_url} onClose={() => setImgOpen(false)} />}

      <div className="bg-surface-2 border border-border rounded-2xl p-5 hover:border-border-2 transition-colors duration-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-3 border border-border flex items-center justify-center text-xs font-display font-600 text-brand-400 flex-shrink-0">
              {initial}
            </div>
            <div>
              <div className="text-sm font-display font-500 text-white">{username}</div>
              <div className="text-xs text-gray-600">{timeAgo}</div>
            </div>
          </div>
          {showStatus && <Badge label={post.status} />}
        </div>

        {/* Misinformation warning banner */}
        {hadMisinfo && post.status === "approved" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-950/40 border border-yellow-900/30 mb-3">
            <span style={{ fontSize: "13px" }}>⚠️</span>
            <p className="text-xs text-yellow-500 font-display">
              Misinformation detected — approved by moderator but may contain false information.
            </p>
          </div>
        )}

        {post.text && (
          <p className="text-sm text-gray-300 leading-relaxed mb-3">{post.text}</p>
        )}

        {post.image_url && (
          <div
            className="rounded-xl overflow-hidden mb-3 border border-border cursor-zoom-in hover:border-border-2 transition-colors"
            onClick={() => setImgOpen(true)}
          >
            <img
              src={post.image_url}
              alt="post"
              className="w-full max-h-72 object-cover"
            />
          </div>
        )}

        {post.flag_reasons?.length > 0 && showStatus && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.flag_reasons.map((r) => (
              <Badge key={r} label={r} />
            ))}
          </div>
        )}

        {isOwner && showStatus && (
          <div className="flex justify-end mt-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-gray-600 hover:text-red-400 font-display transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}