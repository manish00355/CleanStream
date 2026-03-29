import { useContext, useEffect } from "react";
import { AppContext } from "../context/AppContext";

const UserFeed = () => {
  const { posts, fetchFeed, page, totalPages } = useContext(AppContext);

  useEffect(() => {
    fetchFeed(1);
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Feed</h1>

      {posts.map((post) => (
        <div
          key={post._id}
          className="bg-white p-4 mb-6 rounded-xl shadow-sm border"
        >
          {/* Username */}
          <p className="font-semibold text-gray-700 mb-1">
            {post.user_id?.username || "Unknown"}
          </p>

          {/* Text */}
          <p className="text-gray-800 mb-3">{post.text}</p>

          {/* Image */}
          {post.image_url && (
            <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden">
              <img
                src={post.image_url}
                alt="post"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
        </div>
      ))}

      {/* Load More */}
      {page < totalPages && (
        <div className="text-center">
          <button
            onClick={() => fetchFeed(page + 1)}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default UserFeed;