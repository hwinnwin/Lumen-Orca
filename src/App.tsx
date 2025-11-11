import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/use-auth";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import Contracts from "./pages/Contracts";
import Evidence from "./pages/Evidence";
import Telemetry from "./pages/Telemetry";
import Prompt from "./pages/Prompt";
import UserGuide from "./pages/UserGuide";
import DemoPlan from "./pages/DemoPlan";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import MfaSetup from "./pages/MfaSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/evidence" element={<Evidence />} />
              <Route path="/telemetry" element={<Telemetry />} />
              <Route path="/prompt" element={<Prompt />} />
              <Route path="/guide" element={<UserGuide />} />
              <Route path="/demo" element={<DemoPlan />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/mfa-setup" element={<MfaSetup />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
