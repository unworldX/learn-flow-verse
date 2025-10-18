import { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Bell, Shield, Palette, Bot, HelpCircle, Settings as SettingsIcon, Key, Database, Zap } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useSettingsEffects } from "@/hooks/useSettingsEffects";
import { useAISettings } from "@/hooks/useAISettings";
import { useAuth } from "@/contexts/useAuth"
import { useToast } from "@/hooks/use-toast";
import { AI_PROVIDERS, PROVIDER_KEYS } from "@/config/aiProviders";
import { cacheService } from "@/lib/cacheService";
import { notificationService } from "@/lib/notificationService";
import { privacyService } from "@/lib/privacyService";
import { aiFeatureService } from "@/lib/aiFeatureService";
import { useProfile } from "@/hooks/useProfile";
import { Link } from "react-router-dom";
import SidebarControl from "@/components/settings/SidebarControl";
import { useSidebar, type SidebarMode } from "@/components/ui/sidebar";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings, isLoading: settingsLoading, isSaving: settingsSaving, updateSettings } = useUserSettings();
  const { profile, isLoading: profileLoading } = useProfile();
  
  // Apply settings effects (theme, font size, etc.)
  useSettingsEffects(settings);
  
  // Initialize services when settings load
  useEffect(() => {
    if (settings && user) {
      notificationService.loadPreferences(user.id);
      notificationService.updatePreferences({
        email_notifications: settings.email_notifications,
        push_notifications: settings.push_notifications,
        study_reminders: settings.study_reminders,
        new_messages: settings.new_messages,
      });
      
      privacyService.loadSettings(user.id);
      privacyService.updateSettings({
        profile_visibility: settings.profile_visibility,
        activity_status: settings.activity_status,
        data_collection: settings.data_collection,
      });
      
      aiFeatureService.updateSettings({
        ai_suggestions: settings.ai_suggestions,
        ai_autocomplete: settings.ai_autocomplete,
      });
    }
  }, [settings, user]);
  
  const {
    apiKeys,
    provider,
    model,
    setProvider,
    setModel,
    saveApiKey,
    getCurrentModels,
    saveSettings: saveAISettings,
    clearAllApiKeys,
    isLoading: aiLoading
  } = useAISettings();
  const { mode: sidebarMode, setMode: setSidebarModeInContext } = useSidebar();

  const [newApiKey, setNewApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(provider);
  const sidebarToastGuard = useRef(false);

  const handleClearCache = async () => {
    try {
      await cacheService.clear();
      toast({
        title: "Cache cleared",
        description: "All cached data has been cleared successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache.",
        variant: "destructive"
      });
    }
  };

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key.",
        variant: "destructive"
      });
      return;
    }

    await saveApiKey(selectedProvider, newApiKey.trim());
    setNewApiKey('');
  };

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    setSelectedProvider(newProvider);
    const models = getCurrentModels(newProvider);
    if (models.length > 0) {
      setModel(models[0]);
    }
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
  };

  const handleSaveAISettings = async () => {
    await saveAISettings();
    toast({
      title: "AI Settings saved",
      description: "Your AI provider and model settings have been saved."
    });
  };

  const handleSidebarModeChange = (mode: SidebarMode) => {
    setSidebarModeInContext(mode);
    if (!sidebarToastGuard.current) {
      sidebarToastGuard.current = true;
      return;
    }
    toast({
      title: "Sidebar preference updated",
      description:
        mode === "expanded"
          ? "Sidebar will stay open for instant navigation."
          : mode === "collapsed"
            ? "Sidebar will collapse to icons to maximize workspace."
            : "Sidebar will expand whenever you hover to preview contents.",
    });
  };

  if (settingsLoading || !settings || profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-96 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application preferences</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card border border-border shadow-lg rounded-2xl p-2 grid w-full grid-cols-3 lg:grid-cols-7 lg:w-auto lg:inline-grid">
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
          <TabsTrigger value="system" className="rounded-xl font-medium flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="help" className="rounded-xl font-medium flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Help</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="shadow-lg bg-card border border-border">
            <CardHeader className="rounded-t-lg flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link to="/profile">Edit Profile</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <p className="text-sm text-muted-foreground">{profile?.full_name || 'Not set'}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="text-sm text-muted-foreground">{profile?.location || 'Not set'}</p>
                </div>
                <div>
                  <Label>Profession</Label>
                  <p className="text-sm text-muted-foreground">{profile?.profession || 'Not set'}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Status</Label>
                <p className="text-sm text-muted-foreground">{profile?.status || 'Not set'}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Subscription Status</Label>
                <div className="text-sm text-muted-foreground">
                  <p>Plan: Free (Basic features)</p>
                  <p>Resources Downloaded: 0/5</p>
                  <p>Groups Joined: 0/1</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="shadow-lg bg-card border border-border">
            <CardHeader className="rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) => updateSettings({ email_notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications</p>
                  </div>
                  <Switch
                    checked={settings.push_notifications}
                    onCheckedChange={(checked) => updateSettings({ push_notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Study Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get reminded about study sessions</p>
                  </div>
                  <Switch
                    checked={settings.study_reminders}
                    onCheckedChange={(checked) => updateSettings({ study_reminders: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Messages</Label>
                    <p className="text-sm text-muted-foreground">Get notified of new messages</p>
                  </div>
                  <Switch
                    checked={settings.new_messages}
                    onCheckedChange={(checked) => updateSettings({ new_messages: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card className="shadow-lg bg-card border border-border">
            <CardHeader className="rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-muted-foreground">Control who can see your profile</p>
                  </div>
                  <Switch
                    checked={settings.profile_visibility}
                    onCheckedChange={(checked) => updateSettings({ profile_visibility: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Activity Status</Label>
                    <p className="text-sm text-muted-foreground">Show when you're online</p>
                  </div>
                  <Switch
                    checked={settings.activity_status}
                    onCheckedChange={(checked) => updateSettings({ activity_status: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Data Collection</Label>
                    <p className="text-sm text-muted-foreground">Allow anonymous usage data collection</p>
                  </div>
                  <Switch
                    checked={settings.data_collection}
                    onCheckedChange={(checked) => updateSettings({ data_collection: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="shadow-lg bg-card border border-border">
            <CardHeader className="rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value) => updateSettings({ theme: value as 'light' | 'dark' | 'auto' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Font Size</Label>
                  <Select
                    value={settings.font_size}
                    onValueChange={(value) => updateSettings({ font_size: value as 'small' | 'medium' | 'large' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <SidebarControl
                initialMode={sidebarMode}
                onSidebarModeChange={handleSidebarModeChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card className="shadow-lg bg-card border border-border">
            <CardHeader className="rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                AI Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* AI Preferences */}
              <div className="space-y-4">
                <h3 className="font-semibold">AI Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>AI Suggestions</Label>
                      <p className="text-sm text-muted-foreground">Get AI-powered suggestions</p>
                    </div>
                    <Switch
                      checked={settings.ai_suggestions}
                      onCheckedChange={(checked) => updateSettings({ ai_suggestions: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>AI Autocomplete</Label>
                      <p className="text-sm text-muted-foreground">Enable AI autocomplete features</p>
                    </div>
                    <Switch
                      checked={settings.ai_autocomplete}
                      onCheckedChange={(checked) => updateSettings({ ai_autocomplete: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* API Keys Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Keys
                  </h3>
                  <Button variant="outline" size="sm" onClick={clearAllApiKeys}>
                    Clear All Keys
                  </Button>
                </div>

                <div className="grid gap-4">
                  {PROVIDER_KEYS.map((providerKey) => {
                    const providerInfo = AI_PROVIDERS[providerKey];
                    const hasKey = !!apiKeys[providerInfo.keyName];

                    return (
                      <div key={providerKey} className="border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{providerInfo.name}</h4>
                            <p className="text-sm text-muted-foreground">{providerInfo.description}</p>
                          </div>
                          <Badge variant={hasKey ? "default" : "secondary"}>
                            {hasKey ? "Configured" : "Not Set"}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Input
                            placeholder={providerInfo.placeholder}
                            value={selectedProvider === providerKey ? newApiKey : ''}
                            onChange={(e) => {
                              setSelectedProvider(providerKey);
                              setNewApiKey(e.target.value);
                            }}
                            type="password"
                          />
                          <Button
                            onClick={handleSaveApiKey}
                            disabled={!newApiKey.trim() || selectedProvider !== providerKey}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Provider & Model Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold">Default AI Provider</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Provider</Label>
                    <Select value={provider} onValueChange={handleProviderChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDER_KEYS.map((key) => (
                          <SelectItem key={key} value={key}>
                            {AI_PROVIDERS[key].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Model</Label>
                    <Select value={model} onValueChange={handleModelChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getCurrentModels(provider).map((modelName) => (
                          <SelectItem key={modelName} value={modelName}>
                            {modelName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSaveAISettings} disabled={aiLoading}>
                  Save AI Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card className="shadow-lg bg-card border border-border">
            <CardHeader className="rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Cache Management</Label>
                  <p className="text-sm text-muted-foreground mb-2">Clear cached data to improve performance</p>
                  <Button onClick={handleClearCache} variant="outline">
                    <Zap className="w-4 h-4 mr-2" />
                    Clear Cache
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="space-y-6">
          <Card className="shadow-lg bg-card border border-border">
            <CardHeader className="rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Help & Support
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Documentation</h3>
                    <p className="text-sm text-muted-foreground">Learn how to use all features of the platform</p>
                  </div>
                  <Button asChild variant="outline">
                    <a href="https://github.com/GURSHARN219/library/blob/main/README.md" target="_blank" rel="noopener noreferrer">
                      View Docs
                    </a>
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Contact Support</h3>
                    <p className="text-sm text-muted-foreground">Get help from our support team</p>
                  </div>
                  <Button asChild variant="outline">
                    <a href="mailto:support@studentlibrary.com?subject=Support Request" target="_blank" rel="noopener noreferrer">
                      Email Support
                    </a>
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Report a Bug</h3>
                    <p className="text-sm text-muted-foreground">Help us improve by reporting issues</p>
                  </div>
                  <Button asChild variant="outline">
                    <a href="https://github.com/GURSHARN219/library/issues/new" target="_blank" rel="noopener noreferrer">
                      Report Issue
                    </a>
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Version Information</h3>
                    <p className="text-sm text-muted-foreground">Student Library Platform v1.0.0</p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText('v1.0.0');
                      toast({
                        title: "Version copied",
                        description: "Version number copied to clipboard"
                      });
                    }}
                  >
                    Copy Version
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Keyboard Shortcuts</h3>
                    <p className="text-sm text-muted-foreground">View all available keyboard shortcuts</p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Keyboard Shortcuts",
                        description: "Ctrl+K: Search, Ctrl+B: Toggle Sidebar, Ctrl+/: Show shortcuts"
                      });
                    }}
                  >
                    View Shortcuts
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
