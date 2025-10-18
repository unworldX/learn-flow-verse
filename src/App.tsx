import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from 'next-themes';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import { RequireAuth } from "./routes/RequireAuth";
import Index from "./pages/Index";
import Resources from "./pages/Resources";
import Settings from "./pages/Settings";
import Upload from "./pages/Upload";
import Subscription from "./pages/Subscription";
import AIChatPage from "./pages/AIChatPage";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Forums from "./pages/Forums";
import Reminders from "./pages/Reminders";
import NotFound from "./pages/NotFound";
import NewPassword from "./pages/NewPassword";
import PdfViewer from "./pages/PdfViewer";
import Conversations from "./pages/Conversations";
import NotesWorkspace from "./pages/NotesWorkspace";
import WatchCoursePage from "./pages/WatchCoursePage";
import CoursesPage from "./pages/Courses";
import CourseDetailPage from "./pages/CourseDetailPage";

const queryClient = new QueryClient();

const App = () => {
  const isElectron = typeof window !== 'undefined' && window.desktop?.isElectron;
  const Router = isElectron ? HashRouter : BrowserRouter;
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/new-password" element={<NewPassword />} />
                {/* Protected routes */}
                <Route element={<AppLayout />}>
                  <Route element={<RequireAuth />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/study-groups" element={<div className="p-8 text-center text-sm text-muted-foreground">Study Groups feature has been removed.</div>} />
                    <Route path="/conversations" element={<Conversations />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/subscription" element={<Subscription />} />
                    <Route path="/ai-chat" element={<AIChatPage />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/NotesWorkspace" element={<NotesWorkspace />} />
                    <Route path="/forums" element={<Forums />} />
                    {/* Group chat route removed */}
                    <Route path="/reminders" element={<Reminders />} />
                    <Route path="/resources/view/:resourceId" element={<PdfViewer />} />
                    <Route path="/courses" element={<CoursesPage />} />
                    <Route path="/courses/:courseId" element={<CourseDetailPage />} />
                  </Route>
                </Route>
                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
