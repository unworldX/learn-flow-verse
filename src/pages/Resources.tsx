
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, Filter, Heart, Download, Eye } from 'lucide-react';
import { useRealResources } from '@/hooks/useRealResources';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const Resources = () => {
  const { user } = useAuth();
  const { resources, isLoading, filters, setFilters, addToFavorites, updateProgress } = useRealResources();

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const handleSubjectFilter = (subject: string) => {
    setFilters(prev => ({ ...prev, subject }));
  };

  const handleTypeFilter = (resourceType: string) => {
    setFilters(prev => ({ ...prev, resourceType }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Study Resources</h2>
          <p className="text-gray-600 mb-4">Please sign in to access study resources</p>
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Resources</h1>
          <p className="text-gray-600">Discover and access educational materials</p>
        </div>
        <Link to="/upload">
          <Button className="gap-2">
            <BookOpen className="w-4 h-4" />
            Upload Resource
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search resources..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filters.subject} onValueChange={handleSubjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Subjects</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="Biology">Biology</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="History">History</SelectItem>
                <SelectItem value="Literature">Literature</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.resourceType} onValueChange={handleTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Resource type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
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
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600 text-center mb-4">
              {filters.search || filters.subject || filters.resourceType
                ? "Try adjusting your filters to find more resources"
                : "Be the first to upload a study resource for the community"}
            </p>
            <Link to="/upload">
              <Button>Upload First Resource</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {resource.description || "No description available"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => addToFavorites(resource.id)}
                    className="shrink-0"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{resource.resource_type}</Badge>
                    {resource.subject && <Badge variant="outline">{resource.subject}</Badge>}
                    {resource.class && <Badge variant="outline">{resource.class}</Badge>}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>By: {resource.author || "Unknown"}</p>
                    <p>Uploaded: {new Date(resource.upload_date).toLocaleDateString()}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => updateProgress(resource.id, 25)}
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    {resource.file_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="gap-2"
                      >
                        <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Resources;
