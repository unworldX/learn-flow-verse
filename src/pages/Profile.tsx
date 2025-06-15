
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit, Trophy, Target, BookOpen, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Get user initials for avatar fallback
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const userStats = [
    {
      label: "Resources Uploaded",
      value: 23,
      icon: BookOpen,
      color: "text-blue-600"
    },
    {
      label: "Study Hours",
      value: 127,
      icon: Clock,
      color: "text-green-600"
    },
    {
      label: "Goals Completed",
      value: 45,
      icon: Target,
      color: "text-purple-600"
    },
    {
      label: "Achievements",
      value: 12,
      icon: Trophy,
      color: "text-yellow-600"
    }
  ];

  const achievements = [
    {
      title: "Study Streak Master",
      description: "Studied for 7 consecutive days",
      icon: "🔥",
      earned: true
    },
    {
      title: "Knowledge Sharer",
      description: "Uploaded 20+ resources",
      icon: "📚",
      earned: true
    },
    {
      title: "Team Player",
      description: "Active in 5+ study groups",
      icon: "🤝",
      earned: false
    },
    {
      title: "Goal Crusher",
      description: "Completed 50 study goals",
      icon: "🎯",
      earned: false
    }
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Edit className="w-4 h-4" />
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Manage your account details and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl">
                  {getInitials(user.email || 'U')}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">
                  Change Photo
                </Button>
                <p className="text-sm text-muted-foreground mt-1">
                  JPG, PNG or GIF. Max size 2MB
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  defaultValue={user.user_metadata?.username || user.email?.split('@')[0] || ''} 
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={user.email || ''} 
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                defaultValue={user.user_metadata?.bio || ""}
                disabled={!isEditing}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input 
                  id="university" 
                  defaultValue={user.user_metadata?.university || ""} 
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <Input 
                  id="major" 
                  defaultValue={user.user_metadata?.major || ""} 
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p>Account created: {new Date(user.created_at).toLocaleDateString()}</p>
              <p>Last login: {new Date(user.last_sign_in_at || '').toLocaleDateString()}</p>
              <p>Email verified: {user.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
            </div>

            {isEditing && (
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                Save Changes
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userStats.map((stat, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gray-100`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Study Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Weekly Goal</span>
                  <span>65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Monthly Goal</span>
                  <span>80%</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Your learning milestones and accomplishments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  achievement.earned
                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                    : "bg-gray-50 border-gray-200 opacity-60"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium flex items-center gap-2">
                      {achievement.title}
                      {achievement.earned && <Badge variant="secondary">Earned</Badge>}
                    </h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
