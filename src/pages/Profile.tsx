
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit, Trophy, Target, BookOpen, Clock, Camera } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const userStats = [
    {
      label: "Resources Uploaded",
      value: 23,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      label: "Study Hours",
      value: 127,
      icon: Clock,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      label: "Goals Completed",
      value: 45,
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      label: "Achievements",
      value: 12,
      icon: Trophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
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
        <div className="text-lg text-slate-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
          <p className="text-slate-600">Manage your account and track progress</p>
        </div>
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Edit className="w-4 h-4" />
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <Card className="lg:col-span-2 border-0 shadow-sm bg-white">
          <CardHeader className="pb-6">
            <CardTitle className="text-slate-800">Profile Information</CardTitle>
            <CardDescription>Manage your account details and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl">
                    {getInitials(user.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  size="icon" 
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 bg-white shadow-md hover:shadow-lg border-2 border-white"
                  variant="ghost"
                >
                  <Camera className="w-4 h-4 text-slate-600" />
                </Button>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-1">
                  {user.user_metadata?.username || user.email?.split('@')[0] || 'Student'}
                </h3>
                <p className="text-slate-600 mb-3">{user.email}</p>
                <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 font-medium">Username</Label>
                <Input 
                  id="username" 
                  defaultValue={user.user_metadata?.username || user.email?.split('@')[0] || ''} 
                  disabled={!isEditing}
                  className="border-slate-200 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={user.email || ''} 
                  disabled={!isEditing}
                  className="border-slate-200 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-slate-700 font-medium">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                defaultValue={user.user_metadata?.bio || ""}
                disabled={!isEditing}
                className="border-slate-200 focus:border-blue-500 min-h-[100px]"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="university" className="text-slate-700 font-medium">University</Label>
                <Input 
                  id="university" 
                  defaultValue={user.user_metadata?.university || ""} 
                  disabled={!isEditing}
                  className="border-slate-200 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major" className="text-slate-700 font-medium">Major</Label>
                <Input 
                  id="major" 
                  defaultValue={user.user_metadata?.major || ""} 
                  disabled={!isEditing}
                  className="border-slate-200 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <h4 className="font-medium text-slate-800">Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                <div>
                  <span className="font-medium">Created:</span> {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Last login:</span> {new Date(user.last_sign_in_at || '').toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Email verified:</span> {user.email_confirmed_at ? '✅ Yes' : '❌ No'}
                </div>
              </div>
            </div>

            {isEditing && (
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90">
                Save Changes
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Stats & Progress */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-slate-800">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userStats.map((stat, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{stat.value}</p>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-slate-800">Study Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700">Weekly Goal</span>
                  <span className="text-slate-600">65%</span>
                </div>
                <Progress value={65} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700">Monthly Goal</span>
                  <span className="text-slate-600">80%</span>
                </div>
                <Progress value={80} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Achievements */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-slate-800">Achievements</CardTitle>
          <CardDescription>Your learning milestones and accomplishments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border transition-all duration-300 ${
                  achievement.earned
                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-md"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-1">
                      {achievement.title}
                      {achievement.earned && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Earned</Badge>}
                    </h4>
                    <p className="text-sm text-slate-600">{achievement.description}</p>
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
