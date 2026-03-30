import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import { getMLResultApi, approvePostApi, rejectPostApi } from "../../api/moderation.api";
import { getPostApi } from "../../api/posts.api";

function ImageModal({ url, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <img src={url} alt="full" className="max-w-full max-h-[85vh] object-contain rounded-xl border border-border" />
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/80 border border-border text-gray-400 hover:text-white text-sm flex items-center justify-center">✕</button>
      </div>
    </div>
  );
}

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [mlResult, setMlResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [imgModal, setImgModal] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [postRes, mlRes] = await Promise.allSettled([
          getPostApi(id),
          getMLResultApi(id),
        ]);
        if (postRes.status === "fulfilled") setPost(postRes.value.data.post);
        if (mlRes.status === "fulfilled") setMlResult(mlRes.value.data.result);
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      if (action === "approve") await approvePostApi(id);
      else await rejectPostApi(id);
      navigate("/mod/flagged");
    } catch (_) {}
    finally { setActionLoading(null); }
  };

  if (loading) return (
    <div className="min-h-screen bg-surface font-body">
      <Navbar />
      <div className="flex justify-center pt-40"><Spinner /></div>
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-surface font-body">
      <Navbar />
      <div className="text-center pt-40 text-gray-600 text-sm">Post not found.</div>
    </div>
  );

  const username = typeof post.user_id === "object" ? post.user_id?.username : "—";

  return (
    <div className="min-h-screen bg-surface font-body">
      {imgModal && <ImageModal url={post.image_url} onClose={() => setImgModal(false)} />}
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-20 pb-16">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 font-display mt-4 mb-6 transition-colors">
          ← Back
        </button>

        {/* Post card */}
        <div className="bg-surface-2 border border-border rounded-2xl p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-surface-3 border border-border flex items-center justify-center text-sm font-display font-600 text-brand-400">
                {username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-display font-500 text-white">{username}</div>
                <div className="text-xs text-gray-600">{new Date(post.created_at).toLocaleString()}</div>
              </div>
            </div>
            <Badge label={post.status} />
          </div>

          {post.text && (
            <p className="text-sm text-gray-300 leading-relaxed mb-4">{post.text}</p>
          )}

          {post.image_url && (
            <div className="rounded-xl overflow-hidden border border-border cursor-zoom-in hover:border-border-2 transition-colors mb-4" onClick={() => setImgModal(true)}>
              <img src={post.image_url} alt="post" className="w-full max-h-80 object-cover" />
            </div>
          )}

          {post.flag_reasons?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.flag_reasons.map((r) => <Badge key={r} label={r} />)}
            </div>
          )}

          {/* Actions */}
          {(post.status === "flagged" || post.status === "pending") && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <button onClick={() => handleAction("approve")} disabled={!!actionLoading}
                className="flex-1 py-2.5 rounded-xl border border-green-900/40 bg-green-950/30 text-green-400 hover:bg-green-950/60 text-sm font-display transition-all disabled:opacity-50">
                {actionLoading === "approve" ? "Approving..." : "Approve"}
              </button>
              <button onClick={() => handleAction("reject")} disabled={!!actionLoading}
                className="flex-1 py-2.5 rounded-xl border border-red-900/40 bg-red-950/30 text-red-400 hover:bg-red-950/60 text-sm font-display transition-all disabled:opacity-50">
                {actionLoading === "reject" ? "Rejecting..." : "Reject"}
              </button>
            </div>
          )}

          {post.status === "rejected" && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <button onClick={() => handleAction("approve")} disabled={!!actionLoading}
                className="flex-1 py-2.5 rounded-xl border border-green-900/40 bg-green-950/30 text-green-400 hover:bg-green-950/60 text-sm font-display transition-all disabled:opacity-50">
                {actionLoading === "approve" ? "Approving..." : "Re-approve"}
              </button>
            </div>
          )}
        </div>

        {/* ML Result */}
        <div className="bg-surface-2 border border-border rounded-2xl p-6">
          <h2 className="font-display font-600 text-sm text-white mb-4">ML Analysis</h2>

          {!mlResult ? (
            <p className="text-xs text-gray-600">ML result not available — job may still be processing.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-gray-500 font-display">Verdict:</span>
                <Badge label={mlResult.final_verdict} />
                <span className="text-xs text-gray-700">· {mlResult.processing_ms}ms processing</span>
              </div>

              {mlResult.text_result?.detoxify && (
                <div>
                  <p className="text-xs font-display text-gray-500 mb-3">Text — Detoxify scores</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(mlResult.text_result.detoxify)
                      .filter(([, v]) => typeof v === "number")
                      .map(([k, v]) => (
                        <div key={k} className="bg-surface-3 rounded-xl p-3">
                          <div className="text-xs text-gray-600 mb-2 capitalize">{k.replace(/_/g, " ")}</div>
                          <div className="h-1.5 bg-surface-4 rounded-full overflow-hidden mb-1">
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${Math.round(v * 100)}%`,
                              background: v > 0.7 ? "#E24B4A" : v > 0.4 ? "#EF9F27" : "#1D9E75",
                            }} />
                          </div>
                          <div className="text-xs font-display font-500" style={{
                            color: v > 0.7 ? "#E24B4A" : v > 0.4 ? "#EF9F27" : "#1D9E75"
                          }}>
                            {(v * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                  </div>
                  {mlResult.text_result?.gemini_misinfo && (
                    <div className="mt-3 bg-surface-3 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1 font-display">Gemini misinformation check</p>
                      <div className="text-xs text-gray-400">
                        Detected: <span className={mlResult.text_result.gemini_misinfo.is_misinformation ? "text-red-400" : "text-green-400"}>
                          {mlResult.text_result.gemini_misinfo.is_misinformation ? "Yes" : "No"}
                        </span>
                        {mlResult.text_result.gemini_misinfo.reasoning && (
                          <p className="mt-1 text-gray-600 leading-relaxed">{mlResult.text_result.gemini_misinfo.reasoning}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mlResult.image_result && (
                <div>
                  <p className="text-xs font-display text-gray-500 mb-3">Image — NudeNet + Gemini Vision</p>
                  <div className="bg-surface-3 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">NSFW score</span>
                      <span className="font-display text-white">{((mlResult.image_result?.nudenet?.nsfw_score || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Verdict</span>
                      <span className={mlResult.image_result?.nudenet?.is_nsfw ? "text-red-400" : "text-green-400"}>
                        {mlResult.image_result?.nudenet?.is_nsfw ? "NSFW" : "Safe"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}