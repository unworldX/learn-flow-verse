
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Clock, Trash2 } from "lucide-react";
import { useReminders } from "@/hooks/useReminders";
import { format } from "date-fns";

const Reminders = () => {
  const { reminders, isLoading, createReminder, updateReminder, deleteReminder } = useReminders();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_date: '',
    reminder_type: 'general'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.reminder_date) return;

    await createReminder(formData);
    setFormData({
      title: '',
      description: '',
      reminder_date: '',
      reminder_type: 'general'
    });
    setShowForm(false);
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    await updateReminder(id, { is_completed: !currentStatus });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'study': return 'bg-blue-100 text-blue-800';
      case 'assignment': return 'bg-red-100 text-red-800';
      case 'exam': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const upcomingReminders = reminders.filter(r => !r.is_completed && new Date(r.reminder_date) > new Date());
  const completedReminders = reminders.filter(r => r.is_completed);
  const overdueReminders = reminders.filter(r => !r.is_completed && new Date(r.reminder_date) <= new Date());

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Reminders</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Reminder
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Reminder</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Reminder title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details (optional)"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reminder_date">Date & Time</Label>
                  <Input
                    id="reminder_date"
                    type="datetime-local"
                    value={formData.reminder_date}
                    onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label>Type</Label>
                  <Select value={formData.reminder_type} onValueChange={(value) => setFormData({ ...formData, reminder_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">Create Reminder</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8">
        {/* Overdue Reminders */}
        {overdueReminders.length > 0 && (
          <Card className="border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-800">Overdue</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {overdueReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-start justify-between p-4 border rounded-lg bg-red-50">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={reminder.is_completed}
                        onCheckedChange={() => toggleComplete(reminder.id, reminder.is_completed)}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{reminder.title}</h3>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600">{formatDate(reminder.reminder_date)}</span>
                          <Badge className={getTypeColor(reminder.reminder_type)}>
                            {reminder.reminder_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReminder(reminder.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Reminders */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading reminders...</p>
            ) : upcomingReminders.length === 0 ? (
              <p className="text-muted-foreground">No upcoming reminders.</p>
            ) : (
              <div className="space-y-4">
                {upcomingReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={reminder.is_completed}
                        onCheckedChange={() => toggleComplete(reminder.id, reminder.is_completed)}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{reminder.title}</h3>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{formatDate(reminder.reminder_date)}</span>
                          <Badge className={getTypeColor(reminder.reminder_type)}>
                            {reminder.reminder_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReminder(reminder.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Reminders */}
        {completedReminders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-start justify-between p-4 border rounded-lg opacity-60">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={reminder.is_completed}
                        onCheckedChange={() => toggleComplete(reminder.id, reminder.is_completed)}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium line-through">{reminder.title}</h3>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{formatDate(reminder.reminder_date)}</span>
                          <Badge className={getTypeColor(reminder.reminder_type)}>
                            {reminder.reminder_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReminder(reminder.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Reminders;
