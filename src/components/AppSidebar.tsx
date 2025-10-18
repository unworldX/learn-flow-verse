import {
  Calendar,
  FileText,
  Home,
  MessageCircle,
  Upload,
  Settings,
  Bell,
  BookOpen,
  Bot,
  Search,
  Globe,
  PlaySquare
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import BrandLogo from '@/components/BrandLogo';

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
  },
  {
    title: "Resources",
    url: "/resources",
    icon: BookOpen,
  },
  {
    title: "Video Courses",
    url: "/courses",
    icon: PlaySquare,
  },
  {
    title: "Notes",
    url: "/NotesWorkspace",
    icon: FileText,
  },
  {
    title: "Reminders",
    url: "/reminders",
    icon: Bell,
  },
  {
    title: "Upload",
    url: "/upload",
    icon: Upload,
  },
  {
    title: "Subscription",
    url: "/subscription",
    icon: Calendar,
  },
];

const chatItems = [
  {
    title: "AI Assistant",
    url: "/ai-chat",
    icon: Bot,
  },
  {
    title: "Conversations",
    url: "/conversations",
    icon: MessageCircle,
  },
  {
    title: "Forums",
    url: "/forums",
    icon: Globe,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out"
    >
      <SidebarHeader className="border-b border-sidebar-border h-14 p-2">
        <div className="h-full flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-sidebar-accent text-sidebar-foreground/80 shrink-0">
            <BrandLogo className="w-8 h-8" />
          </div>
          <div 
            className={`hidden sm:block transition-all duration-300 overflow-hidden ${
              isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            }`}
          >
            <span className="font-semibold text-base text-sidebar-foreground whitespace-nowrap">
              Student Library
            </span>
            <p className="text-[11px] text-sidebar-foreground/60 whitespace-nowrap">
              Learning Platform
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      location.pathname === item.url ||
                      location.pathname.startsWith(item.url + "/")
                    }
                    className="mx-2 my-1 rounded-lg transition-all duration-200"
                    tooltip={item.title}
                  >
                    <Link
                      to={item.url}
                      className="flex items-center gap-3 relative"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span 
                        className={`font-medium whitespace-nowrap transition-all duration-300 ${
                          isCollapsed 
                            ? 'w-0 opacity-0 overflow-hidden' 
                            : 'w-auto opacity-100'
                        }`}
                      >
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      location.pathname === item.url ||
                      location.pathname.startsWith(item.url + "/")
                    }
                    className="mx-2 my-1 rounded-lg transition-all duration-200"
                    tooltip={item.title}
                  >
                    <Link
                      to={item.url}
                      className="flex items-center gap-3 relative"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span 
                        className={`font-medium whitespace-nowrap transition-all duration-300 ${
                          isCollapsed 
                            ? 'w-0 opacity-0 overflow-hidden' 
                            : 'w-auto opacity-100'
                        }`}
                      >
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer settings button */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <Link
          to="/settings"
          className="flex items-center gap-3 h-10 px-3 rounded-lg hover:bg-sidebar-accent focus:bg-sidebar-accent text-sidebar-foreground transition-all duration-200 w-full"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span 
            className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              isCollapsed 
                ? 'w-0 opacity-0 overflow-hidden' 
                : 'w-auto opacity-100'
            }`}
          >
            Settings
          </span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
