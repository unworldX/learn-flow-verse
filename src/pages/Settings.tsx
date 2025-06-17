
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Palette, Bot, HelpCircle } from "lucide-react";
import SubscriptionPlans from "@/components/subscription/SubscriptionPlans";
import SubscriptionStatus from "@/components/subscription/SubscriptionStatus";

const Settings = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-2 grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="rounded-xl font-medium flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl font-medium flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="rounded-xl font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-xl font-medium flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-xl font-medium flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="help" className="rounded-xl font-medium flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Help</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Enter your full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" placeholder="Tell us about yourself" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
          
          <SubscriptionStatus />
          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <SubscriptionPlans />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in your browser
                  </p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Study Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders for your study sessions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications for new direct messages
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to other users
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activity Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Show when you're online
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Data Collection</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow collection of usage data for improvement
                  </p>
                </div>
                <Switch />
              </div>
              <Button variant="destructive" className="mt-6">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded"></div>
                    Light
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <div className="w-6 h-6 bg-gray-800 rounded"></div>
                    Dark
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-white to-gray-800 rounded"></div>
                    Auto
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Font Size</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Button variant="outline">Small</Button>
                  <Button variant="outline">Medium</Button>
                  <Button variant="outline">Large</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI Suggestions</Label>
                  <p className="text-sm text-muted-foreground">
                    Get AI-powered study suggestions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Complete</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable AI auto-completion in chat
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>AI Model Preference</Label>
                <p className="text-sm text-muted-foreground">
                  Configure your AI settings in the AI Chat page
                </p>
                <Button variant="outline">Open AI Chat</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Help & Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  📚 User Guide
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  💬 Contact Support
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  🐛 Report a Bug
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  ⭐ Rate Our App
                </Button>
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground">
                <p>Version 1.0.0</p>
                <p>© 2024 Student Library. All rights reserved.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
