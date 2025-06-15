
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, BookOpen, Video, FileText, Calendar, TrendingUp, Users, Bell, Upload, Eye, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Resource {
  id: string;
  title: string;
  author: string;
  subject: string;
  class: string;
  resource_type: string;
  file_url: string;
  description: string;
  upload_date: string;
  uploader_id: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const subjects = [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "Literature", "History", "Geography", "Economics", "Psychology"
  ];

  const classes = [
    "Grade 9", "Grade 10", "Grade 11", "Grade 12",
    "Year 1", "Year 2", "Year 3", "Year 4"
  ];

  const formats = [
    { value: "PDF", label: "PDF Document", icon: FileText },
    { value: "Video", label: "Video", icon: Video },
    { value: "Book", label: "E-Book", icon: BookOpen }
  ];

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedSubject, selectedClass, selectedAuthor, selectedFormat, sortBy, resources]);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = resources;

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply subject filter
    if (selectedSubject !== "all") {
      filtered = filtered.filter(resource => resource.subject === selectedSubject);
    }

    // Apply class filter
    if (selectedClass !== "all") {
      filtered = filtered.filter(resource => resource.class === selectedClass);
    }

    // Apply author filter
    if (selectedAuthor !== "all") {
      filtered = filtered.filter(resource => resource.author === selectedAuthor);
    }

    // Apply format filter
    if (selectedFormat !== "all") {
      filtered = filtered.filter(resource => resource.resource_type === selectedFormat);
    }

    // Apply sorting
    if (sortBy === "date") {
      filtered.sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime());
    } else if (sortBy === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "author") {
      filtered.sort((a, b) => a.author.localeCompare(b.author));
    }

    setFilteredResources(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSubject("all");
    setSelectedClass("all");
    setSelectedAuthor("all");
    setSelectedFormat("all");
    setSortBy("date");
  };

  const getUniqueAuthors = () => {
    const authors = [...new Set(resources.map(r => r.author).filter(Boolean))];
    return authors.sort();
  };

  const getResourceIcon = (type: string) => {
    const format = formats.find(f => f.value === type);
    if (format) {
      const IconComponent = format.icon;
      return <IconComponent className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'PDF': return 'bg-red-100 text-red-800';
      case 'Video': return 'bg-purple-100 text-purple-800';
      case 'Book': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.email?.split('@')[0]}!</h1>
          <p className="text-muted-foreground">Discover and explore study resources</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload Resource
          </Button>
        </div>
      </div>

      {/* Search & Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search & Filters
          </CardTitle>
          <CardDescription>
            Find the perfect study materials with our advanced search and filtering system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Global Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by title, author, subject, or content..."
              className="pl-10 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Author</label>
              <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                <SelectTrigger>
                  <SelectValue placeholder="All Authors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Authors</SelectItem>
                  {getUniqueAuthors().map(author => (
                    <SelectItem key={author} value={author}>{author}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Format</label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="All Formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  {formats.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Latest First
                    </div>
                  </SelectItem>
                  <SelectItem value="title">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Title A-Z
                    </div>
                  </SelectItem>
                  <SelectItem value="author">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Author A-Z
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || selectedSubject !== "all" || selectedClass !== "all" || selectedAuthor !== "all" || selectedFormat !== "all") && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary">Search: "{searchQuery}"</Badge>
              )}
              {selectedSubject !== "all" && (
                <Badge variant="secondary">Subject: {selectedSubject}</Badge>
              )}
              {selectedClass !== "all" && (
                <Badge variant="secondary">Class: {selectedClass}</Badge>
              )}
              {selectedAuthor !== "all" && (
                <Badge variant="secondary">Author: {selectedAuthor}</Badge>
              )}
              {selectedFormat !== "all" && (
                <Badge variant="secondary">Format: {selectedFormat}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            Search Results ({filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg">Loading resources...</div>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No resources found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search criteria or clearing some filters
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredResources.map(resource => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    {getResourceIcon(resource.resource_type)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{resource.title}</h4>
                      <p className="text-sm text-gray-600">
                        by {resource.author} • {resource.subject}
                        {resource.class && ` • ${resource.class}`}
                      </p>
                      {resource.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {resource.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Uploaded {new Date(resource.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getResourceTypeColor(resource.resource_type)}>
                      {resource.resource_type}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(resource.file_url, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = resource.file_url;
                        link.download = resource.title;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Resources</p>
                <p className="text-2xl font-bold">{resources.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Subjects</p>
                <p className="text-2xl font-bold">{subjects.length}</p>
              </div>
              <Video className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Authors</p>
                <p className="text-2xl font-bold">{getUniqueAuthors().length}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Search Results</p>
                <p className="text-2xl font-bold">{filteredResources.length}</p>
              </div>
              <Search className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
