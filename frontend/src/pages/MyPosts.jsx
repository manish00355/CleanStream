import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import PostCard from '../components/PostCard';
import { AppContext } from '../context/AppContext';

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const {backendUrl,token} = useContext(AppContext)

  const fetchMyPosts = async () => {
    try {
      const res = await axios.get(
        backendUrl + '/api/posts/my',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      console.log("API Response:", res.data);


      if (Array.isArray(res.data)) {
        setPosts(res.data);
      } else if (Array.isArray(res.data.posts)) {
        setPosts(res.data.posts);
      } else if (Array.isArray(res.data.data)) {
        setPosts(res.data.data);
      } else {
        setPosts([]);
      }

    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchMyPosts();
  }, []);


  if (loading) {
    return <p className="text-center mt-5">Loading...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">My Posts</h2>

      {Array.isArray(posts) && posts.length > 0 ? (
        posts.map((post) => (
          <PostCard key={post.id || post._id} post={post} isAdmin={false} />
        ))
      ) : (
        <p>No posts found</p>
      )}
    </div>
  );
};

export default MyPosts;