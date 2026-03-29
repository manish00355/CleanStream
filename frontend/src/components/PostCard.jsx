import { useContext } from "react";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const PostCard = ({ post, isAdmin }) => {
  const { posts, setPosts } = useContext(AppContext);

  const getStatusColor = () => {
    if (post.status === "approved") return "bg-green-100 text-green-700";
    if (post.status === "rejected") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const updateStatus = (id, status) => {
    const updated = posts.map((p) =>
      p.id === id ? { ...p, status } : p
    );

    toast.info(`Post ${status}`);
    localStorage.setItem("posts", JSON.stringify(updated));
    setPosts(updated);
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-md mb-4 border">
      
      {/* Username */}
      <p className="font-semibold text-gray-700 mb-1">
        {post.user_id?.username || post.username || "Unknown"}
      </p>

      {/* Post Content */}
      <p className="mb-3 text-gray-800">{post.text}</p>

      {/* Image (no crop, consistent UI) */}
      {post.image_url && (
        <div className="w-full h-60 bg-gray-100 flex items-center justify-center rounded-lg mb-3 overflow-hidden">
          <img
            src={post.image_url}
            alt="post"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}

      {/* Status Badge */}
      <div className="mb-3">
        <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor()}`}>
          {post.status || "pending"}
        </span>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="flex gap-2">
          {(!post.status || post.status === "pending") && (
            <>
              <button
                onClick={() => updateStatus(post._id, "approved")}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
              >
                Approve
              </button>

              <button
                onClick={() => updateStatus(post._id, "rejected")}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                Reject
              </button>
            </>
          )}

          {post.status === "approved" && (
            <button
              onClick={() => updateStatus(post._id, "rejected")}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
            >
              Reject
            </button>
          )}

          {post.status === "rejected" && (
            <button
              onClick={() => updateStatus(post._id, "approved")}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
            >
              Approve
            </button>
          )}
        </div>
      )}

      {/* User View */}
      {!isAdmin && post.status !== "approved" && (
        <p className="text-yellow-600 text-sm">Pending Approval</p>
      )}
    </div>
  );
};

export default PostCard;