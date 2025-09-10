import { Outlet, Navigate } from "react-router-dom";

export function ProtectedRoutes() {
  const token = localStorage.getItem("token");
  if (token) {
    return <Outlet />;
  } else {
    return <Navigate to="/Login" replace />;
  }
}

export function PublicRoutes() {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Outlet />;
  } else {
    return <Navigate to="/Home" replace />;
  }
}

export function AdminRoutes() {
  return <div>Admin page</div>;
}
