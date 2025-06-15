
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
import { useAuth } from "@/hooks/useAuth"
import { Badge } from "@/components/ui/badge"

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "Study Plans",
    url: "/study-plans",
    icon: Calendar,
  },
  {
    title: "Resources",
    url: "/resources",
    icon: FileText,
  },
  {
    title: "Forums",
    url: "/forums",
    icon: MessageSquare,
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
]

const chatItems = [
  {
    title: "AI Assistant",
    url: "/ai-chat",
    icon: Bot,
  },
  {
    title: "Direct Messages",
    url: null, // No URL means it's coming soon
    icon: MessageCircle,
  },
  {
    title: "Study Groups",
    url: "/groups",
    icon: Users,
  },
]

export function AppSidebar() {
  const { signOut, user } = useAuth();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <Sidebar className="border-r border-slate-200">
      <SidebarHeader className="border-b border-slate-200 p-6 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-800">Student Library</span>
            <p className="text-xs text-slate-500">Learning Platform</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 font-medium px-3 py-2">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-slate-100 rounded-lg mx-2 transition-all duration-200">
                    <a href={item.url} className="flex items-center gap-3 px-3 py-2">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 font-medium px-3 py-2">Communication</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.url ? (
                    <SidebarMenuButton asChild className="hover:bg-slate-100 rounded-lg mx-2 transition-all duration-200">
                      <a href={item.url} className="flex items-center gap-3 px-3 py-2">
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  ) : (
                    <div className="flex items-center justify-between gap-3 px-5 py-2 text-slate-500 cursor-not-allowed">
                       <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                    </div>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 font-medium px-3 py-2">Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-slate-100 rounded-lg mx-2 transition-all duration-200">
                  <a href="/settings" className="flex items-center gap-3 px-3 py-2">
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-slate-200 p-4 bg-white">
        {user && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{user.email}</p>
                <p className="text-xs text-slate-500">Active now</p>
              </div>
            </div>
            <SidebarMenuButton 
              onClick={handleSignOut} 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Sign Out</span>
            </SidebarMenuButton>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
