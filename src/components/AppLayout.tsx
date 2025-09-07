
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Settings, User } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import NotificationPopover from "@/components/NotificationPopover";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const { profile } = useProfile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-surface">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="border-b border-border/50 bg-card/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
            <div className="flex items-center justify-between h-16 px-4 lg:px-6">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="hover:bg-muted p-2 rounded-lg transition-all duration-200" />
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
                  {location.pathname === '/ai-chat' && (
                    <div className="bg-gradient-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                      AI Powered
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <NotificationPopover />
                <Link 
                  to="/settings"
                  className="p-2 hover:bg-muted rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground"
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </Link>
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  <AvatarFallback className="text-sm bg-gradient-primary text-primary-foreground">
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : profile?.email.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          <div className="flex-1 bg-gradient-surface">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
