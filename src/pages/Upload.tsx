
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, File, X, FolderOpen, Zap } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cacheService } from "@/lib/cacheService";

const Upload = () => {
  const { uploads, isLoading, isUploading, uploadFile, deleteFile, refetch } = useFileUpload();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    subject: '',
    class: '',
    resourceType: '',
    file: null as File | null
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) return;

    await uploadFile(formData.file, {
      title: formData.title,
      description: formData.description,
      author: formData.author,
      subject: formData.subject,
      class: formData.class,
      resourceType: formData.resourceType
    });

    // Reset form
    setFormData({
      title: '',
      description: '',
      author: '',
      subject: '',
      class: '',
      resourceType: '',
      file: null
    });

    // Clear file input
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleRefresh = async () => {
    await cacheService.invalidate('file_uploads_');
    await refetch();
    toast({
      title: "Refreshed",
      description: "File list has been refreshed"
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-8 w-8 text-gray-500" />;

    if (fileType.startsWith('image/')) return <File className="h-8 w-8 text-green-500" />;
    if (fileType.startsWith('video/')) return <File className="h-8 w-8 text-blue-500" />;
    if (fileType.includes('pdf')) return <File className="h-8 w-8 text-red-500" />;
    if (fileType.includes('document') || fileType.includes('word')) return <File className="h-8 w-8 text-blue-600" />;

    return <File className="h-8 w-8 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
            <UploadIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Upload Files</h1>
            <p className="text-muted-foreground">Share your resources with the community</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-lg bg-card border border-border">
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-lg bg-card border border-border">
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const VISIBLE_LIMIT = 100; // Increased from 8

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
          <UploadIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload Files</h1>
          <p className="text-muted-foreground">Share your resources with the community</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <Card className="shadow-lg bg-card border border-border">
          <CardHeader className="rounded-t-lg">
            <CardTitle>Upload New File</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter file title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter file description"
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
                  <Label htmlFor="class">Class</Label>
                  <Input
                    id="class"
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    placeholder="Class/Grade"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subject</Label>
                  <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="History">History</SelectItem>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                      <SelectItem value="Literature">Literature</SelectItem>
                      <SelectItem value="Geography">Geography</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Resource Type</Label>
                  <Select value={formData.resourceType} onValueChange={(value) => setFormData({ ...formData, resourceType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="Video">Video</SelectItem>
                      <SelectItem value="Audio">Audio</SelectItem>
                      <SelectItem value="Presentation">Presentation</SelectItem>
                      <SelectItem value="Document">Document</SelectItem>
                      <SelectItem value="Spreadsheet">Spreadsheet</SelectItem>
                      <SelectItem value="Image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="file">File *</Label>
                <div className="mt-1">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".txt,.pdf,.doc,.docx"
                    required
                  />
                </div>
                {formData.file && (
                  <div className="mt-2 p-3 bg-muted rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      {getFileIcon(formData.file.type)}
                      <div className="ml-3">
                        <span className="text-sm font-medium text-foreground">{formData.file.name}</span>
                        <p className="text-xs text-muted-foreground">{formatFileSize(formData.file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData({ ...formData, file: null });
                        const fileInput = document.getElementById('file') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isUploading || !formData.file || !formData.title}>
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Upload File
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card className="shadow-lg bg-card border border-border">
          <CardHeader className="rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Uploads</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <Zap className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {uploads.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No uploads yet</p>
                <p className="text-sm text-muted-foreground/80">Upload your first file to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {uploads.slice(0, VISIBLE_LIMIT).map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(upload.file_type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-foreground">{upload.file_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(upload.file_size)}
                          </p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <p className="text-xs text-muted-foreground">
                            {new Date(upload.upload_date).toLocaleDateString()}
                          </p>
                          {upload.is_processed && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <Badge variant="secondary" className="text-xs">
                                Processed
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteFile(upload.id, upload.file_path)}
                      className="text-red-500 hover:text-red-500/90 hover:bg-muted"
                    >
                      Delete
                    </Button>
                  </div>
                ))}

                {uploads.length > VISIBLE_LIMIT && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {VISIBLE_LIMIT} of {uploads.length} uploads
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upload;
