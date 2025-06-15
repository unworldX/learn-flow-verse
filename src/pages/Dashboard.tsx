
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Target, TrendingUp, FileText, Video, Calendar } from "lucide-react";

const Dashboard = () => {
  const quickStats = [
    {
      title: "Study Time Today",
      value: "2h 45m",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Notes Read",
      value: "12",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Goals Completed",
      value: "3/5",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Study Streak",
      value: "7 days",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const recentResources = [
    {
      title: "Advanced Calculus Notes",
      author: "Dr. Smith",
      subject: "Mathematics",
      type: "PDF",
      progress: 75,
    },
    {
      title: "Physics Lecture Series",
      author: "Prof. Johnson",
      subject: "Physics",
      type: "Video",
      progress: 45,
    },
    {
      title: "Chemistry Lab Manual",
      author: "Lab Team",
      subject: "Chemistry",
      type: "PDF",
      progress: 100,
    },
  ];

  const todayReminders = [
    {
      title: "Math Assignment Due",
      time: "2:00 PM",
      type: "assignment",
    },
    {
      title: "Study Group Meeting",
      time: "4:30 PM",
      type: "meeting",
    },
    {
      title: "Review Chemistry Notes",
      time: "7:00 PM",
      type: "study",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, Alex! 👋</h1>
        <p className="opacity-90">Ready to continue your learning journey? You're doing great!</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Recently Viewed
            </CardTitle>
            <CardDescription>Continue where you left off</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentResources.map((resource, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex-shrink-0">
                  {resource.type === "Video" ? (
                    <Video className="w-8 h-8 text-red-500" />
                  ) : (
                    <FileText className="w-8 h-8 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{resource.title}</h4>
                  <p className="text-sm text-muted-foreground">{resource.author}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {resource.subject}
                    </Badge>
                    <div className="flex-1">
                      <Progress value={resource.progress} className="h-2" />
                    </div>
                    <span className="text-xs text-muted-foreground">{resource.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View All Resources
            </Button>
          </CardContent>
        </Card>

        {/* Today's Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Don't miss these important events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayReminders.map((reminder, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <h4 className="font-medium">{reminder.title}</h4>
                  <p className="text-sm text-muted-foreground">{reminder.time}</p>
                </div>
                <Badge 
                  variant={reminder.type === "assignment" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {reminder.type}
                </Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View Full Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended for You</CardTitle>
          <CardDescription>Based on your recent activity and interests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "Linear Algebra Fundamentals",
                author: "Prof. Martinez",
                subject: "Mathematics",
                rating: 4.8,
                type: "Video Series"
              },
              {
                title: "Organic Chemistry Study Guide",
                author: "Dr. Wilson",
                subject: "Chemistry",
                rating: 4.9,
                type: "PDF Notes"
              },
              {
                title: "Data Structures & Algorithms",
                author: "Tech Academy",
                subject: "Computer Science",
                rating: 4.7,
                type: "Interactive"
              }
            ].map((item, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <h4 className="font-medium mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">{item.author}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{item.subject}</Badge>
                  <span className="text-sm text-yellow-600">⭐ {item.rating}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{item.type}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
