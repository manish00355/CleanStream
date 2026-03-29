import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const Sidebar = () => {
  const location = useLocation();
  const {user} = useContext(AppContext);

  console.log(user);

  const isAdmin = user?.role === "admin";
  const isLoggedIn = !!user;


  // ✅ Dynamic menu
  const menuItems = [
    { name: "Feed", path: "/feed" },

    ...(isLoggedIn
      ? [
          { name: "Create Post", path: "/post" },
          { name: "My Posts", path: "/myposts" },
        ]
      : []),

    ...(isAdmin
      ? [
          { name: "Approved", path: "/approved" },
          { name: "Rejected", path: "/rejected" },
        ]
      : []),
  ];

  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-white shadow-md p-5 z-40">
      
      {/* Title */}
      <h2 className="text-xl font-bold mb-8">Menu</h2>

      {/* Menu */}
      <div className="flex flex-col gap-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-md transition ${
                isActive
                  ? "bg-teal-100 text-teal-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;