
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
    <Sidebar className="border-r border-white/20 bg-white/95 backdrop-blur-md">
      <SidebarHeader className="border-b border-white/20 p-4 md:p-6 glass">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg text-slate-800">Student Library</span>
            <p className="text-xs text-slate-500">Learning Platform</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="glass">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 font-medium px-3 py-2 text-xs uppercase tracking-wider">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-white/60 rounded-xl mx-2 my-1 transition-all duration-200 group">
                    <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium hidden sm:inline">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 font-medium px-3 py-2 text-xs uppercase tracking-wider">Communication</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-white/60 rounded-xl mx-2 my-1 transition-all duration-200 group">
                    <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 group-hover:from-green-600 group-hover:to-teal-600 transition-all">
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium hidden sm:inline">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      
      <SidebarFooter className="border-t border-white/20 p-4 glass">
        {user && (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-sm font-medium">
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {shortName && (
                <span className="text-slate-700 text-sm font-medium">{shortName}</span>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-full p-2 text-red-600 hover:text-red-700 hover:bg-red-50/80 transition-all duration-200"
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
