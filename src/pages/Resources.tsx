import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, BookOpen, Video, FileText, Upload, Plus, Download, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const Resources = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [uploadData, setUploadData] = useState({
    title: "",
    author: "",
    subject: "",
    class: "",
    description: "",
    resourceType: "",
    file: null as File | null
  });

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const { data, error } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const subjects = [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "Literature", "History", "Geography", "Economics", "Psychology"
  ];

  const resourceTypes = [
    { value: "PDF", label: "PDF Document", icon: FileText },
    { value: "Video", label: "Video", icon: Video },
    { value: "Book", label: "E-Book", icon: BookOpen },
    { value: "Other", label: "Other", icon: FileText }
  ];
  
  const getResourceTypeIcon = (type: string) => {
    const resourceType = resourceTypes.find(rt => rt.value === type);
    if (resourceType) {
      const Icon = resourceType.icon;
      return <Icon className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  }

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

    setIsUploading(true);
    try {
      const file = uploadData.file;
      const fileName = `resources/${user.id}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);
      
      const fileUrl = urlData.publicUrl;

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
      
      queryClient.invalidateQueries({ queryKey: ['resources'] });

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
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredResources = resources?.filter(resource => {
    const searchMatch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (resource.author && resource.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (resource.subject && resource.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    const subjectMatch = selectedSubject === 'all' || !selectedSubject || resource.subject === selectedSubject;
    const typeMatch = selectedType === 'all' || !selectedType || resource.resource_type === selectedType;
    return searchMatch && subjectMatch && typeMatch;
  }) || [];

  return (
    <div className="space-y-6 p-4 md:p-6">
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
                <Select
                  onValueChange={(value) => setUploadData(prev => ({ ...prev, resourceType: value }))}
                  value={uploadData.resourceType}
                >
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
                  disabled={isUploading}
                />
              </div>

              <Button onClick={handleUpload} className="w-full" disabled={isUploading}>
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {isUploading ? 'Uploading...' : 'Upload Resource'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
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
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Resource Type</Label>
             <ToggleGroup
              type="single"
              value={selectedType}
              onValueChange={(value) => { if (value) setSelectedType(value) }}
              className="justify-start flex-wrap"
            >
              <ToggleGroupItem value="all" aria-label="All types">All</ToggleGroupItem>
              {resourceTypes.map(type => (
                 <ToggleGroupItem key={type.value} value={type.value} aria-label={type.label}>{type.label}</ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>
      
      {/* Resources Grid */}
      {isLoading ? (
        <div className="text-center p-12">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading resources...</p>
        </div>
      ) : filteredResources.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredResources.map(resource => (
            <Card key={resource.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg leading-tight">{resource.title}</CardTitle>
                  <Badge variant="secondary">{resource.resource_type}</Badge>
                </div>
                {resource.author && <CardDescription>by {resource.author}</CardDescription>}
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-3">{resource.description}</p>
                <div className="flex gap-2">
                  {resource.subject && <Badge variant="outline">{resource.subject}</Badge>}
                  {resource.class && <Badge variant="outline">{resource.class}</Badge>}
                </div>
              </CardContent>
              <div className="p-4 pt-0">
                <Button 
                  className="w-full" 
                  onClick={() => handleDownload(resource.file_url, resource.title)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No resources found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search or filters, or be the first to share study materials.
            </p>
            <Button 
              onClick={() => setIsUploadOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload a Resource
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Resources;
