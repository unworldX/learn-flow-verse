
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, Bell, Clock, Calendar as CalendarIcon, AlertCircle, CheckCircle, Trash2, Edit, Filter } from "lucide-react";

const Reminders = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [readFilter, setReadFilter] = useState("all");

  const mockReminders = [
    {
      id: 1,
      title: "Math Quiz Tomorrow",
      description: "Review chapters 5-7 for tomorrow's quiz",
      dueDate: "2024-12-16T10:00:00",
      priority: "high",
      isCompleted: false,
      isRead: true,
      type: "exam",
      notificationEnabled: true
    },
    {
      id: 2,
      title: "Submit History Essay",
      description: "Essay on World War II due by midnight",
      dueDate: "2024-12-17T23:59:00",
      priority: "medium",
      isCompleted: false,
      isRead: false,
      type: "assignment",
      notificationEnabled: true
    },
    {
      id: 3,
      title: "Group Study Session",
      description: "Chemistry study group at library",
      dueDate: "2024-12-18T15:00:00",
      priority: "low",
      isCompleted: true,
      isRead: true,
      type: "study",
      notificationEnabled: false
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "exam": return AlertCircle;
      case "assignment": return Clock;
      case "study": return CalendarIcon;
      default: return Bell;
    }
  };

  const filteredReminders = (reminders) => {
    return reminders.filter(reminder => {
      if (readFilter === "all") return true;
      if (readFilter === "read") return reminder.isRead;
      if (readFilter === "unread") return !reminder.isRead;
      return true;
    });
  };

  const upcomingReminders = filteredReminders(mockReminders.filter(r => !r.isCompleted));
  const completedReminders = filteredReminders(mockReminders.filter(r => r.isCompleted));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reminders
            </h1>
            <p className="text-slate-600 mt-2">Stay on top of your deadlines and study schedule</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl h-12">
                <Plus className="w-5 h-5 mr-2" />
                New Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 rounded-2xl border-0 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-800">Create Reminder</DialogTitle>
                <DialogDescription className="text-slate-600">Never miss an important deadline again</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-slate-700">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Math Quiz Tomorrow"
                    className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Add more details..."
                    rows={3}
                    className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium text-slate-700">Type</Label>
                    <Select>
                      <SelectTrigger className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="exam" className="rounded-lg">Exam</SelectItem>
                        <SelectItem value="assignment" className="rounded-lg">Assignment</SelectItem>
                        <SelectItem value="study" className="rounded-lg">Study Session</SelectItem>
                        <SelectItem value="other" className="rounded-lg">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority" className="text-sm font-medium text-slate-700">Priority</Label>
                    <Select>
                      <SelectTrigger className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="high" className="rounded-lg">High</SelectItem>
                        <SelectItem value="medium" className="rounded-lg">Medium</SelectItem>
                        <SelectItem value="low" className="rounded-lg">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="dueDate" className="text-sm font-medium text-slate-700">Due Date & Time *</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <Label htmlFor="notifications" className="text-sm font-medium text-slate-700">Enable Notifications</Label>
                    <p className="text-xs text-slate-500">Get notified before the deadline</p>
                  </div>
                  <Switch id="notifications" />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => setIsCreateOpen(false)} variant="outline" className="flex-1 rounded-xl border-slate-200">
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl">
                    Create Reminder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">{upcomingReminders.length}</div>
              <div className="text-sm opacity-90">Upcoming</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">{completedReminders.length}</div>
              <div className="text-sm opacity-90">Completed</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">2</div>
              <div className="text-sm opacity-90">High Priority</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">Today</div>
              <div className="text-sm opacity-90">1 Due</div>
            </CardContent>
          </Card>
        </div>

        {/* Read Status Filter */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-600" />
                <Label className="text-sm font-medium text-slate-700">Read Status</Label>
              </div>
              <ToggleGroup
                type="single"
                value={readFilter}
                onValueChange={(value) => { if (value) setReadFilter(value) }}
                className="justify-start flex-wrap"
              >
                <ToggleGroupItem value="all" aria-label="All" className="rounded-xl">All</ToggleGroupItem>
                <ToggleGroupItem value="read" aria-label="Read" className="rounded-xl">Read</ToggleGroupItem>
                <ToggleGroupItem value="unread" aria-label="Unread" className="rounded-xl">Unread</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg text-slate-800">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-white" />
                </div>
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-xl border-0 w-full"
              />
            </CardContent>
          </Card>

          {/* Reminders List */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-2 grid w-full grid-cols-2">
                <TabsTrigger value="upcoming" className="rounded-xl font-medium">Upcoming</TabsTrigger>
                <TabsTrigger value="completed" className="rounded-xl font-medium">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingReminders.length === 0 ? (
                  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
                    <CardContent className="p-12 text-center">
                      <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-600 mb-2">No upcoming reminders</h3>
                      <p className="text-slate-500 mb-6">Create your first reminder to stay organized</p>
                      <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Reminder
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  upcomingReminders.map(reminder => {
                    const IconComponent = getTypeIcon(reminder.type);
                    const isOverdue = new Date(reminder.dueDate) < new Date();
                    
                    return (
                      <Card key={reminder.id} className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm rounded-2xl ${isOverdue ? 'ring-2 ring-red-200' : ''} ${!reminder.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getPriorityColor(reminder.priority)}`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-slate-800">{reminder.title}</h3>
                                  {!reminder.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${getPriorityColor(reminder.priority)} text-white hover:${getPriorityColor(reminder.priority)} rounded-lg`}>
                                    {reminder.priority}
                                  </Badge>
                                  {reminder.notificationEnabled && (
                                    <Badge variant="outline" className="rounded-lg">
                                      <Bell className="w-3 h-3 mr-1" />
                                      Notifications
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-slate-600 text-sm">{reminder.description}</p>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-500">
                                  Due: {new Date(reminder.dueDate).toLocaleDateString()} at {new Date(reminder.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {completedReminders.length === 0 ? (
                  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
                    <CardContent className="p-12 text-center">
                      <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-600 mb-2">No completed reminders</h3>
                      <p className="text-slate-500">Completed reminders will appear here</p>
                    </CardContent>
                  </Card>
                ) : (
                  completedReminders.map(reminder => {
                    const IconComponent = getTypeIcon(reminder.type);
                    
                    return (
                      <Card key={reminder.id} className="border-0 shadow-lg bg-white/60 backdrop-blur-sm rounded-2xl opacity-75">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <h3 className="font-semibold text-slate-600 line-through">{reminder.title}</h3>
                              <p className="text-slate-500 text-sm">{reminder.description}</p>
                              <div className="text-sm text-slate-400">
                                Completed: {new Date(reminder.dueDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reminders;
