
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "@/hooks/useProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { profile, isLoading, updateProfile } = useProfile();
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
    location: ''
  });

  const handleEdit = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email,
        regions: (profile as any).regions || '',
        status: (profile as any).status || 'student',
        profession: (profile as any).profession || '',
        location: (profile as any).location || ''
      });
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    await updateProfile({
      full_name: formData.full_name,
      regions: formData.regions,
      status: formData.status,
      profession: formData.profession,
      location: formData.location
    } as any);
    setIsEditing(false);
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
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="relative inline-block mb-4">
            <Avatar className="h-24 w-24 mx-auto">
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
              {profile.email}
            </p>
            <p className="text-muted-foreground text-xs">
              App Mail: {profile.email.split('@')[0]}@tempstoxedu.ac
            </p>
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
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
              
              <div>
                <Label htmlFor="appmail">App Mail</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.email.split('@')[0]}@tempstoxedu.ac
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    {(profile as any).regions || 'Not set'}
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
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="researcher">Researcher</option>
                    <option value="professional">Professional</option>
                  </select>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {(profile as any).status || 'Student'}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    {(profile as any).profession || 'Not set'}
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
                    {(profile as any).location || 'Not set'}
                  </p>
                )}
              </div>
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
  );
};

export default Profile;
