
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="border-b bg-white/50 backdrop-blur-sm p-4 flex items-center">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1" />
          </header>
          <div className="flex-1 p-6 bg-gray-50">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
