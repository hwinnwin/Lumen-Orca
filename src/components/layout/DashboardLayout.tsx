import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ProtectedRoute } from "./ProtectedRoute";

export const DashboardLayout = () => {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
};
