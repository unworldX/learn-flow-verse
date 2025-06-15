
import { useState } from "react";
import { Home, User, Calendar, BookOpen, MessageCircle, Settings, LogOut, Upload, Users, Bell } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

const menuItems = [
  {
    title: "Home",
    icon: Home,
    url: "/",
  },
  {
    title: "Study Plans",
    icon: Calendar,
    url: "/study-plans",
  },
  {
    title: "Resources",
    icon: BookOpen,
    url: "/resources",
  },
  {
    title: "Forums",
    icon: MessageCircle,
    url: "/forums",
  },
  {
    title: "Upload",
    icon: Upload,
    url: "/upload",
  },
];

const chatItems = [
  {
    title: "Direct Messages",
    icon: MessageCircle,
    url: "/chats",
  },
  {
    title: "Study Groups",
    icon: Users,
    url: "/groups",
  },
];

const settingsItems = [
  {
    title: "Reminders",
    icon: Bell,
    url: "/reminders",
  },
  {
    title: "Profile",
    icon: User,
    url: "/profile",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/settings",
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const [currentUser] = useState({
    name: "Alex Student",
    email: "alex@student.edu",
    avatar: "",
  });

  return (
    <Sidebar className="border-r bg-gradient-to-b from-blue-50 to-purple-50">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Student Library
            </h2>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    className="hover:bg-blue-100 transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Communication</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    className="hover:bg-blue-100 transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    className="hover:bg-blue-100 transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center space-x-3 mb-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
          </div>
        </div>
        <SidebarMenuButton className="w-full justify-start text-red-600 hover:bg-red-50">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
