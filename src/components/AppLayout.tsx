
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Settings, User, Bell } from "lucide-react";
import { useLocation } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

const getPageTitle = (pathname: string) => {
  const routes: Record<string, string> = {
    '/': 'Dashboard',
    '/resources': 'Resources',
    '/profile': 'Profile',
    '/study-plans': 'Study Plans',
    '/forums': 'Forums',
    '/reminders': 'Reminders',
    '/upload': 'Upload',
    '/chats': 'Direct Messages',
    '/groups': 'Study Groups',
    '/ai-chat': 'AI Assistant',
    '/settings': 'Settings',
  };
  return routes[pathname] || 'Student Library';
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex items-center justify-between h-16 px-6">
              {/* Left section with sidebar trigger and page title */}
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-md transition-colors" />
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
                  {location.pathname === '/ai-chat' && (
                    <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                      AI Powered
                    </div>
                  )}
                </div>
              </div>

              {/* Right section with action buttons */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </Button>
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </header>
          <div className="flex-1 bg-gray-50">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
