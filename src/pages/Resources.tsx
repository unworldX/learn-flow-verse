
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, BookOpen, Video, FileText } from "lucide-react";

const Resources = () => {
  const resources = [
    {
      id: 1,
      title: "Advanced Calculus Complete Course",
      author: "Dr. Sarah Johnson",
      subject: "Mathematics",
      type: "PDF",
      description: "Comprehensive study material covering differential and integral calculus",
      downloads: 1250,
      rating: 4.8,
      size: "15.2 MB"
    },
    {
      id: 2,
      title: "Physics Lab Experiments Video Series",
      author: "Prof. Michael Chen",
      subject: "Physics",
      type: "Video",
      description: "Step-by-step laboratory experiments with detailed explanations",
      downloads: 890,
      rating: 4.9,
      size: "2.1 GB"
    },
    {
      id: 3,
      title: "Organic Chemistry Reaction Mechanisms",
      author: "Dr. Emily Rodriguez",
      subject: "Chemistry",
      type: "PDF",
      description: "Detailed notes on organic reaction mechanisms and synthesis",
      downloads: 670,
      rating: 4.7,
      size: "8.7 MB"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Study Resources</h1>
          <p className="text-muted-foreground">Discover and access shared study materials</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          Upload Resource
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search resources, authors, subjects..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resource Grid */}
      <div className="grid gap-6">
        {resources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {resource.type === "Video" ? (
                    <Video className="w-12 h-12 text-red-500" />
                  ) : (
                    <FileText className="w-12 h-12 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">by {resource.author}</p>
                      <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {resource.downloads} downloads
                        </span>
                        <span>⭐ {resource.rating}</span>
                        <span>{resource.size}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant="secondary">{resource.subject}</Badge>
                      <Badge variant="outline">{resource.type}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Preview
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Download
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm">
                      ❤️ Save
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Resources;
