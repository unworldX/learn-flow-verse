
import {
  Calendar,
  FileText,
  Home,
  MessageCircle,
  Settings,
  Upload,
  User,
  Users,
  Bell,
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
    title: "Direct Messages",
    url: "/messages",
    icon: MessageCircle,
  },
  {
    title: "Study Groups",
    url: "/study-groups",
    icon: Users,
  },
  {
    title: "Forums",
    url: "/forums",
    icon: Globe,
  },
]

export function AppSidebar() {
  const { signOut, user } = useAuth();

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

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 font-medium px-3 py-2 text-xs uppercase tracking-wider">Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-white/60 rounded-xl mx-2 my-1 transition-all duration-200 group">
                  <Link to="/settings" className="flex items-center gap-3 px-3 py-3">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 group-hover:from-slate-600 group-hover:to-slate-700 transition-all">
                      <Settings className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium hidden sm:inline">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-white/20 p-4 glass">
        {user && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-3 py-2 glass border border-white/30 rounded-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-medium">
                  {user.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0 hidden sm:block">
                <p className="text-sm font-medium text-slate-800 truncate">{user.email}</p>
                <p className="text-xs text-slate-500">Active now</p>
              </div>
            </div>
            <SidebarMenuButton 
              onClick={handleSignOut} 
              className="w-full justify-center sm:justify-start text-red-600 hover:text-red-700 hover:bg-red-50/80 rounded-xl transition-all duration-200 p-2"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium hidden sm:inline ml-2">Sign Out</span>
            </SidebarMenuButton>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
