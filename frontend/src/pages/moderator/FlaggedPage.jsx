import { useEffect, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import { getFlaggedApi, approvePostApi, rejectPostApi, getMLResultApi } from "../../api/moderation.api";

const TABS = [
  { key: "flagged", label: "Flagged" },
  { key: "pending", label: "Pending" },
  { key: "rejected", label: "Rejected" },
];

const REASON_FILTERS = ["all", "toxic_text", "nsfw_image", "misinformation", "manual_review"];

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

export default function FlaggedPage() {
  const [tab, setTab] = useState("flagged");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [mlResult, setMlResult] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [imgModal, setImgModal] = useState(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // pass tab as status filter, reason as flag reason filter
      const { data } = await getFlaggedApi(page, reason === "all" ? "" : reason, tab);
      setPosts(data.posts);
      setTotalPages(data.totalPages || 1);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, [page, reason, tab]);

  const handleExpand = async (post) => {
    if (expanded === post._id) { setExpanded(null); setMlResult(null); return; }
    setExpanded(post._id);
    setMlResult(null);
    setMlLoading(true);
    try {
      const { data } = await getMLResultApi(post._id);
      setMlResult(data.result);
    } catch (_) { setMlResult(null); }
    finally { setMlLoading(false); }
  };

  const handleAction = async (postId, action) => {
    setActionLoading((prev) => ({ ...prev, [postId]: action }));
    try {
      if (action === "approve") await approvePostApi(postId);
      else await rejectPostApi(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      if (expanded === postId) setExpanded(null);
    } catch (_) {}
    finally { setActionLoading((prev) => ({ ...prev, [postId]: null })); }
  };

  return (
    <div className="min-h-screen bg-surface font-body">
      {imgModal && <ImageModal url={imgModal} onClose={() => setImgModal(null)} />}
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-16">
        <div className="pt-4 mb-6">
          <h1 className="font-display font-700 text-xl text-white">Review queue</h1>
          <p className="text-xs text-gray-600 mt-0.5">Manage all flagged, pending, and rejected content</p>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 p-1 bg-surface-2 border border-border rounded-xl mb-4 w-fit">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setPage(1); setReason("all"); }}
              className={`px-4 py-2 rounded-lg text-xs font-display font-500 transition-all duration-150 ${
                tab === t.key ? "bg-brand-400 text-white" : "text-gray-600 hover:text-gray-300"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Reason filter — only for flagged tab */}
        {tab === "flagged" && (
          <div className="flex gap-1 flex-wrap mb-6">
            {REASON_FILTERS.map((r) => (
              <button key={r} onClick={() => { setReason(r); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-display transition-all duration-150 border ${
                  reason === r
                    ? "border-brand-400 text-brand-400 bg-brand-400/10"
                    : "border-border text-gray-600 hover:text-gray-400 hover:border-border-2"
                }`}>
                {r.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-sm">No {tab} posts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post._id} className="bg-surface-2 border border-border rounded-2xl overflow-hidden hover:border-border-2 transition-colors">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="w-6 h-6 rounded-full bg-surface-3 border border-border flex items-center justify-center text-xs font-display font-600 text-brand-400 flex-shrink-0">
                          {post.user_id?.username?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs font-display text-gray-400">{post.user_id?.username}</span>
                        <span className="text-xs text-gray-700">·</span>
                        <span className="text-xs text-gray-700">{new Date(post.created_at).toLocaleDateString()}</span>
                        <Badge label={post.status} />
                      </div>

                      {post.text && (
                        <p className="text-sm text-gray-300 leading-relaxed mb-3 line-clamp-3">{post.text}</p>
                      )}

                      {post.image_url && (
                        <div className="mb-3 cursor-zoom-in" onClick={() => setImgModal(post.image_url)}>
                          <img src={post.image_url} alt="" className="h-24 rounded-lg object-cover border border-border hover:border-border-2 transition-colors" />
                        </div>
                      )}

                      {post.flag_reasons?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {post.flag_reasons.map((r) => <Badge key={r} label={r} />)}
                        </div>
                      )}

                      {/* show who moderated if rejected */}
                      {post.status === "rejected" && post.moderated_at && (
                        <p className="text-xs text-gray-700 mt-2">
                          Rejected on {new Date(post.moderated_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {tab !== "rejected" && (
                        <>
                          <button onClick={() => handleAction(post._id, "approve")}
                            disabled={!!actionLoading[post._id]}
                            className="px-3 py-1.5 rounded-lg border border-green-900/40 bg-green-950/30 text-green-400 hover:bg-green-950/60 text-xs font-display transition-all disabled:opacity-50">
                            {actionLoading[post._id] === "approve" ? "..." : "Approve"}
                          </button>
                          <button onClick={() => handleAction(post._id, "reject")}
                            disabled={!!actionLoading[post._id]}
                            className="px-3 py-1.5 rounded-lg border border-red-900/40 bg-red-950/30 text-red-400 hover:bg-red-950/60 text-xs font-display transition-all disabled:opacity-50">
                            {actionLoading[post._id] === "reject" ? "..." : "Reject"}
                          </button>
                        </>
                      )}
                      {tab === "rejected" && (
                        <button onClick={() => handleAction(post._id, "approve")}
                          disabled={!!actionLoading[post._id]}
                          className="px-3 py-1.5 rounded-lg border border-green-900/40 bg-green-950/30 text-green-400 hover:bg-green-950/60 text-xs font-display transition-all disabled:opacity-50 whitespace-nowrap">
                          {actionLoading[post._id] === "approve" ? "..." : "Re-approve"}
                        </button>
                      )}
                      <button onClick={() => handleExpand(post)}
                        className="px-3 py-1.5 rounded-lg border border-border text-gray-600 hover:text-gray-400 hover:border-border-2 text-xs font-display transition-all">
                        {expanded === post._id ? "Hide" : "ML scores"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ML Result panel */}
                {expanded === post._id && (
                  <div className="border-t border-border bg-surface-3 p-5">
                    {mlLoading ? (
                      <div className="flex justify-center py-4"><Spinner size="sm" /></div>
                    ) : !mlResult ? (
                      <p className="text-xs text-gray-600">ML result not available yet.</p>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-500 font-display">Final verdict:</span>
                          <Badge label={mlResult.final_verdict} />
                          <span className="text-xs text-gray-700 ml-2">· {mlResult.processing_ms}ms</span>
                        </div>

                        {mlResult.text_result?.detoxify && (
                          <div>
                            <p className="text-xs font-display text-gray-500 mb-2">Text analysis</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {Object.entries(mlResult.text_result.detoxify)
                                .filter(([, v]) => typeof v === "number")
                                .map(([k, v]) => (
                                  <div key={k} className="bg-surface-2 rounded-lg p-2.5">
                                    <div className="text-xs text-gray-600 mb-1">{k.replace(/_/g, " ")}</div>
                                    <div className="h-1.5 bg-surface-4 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{
                                        width: `${Math.round(v * 100)}%`,
                                        background: v > 0.7 ? "#E24B4A" : v > 0.4 ? "#EF9F27" : "#1D9E75",
                                      }} />
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">{(v * 100).toFixed(0)}%</div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {mlResult.image_result && (
                          <div>
                            <p className="text-xs font-display text-gray-500 mb-2">Image analysis</p>
                            <div className="bg-surface-2 rounded-lg p-3 text-xs text-gray-500">
                              NSFW score: <span className="text-white">{((mlResult.image_result?.nudenet?.nsfw_score || 0) * 100).toFixed(0)}%</span>
                              {" · "}
                              Verdict: <span className="text-white">{mlResult.image_result?.nudenet?.is_nsfw ? "NSFW" : "Safe"}</span>
                            </div>
                          </div>
                        )}

                        {mlResult.misinfo_result && (
                          <div>
                            <p className="text-xs font-display text-gray-500 mb-2">Misinformation check</p>
                            <div className="bg-surface-2 rounded-lg p-3 text-xs text-gray-500">
                              Detected: <span className={mlResult.misinfo_result.detected ? "text-red-400" : "text-green-400"}>
                                {mlResult.misinfo_result.detected ? "Yes" : "No"}
                              </span>
                              {" · "}
                              Confidence: <span className="text-white">{((mlResult.misinfo_result.confidence || 0) * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-lg border border-border text-xs text-gray-500 hover:border-border-2 disabled:opacity-30 font-display transition-colors">
              Previous
            </button>
            <span className="text-xs text-gray-600 font-display">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg border border-border text-xs text-gray-500 hover:border-border-2 disabled:opacity-30 font-display transition-colors">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}