
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Resources from "./pages/Resources";
import StudyGroups from "./pages/StudyGroups";
import DirectMessages from "./pages/DirectMessages";
import Settings from "./pages/Settings";
import Upload from "./pages/Upload";
import Subscription from "./pages/Subscription";
import AIChatPage from "./pages/AIChatPage";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Notes from "./pages/Notes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/study-groups" element={<StudyGroups />} />
              <Route path="/messages" element={<DirectMessages />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/ai-chat" element={<AIChatPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/search" element={<Search />} />
              <Route path="/notes" element={<Notes />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
