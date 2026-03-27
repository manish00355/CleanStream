const PostCard = ({ post, isAdmin, updateStatus }) => {
    return (
      <div className="bg-white p-4 rounded shadow mb-4">
        <p className="mb-2">{post.text}</p>
  
        {post.image && (
          <img src={post.image} alt="post" className="w-full rounded mb-2" />
        )}
  
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => updateStatus(post.id, "approved")}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Approve
            </button>
  
            <button
              onClick={() => updateStatus(post.id, "rejected")}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Reject
            </button>
          </div>
        )}
  
        {!isAdmin && post.status !== "approved" && (
          <p className="text-yellow-600 text-sm">Pending Approval</p>
        )}
      </div>
    );
  };
  
  export default PostCard;