
import {
  Calendar,
  FileText,
  Home,
  MessageCircle,
  Upload,
  User,
  Users,
  BookOpen,
  MessageSquare,
  LogOut,
  Bot,
  Search,
  Globe,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { useProfile } from "@/hooks/useProfile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
    title: "Notes",
    url: "/notes",
    icon: FileText,
  },
  {
    title: "Upload",
    url: "/upload",
    icon: Upload,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "Subscription",
    url: "/subscription",
    icon: Calendar,
  },
]

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
]

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  const displayName = user?.email?.split('@')[0] || '';
  const shortName = displayName.length > 8 ? displayName.slice(0, 8) + '..' : displayName;

  const handleSignOut = () => {
    signOut();
  };
  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar/95 backdrop-blur-md">
      <SidebarHeader className="border-b border-sidebar-border p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg text-sidebar-foreground">Student Library</span>
            <p className="text-xs text-muted-foreground">Learning Platform</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-medium px-3 py-2 text-xs uppercase tracking-wider">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-sidebar-accent rounded-xl mx-2 my-1 transition-all duration-200 group">
                    <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                      <div className="p-1.5 rounded-lg bg-gradient-primary group-hover:shadow-md transition-all">
                        <item.icon className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <span className="font-medium hidden sm:inline text-sidebar-foreground">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-medium px-3 py-2 text-xs uppercase tracking-wider">Communication</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-sidebar-accent rounded-xl mx-2 my-1 transition-all duration-200 group">
                    <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                      <div className="p-1.5 rounded-lg bg-gradient-secondary group-hover:shadow-md transition-all">
                        <item.icon className="w-4 h-4 text-success-foreground" />
                      </div>
                      <span className="font-medium hidden sm:inline text-sidebar-foreground">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border p-4">
        {user && (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-sm font-medium bg-gradient-primary text-primary-foreground">
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {shortName && (
                <span className="text-sidebar-foreground text-sm font-medium">{shortName}</span>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-full p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 transition-all duration-200"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
