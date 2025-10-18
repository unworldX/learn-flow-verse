import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Settings, User, LogOut } from "lucide-react";
import { useLocation, Outlet } from "react-router-dom";
import NotificationPopover from "@/components/NotificationPopover";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/contexts/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppLayoutProps {
  children?: React.ReactNode; // Optional so <AppLayout /> can be used as a route element
}

const getPageTitle = (pathname: string) => {
  const routes: Record<string, string> = {
    '/': 'Dashboard',
    '/resources': 'Resources',
    '/resources/view': 'Resource Viewer',
    '/profile': 'Profile',
    '/study-plans': 'Study Plans',
    '/forums': 'Forums',
    '/reminders': 'Reminders',
    '/upload': 'Upload',
    '/chats': 'Direct Messages',
    '/groups': 'Study Groups',
    '/ai-chat': 'AI Assistant',
    '/settings': 'Settings',
    '/courses': 'Courses',
    '/NotesWorkspace': 'Notes',
    '/subscription': 'Subscription',
    '/conversations': 'Conversations',
  };
  if (pathname.startsWith('/resources/view')) {
    return routes['/resources/view'];
  }
  if (pathname.startsWith('/courses/')) {
    return 'Video Course';
  }
  return routes[pathname] || 'Student Library';
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const { profile } = useProfile();
  const { user, signOut } = useAuth();

  // Minimal layout pages (hide sidebar/header chrome)
  // Removed chat-related minimal routes since feature was deleted
  const minimalRoutes: string[] = [];
  if (minimalRoutes.some(r => location.pathname.startsWith(r))) {
    return (
      <SidebarProvider
        style={
          {
            ['--sidebar-width' as keyof React.CSSProperties]: '14rem',
            ['--sidebar-width-icon' as keyof React.CSSProperties]: '3.5rem',
            ['--app-header-height' as keyof React.CSSProperties]: '3rem',
          } as React.CSSProperties
        }
      >
        <div className="min-h-screen w-full bg-gradient-surface flex">
          {/* Offcanvas sidebar (hidden on mobile until triggered) */}
          <AppSidebar />
          <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">{children ? children : <Outlet />}</div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          ['--sidebar-width' as keyof React.CSSProperties]: '14rem',
          ['--sidebar-width-icon' as keyof React.CSSProperties]: '3.5rem',
          ['--app-header-height' as keyof React.CSSProperties]: '3rem',
        } as React.CSSProperties
      }
    >
      <div className="min-h-screen flex w-full bg-gradient-surface">
        <AppSidebar />
        <main className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
          <header className="border-b border-border/50 bg-card/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
            <div className="flex items-center justify-between h-12 px-4 lg:px-6">
              <div className="flex items-center gap-3">
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
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full overflow-hidden focus:outline-none focus:ring-primary">
                      <Avatar className="h-9 w-9 border-2 border-primary/20">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="text-sm font-medium bg-gradient-primary text-primary-foreground">
                          {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={profile?.avatar_url || ''} />
                          <AvatarFallback>
                            {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{user?.email || 'User'}</div>
                          <div className="text-[11px] text-muted-foreground truncate">Welcome to Contributors</div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="/profile" className="flex items-center gap-2"><User className="h-4 w-4" /> Profile</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/settings" className="flex items-center gap-2"><Settings className="h-4 w-4" /> Settings</a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          <div className="flex-1 bg-gradient-surface">
            {children ? children : <Outlet />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

// Provide a default export for modules expecting default
export default AppLayout;
