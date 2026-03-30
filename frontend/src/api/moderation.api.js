import api from "./axios";

export const getStatsApi = () => api.get("/api/moderation/stats");

export const getFlaggedApi = (page = 1, reason = "", status = "flagged") =>
  api.get(`/api/moderation/flagged?page=${page}&limit=20&status=${status}${reason ? `&reason=${reason}` : ""}`);

export const approvePostApi = (postId) =>
  api.post(`/api/moderation/${postId}/approve`);

export const rejectPostApi = (postId, reason = "") =>
  api.post(`/api/moderation/${postId}/reject`, { reason });

export const getMLResultApi = (postId) =>
  api.get(`/api/moderation/${postId}/result`);