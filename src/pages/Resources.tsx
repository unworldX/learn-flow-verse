
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
import { Search, BookOpen, Video, FileText, Upload, Plus, Download, Loader2, Filter } from "lucide-react";
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
      const { data, error } = await supabase.from('resources').select('*').order('upload_date', { ascending: false });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Study Resources
            </h1>
            <p className="text-slate-600 mt-2">Upload and discover learning materials</p>
          </div>
          
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl h-12">
                <Upload className="w-5 h-5 mr-2" />
                Upload Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl mx-4 rounded-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-800">Upload New Resource</DialogTitle>
                <DialogDescription className="text-slate-600">Share your study materials with the community</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 mt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium text-slate-700">Resource Title *</Label>
                    <Input
                      id="title"
                      value={uploadData.title}
                      onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter resource title"
                      className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="author" className="text-sm font-medium text-slate-700">Author Name</Label>
                    <Input
                      id="author"
                      value={uploadData.author}
                      onChange={(e) => setUploadData(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Enter author name"
                      className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject" className="text-sm font-medium text-slate-700">Subject</Label>
                    <Select onValueChange={(value) => setUploadData(prev => ({ ...prev, subject: value }))} value={uploadData.subject}>
                      <SelectTrigger className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-2xl">
                        {subjects.map(subject => (
                          <SelectItem key={subject} value={subject} className="rounded-lg">{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="class" className="text-sm font-medium text-slate-700">Class</Label>
                    <Input
                      id="class"
                      value={uploadData.class}
                      onChange={(e) => setUploadData(prev => ({ ...prev, class: e.target.value }))}
                      placeholder="e.g. Grade 12"
                      className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="resourceType" className="text-sm font-medium text-slate-700">Resource Type *</Label>
                  <Select
                    onValueChange={(value) => setUploadData(prev => ({ ...prev, resourceType: value }))}
                    value={uploadData.resourceType}
                  >
                    <SelectTrigger className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12">
                      <SelectValue placeholder="Select resource type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-2xl">
                      {resourceTypes.map(type => (
                        <SelectItem key={type.value} value={type.value} className="rounded-lg">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
                  <Textarea
                    id="description"
                    value={uploadData.description}
                    onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the resource"
                    rows={4}
                    className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="file" className="text-sm font-medium text-slate-700">File *</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.mp4,.avi,.mov,.epub,.doc,.docx"
                    disabled={isUploading}
                    className="mt-1 border-2 border-dashed border-slate-300 hover:border-blue-400 focus:border-blue-500 rounded-xl h-20 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-blue-600 file:to-purple-600 file:text-white file:font-medium hover:file:from-blue-700 hover:file:to-purple-700 transition-all duration-300"
                  />
                  {uploadData.file ? (
                    <p className="text-sm text-green-600 mt-1">File selected: {uploadData.file.name}</p>
                  ) : (
                    <p className="text-sm text-slate-500 mt-1">No file chosen</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={() => setIsUploadOpen(false)} variant="outline" className="flex-1 rounded-xl border-slate-200">
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl" disabled={isUploading}>
                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    {isUploading ? 'Uploading...' : 'Upload Resource'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                  <Search className="w-5 h-5" />
                  Search & Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Search</Label>
                  <Input
                    placeholder="Search resources..."
                    className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-700">Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-2xl">
                      <SelectItem value="all" className="rounded-lg">All Subjects</SelectItem>
                      {subjects.map(subject => (
                        <SelectItem key={subject} value={subject} className="rounded-lg">{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Download Panel */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                  <Download className="w-5 h-5" />
                  Download Panel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-3 block">Resource Type</Label>
                  <ToggleGroup
                    type="single"
                    value={selectedType}
                    onValueChange={(value) => { if (value) setSelectedType(value) }}
                    className="flex flex-col items-stretch gap-2"
                  >
                    <ToggleGroupItem value="all" aria-label="All types" className="rounded-xl justify-start">
                      <Filter className="w-4 h-4 mr-2" />
                      All
                    </ToggleGroupItem>
                    {resourceTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <ToggleGroupItem key={type.value} value={type.value} aria-label={type.label} className="rounded-xl justify-start">
                          <Icon className="w-4 h-4 mr-2" />
                          {type.label}
                        </ToggleGroupItem>
                      );
                    })}
                  </ToggleGroup>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Resources Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="text-center p-12">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading resources...</p>
              </div>
            ) : filteredResources.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredResources.map(resource => (
                  <Card key={resource.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm rounded-2xl group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                            {getResourceTypeIcon(resource.resource_type)}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg leading-tight text-slate-800 line-clamp-2">{resource.title}</CardTitle>
                            {resource.author && <CardDescription className="text-slate-600">by {resource.author}</CardDescription>}
                          </div>
                        </div>
                        <Badge variant="secondary" className="rounded-lg shrink-0">{resource.resource_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-600 line-clamp-3">{resource.description}</p>
                      <div className="flex gap-2 flex-wrap">
                        {resource.subject && <Badge variant="outline" className="rounded-lg text-xs">{resource.subject}</Badge>}
                        {resource.class && <Badge variant="outline" className="rounded-lg text-xs">{resource.class}</Badge>}
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl group-hover:shadow-lg transition-all duration-300" 
                        onClick={() => handleDownload(resource.file_url, resource.title)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-slate-800">No resources found</h3>
                  <p className="text-slate-600 mb-6">
                    Try adjusting your search or filters, or be the first to share study materials.
                  </p>
                  <Button 
                    onClick={() => setIsUploadOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload a Resource
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
