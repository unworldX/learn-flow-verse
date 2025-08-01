
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Heart, Search, Star, Eye, ArrowLeft, Filter, BookOpen } from "lucide-react";
import { useRealResources } from "@/hooks/useRealResources";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Resources = () => {
  const { resources, isLoading, filters, setFilters, downloadResource, addToFavorites } = useRealResources();
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
  };

  const handleSubjectFilter = (value: string) => {
    setFilters({ ...filters, subject: value === 'all' ? '' : value });
  };

  const handleTypeFilter = (value: string) => {
    setFilters({ ...filters, resourceType: value === 'all' ? '' : value });
  };

  const handleDownload = async (resource: any) => {
    const resourceId = resource.id;
    setDownloadProgress(prev => ({ ...prev, [resourceId]: 0 }));
    
    // Simulate download progress
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        const currentProgress = prev[resourceId] || 0;
        if (currentProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDownloadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[resourceId];
              return newProgress;
            });
          }, 1000);
          return prev;
        }
        return { ...prev, [resourceId]: currentProgress + 10 };
      });
    }, 200);
    
    await downloadResource(resource);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-4 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Study Resources</h1>
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
    <div className="min-h-screen liquid-bg">
      <div className="container mx-auto px-3 py-4 md:px-4 md:py-6 max-w-7xl">
        {/* Enhanced Title Bar */}
        <div className="glass-card p-4 md:p-6 mb-6 border border-white/20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold gradient-text">Study Resources</h1>
                <p className="text-sm text-slate-600 mt-1">Access learning materials and documents</p>
              </div>
            </div>
            <Button variant="outline" className="glass border-white/30 hover:bg-white/20">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </div>
      
        {/* Enhanced Filters */}
        <div className="glass-card p-4 md:p-6 mb-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search resources..."
                className="pl-10 bg-white/80 border-white/30"
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Select value={filters.subject || 'all'} onValueChange={handleSubjectFilter}>
              <SelectTrigger className="bg-white/80 border-white/30">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent className="glass-card border-white/30">
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="History">History</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.resourceType || 'all'} onValueChange={handleTypeFilter}>
              <SelectTrigger className="bg-white/80 border-white/30">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="glass-card border-white/30">
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
              <div className="glass-card p-8 border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg text-slate-700 mb-2">No resources found</p>
                <p className="text-sm text-slate-500">Try adjusting your search terms or filters</p>
              </div>
            </div>
          ) : (
            resources.map((resource) => (
              <div key={resource.id} className="glass-card border border-white/20 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                <div className="p-4 md:p-6">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h3 className="text-base md:text-lg font-semibold line-clamp-2 leading-tight text-slate-800">
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
                    <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">{resource.subject}</Badge>
                    <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 bg-purple-50">{resource.resource_type}</Badge>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                    {resource.description}
                  </p>
                  
                  <div className="text-xs text-slate-500 mb-4 space-y-1">
                    <p>By: <span className="font-medium text-slate-700">{resource.author}</span></p>
                    <p>Class: <span className="font-medium text-slate-700">{resource.class}</span></p>
                    <div className="flex items-center justify-between">
                      <span>Downloads: <span className="font-medium text-slate-700">{resource.download_count}</span></span>
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
                      className="shrink-0 glass border-white/30 hover:bg-white/20"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    {resource.file_url && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(resource.file_url, '_blank')}
                        className="shrink-0 glass border-white/30 hover:bg-white/20"
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
    </div>
  );
};

export default Resources;
