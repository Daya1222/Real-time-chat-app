import { useState } from "react";
import "./App.css";
import Login from "./pages/login";
import Home from "./pages/home";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PublicRoutes, ProtectedRoutes } from "./components/redirectHandler";
import Register from "./pages/register";
import Info from "./pages/info";
import Dashboard from "./components/dashboard";
import UserCard from "./components/userCard";

function App() {
  return (
    <div className="app">
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoutes />}>
            <Route path="/" element={<Info />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<ProtectedRoutes />}>
            <Route
              path="/home"
              element={
                <Dashboard>
                  <Home />
                </Dashboard>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
