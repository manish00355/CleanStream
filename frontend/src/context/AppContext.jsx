import { useEffect, useState, createContext } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { postsData } from "../assets/assets";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const useMock = import.meta.env.VITE_USE_MOCK === "true";
  const navigate = useNavigate();

  // ================= AXIOS INSTANCE =================

  const api = axios.create({
    baseURL: backendUrl,
    withCredentials: true,
  });

  // ✅ Attach token automatically
  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // ✅ GLOBAL ERROR HANDLER (🔥 IMPORTANT)
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const message =
        error.response?.data?.message || "Something went wrong";

      // 🔐 Auto logout on unauthorized
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
        navigate("/feed");
      }

      toast.error(message);
      return Promise.reject(error);
    }
  );

  // ================= AUTH =================

  const getCurrentUser = async () => {
    try {
      if (!token) return;

      const { data } = await api.get("/me");

      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      console.log("Get user failed:", error);
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");

      localStorage.removeItem("token");
      setToken("");
      setUser(null);

      toast.success("Logged out");
      navigate("/feed");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // ================= FEED =================

  const fetchFeed = async (pageNumber = 1) => {
    try {
      setLoading(true);

      const res = await api.get(
        `/api/posts/feed?page=${pageNumber}&limit=10`
      );

      if (res.data.success) {
        if (pageNumber === 1) {
          setPosts(res.data.posts);
        } else {
          setPosts((prev) => [...prev, ...res.data.posts]);
        }

        setPage(res.data.page);
        setTotalPages(res.data.totalPages);
      }
    } catch (error) {
      console.log(error); // ❌ no toast here (handled globally)
    } finally {
      setLoading(false);
    }
  };

  // ================= MY POSTS =================

  const fetchMyPosts = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/posts/my");

      const data = res.data.posts || res.data.data || res.data;
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // ================= AUTO LOAD =================

  useEffect(() => {
    if (token) {
      getCurrentUser(); // ✅ load user
      fetchFeed();      // ✅ load feed
    } else {
      setUser(null);
      setPosts([]);
    }
  }, [token]);

  useEffect(() => {

    if (useMock) {
      setPosts(postsData);
    }
  }, []);

  // ================= VALUE =================

  const value = {
    user,
    setUser,
    showLogin,
    setShowLogin,

    token,
    setToken,
    logout,

    posts,
    setPosts,

    fetchFeed,
    fetchMyPosts,

    page,
    totalPages,
    loading,

    backendUrl,
    navigate,
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;