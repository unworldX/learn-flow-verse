
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Heart, Search, Star, Eye } from "lucide-react";
import { useRealResources } from "@/hooks/useRealResources";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Resources = () => {
  const { resources, isLoading, filters, setFilters, downloadResource, addToFavorites } = useRealResources();

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
  };

  const handleSubjectFilter = (value: string) => {
    setFilters({ ...filters, subject: value === 'all' ? '' : value });
  };

  const handleTypeFilter = (value: string) => {
    setFilters({ ...filters, resourceType: value === 'all' ? '' : value });
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
    <div className="container mx-auto px-4 py-4 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Study Resources</h1>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4 md:pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                className="pl-8"
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
        </CardContent>
      </Card>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {resources.length === 0 ? (
          <div className="col-span-full text-center py-8 md:py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg text-muted-foreground mb-2">No resources found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search terms or filters</p>
          </div>
        ) : (
          resources.map((resource) => (
            <Card key={resource.id} className="card-hover transition-all duration-300 hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base md:text-lg line-clamp-2 leading-tight">
                    {resource.title}
                  </CardTitle>
                  {resource.premium_content && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      <Star className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 md:gap-2">
                  <Badge variant="outline" className="text-xs">{resource.subject}</Badge>
                  <Badge variant="outline" className="text-xs">{resource.resource_type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                  {resource.description}
                </p>
                <div className="text-xs text-muted-foreground mb-4 space-y-1">
                  <p>By: <span className="font-medium">{resource.author}</span></p>
                  <p>Class: <span className="font-medium">{resource.class}</span></p>
                  <div className="flex items-center justify-between">
                    <span>Downloads: <span className="font-medium">{resource.download_count}</span></span>
                    <span>{new Date(resource.upload_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={() => downloadResource(resource)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Download</span>
                    <span className="sm:hidden">Get</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => addToFavorites(resource.id)}
                    className="shrink-0"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  {resource.file_url && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(resource.file_url, '_blank')}
                      className="shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Resources;
