import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const Navbar = () => {
  const { user, setShowLogin, logout } = useContext(AppContext);
  const navigate = useNavigate();

  return (
    <div className="w-full h-16 flex justify-between items-center px-6 bg-white shadow">

      {/* Logo */}
      <Link
        to="/feed"
        className="text-xl font-bold text-gray-800 tracking-wide"
      >
        SocialApp
      </Link>

      {/* Right Side */}
      {user ? (
        <div className="flex items-center gap-5">

          {/* Welcome */}
          <p className="text-gray-600 hidden sm:block">
            Hi, <span className="font-semibold">{user.name}</span>
          </p>

          {/* Role Badge */}
          <span className="text-xs px-2 py-1 bg-gray-200 rounded capitalize">
            {user.role || "user"}
          </span>

          {/* Profile Dropdown */}
          <div className="relative group">
            <img
              src={assets.profile_icon}
              className="w-10 h-10 rounded-full border cursor-pointer"
              alt="profile"
            />

            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-36 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200">
              <ul className="text-sm">

                <li
                  onClick={() => navigate("/myposts")}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  My Posts
                </li>

                <li
                  onClick={logout}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500"
                >
                  Logout
                </li>

              </ul>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowLogin(true)}
          className="bg-zinc-800 text-white px-5 py-2 rounded-full text-sm hover:bg-zinc-700 transition"
        >
          Login
        </button>
      )}
    </div>
  );
};

export default Navbar;