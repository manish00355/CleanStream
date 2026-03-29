import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import PostCard from '../components/PostCard';

const Approved = () => {
  const { posts } = useContext(AppContext);

  const approvedPosts = posts.filter(
    (post) => post.status === "approved"
  );

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Approved Posts</h2>

      {approvedPosts.length === 0 && <p>No approved posts</p>}

      {approvedPosts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          isAdmin={true}
        />
      ))}
    </div>
  );
};

export default Approved;