
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, File, X } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Skeleton } from "@/components/ui/skeleton";

const Upload = () => {
  const { uploads, isLoading, isUploading, uploadFile, deleteFile } = useFileUpload();
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

    await uploadFile(formData.file);
    
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
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Upload Files</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Upload Files</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Upload New File</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="file">File</Label>
                <div className="mt-1">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3,.jpg,.jpeg,.png"
                    required
                  />
                </div>
                {formData.file && (
                  <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                    <div className="flex items-center">
                      <File className="h-4 w-4 mr-2" />
                      <span className="text-sm">{formData.file.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, file: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isUploading || !formData.file}>
                {isUploading ? (
                  <>Uploading...</>
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
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            {uploads.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No uploads yet</p>
                <p className="text-sm text-gray-400">Upload your first file to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {uploads.slice(0, 5).map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <File className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">{upload.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {upload.file_size ? `${(upload.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(upload.upload_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteFile(upload.id, upload.file_path)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upload;
