
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Heart, Search, Star } from "lucide-react";
import { useRealResources } from "@/hooks/useRealResources";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Resources</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Resources</h1>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-lg text-gray-500">No resources found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          resources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                  {resource.premium_content && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{resource.subject}</Badge>
                  <Badge variant="outline">{resource.resource_type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {resource.description}
                </p>
                <div className="text-xs text-gray-500 mb-4">
                  <p>By: {resource.author}</p>
                  <p>Class: {resource.class}</p>
                  <p>Downloads: {resource.download_count}</p>
                  <p>Uploaded: {new Date(resource.upload_date).toLocaleDateString()}</p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => downloadResource(resource)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => addToFavorites(resource.id)}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
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
