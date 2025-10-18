import { useMemo } from "react";
import { format, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Upload, Users, MessageCircle, Search, Bot, Zap, Star, FileText, Video, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/contexts/useAuth';
import { useRealResources } from '@/hooks/useRealResources';
import { useReminders } from '@/hooks/useReminders';

const formatReminderTypeLabel = (value: string | undefined) => {
  const canonical = value?.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (!canonical) return "General";
  return canonical
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const formatReminderPriorityLabel = (priority: string) =>
  priority
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const Index = () => {
  const { user } = useAuth();
  const { resources, isLoading: resourcesLoading } = useRealResources();
  const { reminders, isLoading: remindersLoading } = useReminders();

  // Derive recent resources for authenticated user (otherwise empty)
  const recentResources = user
    ? resources.slice(0, 2).map(r => ({
      id: r.id,
      title: r.title,
      author: r.author || 'Unknown',
      subject: r.subject || 'General',
      type: (r.resource_type?.toLowerCase().includes('video') ? 'Video' : 'PDF') as 'Video' | 'PDF',
      // Progress would normally come from user_progress join; placeholder 0 until integrated
      progress: 0,
      timeAgo: new Date(r.upload_date).toLocaleDateString()
    }))
    : [];

  // Filter upcoming (incomplete) reminders within next 7 days
  const upcomingReminders = useMemo(() => {
    if (!user) return [] as Array<{
      id: string;
      title: string;
      dueDate: Date;
      priority: 'overdue' | 'high' | 'medium' | 'low';
      type: string;
      typeLabel: string;
      dateLabel: string;
      timeLabel: string;
      isToday: boolean;
    }>;

    const now = new Date();
    return reminders
      .filter((reminder) => !reminder.is_completed)
      .map((reminder) => {
        const dueDate = new Date(reminder.reminder_date);
        const diffHrs = (dueDate.getTime() - now.getTime()) / 36e5;
        let priority: 'overdue' | 'high' | 'medium' | 'low' = 'low';
        if (diffHrs < 0) priority = 'overdue';
        else if (diffHrs <= 24) priority = 'high';
        else if (diffHrs <= 72) priority = 'medium';

        return {
          id: reminder.id,
          title: reminder.title,
          dueDate,
          priority,
          type: reminder.reminder_type || 'general',
          typeLabel: formatReminderTypeLabel(reminder.reminder_type || 'general'),
          dateLabel: format(dueDate, 'MMM d'),
          timeLabel: format(dueDate, 'p'),
          isToday: isToday(dueDate),
        };
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 5);
  }, [reminders, user]);
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 gradient-text">
            Welcome to Student Library
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your comprehensive learning platform with AI-powered assistance, collaborative tools, and endless resources
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          <div className="text-center p-4 bg-card rounded-xl border border-border">
            <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">1000+</div>
            <div className="text-sm text-muted-foreground">Resources</div>
          </div>
          <div className="text-center p-4 bg-card rounded-xl border border-border">
            <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">500+</div>
            <div className="text-sm text-muted-foreground">Students</div>
          </div>
          <div className="text-center p-4 bg-card rounded-xl border border-border">
            <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">50+</div>
            <div className="text-sm text-muted-foreground">Study Groups</div>
          </div>
          <div className="text-center p-4 bg-card rounded-xl border border-border">
            <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1">24/7</div>
            <div className="text-sm text-muted-foreground">AI Support</div>
          </div>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="card-hover bg-card shadow-xl">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Study Resources</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">Access thousands of study materials, notes, and educational content</p>
              <Button asChild className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                <Link to="/resources">Browse Resources</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover bg-card shadow-xl">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">AI Assistant</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">Get instant help with your studies from our AI tutor</p>
              <Button asChild className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                <Link to="/ai-chat">Chat with AI</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover bg-card shadow-xl">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Study Groups</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">Join collaborative study groups and learn together</p>
              <Button asChild className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                <Link to="/study-groups">Join Groups</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover bg-card shadow-xl">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Smart Search</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">Find exactly what you need with advanced search filters</p>
              <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                <Link to="/search">Start Searching</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard-style Preview Sections */}
        {user && (
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {/* Continue Learning Preview */}
            <Card className="lg:col-span-2 shadow-sm bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <BookOpen className="w-5 h-5" />
                      Continue Learning
                    </CardTitle>
                    <CardDescription>Pick up where you left off (after you sign in)</CardDescription>
                  </div>
                  <Link to="/resources">
                    <Button variant="ghost" size="sm" className="text-primary">
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {resourcesLoading && (
                  <div className="text-sm text-muted-foreground">Loading resources...</div>
                )}
                {!resourcesLoading && recentResources.length === 0 && (
                  <div className="text-sm text-muted-foreground">No recent resources yet.</div>
                )}
                {!resourcesLoading && recentResources.map((resource, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-muted cursor-pointer transition-all duration-200 border border-border bg-card">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        {resource.type === 'Video' ? (
                          <Video className="w-6 h-6 text-white" />
                        ) : (
                          <FileText className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{resource.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{resource.author} • {resource.timeAgo}</p>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" className="text-xs">{resource.subject}</Badge>
                        <div className="flex-1">
                          <Progress value={resource.progress} className="h-2" />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{resource.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
                <Link to="/resources">
                  <Button variant="outline" className="w-full">View All Resources</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Today's Schedule Preview */}
            <Card className="shadow-sm bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Calendar className="w-5 h-5" />
                      Today's Schedule
                    </CardTitle>
                    <CardDescription>Your upcoming reminders</CardDescription>
                  </div>
                  <Link to="/reminders">
                    <Button variant="ghost" size="sm" className="text-primary">
                      Show All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {remindersLoading && (
                  <div className="text-sm text-muted-foreground">Loading reminders...</div>
                )}
                {!remindersLoading && upcomingReminders.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">No upcoming reminders</p>
                    <Link to="/reminders">
                      <Button variant="outline" size="sm">Create Reminder</Button>
                    </Link>
                  </div>
                )}
                {!remindersLoading && upcomingReminders.map((reminder) => {
                  const isPastDue = reminder.dueDate < new Date();
                  const scheduleLabel = reminder.isToday
                    ? `Today • ${reminder.timeLabel}`
                    : `${reminder.dateLabel} • ${reminder.timeLabel}`;
                  const priorityLabel = formatReminderPriorityLabel(reminder.priority);

                  return (
                    <div key={reminder.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted border border-border hover:bg-muted/80 transition-colors">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isPastDue
                            ? 'bg-red-500'
                            : reminder.priority === 'high'
                            ? 'bg-orange-500'
                            : reminder.priority === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        aria-hidden
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{reminder.title}</h4>
                        <p className="text-xs text-muted-foreground">{scheduleLabel}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant="secondary" className="text-xs capitalize shrink-0">
                          {reminder.typeLabel}
                        </Badge>
                        <span className={`text-[10px] font-medium uppercase tracking-wide ${
                          isPastDue ? 'text-destructive' : 'text-muted-foreground'
                        }`}>
                          {priorityLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {!remindersLoading && upcomingReminders.length > 0 && (
                  <Link to="/reminders">
                    <Button variant="outline" className="w-full">View All Reminders</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="card-hover bg-card shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Upload className="w-8 h-8 text-indigo-600" />
                <CardTitle className="text-lg">Share Content</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Upload and share your study materials with the community</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/upload">Upload Files</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover bg-card shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-pink-600" />
                <CardTitle className="text-lg">Discussions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Engage in academic discussions and forums</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/forums">Join Discussions</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover bg-card shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-600" />
                <CardTitle className="text-lg">Premium</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Unlock advanced features with premium subscription</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/subscription">Learn More</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Start Learning Today
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Ready to supercharge your learning?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of students who are already using our platform to achieve their academic goals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link to="/resources">Explore Resources</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2">
              <Link to="/ai-chat">Try AI Assistant</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
