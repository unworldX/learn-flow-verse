
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, Plus, Check, X, Bell, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface Reminder {
  id: string;
  title: string;
  description: string;
  reminder_date: string;
  reminder_type: string;
  is_completed: boolean;
  created_at: string;
}

const Reminders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    reminder_date: "",
    reminder_type: "general"
  });

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user]);

  const fetchReminders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('reminder_date');

    if (error) {
      console.error('Error fetching reminders:', error);
      toast({
        title: "Error fetching reminders",
        description: "There was an error loading your reminders",
        variant: "destructive"
      });
    } else {
      setReminders(data || []);
    }
  };

  const createReminder = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create reminders",
        variant: "destructive"
      });
      return;
    }

    if (!newReminder.title || !newReminder.reminder_date) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title and reminder date",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('reminders')
      .insert({
        title: newReminder.title,
        description: newReminder.description,
        reminder_date: newReminder.reminder_date,
        reminder_type: newReminder.reminder_type,
        user_id: user.id
      });

    if (error) {
      console.error('Error creating reminder:', error);
      toast({
        title: "Error creating reminder",
        description: "There was an error creating your reminder",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Reminder created successfully",
        description: "Your reminder has been added"
      });
      setNewReminder({
        title: "",
        description: "",
        reminder_date: "",
        reminder_type: "general"
      });
      setIsCreateOpen(false);
      fetchReminders();
    }
  };

  const toggleCompletion = async (id: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from('reminders')
      .update({ is_completed: !isCompleted })
      .eq('id', id);

    if (error) {
      console.error('Error updating reminder:', error);
      toast({
        title: "Error updating reminder",
        description: "There was an error updating your reminder",
        variant: "destructive"
      });
    } else {
      fetchReminders();
    }
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting reminder:', error);
      toast({
        title: "Error deleting reminder",
        description: "There was an error deleting your reminder",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Reminder deleted",
        description: "Your reminder has been removed"
      });
      fetchReminders();
    }
  };

  const getReminderTypeColor = (type: string) => {
    switch (type) {
      case 'study': return 'bg-blue-100 text-blue-800';
      case 'assignment': return 'bg-red-100 text-red-800';
      case 'exam': return 'bg-purple-100 text-purple-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (date: string) => {
    return new Date(date) < new Date() && !reminders.find(r => r.reminder_date === date)?.is_completed;
  };

  const filteredReminders = reminders.filter(reminder => {
    if (filter === "completed") return reminder.is_completed;
    if (filter === "pending") return !reminder.is_completed;
    if (filter === "overdue") return isOverdue(reminder.reminder_date) && !reminder.is_completed;
    return true;
  });

  const upcomingReminders = reminders.filter(r => 
    !r.is_completed && 
    new Date(r.reminder_date) > new Date() &&
    new Date(r.reminder_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reminders</h1>
          <p className="text-muted-foreground">Stay organized with your study schedule</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Reminder</DialogTitle>
              <DialogDescription>
                Set up a reminder for your study schedule
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Reminder title"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Type</Label>
                <Select onValueChange={(value) => setNewReminder(prev => ({ ...prev, reminder_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="study">Study Session</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Reminder Date & Time *</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={newReminder.reminder_date}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, reminder_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newReminder.description}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

              <Button onClick={createReminder} className="w-full">
                <Bell className="w-4 h-4 mr-2" />
                Create Reminder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {upcomingReminders.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              Upcoming Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingReminders.slice(0, 3).map(reminder => (
                <div key={reminder.id} className="flex items-center justify-between p-2 bg-white rounded">
                  <div>
                    <p className="font-medium">{reminder.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(reminder.reminder_date).toLocaleDateString()} at{' '}
                      {new Date(reminder.reminder_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge className={getReminderTypeColor(reminder.reminder_type)}>
                    {reminder.reminder_type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              All ({reminders.length})
            </Button>
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              onClick={() => setFilter("pending")}
              size="sm"
            >
              Pending ({reminders.filter(r => !r.is_completed).length})
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              onClick={() => setFilter("completed")}
              size="sm"
            >
              Completed ({reminders.filter(r => r.is_completed).length})
            </Button>
            <Button
              variant={filter === "overdue" ? "default" : "outline"}
              onClick={() => setFilter("overdue")}
              size="sm"
            >
              Overdue ({reminders.filter(r => isOverdue(r.reminder_date) && !r.is_completed).length})
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredReminders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No reminders found</h3>
              <p className="text-gray-500 mb-6">
                Create your first reminder to stay organized
              </p>
              <Button 
                onClick={() => setIsCreateOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Reminder
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredReminders.map(reminder => (
            <Card 
              key={reminder.id} 
              className={`${reminder.is_completed ? 'opacity-60' : ''} ${
                isOverdue(reminder.reminder_date) && !reminder.is_completed ? 'border-red-200 bg-red-50' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={reminder.is_completed}
                      onCheckedChange={() => toggleCompletion(reminder.id, reminder.is_completed)}
                      className="mt-1"
                    />
                    <div>
                      <CardTitle className={`text-lg ${reminder.is_completed ? 'line-through' : ''}`}>
                        {reminder.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(reminder.reminder_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(reminder.reminder_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOverdue(reminder.reminder_date) && !reminder.is_completed && (
                          <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getReminderTypeColor(reminder.reminder_type)}>
                      {reminder.reminder_type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReminder(reminder.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {reminder.description && (
                <CardContent>
                  <p className="text-gray-600">{reminder.description}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Reminders;
