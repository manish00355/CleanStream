import { useContext } from "react";
import UserFeed from "./pages/UserFeed";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import { Route, Routes, Navigate } from "react-router-dom";
import { AppContext } from "./context/AppContext";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import CreatePost from "./pages/CreatePost";
import Approved from "./pages/Approved";
import Rejected from "./pages/Rejected";
import MyPosts from "./pages/MyPosts";

function App() {
  const { showLogin, user } = useContext(AppContext);

  const role = user?.role;

  const AdminRoute = ({ children }) => {
    return role === "admin" ? children : <Navigate to="/feed" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-orange-50">

      {/* Sidebar (Fixed) */}
      <div className="fixed top-0 left-0 w-64 h-screen bg-white shadow z-40">
        <Sidebar user={user} />
      </div>

      {/* Right Side */}
      <div className="ml-64">

        {/* Navbar (Fixed) */}
        <div className="fixed top-0 left-64 right-0 h-16 bg-white shadow z-50 flex items-center">
          <Navbar user={user} />
        </div>

        {/* Page Content */}
        <div className="mt-16 p-4 sm:p-6 md:p-8">
          <ToastContainer position="bottom-right" />

          {showLogin && <Login />}

          <Routes>
            <Route path="/feed" element={<UserFeed />} />
            <Route path="/post" element={<CreatePost />} />
            <Route path="/myposts" element={<MyPosts />} />

            <Route
              path="/approved"
              element={
                <AdminRoute>
                  <Approved />
                </AdminRoute>
              }
            />
            <Route
              path="/rejected"
              element={
                <AdminRoute>
                  <Rejected />
                </AdminRoute>
              }
            />

            <Route path="*" element={<Navigate to="/feed" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;