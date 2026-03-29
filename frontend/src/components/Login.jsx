import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";

const Login = () => {
  const [state, setState] = useState("Login");
  const { setShowLogin, backendUrl, setToken, setUser } =
    useContext(AppContext);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // ✅ Submit Handler
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url =
        state === "Login"
          ? `${backendUrl}/api/auth/login`
          : `${backendUrl}/api/auth/register`;

      const payload =
        state === "Login"
          ? { email, password }
          : { username, email, password };

      const { data } = await axios.post(url, payload, {
        withCredentials: true, // 🔥 needed for cookies
      });

      if (!data.success) {
        return toast.error(data.message);
      }

      // ✅ Store token
      if (data.accessToken) {
        setToken(data.accessToken);
        localStorage.setItem("token", data.accessToken);
      }

      // ✅ Store user
      if (data.user) {
        setUser(data.user);
      }

      toast.success(
        state === "Login" ? "Login successful 🎉" : "Account created 🎉"
      );

      setShowLogin(false);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Disable background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-10 backdrop-blur-sm bg-black/30 flex justify-center items-center">
      <motion.form
        onSubmit={onSubmitHandler}
        initial={{ opacity: 0.2, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative bg-white p-10 rounded-xl text-slate-500 w-[90%] max-w-md"
      >
        {/* Title */}
        <h1 className="text-center text-2xl text-neutral-700 font-medium">
          {state}
        </h1>
        <p className="text-sm text-center mt-1">
          {state === "Login"
            ? "Welcome back! Please sign in"
            : "Create your account"}
        </p>

        {/* Username */}
        {state !== "Login" && (
          <div className="border px-6 py-2 flex items-center gap-2 rounded-full mt-5">
            <img src={assets.star_icon} alt="" />
            <input
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              type="text"
              className="outline-none text-sm w-full"
              placeholder="Full Name"
              required
            />
          </div>
        )}

        {/* Email */}
        <div className="border px-6 py-2 flex items-center gap-2 rounded-full mt-4">
          <img src={assets.email_icon} alt="" />
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            className="outline-none text-sm w-full"
            placeholder="Email"
            required
          />
        </div>

        {/* Password */}
        <div className="border px-6 py-2 flex items-center gap-2 rounded-full mt-4">
          <img src={assets.lock_icon} alt="" />
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            className="outline-none text-sm w-full"
            placeholder="Password"
            required
          />
        </div>

        {/* Forgot password */}
        {state === "Login" && (
          <p className="text-sm text-blue-600 my-4 cursor-pointer hover:underline">
            Forgot password?
          </p>
        )}

        {/* Button */}
        <button
          disabled={loading}
          className="bg-blue-600 w-full text-white py-2 rounded-full hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading
            ? "Please wait..."
            : state === "Login"
            ? "Login"
            : "Create Account"}
        </button>

        {/* Switch */}
        {state === "Login" ? (
          <p className="mt-5 text-center text-sm">
            Don't have an account?{" "}
            <span
              className="text-blue-600 cursor-pointer hover:underline"
              onClick={() => setState("Sign Up")}
            >
              Sign up
            </span>
          </p>
        ) : (
          <p className="mt-5 text-center text-sm">
            Already have an account?{" "}
            <span
              className="text-blue-600 cursor-pointer hover:underline"
              onClick={() => setState("Login")}
            >
              Login
            </span>
          </p>
        )}

        {/* Close Button */}
        <img
          onClick={() => setShowLogin(false)}
          src={assets.cross_icon}
          alt="close"
          className="absolute top-5 right-5 cursor-pointer w-4"
        />
      </motion.form>
    </div>
  );
};

export default Login;