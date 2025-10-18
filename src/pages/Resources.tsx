
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSignedUrl } from '@/lib/signedUrlCache';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Heart, Search, Star, Eye } from "lucide-react";
import { useRealResources, Resource } from "@/hooks/useRealResources";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveResourceUrl } from "@/lib/utils"; // still used for non-preview actions
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PdfViewerContent from "@/components/resources/PdfViewerContent";

const Resources = () => {
  const { resources, isLoading, filters, setFilters, downloadResource, addToFavorites } = useRealResources();
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
  };

  const handleSubjectFilter = (value: string) => {
    setFilters({ ...filters, subject: value === 'all' ? '' : value });
  };

  const handleTypeFilter = (value: string) => {
    setFilters({ ...filters, resourceType: value === 'all' ? '' : value });
  };

  const openPreview = (resource: Resource) => {
    // Keep original stored file_url so PdfViewerContent can sign it (bucket now private)
    setPreviewResource({ ...resource });
    setIsPreviewOpen(true);
  };

  const handleView = (resource: Resource) => {
    const resolvedUrl = resolveResourceUrl(resource.file_url);
    if (!resolvedUrl) return;

    const isPdf = (resource.resource_type || '').toLowerCase() === 'pdf' || resolvedUrl.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      openPreview(resource);
      return;
    }

    if (window.desktop?.isElectron && window.desktop.openExternal) {
      window.desktop.openExternal(resolvedUrl);
    } else {
      window.open(resolvedUrl, '_blank', 'noopener');
    }
  };

  const handleDownload = async (resource: Resource) => {
    const resourceId = resource.id;
    setDownloadProgress((prev) => ({ ...prev, [resourceId]: 0 }));

    const interval = window.setInterval(() => {
      setDownloadProgress((prev) => {
        const currentProgress = prev[resourceId] || 0;
        if (currentProgress >= 100) {
          return prev;
        }
        return { ...prev, [resourceId]: currentProgress + 12 };
      });
    }, 180);

    try {
  const downloaded = await downloadResource(resource);
  const target = downloaded ?? resource;
  const resolvedUrl = resolveResourceUrl(target.file_url);

      clearInterval(interval);
      setDownloadProgress((prev) => ({ ...prev, [resourceId]: 100 }));
      setTimeout(() => {
        setDownloadProgress((prev) => {
          const { [resourceId]: _removed, ...rest } = prev;
          return rest;
        });
      }, 900);

      if (!resolvedUrl) return;

      // If this is a Supabase storage URL (private bucket), obtain a signed URL for direct download
      let finalDownloadUrl = resolvedUrl;
      try {
        const match = resolvedUrl.match(/\/storage\/v1\/object\/public\/uploads\/(.+)$/);
        if (match) {
          const objectPath = match[1].replace(/^uploads\//, '');
          finalDownloadUrl = await getSignedUrl('uploads', objectPath, { lifetimeSeconds: 3600 });
        }
      } catch (e) {
        console.warn('Download signing fallback:', e);
      }

      const isPdf = (target.resource_type || '').toLowerCase() === 'pdf' || resolvedUrl.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        openPreview(target);
      } else if (window.desktop?.isElectron && window.desktop.openExternal) {
        window.desktop.openExternal(finalDownloadUrl);
      } else {
        const link = document.createElement('a');
        link.href = finalDownloadUrl;
        link.download = '';
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      clearInterval(interval);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 py-4 md:px-4 md:py-6 max-w-7xl">


        {/* Enhanced Filters */}
        <div className="p-4 md:p-6 mb-6 border border-border rounded-xl bg-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Select value={filters.subject || 'all'} onValueChange={handleSubjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="History">History</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.resourceType || 'all'} onValueChange={handleTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="Video">Video</SelectItem>
                <SelectItem value="Audio">Audio</SelectItem>
                <SelectItem value="Presentation">Presentation</SelectItem>
                <SelectItem value="Document">Document</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Enhanced Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {resources.length === 0 ? (
            <div className="col-span-full text-center py-8 md:py-12">
              <div className="p-8 border border-border rounded-xl bg-card">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg text-foreground mb-2">No resources found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search terms or filters</p>
              </div>
            </div>
          ) : (
            resources.map((resource) => (
              <div key={resource.id} className="border border-border rounded-xl bg-card transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                <div className="p-4 md:p-6">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h3 className="text-base md:text-lg font-semibold line-clamp-2 leading-tight text-foreground">
                      {resource.title}
                    </h3>
                    {resource.premium_content && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs shrink-0">
                        <Star className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 md:gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">{resource.subject}</Badge>
                    <Badge variant="secondary" className="text-xs">{resource.resource_type}</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                    {resource.description}
                  </p>

                  <div className="text-xs text-muted-foreground mb-4 space-y-1">
                    <p>By: <span className="font-medium text-foreground">{resource.author}</span></p>
                    <p>Class: <span className="font-medium text-foreground">{resource.class}</span></p>
                    <div className="flex items-center justify-between">
                      <span>Downloads: <span className="font-medium text-foreground">{resource.download_count}</span></span>
                      <span>{new Date(resource.upload_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Download Progress */}
                  {downloadProgress[resource.id] !== undefined && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>Downloading...</span>
                        <span>{downloadProgress[resource.id]}%</span>
                      </div>
                      <Progress value={downloadProgress[resource.id]} className="h-2" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      onClick={() => handleDownload(resource)}
                      disabled={downloadProgress[resource.id] !== undefined}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Download</span>
                      <span className="sm:hidden">Get</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addToFavorites(resource.id)}
                      className="shrink-0 hover:bg-muted"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    {resource.file_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(resource)}
                        className="shrink-0 hover:bg-muted"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog
        open={isPreviewOpen}
        onOpenChange={(open) => {
          setIsPreviewOpen(open);
          if (!open) {
            setPreviewResource(null);
          }
        }}
      >
        <DialogContent className="max-w-6xl w-[96vw] lg:w-[90vw] h-[90vh] p-0">
          <DialogTitle className="sr-only">Resource Preview</DialogTitle>
          <DialogDescription className="sr-only">PDF resource preview dialog</DialogDescription>
          {previewResource && (
            <div className="h-full">
              <PdfViewerContent
                resourceId={previewResource.id}
                initialResource={previewResource}
                onClose={() => {
                  setIsPreviewOpen(false);
                  setPreviewResource(null);
                }}
                mode="dialog"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Resources;
