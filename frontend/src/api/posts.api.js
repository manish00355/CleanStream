import api from "./axios";

export const getFeedApi = (page = 1) =>
  api.get(`/api/posts/feed?page=${page}&limit=20`);

export const getMyPostsApi = (page = 1) =>
  api.get(`/api/posts/my?page=${page}&limit=20`);

export const getPostApi = (id) => api.get(`/api/posts/${id}`);

export const createPostApi = (formData) =>
  api.post("/api/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deletePostApi = (id) => api.delete(`/api/posts/${id}`);