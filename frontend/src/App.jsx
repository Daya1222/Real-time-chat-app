import { useState, useEffect, useContext, createContext } from "react";
import "./App.css";
import Login from "./pages/login";
import Home from "./pages/home";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PublicRoutes, ProtectedRoutes } from "./components/redirectHandler";
import Register from "./pages/register";
import Info from "./pages/info";
import Dashboard from "./components/dashboard";
import { RefreshContext } from "./components/refreshContext.jsx";

function App() {
  const [refresh, setRefresh] = useState(false);
  const [globalUser, setGlobalUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : {};
  });

  return (
    <div className="app">
      <BrowserRouter>
        <RefreshContext.Provider
          value={{ refresh, setRefresh, globalUser, setGlobalUser }}
        >
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
        </RefreshContext.Provider>
      </BrowserRouter>
    </div>
  );
}

export default App;
