
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useProfile, UserProfile } from "@/hooks/useProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Upload, Book, HelpCircle, UploadCloud, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAchievements } from '@/hooks/useAchievements';
import { getAchievementIcon } from '@/lib/achievementIcons';
import { useStudyPlans } from '@/hooks/useStudyPlans';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useReminders } from '@/hooks/useReminders';
import { useRealResources } from '@/hooks/useRealResources';

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) => (
  <Card className="flex flex-col items-center justify-center p-4 text-center">
    <div className={`mb-2 ${color}`}>{icon}</div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </Card>
);

const Profile = () => {
  const { profile, isLoading: profileLoading, updateProfile } = useProfile();
  const { achievements, isLoading: achievementsLoading } = useAchievements();
  // Support legacy or alternate return shapes by normalizing tasks
  interface StudyTask { id: string; plan_id: string; is_completed: boolean }
  interface StudyPlansHookShape { studyPlans: Array<{ id: string; plan_name: string }>; allTasks?: StudyTask[]; tasks?: StudyTask[]; isLoading: boolean }
  const studyPlansHook = useStudyPlans() as StudyPlansHookShape;
  const { studyPlans, isLoading: studyPlansLoading } = studyPlansHook;
  const allTasks: Array<{ id: string; plan_id: string; is_completed: boolean }> = studyPlansHook.allTasks || studyPlansHook.tasks || [];
  const { uploads, isLoading: uploadsLoading } = useFileUpload();
  const { reminders, isLoading: remindersLoading } = useReminders();
  const { resources, isLoading: resourcesLoading } = useRealResources();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    regions: '',
    status: 'student',
    profession: '',
    location: '',
    bio: ''
  });

  const isLoading = profileLoading || achievementsLoading || studyPlansLoading || uploadsLoading || remindersLoading || resourcesLoading;


  // Support either allTasks or tasks array from hook (defensive for API differences)
  const mergedTasks = allTasks;
  const getStudyPlanProgress = (planId: string) => {
    const tasksForPlan = mergedTasks.filter(task => task.plan_id === planId);
    if (tasksForPlan.length === 0) return 0;
    const completedTasks = tasksForPlan.filter(task => task.is_completed).length;
    return Math.round((completedTasks / tasksForPlan.length) * 100);
  };



  const handleEdit = () => {
    if (profile) {
      const extended = profile as UserProfile & { regions?: string | null; status?: string | null; profession?: string | null; location?: string | null; bio?: string | null };
      setFormData({
        full_name: extended.full_name || '',
        email: extended.email,
        regions: extended.regions || '',
        status: extended.status || 'student',
        profession: extended.profession || '',
        location: extended.location || '',
        bio: extended.bio || ''
      // Auto-award (client side heuristic) – could be moved server-side for security
      });
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    type Updatable = Partial<UserProfile> & { bio?: string | null };
    const payload: Updatable = {
      full_name: formData.full_name,
      regions: formData.regions,
      status: formData.status,
      profession: formData.profession,
      location: formData.location,
      bio: formData.bio
    };
    await updateProfile(payload);

    {
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved."
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await updateProfile({
        avatar_url: data.publicUrl
      });

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully"
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-48 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Unable to load profile data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="text-center">
              <div className="relative inline-block mb-4 mx-auto">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Upload className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <CardTitle className="text-2xl">
                {profile.full_name || profile.email.split('@')[0]}
              </CardTitle>
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">
                  {profile.email.split('@')[0]}@tempstoxedu.ac
                </p>
                {/* <p className="text-muted-foreground text-xs">
                  App Mail: {profile.email.split('@')[0]}@tempstoxedu.ac
                </p> */}
              </div>
            </CardHeader>
            
            <Separator />
            
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {profile.full_name || 'Not set'}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Original Email</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="regions">Region</Label>
                    {isEditing ? (
                      <Input
                        id="regions"
                        value={formData.regions}
                        onChange={(e) => setFormData({ ...formData, regions: e.target.value })}
                        placeholder="e.g., North America, Europe"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {(profile as UserProfile & { regions?: string | null }).regions || 'Not set'}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status</Label>
                    {isEditing ? (
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full mt-1 p-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="researcher">Researcher</option>
                        <option value="professional">Professional</option>
                      </select>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {(profile as UserProfile & { status?: string | null }).status || 'Student'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profession">Profession</Label>
                    {isEditing ? (
                      <Input
                        id="profession"
                        value={formData.profession}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        placeholder="e.g., Computer Science, Medicine"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {(profile as UserProfile & { profession?: string | null }).profession || 'Not set'}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location</Label>
                    {isEditing ? (
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., New York, London"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {(profile as UserProfile & { location?: string | null }).location || 'Not set'}
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us a little about yourself"
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                      {(profile as UserProfile & { bio?: string | null }).bio || 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Member Since</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave}>
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleEdit}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              ) : (
                <>
                  <StatCard icon={<Book size={24} />} label="Study Plans" value={studyPlans.length} color="text-blue-500" />
                  <StatCard icon={<HelpCircle size={24} />} label="Resources" value={resources.length} color="text-green-500" />
                  <StatCard icon={<UploadCloud size={24} />} label="Uploads" value={uploads.length} color="text-purple-500" />
                  <StatCard icon={<Star size={24} />} label="Reminders" value={reminders.length} color="text-yellow-500" />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Study Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
              ) : (
                studyPlans.slice(0, 3).map(plan => (
                  <div key={plan.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{plan.plan_name}</span>
                      <span className="text-sm font-medium">{getStudyPlanProgress(plan.id)}%</span>
                    </div>
                    <Progress value={getStudyPlanProgress(plan.id)} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <Skeleton className="h-4 w-16 mt-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {achievements.map(ach => {
                    const Icon = getAchievementIcon(ach.icon || ach.name);
                    const earned = !!ach.earned;
                    const tier = (ach.tier || '').toLowerCase();
                    const ringColor = earned ? (
                      tier === 'gold' ? 'ring-yellow-400' : tier === 'silver' ? 'ring-gray-300' : tier === 'bronze' ? 'ring-amber-600' : 'ring-primary'
                    ) : 'ring-muted';
                    const bgGradient = earned ? (
                      tier === 'gold' ? 'bg-gradient-to-br from-yellow-200 to-yellow-500' : tier === 'silver' ? 'bg-gradient-to-br from-gray-200 to-gray-400' : tier === 'bronze' ? 'bg-gradient-to-br from-amber-200 to-amber-600' : 'bg-gradient-to-br from-primary/30 to-primary'
                    ) : 'bg-muted';
                    return (
                      <div key={ach.id} className="flex flex-col items-center text-center">
                        <div className={`relative h-14 w-14 rounded-full flex items-center justify-center ring-2 ${ringColor} ${bgGradient} transition-all`}> 
                          <Icon size={28} className={earned ? 'text-black/70 dark:text-white' : 'text-muted-foreground'} />
                          {!earned && <div className="absolute inset-0 bg-black/40 rounded-full backdrop-blur-[1px]" />}
                        </div>
                        <span className="text-[11px] mt-2 font-medium line-clamp-2">{ach.name}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{tier || 'common'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="mt-3 text-[11px] text-muted-foreground">Earn badges by completing actions. Tiers: Bronze, Silver, Gold.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
