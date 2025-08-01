import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useRealStudyGroups } from "@/hooks/useRealStudyGroups";

interface CreateGroupDialogProps {
  children?: React.ReactNode;
}

export const CreateGroupDialog = ({ children }: CreateGroupDialogProps = {}) => {
  const { createGroup } = useRealStudyGroups();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_private: false,
    max_members: 50
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await createGroup(formData);
    if (result) {
      setOpen(false);
      setFormData({
        name: '',
        description: '',
        is_private: false,
        max_members: 50
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Study Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter group name"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your study group"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="max_members">Maximum Members</Label>
            <Input
              id="max_members"
              type="number"
              min="2"
              max="500"
              value={formData.max_members}
              onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_private"
              checked={formData.is_private}
              onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
            />
            <Label htmlFor="is_private">Private Group</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name.trim()}>
              Create Group
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};