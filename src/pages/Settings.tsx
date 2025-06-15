
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, User, Bell, Shield, Palette, HelpCircle, LogOut, Camera, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [profileSettings, setProfileSettings] = useState({
    displayName: user?.email?.split('@')[0] || '',
    email: user?.email || '',
    bio: '',
    timezone: 'UTC',
    language: 'en'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    studyReminders: true,
    forumUpdates: false,
    weeklyDigest: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showStudyStats: true,
    allowDirectMessages: true
  });

  const [themeSettings, setThemeSettings] = useState({
    theme: 'light',
    colorScheme: 'blue',
    compactMode: false,
    animations: true
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Profile updated",
        description: "Your profile settings have been saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out"
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-xl border-0 rounded-2xl">
          <CardContent className="p-8">
            <SettingsIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-slate-800">Authentication Required</h2>
            <p className="text-slate-600">Please sign in to access settings</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-slate-600">Manage your account preferences and application settings</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-2 grid w-full grid-cols-2 lg:grid-cols-5 lg:w-auto lg:inline-grid">
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
            <TabsTrigger value="help" className="rounded-xl font-medium flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Help</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  Profile Information
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Update your personal information and profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-semibold">
                      {user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-800">Profile Photo</h3>
                    <p className="text-sm text-slate-600">Upload a new avatar for your profile</p>
                    <Button variant="outline" className="rounded-xl border-slate-200 hover:border-blue-300 hover:bg-blue-50">
                      <Camera className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                  </div>
                </div>

                <Separator className="bg-slate-200" />

                {/* Profile Form */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-sm font-medium text-slate-700">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profileSettings.displayName}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, displayName: e.target.value }))}
                      className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileSettings.email}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, email: e.target.value }))}
                      className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-sm font-medium text-slate-700">Timezone</Label>
                    <Select value={profileSettings.timezone} onValueChange={(value) => setProfileSettings(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="UTC" className="rounded-lg">UTC</SelectItem>
                        <SelectItem value="EST" className="rounded-lg">Eastern Time</SelectItem>
                        <SelectItem value="PST" className="rounded-lg">Pacific Time</SelectItem>
                        <SelectItem value="GMT" className="rounded-lg">Greenwich Mean Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm font-medium text-slate-700">Language</Label>
                    <Select value={profileSettings.language} onValueChange={(value) => setProfileSettings(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="en" className="rounded-lg">English</SelectItem>
                        <SelectItem value="es" className="rounded-lg">Spanish</SelectItem>
                        <SelectItem value="fr" className="rounded-lg">French</SelectItem>
                        <SelectItem value="de" className="rounded-lg">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl h-12 px-8">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Choose how and when you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-800 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </Label>
                      <p className="text-xs text-slate-600">
                        {key === 'emailNotifications' && 'Receive updates via email'}
                        {key === 'pushNotifications' && 'Get push notifications in browser'}
                        {key === 'studyReminders' && 'Reminders for your study schedule'}
                        {key === 'forumUpdates' && 'Notifications for forum discussions'}
                        {key === 'weeklyDigest' && 'Weekly summary of your progress'}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, [key]: checked }))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  Privacy & Security
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Control your privacy and data sharing preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <Label className="text-sm font-medium text-slate-800">Profile Visibility</Label>
                    <p className="text-xs text-slate-600 mb-3">Who can see your profile information</p>
                    <Select value={privacySettings.profileVisibility} onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, profileVisibility: value }))}>
                      <SelectTrigger className="border-slate-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="public" className="rounded-lg">Public</SelectItem>
                        <SelectItem value="students" className="rounded-lg">Students Only</SelectItem>
                        <SelectItem value="private" className="rounded-lg">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {Object.entries(privacySettings).filter(([key]) => key !== 'profileVisibility').map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-slate-800 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <p className="text-xs text-slate-600">
                          {key === 'showEmail' && 'Display your email address on your profile'}
                          {key === 'showStudyStats' && 'Show your study statistics and progress'}
                          {key === 'allowDirectMessages' && 'Allow other students to message you'}
                        </p>
                      </div>
                      <Switch
                        checked={value as boolean}
                        onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, [key]: checked }))}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  Appearance & Theme
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Customize the look and feel of your learning environment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-800">Theme</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {['light', 'dark'].map((theme) => (
                        <div
                          key={theme}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            themeSettings.theme === theme
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => setThemeSettings(prev => ({ ...prev, theme }))}
                        >
                          <div className="text-center">
                            <div className={`w-12 h-8 mx-auto mb-2 rounded ${theme === 'light' ? 'bg-white border' : 'bg-slate-800'}`} />
                            <span className="text-sm font-medium capitalize">{theme}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-800">Color Scheme</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {['blue', 'purple', 'green'].map((color) => (
                        <div
                          key={color}
                          className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${
                            themeSettings.colorScheme === color
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => setThemeSettings(prev => ({ ...prev, colorScheme: color }))}
                        >
                          <div className="text-center">
                            <div className={`w-8 h-8 mx-auto mb-1 rounded-full bg-${color}-500`} />
                            <span className="text-xs font-medium capitalize">{color}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-200" />

                <div className="space-y-4">
                  {Object.entries(themeSettings).filter(([key]) => !['theme', 'colorScheme'].includes(key)).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-slate-800 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <p className="text-xs text-slate-600">
                          {key === 'compactMode' && 'Use a more compact layout to fit more content'}
                          {key === 'animations' && 'Enable smooth animations throughout the app'}
                        </p>
                      </div>
                      <Switch
                        checked={value as boolean}
                        onCheckedChange={(checked) => setThemeSettings(prev => ({ ...prev, [key]: checked }))}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Help & Support */}
          <TabsContent value="help" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg text-slate-800">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-white" />
                    </div>
                    Help & Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start rounded-xl border-slate-200 hover:border-blue-300 hover:bg-blue-50">
                    Documentation
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-xl border-slate-200 hover:border-blue-300 hover:bg-blue-50">
                    Contact Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-xl border-slate-200 hover:border-blue-300 hover:bg-blue-50">
                    Report a Bug
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-xl border-slate-200 hover:border-blue-300 hover:bg-blue-50">
                    Feature Request
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg text-slate-800">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <LogOut className="w-4 h-4 text-white" />
                    </div>
                    Account Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <h4 className="font-medium text-red-800 mb-2">Sign Out</h4>
                    <p className="text-sm text-red-600 mb-4">Sign out of your account on this device</p>
                    <Button onClick={handleSignOut} variant="destructive" className="w-full rounded-xl">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <h4 className="font-medium text-orange-800 mb-2">Account Status</h4>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                      <span className="text-sm text-orange-600">Member since Dec 2024</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
