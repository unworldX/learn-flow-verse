
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Target, TrendingUp, FileText, Video, Calendar, ArrowRight, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();

  const getFirstName = () => {
    if (user?.user_metadata?.username) {
      return user.user_metadata.username;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Student';
  };

  const quickStats = [
    {
      title: "Study Time Today",
      value: "2h 30m",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+15min from yesterday"
    },
    {
      title: "Resources Read",
      value: "12",
      icon: FileText,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      change: "+3 this week"
    },
    {
      title: "Goals Completed",
      value: "8/12",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "67% complete"
    },
    {
      title: "Study Streak",
      value: "7 days",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "Personal best!"
    },
  ];

  const recentResources = [
    {
      title: "Advanced Calculus Notes",
      author: "Prof. Johnson",
      subject: "Mathematics",
      progress: 75,
      type: "PDF",
      timeAgo: "2 hours ago"
    },
    {
      title: "React Hooks Tutorial",
      author: "Tech Academy",
      subject: "Computer Science",
      progress: 45,
      type: "Video",
      timeAgo: "1 day ago"
    }
  ];

  const todayReminders = [
    {
      title: "Submit Physics Assignment",
      time: "3:00 PM",
      type: "assignment",
      priority: "high"
    },
    {
      title: "Study Group Meeting",
      time: "5:30 PM",
      type: "meeting",
      priority: "medium"
    }
  ];

  const recommendations = [
    {
      title: "Linear Algebra Fundamentals",
      author: "Prof. Martinez",
      subject: "Mathematics",
      rating: 4.8,
      type: "Video Series",
      thumbnail: "🔢"
    },
    {
      title: "Organic Chemistry Guide",
      author: "Dr. Wilson",
      subject: "Chemistry",
      rating: 4.9,
      type: "PDF Notes",
      thumbnail: "⚗️"
    },
    {
      title: "Data Structures & Algorithms",
      author: "Tech Academy",
      subject: "Computer Science",
      rating: 4.7,
      type: "Interactive",
      thumbnail: "💻"
    }
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {getFirstName()}! 👋</h1>
          <p className="text-blue-100 text-lg">Ready to continue your learning journey? You're doing great!</p>
        </div>
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full"></div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <Badge variant="secondary" className="text-xs">{stat.change}</Badge>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 mb-1">{stat.value}</p>
                <p className="text-sm text-slate-600">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Resources */}
        <Card className="lg:col-span-2 border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <BookOpen className="w-5 h-5" />
                  Continue Learning
                </CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentResources.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">No resources yet</h3>
                <p className="text-slate-600 mb-6">Start exploring resources to see them here</p>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Browse Resources
                </Button>
              </div>
            ) : (
              <>
                {recentResources.map((resource, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-slate-50 cursor-pointer transition-all duration-200 border border-slate-100">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        {resource.type === "Video" ? (
                          <Video className="w-6 h-6 text-white" />
                        ) : (
                          <FileText className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 truncate">{resource.title}</h4>
                      <p className="text-sm text-slate-600 mb-2">{resource.author} • {resource.timeAgo}</p>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" className="text-xs">
                          {resource.subject}
                        </Badge>
                        <div className="flex-1">
                          <Progress value={resource.progress} className="h-2" />
                        </div>
                        <span className="text-xs text-slate-600 font-medium">{resource.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  View All Resources
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Calendar className="w-5 h-5" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Your upcoming tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayReminders.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-600 mb-2">No reminders today</p>
                <p className="text-sm text-slate-500 mb-4">Add tasks to stay organized</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reminder
                </Button>
              </div>
            ) : (
              <>
                {todayReminders.map((reminder, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className={`w-3 h-3 rounded-full ${
                      reminder.priority === 'high' ? 'bg-red-500' : 
                      reminder.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">{reminder.title}</h4>
                      <p className="text-sm text-slate-600">{reminder.time}</p>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-800">Recommended for You</CardTitle>
              <CardDescription>Discover new learning resources</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {recommendations.map((item, index) => (
              <div key={index} className="group p-6 border border-slate-200 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer bg-white hover:border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">{item.thumbnail}</div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-yellow-600">⭐</span>
                    <span className="text-sm font-medium text-slate-700">{item.rating}</span>
                  </div>
                </div>
                <h4 className="font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                <p className="text-sm text-slate-600 mb-3">{item.author}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{item.subject}</Badge>
                  <span className="text-xs text-slate-500">{item.type}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
