import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Filter, Download } from "lucide-react";
import { useSearch, SearchFilters } from "@/hooks/useSearch";
import { Skeleton } from "@/components/ui/skeleton";

const Search = () => {
  const { results, isLoading, searchResources } = useSearch();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    searchResources(query, filters);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Search Resources</h1>

      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search books, videos, notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full"
          />
        </div>
        <Button onClick={handleSearch}>
          <SearchIcon className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input
                  placeholder="e.g., Math, Science"
                  value={filters.subject || ''}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Class</label>
                <Input
                  placeholder="e.g., Grade 10, BSc"
                  value={filters.class || ''}
                  onChange={(e) => handleFilterChange('class', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Author</label>
                <Input
                  placeholder="Author name"
                  value={filters.author || ''}
                  onChange={(e) => handleFilterChange('author', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select 
                  value={filters.resourceType || ''} 
                  onValueChange={(value) => handleFilterChange('resourceType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select 
                  value={filters.sortBy || 'date'} 
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Order</label>
                <Select 
                  value={filters.sortOrder || 'desc'} 
                  onValueChange={(value) => handleFilterChange('sortOrder', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest</SelectItem>
                    <SelectItem value="asc">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {isLoading ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{resource.resource_type}</Badge>
                  {resource.author && <span>by {resource.author}</span>}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {resource.description}
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    <p>Subject: {resource.subject || 'General'}</p>
                    <p>Downloads: {resource.download_count || 0}</p>
                  </div>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {results.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">No results found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search terms or filters</p>
        </div>
      )}
    </div>
  );
};

export default Search;