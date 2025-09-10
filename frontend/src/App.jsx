import { useState } from "react";
import "./App.css";
import Login from "./pages/login";
import Home from "./pages/home";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PublicRoutes, ProtectedRoutes } from "./components/redirectHandler";
import Register from "./pages/register";
import Info from "./pages/info";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoutes />}>
            <Route path="/" element={<Info />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<ProtectedRoutes />}>
            <Route path="/home" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
