import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function ModeratorRoute() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "moderator") return <Navigate to="/feed" replace />;
  return <Outlet />;
}