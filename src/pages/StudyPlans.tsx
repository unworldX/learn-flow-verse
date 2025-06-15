
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar as CalendarIcon, Target, Clock, BookOpen, CheckCircle2, Circle, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isWithinInterval } from "date-fns";

const StudyPlans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studyPlans, setStudyPlans] = useState([]);
  const [planTasks, setPlanTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("daily");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const [planData, setPlanData] = useState({
    plan_name: "",
    description: "",
    start_date: "",
    end_date: ""
  });

  const [taskData, setTaskData] = useState({
    task_name: "",
    description: "",
    due_date: "",
    resource_id: null
  });

  const subjects = [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "Literature", "History", "Geography", "Economics", "Psychology"
  ];

  const subjectColors = {
    "Mathematics": "bg-blue-500",
    "Physics": "bg-purple-500", 
    "Chemistry": "bg-green-500",
    "Biology": "bg-yellow-500",
    "Computer Science": "bg-red-500",
    "Literature": "bg-pink-500",
    "History": "bg-orange-500",
    "Geography": "bg-teal-500",
    "Economics": "bg-indigo-500",
    "Psychology": "bg-cyan-500"
  };

  useEffect(() => {
    if (user) {
      fetchStudyPlans();
      fetchPlanTasks();
    }
  }, [user]);

  const fetchStudyPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudyPlans(data || []);
    } catch (error) {
      console.error('Error fetching study plans:', error);
      toast({
        title: "Error",
        description: "Failed to load study plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('study_plan_tasks')
        .select(`
          *,
          study_plans!inner(user_id, plan_name),
          resources(title, subject)
        `)
        .eq('study_plans.user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setPlanTasks(data || []);
    } catch (error) {
      console.error('Error fetching plan tasks:', error);
    }
  };

  const createStudyPlan = async () => {
    if (!planData.plan_name || !planData.start_date || !planData.end_date) {
      toast({
        title: "Missing required fields",
        description: "Please fill in plan name, start date, and end date",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('study_plans')
        .insert({
          ...planData,
          user_id: user.id,
          start_date: new Date(planData.start_date).toISOString(),
          end_date: new Date(planData.end_date).toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Study plan created successfully"
      });

      setPlanData({ plan_name: "", description: "", start_date: "", end_date: "" });
      setIsCreateOpen(false);
      fetchStudyPlans();
    } catch (error) {
      console.error('Error creating study plan:', error);
      toast({
        title: "Error",
        description: "Failed to create study plan",
        variant: "destructive"
      });
    }
  };

  const createTask = async () => {
    if (!taskData.task_name || !taskData.due_date || !selectedPlan) {
      toast({
        title: "Missing required fields",
        description: "Please fill in task name, due date, and select a plan",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('study_plan_tasks')
        .insert({
          ...taskData,
          plan_id: selectedPlan,
          due_date: new Date(taskData.due_date).toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task created successfully"
      });

      setTaskData({ task_name: "", description: "", due_date: "", resource_id: null });
      setIsTaskOpen(false);
      fetchPlanTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    }
  };

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('study_plan_tasks')
        .update({ is_completed: !currentStatus })
        .eq('id', taskId);

      if (error) throw error;
      fetchPlanTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getTasksForDate = (date) => {
    return planTasks.filter(task => {
      const taskDate = new Date(task.due_date);
      return isSameDay(taskDate, date);
    });
  };

  const getTasksForPeriod = () => {
    let startDate, endDate;
    
    switch (viewMode) {
      case "weekly":
        startDate = startOfWeek(selectedDate);
        endDate = endOfWeek(selectedDate);
        break;
      case "monthly":
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
        break;
      default: // daily
        return getTasksForDate(selectedDate);
    }

    return planTasks.filter(task => {
      const taskDate = new Date(task.due_date);
      return isWithinInterval(taskDate, { start: startDate, end: endDate });
    });
  };

  const getProgressBySubject = () => {
    const subjectProgress: Record<string, { total: number; completed: number }> = {};
    
    planTasks.forEach(task => {
      const subject = task.resources?.subject || 'General';
      if (!subjectProgress[subject]) {
        subjectProgress[subject] = { total: 0, completed: 0 };
      }
      subjectProgress[subject].total++;
      if (task.is_completed) {
        subjectProgress[subject].completed++;
      }
    });

    return Object.entries(subjectProgress).map(([subject, progress]) => ({
      subject,
      percentage: progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0,
      completed: progress.completed,
      total: progress.total
    }));
  };

  const renderDayTasks = (tasks) => (
    <div className="space-y-2">
      {tasks.map(task => (
        <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleTaskCompletion(task.id, task.is_completed)}
            className="p-0 h-auto"
          >
            {task.is_completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400" />
            )}
          </Button>
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.task_name}
            </h4>
            <p className="text-sm text-muted-foreground">{task.description}</p>
            {task.resources && (
              <Badge variant="outline" className="mt-1 text-xs">
                {task.resources.subject}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(task.due_date), 'HH:mm')}
          </div>
        </div>
      ))}
    </div>
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Please sign in to access study plans</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Study Plans</h1>
          <p className="text-muted-foreground">Create and manage your personalized study schedules</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Study Plan</DialogTitle>
                <DialogDescription>Plan your learning journey</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="plan_name">Plan Name *</Label>
                  <Input
                    id="plan_name"
                    value={planData.plan_name}
                    onChange={(e) => setPlanData(prev => ({ ...prev, plan_name: e.target.value }))}
                    placeholder="e.g. Final Exam Preparation"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={planData.description}
                    onChange={(e) => setPlanData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your study plan"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={planData.start_date}
                      onChange={(e) => setPlanData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={planData.end_date}
                      onChange={(e) => setPlanData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={createStudyPlan} className="w-full">
                  Create Plan
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Target className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
                <DialogDescription>Add a new task to your study plan</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="task_name">Task Name *</Label>
                  <Input
                    id="task_name"
                    value={taskData.task_name}
                    onChange={(e) => setTaskData(prev => ({ ...prev, task_name: e.target.value }))}
                    placeholder="e.g. Review Chapter 5"
                  />
                </div>
                <div>
                  <Label htmlFor="task_description">Description</Label>
                  <Textarea
                    id="task_description"
                    value={taskData.description}
                    onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Task details"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="plan_select">Study Plan *</Label>
                  <Select onValueChange={(value) => setSelectedPlan(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a study plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {studyPlans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.plan_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={taskData.due_date}
                    onChange={(e) => setTaskData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                <Button onClick={createTask} className="w-full">
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Progress by Subject */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Progress by Subject
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getProgressBySubject().map(({ subject, percentage, completed, total }) => (
              <div key={subject} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{subject}</span>
                  <span className="text-sm text-muted-foreground">
                    {completed}/{total}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${subjectColors[subject] || 'bg-gray-500'}`} />
                  <span className="text-xs text-muted-foreground">{percentage}% complete</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Views */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Schedule
            </CardTitle>
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </div>
            <div className="md:col-span-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {viewMode === "daily" && format(selectedDate, "EEEE, MMMM d, yyyy")}
                    {viewMode === "weekly" && `Week of ${format(startOfWeek(selectedDate), "MMM d")}`}
                    {viewMode === "monthly" && format(selectedDate, "MMMM yyyy")}
                  </h3>
                  <Badge variant="outline">
                    {getTasksForPeriod().length} tasks
                  </Badge>
                </div>
                
                {getTasksForPeriod().length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No tasks scheduled</p>
                    <p className="text-sm text-gray-400">Create a task to get started</p>
                  </div>
                ) : (
                  renderDayTasks(getTasksForPeriod())
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study Plans List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Your Study Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading your study plans...</div>
          ) : studyPlans.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No study plans yet</p>
              <p className="text-sm text-gray-400 mb-4">Create your first study plan to get organized</p>
              <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Study Plan
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {studyPlans.map(plan => {
                const currentPlanTasks = planTasks.filter(task => task.plan_id === plan.id);
                const completedTasks = currentPlanTasks.filter(task => task.is_completed).length;
                const totalTasks = currentPlanTasks.length;
                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                return (
                  <Card key={plan.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{plan.plan_name}</CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </div>
                        <Badge variant={progress === 100 ? "default" : "secondary"}>
                          {progress}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{completedTasks}/{totalTasks} tasks completed</span>
                        <span>
                          {format(new Date(plan.start_date), "MMM d")} - {format(new Date(plan.end_date), "MMM d")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyPlans;
