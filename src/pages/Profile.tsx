
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit, Trophy, Target, BookOpen, Clock } from "lucide-react";

const Profile = () => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button className="flex items-center gap-2">
          <Edit className="w-4 h-4" />
          Edit Profile
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
                  AS
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
                <Input id="username" defaultValue="alex_student" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="alex@student.edu" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                defaultValue="Computer Science student passionate about mathematics and programming. Love sharing knowledge and helping fellow students succeed."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input id="university" defaultValue="University of Technology" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <Input id="major" defaultValue="Computer Science" />
              </div>
            </div>

            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              Save Changes
            </Button>
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
