
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, MessageSquare, TrendingUp, Clock, User, Heart, MessageCircle } from "lucide-react";

const Forums = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const categories = [
    { id: "all", name: "All Topics", color: "bg-slate-500" },
    { id: "general", name: "General Discussion", color: "bg-blue-500" },
    { id: "math", name: "Mathematics", color: "bg-purple-500" },
    { id: "science", name: "Science", color: "bg-green-500" },
    { id: "help", name: "Study Help", color: "bg-orange-500" },
    { id: "resources", name: "Resources", color: "bg-pink-500" }
  ];

  const mockPosts = [
    {
      id: 1,
      title: "Tips for effective study habits",
      content: "What are your best study techniques that have helped you succeed?",
      author: "StudyMaster",
      category: "general",
      replies: 23,
      likes: 15,
      time: "2 hours ago",
      isPinned: true
    },
    {
      id: 2,
      title: "Calculus help needed",
      content: "Struggling with integration by parts. Any good resources?",
      author: "MathStudent",
      category: "math",
      replies: 8,
      likes: 12,
      time: "4 hours ago"
    },
    {
      id: 3,
      title: "Chemistry lab report guide",
      content: "How to write better lab reports for chemistry class?",
      author: "ChemLover",
      category: "science",
      replies: 15,
      likes: 20,
      time: "6 hours ago"
    }
  ];

  const filteredPosts = mockPosts.filter(post => {
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Study Forums
          </h1>
          <p className="text-slate-600">Connect, discuss, and learn together with fellow students</p>
        </div>

        {/* Search and Actions */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search discussions, topics, questions..."
                  className="pl-12 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl bg-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-0 shadow-2xl">
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id} className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${category.color}`} />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl h-12 px-6">
                      <Plus className="w-5 h-5 mr-2" />
                      New Discussion
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl mx-4 rounded-2xl border-0 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold text-slate-800">Start New Discussion</DialogTitle>
                      <DialogDescription className="text-slate-600">Share your thoughts and questions with the community</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Input
                          placeholder="Discussion title"
                          className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                        />
                      </div>
                      <div>
                        <Select>
                          <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {categories.slice(1).map(category => (
                              <SelectItem key={category.id} value={category.id} className="rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${category.color}`} />
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Textarea
                          placeholder="What would you like to discuss?"
                          rows={6}
                          className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                        />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button onClick={() => setIsCreateOpen(false)} variant="outline" className="flex-1 rounded-xl border-slate-200">
                          Cancel
                        </Button>
                        <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl">
                          Post Discussion
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forum Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">1,234</div>
              <div className="text-sm opacity-90">Total Posts</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <User className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">567</div>
              <div className="text-sm opacity-90">Active Users</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">89</div>
              <div className="text-sm opacity-90">Hot Topics</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm opacity-90">Active</div>
            </CardContent>
          </Card>
        </div>

        {/* Forum Tabs */}
        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-2 grid w-full grid-cols-3 lg:w-auto lg:inline-grid lg:grid-cols-3">
            <TabsTrigger value="recent" className="rounded-xl font-medium">Recent</TabsTrigger>
            <TabsTrigger value="trending" className="rounded-xl font-medium">Trending</TabsTrigger>
            <TabsTrigger value="unanswered" className="rounded-xl font-medium">Unanswered</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            {filteredPosts.map(post => (
              <Card key={post.id} className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm rounded-2xl ${post.isPinned ? 'ring-2 ring-blue-200' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        {post.isPinned && (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-lg">Pinned</Badge>
                        )}
                        <Badge variant="outline" className="rounded-lg">
                          <div className={`w-2 h-2 rounded-full mr-2 ${categories.find(c => c.id === post.category)?.color}`} />
                          {categories.find(c => c.id === post.category)?.name}
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2 hover:text-blue-600 cursor-pointer transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed">{post.content}</p>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{post.time}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex lg:flex-col gap-4 lg:gap-2 lg:items-end">
                      <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl">
                        <MessageCircle className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">{post.replies}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-xl">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-red-600">{post.likes}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="trending">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardContent className="p-12 text-center">
                <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">Trending Discussions</h3>
                <p className="text-slate-500">Popular discussions will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unanswered">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">Unanswered Questions</h3>
                <p className="text-slate-500">Help others by answering their questions</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Forums;
