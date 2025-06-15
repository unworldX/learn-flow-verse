
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Filter, BookOpen, Video, FileText, Upload, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Resources = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: "",
    author: "",
    subject: "",
    class: "",
    description: "",
    resourceType: "",
    file: null as File | null
  });

  const subjects = [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "Literature", "History", "Geography", "Economics", "Psychology"
  ];

  const resourceTypes = [
    { value: "PDF", label: "PDF Document", icon: FileText },
    { value: "Video", label: "Video", icon: Video },
    { value: "Book", label: "E-Book", icon: BookOpen }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadData(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload resources",
        variant: "destructive"
      });
      return;
    }

    if (!uploadData.title || !uploadData.resourceType || !uploadData.file) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, resource type, and select a file",
        variant: "destructive"
      });
      return;
    }

    try {
      // Upload file to Supabase Storage (placeholder for now)
      const fileUrl = `placeholder-url/${uploadData.file.name}`;

      // Insert resource data into database
      const { error } = await supabase
        .from('resources')
        .insert({
          title: uploadData.title,
          author: uploadData.author || 'Unknown',
          subject: uploadData.subject,
          class: uploadData.class,
          description: uploadData.description,
          resource_type: uploadData.resourceType,
          file_url: fileUrl,
          uploader_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Resource uploaded successfully",
        description: "Your resource has been added to the library"
      });

      // Reset form and close dialog
      setUploadData({
        title: "",
        author: "",
        subject: "",
        class: "",
        description: "",
        resourceType: "",
        file: null
      });
      setIsUploadOpen(false);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your resource",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Study Resources</h1>
          <p className="text-muted-foreground">Upload and discover learning materials</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <Upload className="w-4 h-4 mr-2" />
              Upload Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload New Resource</DialogTitle>
              <DialogDescription>
                Share your study materials with the community
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={uploadData.title}
                  onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Resource title"
                />
              </div>
              
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={uploadData.author}
                  onChange={(e) => setUploadData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Author name"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select onValueChange={(value) => setUploadData(prev => ({ ...prev, subject: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="class">Class</Label>
                  <Input
                    id="class"
                    value={uploadData.class}
                    onChange={(e) => setUploadData(prev => ({ ...prev, class: e.target.value }))}
                    placeholder="e.g. Grade 12"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="resourceType">Resource Type *</Label>
                <Select onValueChange={(value) => setUploadData(prev => ({ ...prev, resourceType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the resource"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.mp4,.avi,.mov,.epub,.doc,.docx"
                />
              </div>

              <Button onClick={handleUpload} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Upload Resource
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search resources, authors, subjects..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {resourceTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      <Card>
        <CardContent className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No resources found</h3>
          <p className="text-gray-500 mb-6">
            Be the first to share study materials with the community
          </p>
          <Button 
            onClick={() => setIsUploadOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload First Resource
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Resources;
