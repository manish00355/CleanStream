import { useState } from "react";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";

const UserFeed = () => {
  const [posts, setPosts] = useState([]);

  const addPost = (post) => {
    setPosts([post, ...posts]);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <CreatePost addPost={addPost} />

      {posts.map((post) => (
        <PostCard key={post.id} post={post} isAdmin={false} />
      ))}
    </div>
  );
};

export default UserFeed;