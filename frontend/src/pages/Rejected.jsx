import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import PostCard from '../components/PostCard';

const Rejected = () => {
  const { posts } = useContext(AppContext);


  const rejectedPosts = posts.filter(
    (post) => post.status === "rejected"
  );

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Rejected Posts</h2>

      {rejectedPosts.length === 0 && <p>No rejected posts</p>}

      {rejectedPosts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          isAdmin={true}
        />
      ))}
    </div>
  );
};

export default Rejected;