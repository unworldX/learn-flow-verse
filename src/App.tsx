
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Resources from "./pages/Resources";
import Profile from "./pages/Profile";
import StudyPlans from "./pages/StudyPlans";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  return user ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  return user ? <Navigate to="/" /> : <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
    
    {/* Protected Routes */}
    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    
    {/* Placeholder routes - to be implemented */}
    <Route path="/study-plans" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Study Plans - Coming Soon!</h1></div></ProtectedRoute>} />
    <Route path="/forums" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Forums - Coming Soon!</h1></div></ProtectedRoute>} />
    <Route path="/upload" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Upload - Coming Soon!</h1></div></ProtectedRoute>} />
    <Route path="/chats" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Direct Messages - Coming Soon!</h1></div></ProtectedRoute>} />
    <Route path="/groups" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Study Groups - Coming Soon!</h1></div></ProtectedRoute>} />
    <Route path="/reminders" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Reminders - Coming Soon!</h1></div></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Settings - Coming Soon!</h1></div></ProtectedRoute>} />

    {/* Catch all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
