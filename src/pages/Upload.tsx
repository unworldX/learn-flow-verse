import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, File, FileText, Video, Image, Download, Trash2, Eye, Cloud, FolderOpen, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FileUpload {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  upload_date: string;
  is_processed: boolean;
}

const Upload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadMetadata, setUploadMetadata] = useState({
    description: "",
    category: "general"
  });

  // Resource upload state
  const [isResourceUploading, setIsResourceUploading] = useState(false);
  const [resourceUploadData, setResourceUploadData] = useState({
    title: "",
    author: "",
    subject: "",
    class: "",
    description: "",
    resourceType: "",
    file: null as File | null
  });

  useEffect(() => {
    if (user) {
      fetchUploads();
    }
  }, [user]);

  const fetchUploads = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('user_id', user.id)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching uploads:', error);
      toast({
        title: "Error fetching uploads",
        description: "There was an error loading your uploads",
        variant: "destructive"
      });
    } else {
      setUploads(data || []);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const uploadFiles = async () => {
    if (!user || !selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = selectedFiles.length;
      let completedFiles = 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${file.name}`;

        // Upload to Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('uploads')
          .upload(fileName, file);

        if (storageError) {
          console.error('Storage upload error:', storageError);
          throw storageError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(fileName);

        // Save file metadata to database
        const { error: dbError } = await supabase
          .from('file_uploads')
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            file_path: urlData.publicUrl,
            is_processed: true
          });

        if (dbError) {
          console.error('Database insert error:', dbError);
          throw dbError;
        }

        completedFiles++;
        setUploadProgress((completedFiles / totalFiles) * 100);
      }

      toast({
        title: "Upload successful",
        description: `${totalFiles} file(s) uploaded successfully`
      });

      setSelectedFiles(null);
      setUploadMetadata({ description: "", category: "general" });
      fetchUploads();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleResourceFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResourceUploadData(prev => ({ ...prev, file }));
    }
  };

  const handleResourceUpload = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload resources",
        variant: "destructive"
      });
      return;
    }

    if (!resourceUploadData.title || !resourceUploadData.resourceType || !resourceUploadData.file) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, resource type, and select a file",
        variant: "destructive"
      });
      return;
    }

    setIsResourceUploading(true);
    try {
      const file = resourceUploadData.file;
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
          title: resourceUploadData.title,
          author: resourceUploadData.author || 'Unknown',
          subject: resourceUploadData.subject,
          class: resourceUploadData.class,
          description: resourceUploadData.description,
          resource_type: resourceUploadData.resourceType,
          file_url: fileUrl,
          uploader_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Resource uploaded successfully",
        description: "Your resource has been added to the library"
      });
      
      queryClient.invalidateQueries({ queryKey: ['resources'] });

      setResourceUploadData({
        title: "",
        author: "",
        subject: "",
        class: "",
        description: "",
        resourceType: "",
        file: null
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your resource",
        variant: "destructive"
      });
    } finally {
      setIsResourceUploading(false);
    }
  };

  const deleteFile = async (upload: FileUpload) => {
    try {
      // Extract file path from URL
      const urlParts = upload.file_path.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user?.id}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('uploads')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', upload.id);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw dbError;
      }

      toast({
        title: "File deleted",
        description: "File has been removed successfully"
      });

      fetchUploads();

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the file",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5 text-green-600" />;
    if (fileType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-600" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-5 h-5 text-red-600" />;
    return <File className="w-5 h-5 text-blue-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'bg-green-50 text-green-700 border-green-200';
    if (fileType.startsWith('video/')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (fileType.includes('pdf')) return 'bg-red-50 text-red-700 border-red-200';
    if (fileType.includes('document')) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const subjects = [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "Literature", "History", "Geography", "Economics", "Psychology"
  ];

  const resourceTypes = [
    { value: "PDF", label: "PDF Document", icon: FileText },
    { value: "Video", label: "Video", icon: Video },
    { value: "Book", label: "E-Book", icon: FileText },
    { value: "Other", label: "Other", icon: FileText }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-xl border-0 rounded-2xl">
          <CardContent className="p-8">
            <Cloud className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-slate-800">Authentication Required</h2>
            <p className="text-slate-600">Please sign in to access file uploads</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            File Upload
          </h1>
          <p className="text-slate-600">Upload and manage your study materials securely</p>
        </div>

        {/* Upload Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <Cloud className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">{uploads.length}</div>
              <div className="text-sm opacity-90">Total Files</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">{uploads.filter(f => f.file_type.includes('pdf') || f.file_type.includes('document')).length}</div>
              <div className="text-sm opacity-90">Documents</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <Image className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">{uploads.filter(f => f.file_type.startsWith('image/')).length}</div>
              <div className="text-sm opacity-90">Images</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <Video className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">{uploads.filter(f => f.file_type.startsWith('video/')).length}</div>
              <div className="text-sm opacity-90">Videos</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <TabsTrigger value="files" className="rounded-xl">Personal Files</TabsTrigger>
            <TabsTrigger value="resources" className="rounded-xl">Upload Resources</TabsTrigger>
          </TabsList>

          {/* Personal Files Upload */}
          <TabsContent value="files" className="space-y-6">
            {/* Upload Form */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <UploadIcon className="w-5 h-5 text-white" />
                  </div>
                  Upload New Files
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Select files to upload to your personal library
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="files" className="text-sm font-medium text-slate-700">Select Files</Label>
                  <div className="relative">
                    <Input
                      id="files"
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.mp3,.wav"
                      disabled={isUploading}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-400 focus:border-blue-500 rounded-xl h-20 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-blue-600 file:to-purple-600 file:text-white file:font-medium hover:file:from-blue-700 hover:file:to-purple-700 transition-all duration-300"
                    />
                  </div>
                  <p className="text-sm text-slate-500">
                    Supported formats: PDF, Office documents, images, videos, audio files (Max 50MB per file)
                  </p>
                </div>

                <Button 
                  onClick={uploadFiles} 
                  disabled={!selectedFiles || selectedFiles.length === 0 || isUploading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl h-12"
                >
                  <UploadIcon className="w-5 h-5 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload Files'}
                </Button>
              </CardContent>
            </Card>
            {/* Files List */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-white" />
                  </div>
                  Your Files ({uploads.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {uploads.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200">
                    <Cloud className="w-20 h-20 text-slate-300 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-slate-600 mb-2">No files uploaded yet</h3>
                    <p className="text-slate-500 mb-6">Upload your first file to get started with your digital library</p>
                    <Button onClick={() => document.getElementById('files')?.click()} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl">
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Choose Files
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {uploads.map(upload => (
                      <div 
                        key={upload.id} 
                        className="flex items-center justify-between p-6 border border-slate-200 rounded-2xl hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-slate-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                            {getFileIcon(upload.file_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-800 truncate">{upload.file_name}</h4>
                            <p className="text-sm text-slate-500 flex items-center gap-2">
                              <span>Uploaded {new Date(upload.upload_date).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{formatFileSize(upload.file_size)}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge className={getFileTypeColor(upload.file_type)} variant="outline">
                            {upload.file_type.split('/')[0]}
                          </Badge>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(upload.file_path, '_blank')}
                              className="h-10 w-10 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-xl"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = upload.file_path;
                                link.download = upload.file_name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="h-10 w-10 p-0 hover:bg-green-50 hover:text-green-600 rounded-xl"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteFile(upload)}
                              className="h-10 w-10 p-0 hover:bg-red-50 hover:text-red-600 rounded-xl"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resource Upload */}
          <TabsContent value="resources" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <UploadIcon className="w-5 h-5 text-white" />
                  </div>
                  Upload New Resource
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Share your study materials with the community
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="resource-title" className="text-sm font-medium text-slate-700">Resource Title *</Label>
                    <Input
                      id="resource-title"
                      value={resourceUploadData.title}
                      onChange={(e) => setResourceUploadData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter resource title"
                      className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="resource-author" className="text-sm font-medium text-slate-700">Author Name</Label>
                    <Input
                      id="resource-author"
                      value={resourceUploadData.author}
                      onChange={(e) => setResourceUploadData(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Enter author name"
                      className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="resource-subject" className="text-sm font-medium text-slate-700">Subject</Label>
                    <Select onValueChange={(value) => setResourceUploadData(prev => ({ ...prev, subject: value }))} value={resourceUploadData.subject}>
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
                    <Label htmlFor="resource-class" className="text-sm font-medium text-slate-700">Class</Label>
                    <Input
                      id="resource-class"
                      value={resourceUploadData.class}
                      onChange={(e) => setResourceUploadData(prev => ({ ...prev, class: e.target.value }))}
                      placeholder="e.g. Grade 12"
                      className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="resource-type" className="text-sm font-medium text-slate-700">Resource Type *</Label>
                  <Select
                    onValueChange={(value) => setResourceUploadData(prev => ({ ...prev, resourceType: value }))}
                    value={resourceUploadData.resourceType}
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
                  <Label htmlFor="resource-description" className="text-sm font-medium text-slate-700">Description</Label>
                  <Textarea
                    id="resource-description"
                    value={resourceUploadData.description}
                    onChange={(e) => setResourceUploadData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the resource"
                    rows={4}
                    className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="resource-file" className="text-sm font-medium text-slate-700">File *</Label>
                  <Input
                    id="resource-file"
                    type="file"
                    onChange={handleResourceFileUpload}
                    accept=".pdf,.mp4,.avi,.mov,.epub,.doc,.docx"
                    disabled={isResourceUploading}
                    className="mt-1 border-2 border-dashed border-slate-300 hover:border-blue-400 focus:border-blue-500 rounded-xl h-20 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-blue-600 file:to-purple-600 file:text-white file:font-medium hover:file:from-blue-700 hover:file:to-purple-700 transition-all duration-300"
                  />
                  {resourceUploadData.file ? (
                    <p className="text-sm text-green-600 mt-1">File selected: {resourceUploadData.file.name}</p>
                  ) : (
                    <p className="text-sm text-slate-500 mt-1">No file chosen</p>
                  )}
                </div>

                <Button onClick={handleResourceUpload} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl h-12" disabled={isResourceUploading}>
                  {isResourceUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  {isResourceUploading ? 'Uploading...' : 'Upload Resource'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Upload;
