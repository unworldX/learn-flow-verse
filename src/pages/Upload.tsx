
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Upload as UploadIcon, File } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useRealResources } from "@/hooks/useRealResources";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Upload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploads, isLoading, isUploading, uploadFile, deleteFile } = useFileUpload();
  const { refetch: refetchResources } = useRealResources();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    subject: '',
    class: '',
    resource_type: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCreatingResource, setIsCreatingResource] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    await uploadFile(selectedFile);
    setSelectedFile(null);
    
    // Reset file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const createResource = async (uploadId: string, filePath: string) => {
    if (!user) return;

    setIsCreatingResource(true);
    try {
      const { error } = await supabase
        .from('resources')
        .insert({
          title: formData.title,
          description: formData.description,
          author: formData.author,
          subject: formData.subject,
          class: formData.class,
          resource_type: formData.resource_type,
          file_url: filePath,
          uploader_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Resource created",
        description: "Your resource has been created successfully"
      });

      setFormData({
        title: '',
        description: '',
        author: '',
        subject: '',
        class: '',
        resource_type: ''
      });

      refetchResources();
    } catch (error) {
      console.error('Error creating resource:', error);
      toast({
        title: "Error",
        description: "Failed to create resource",
        variant: "destructive"
      });
    } finally {
      setIsCreatingResource(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="h-5 w-5" />
              Upload Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-input">Select File</Label>
              <Input
                id="file-input"
                type="file"
                onChange={handleFileSelect}
                className="mt-1"
              />
            </div>
            
            {selectedFile && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                  </div>
                  <Badge variant="secondary">
                    {formatFileSize(selectedFile.size)}
                  </Badge>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isUploading}
              className="w-full"
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
          </CardContent>
        </Card>

        {/* Create Resource Section */}
        <Card>
          <CardHeader>
            <CardTitle>Create Resource</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Resource title"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Resource description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
              
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Subject"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class">Class</Label>
                <Input
                  id="class"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  placeholder="Class/Grade"
                />
              </div>
              
              <div>
                <Label>Resource Type</Label>
                <Select value={formData.resource_type} onValueChange={(value) => setFormData({ ...formData, resource_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={() => uploads.length > 0 && createResource(uploads[0].id, uploads[0].file_path)}
              disabled={!formData.title || !formData.resource_type || uploads.length === 0 || isCreatingResource}
              className="w-full"
            >
              {isCreatingResource ? "Creating..." : "Create Resource"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Files List */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading files...</p>
          ) : uploads.length === 0 ? (
            <p className="text-muted-foreground">No files uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {uploads.map((upload) => (
                <div key={upload.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <File className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{upload.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(upload.file_size)} • {new Date(upload.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteFile(upload.id, upload.file_path)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;
