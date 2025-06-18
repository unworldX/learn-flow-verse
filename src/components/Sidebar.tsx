
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  BookOpen, 
  Users, 
  MessageSquare, 
  Settings, 
  Upload,
  Crown,
  Bot,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Resources', href: '/resources', icon: BookOpen },
  { name: 'Study Groups', href: '/study-groups', icon: Users },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'AI Chat', href: '/ai-chat', icon: Bot },
  { name: 'Subscription', href: '/subscription', icon: Crown },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg text-gray-900">StudyLib</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "flex-shrink-0",
                    collapsed ? "h-5 w-5" : "h-5 w-5 mr-3",
                    isActive ? "text-blue-700" : "text-gray-400"
                  )}
                />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
