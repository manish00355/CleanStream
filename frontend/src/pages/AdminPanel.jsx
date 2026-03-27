import { useState } from "react";
import PostCard from "../components/PostCard";

const AdminPanel = () => {
  const [posts, setPosts] = useState([]);

  const updateStatus = (id, status) => {
    const updated = posts.map((p) =>
      p.id === id ? { ...p, status } : p
    );
    setPosts(updated);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Admin Review Panel</h2>

      {posts.length === 0 && <p>No posts to review</p>}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isAdmin={true}
          updateStatus={updateStatus}
        />
      ))}
    </div>
  );
};

export default AdminPanel;