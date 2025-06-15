
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
      <div className="min-h-screen flex w-full bg-slate-50">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-sm">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-all duration-200" />
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-slate-800">{pageTitle}</h1>
                  {location.pathname === '/ai-chat' && (
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      AI Powered
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 rounded-full">
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
                  <User className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </header>
          <div className="flex-1 bg-slate-50">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
