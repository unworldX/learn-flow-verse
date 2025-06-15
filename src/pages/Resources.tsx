
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  FileText, 
  Video, 
  Link2, 
  Download, 
  Heart, 
  Search, 
  Filter,
  Star,
  Calendar,
  User,
  Eye,
  Grid3X3,
  List
} from 'lucide-react';

// Mock data for resources
const mockResources = [
  {
    id: '1',
    title: 'Introduction to Calculus',
    description: 'Comprehensive guide to calculus fundamentals including limits, derivatives, and integrals.',
    author: 'Dr. Sarah Johnson',
    subject: 'Mathematics',
    class: 'Calculus I',
    type: 'PDF',
    uploadDate: '2024-01-15',
    downloads: 1250,
    rating: 4.8,
    isFavorite: true,
  },
  {
    id: '2',
    title: 'Physics Lab Manual',
    description: 'Complete laboratory procedures and experiments for introductory physics.',
    author: 'Prof. Michael Chen',
    subject: 'Physics',
    class: 'Physics 101',
    type: 'PDF',
    uploadDate: '2024-01-20',
    downloads: 890,
    rating: 4.6,
    isFavorite: false,
  },
  {
    id: '3',
    title: 'Chemistry Video Lectures',
    description: 'Video series covering organic chemistry reactions and mechanisms.',
    author: 'Dr. Emily Rodriguez',
    subject: 'Chemistry',
    class: 'Organic Chemistry',
    type: 'Video',
    uploadDate: '2024-01-10',
    downloads: 2100,
    rating: 4.9,
    isFavorite: true,
  },
  {
    id: '4',
    title: 'Biology Study Guide',
    description: 'Comprehensive study notes for cell biology and molecular processes.',
    author: 'Dr. James Wilson',
    subject: 'Biology',
    class: 'Cell Biology',
    type: 'Document',
    uploadDate: '2024-01-25',
    downloads: 675,
    rating: 4.4,
    isFavorite: false,
  },
];

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];
  const types = ['PDF', 'Video', 'Document', 'Link'];

  const filteredResources = mockResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || resource.subject === selectedSubject;
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    return matchesSearch && matchesSubject && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-4 h-4" />;
      case 'Video':
        return <Video className="w-4 h-4" />;
      case 'Link':
        return <Link2 className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PDF':
        return 'bg-red-100 text-red-800';
      case 'Video':
        return 'bg-purple-100 text-purple-800';
      case 'Link':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const ResourceCard = ({ resource }: { resource: any }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm md:text-base font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {resource.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={`${getTypeColor(resource.type)} text-xs`}>
                <div className="flex items-center gap-1">
                  {getTypeIcon(resource.type)}
                  {resource.type}
                </div>
              </Badge>
              <Badge variant="outline" className="text-xs">
                {resource.subject}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-8 w-8 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Heart className={`w-4 h-4 ${resource.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs md:text-sm text-slate-600 mb-3 line-clamp-2">
          {resource.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <User className="w-3 h-3" />
            <span className="truncate">{resource.author}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(resource.uploadDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                <span>{resource.downloads}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{resource.rating}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs">
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline" className="text-xs">
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ResourceListItem = ({ resource }: { resource: any }) => (
    <Card className="group hover:shadow-md transition-all duration-300 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${getTypeColor(resource.type)} flex items-center justify-center flex-shrink-0`}>
            {getTypeIcon(resource.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                  {resource.title}
                </h3>
                <p className="text-xs md:text-sm text-slate-600 line-clamp-1 mt-1">
                  {resource.description}
                </p>
                <div className="flex items-center gap-2 md:gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {resource.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(resource.uploadDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {resource.rating}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-8 w-8 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${resource.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button size="sm" variant="outline" className="text-xs px-2 md:px-3">
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Study Resources
          </h1>
          <p className="text-sm md:text-base text-slate-600">Discover and access educational materials to enhance your learning</p>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-3 md:p-6">
            <div className="space-y-3 md:space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 md:h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>

              {/* Filter Toggle (Mobile) */}
              <div className="flex items-center justify-between md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-xs"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Filters
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="p-2"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="p-2"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className={`grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 ${showFilters || 'hidden md:grid'}`}>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {types.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="hidden md:block"></div>

                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="flex-1"
                  >
                    <Grid3X3 className="w-4 h-4 mr-1" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="flex-1"
                  >
                    <List className="w-4 h-4 mr-1" />
                    List
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing {filteredResources.length} of {mockResources.length} resources
          </p>
        </div>

        {/* Resources Grid/List */}
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'
            : 'space-y-3 md:space-y-4'
        }>
          {filteredResources.map(resource => 
            viewMode === 'grid' 
              ? <ResourceCard key={resource.id} resource={resource} />
              : <ResourceListItem key={resource.id} resource={resource} />
          )}
        </div>

        {filteredResources.length === 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12 text-center">
              <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-slate-800 mb-2">No resources found</h3>
              <p className="text-sm md:text-base text-slate-600">Try adjusting your search terms or filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Resources;
