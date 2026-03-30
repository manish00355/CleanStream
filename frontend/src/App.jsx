import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FeedPage from "./pages/user/FeedPage";
import CreatePostPage from "./pages/user/CreatePostPage";
import MyPostsPage from "./pages/user/MyPostsPage";
import DashboardPage from "./pages/moderator/DashboardPage";
import FlaggedPage from "./pages/moderator/FlaggedPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import ModeratorRoute from "./routes/ModeratorRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* User — requires login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/my-posts" element={<MyPostsPage />} />
        </Route>

        {/* Moderator — requires login + moderator role */}
        <Route element={<ModeratorRoute />}>
          <Route path="/mod/dashboard" element={<DashboardPage />} />
          <Route path="/mod/flagged" element={<FlaggedPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}