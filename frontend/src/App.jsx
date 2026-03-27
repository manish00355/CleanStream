import { useContext, useState } from "react";
import UserFeed from "./pages/UserFeed";
import AdminPanel from "./pages/AdminPanel";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import { Route, Routes } from "react-router-dom";
import { AppContext } from "./context/AppContext";
import Login from "./components/Login";

function App() {
  const {showLogin} = useContext(AppContext)
  const role = "ADMI" // "admin"

  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer position="button-right" />
      <Navbar role={role} />

      {showLogin && <Login/>}
      <Routes >
        <Route path='/' element={ <UserFeed />} />
        <Route path='/admin' element={role==='ADMIN'?<AdminPanel/>:<Login/>} />
      </Routes>
    </div>
  );
}

export default App;