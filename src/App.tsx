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
import RateLimitManagement from "./pages/RateLimitManagement";
import AuditLogs from "./pages/AuditLogs";
import SystemLogs from "./pages/SystemLogs";
import Builder from "./pages/Builder";
import NotFound from "./pages/NotFound";
// Business Platform Pages
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import BookConsultation from "./pages/BookConsultation";
import ConsultationConfirmed from "./pages/ConsultationConfirmed";
import ClientPortal from "./pages/ClientPortal";
import AdminClients from "./pages/AdminClients";
import ROICalculator from "./pages/ROICalculator";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Business Platform Routes */}
            <Route path="/home" element={<Landing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/book-consultation" element={<BookConsultation />} />
            <Route path="/consultation-confirmed" element={<ConsultationConfirmed />} />
            <Route path="/roi-calculator" element={<ROICalculator />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancelled" element={<PaymentCancelled />} />

            {/* Auth */}
            <Route path="/auth" element={<Auth />} />

            {/* Client Portal (Protected) */}
            <Route path="/portal" element={<ClientPortal />} />

            {/* Admin Dashboard (Protected) */}
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
              <Route path="/rate-limit" element={<RateLimitManagement />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/system-logs" element={<SystemLogs />} />
              <Route path="/clients" element={<AdminClients />} />
              <Route path="/builder" element={<Builder />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
