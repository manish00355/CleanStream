import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import { createPostApi } from "../../api/posts.api";

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !image) {
      setError("Add some text or an image.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append("text", text.trim());
      if (image) fd.append("image", image);
      await createPostApi(fd);
      setSuccess(true);
      setTimeout(() => navigate("/my-posts"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit post.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface font-body">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-400/10 border border-brand-400/30 flex items-center justify-center">
            <span style={{ fontSize: "20px" }}>✓</span>
          </div>
          <h2 className="font-display font-700 text-white text-lg">Post submitted!</h2>
          <p className="text-gray-500 text-sm">AI is reviewing your post. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 pt-20 pb-16">
        <div className="pt-6 mb-6">
          <h1 className="font-display font-700 text-xl text-white">Create post</h1>
          <p className="text-xs text-gray-600 mt-0.5">Submitted posts are reviewed by AI before appearing in the feed</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-surface-2 border border-border rounded-2xl p-5">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={2000}
              rows={5}
              className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-700 outline-none resize-none font-body leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-gray-700">{text.length} / 2000</span>
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-400 font-display transition-colors"
              >
                <span style={{ fontSize: "14px" }}>🖼</span> Add image
              </button>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImage}
          />

          {preview && (
            <div className="relative rounded-2xl overflow-hidden border border-border">
              <img src={preview} alt="preview" className="w-full max-h-64 object-cover" />
              <button
                type="button"
                onClick={() => { setImage(null); setPreview(null); }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-surface/80 text-gray-400 hover:text-white text-xs flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-950/40 border border-red-900/40 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              AI moderation runs async — you'll get 202 instantly
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-400 hover:bg-brand-600 disabled:opacity-50 text-white font-display font-600 px-6 py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-95"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>

        <div className="mt-6 bg-surface-2 border border-border rounded-2xl p-4">
          <p className="text-xs font-display font-500 text-gray-500 mb-2">What happens next</p>
          <div className="space-y-1.5 text-xs text-gray-700 leading-relaxed">
            <div>1. Post saved as <span className="text-amber-500">pending</span></div>
            <div>2. ML worker checks text + image via AI models</div>
            <div>3. Clean posts → <span className="text-green-500">approved</span> and appear in feed</div>
            <div>4. Flagged posts → moderator review</div>
          </div>
        </div>
      </div>
    </div>
  );
}