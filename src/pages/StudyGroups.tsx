
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Plus, MessageCircle, Settings, UserPlus, Crown, Star, Clock, BookOpen } from "lucide-react";

const StudyGroups = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Prototype groups data
  const prototypeGroups = [
    {
      id: 1,
      name: "Advanced Mathematics Study Circle",
      description: "Collaborative learning for calculus, algebra, and advanced mathematical concepts",
      subject: "Mathematics",
      memberCount: 24,
      maxMembers: 30,
      isPrivate: false,
      featured: true,
      lastActivity: "2 hours ago",
      avatar: "/placeholder.svg",
      members: [
        { id: 1, name: "Alex Chen", avatar: "/placeholder.svg", role: "admin" },
        { id: 2, name: "Sarah Kim", avatar: "/placeholder.svg", role: "member" },
        { id: 3, name: "Mike Johnson", avatar: "/placeholder.svg", role: "member" },
        { id: 4, name: "Emily Davis", avatar: "/placeholder.svg", role: "moderator" }
      ]
    },
    {
      id: 2,
      name: "Physics Problem Solvers",
      description: "Tackling complex physics problems together, from mechanics to quantum theory",
      subject: "Physics",
      memberCount: 18,
      maxMembers: 25,
      isPrivate: false,
      featured: false,
      lastActivity: "5 hours ago",
      avatar: "/placeholder.svg",
      members: [
        { id: 5, name: "David Lee", avatar: "/placeholder.svg", role: "admin" },
        { id: 6, name: "Lisa Wang", avatar: "/placeholder.svg", role: "member" }
      ]
    },
    {
      id: 3,
      name: "Computer Science Bootcamp",
      description: "Programming, algorithms, and software development discussions",
      subject: "Computer Science",
      memberCount: 42,
      maxMembers: 50,
      isPrivate: false,
      featured: true,
      lastActivity: "30 minutes ago",
      avatar: "/placeholder.svg",
      members: [
        { id: 7, name: "James Rodriguez", avatar: "/placeholder.svg", role: "admin" },
        { id: 8, name: "Anna Thompson", avatar: "/placeholder.svg", role: "moderator" }
      ]
    },
    {
      id: 4,
      name: "Chemistry Lab Partners",
      description: "Organic chemistry, biochemistry, and lab experiment discussions",
      subject: "Chemistry",
      memberCount: 15,
      maxMembers: 20,
      isPrivate: true,
      featured: false,
      lastActivity: "1 day ago",
      avatar: "/placeholder.svg",
      members: [
        { id: 9, name: "Sophie Brown", avatar: "/placeholder.svg", role: "admin" }
      ]
    },
    {
      id: 5,
      name: "History Enthusiasts",
      description: "Exploring world history, analyzing historical events and their impacts",
      subject: "History",
      memberCount: 31,
      maxMembers: 40,
      isPrivate: false,
      featured: false,
      lastActivity: "3 hours ago",
      avatar: "/placeholder.svg",
      members: [
        { id: 10, name: "Robert Miller", avatar: "/placeholder.svg", role: "admin" },
        { id: 11, name: "Jessica Wilson", avatar: "/placeholder.svg", role: "member" }
      ]
    },
    {
      id: 6,
      name: "Literature Analysis Club",
      description: "Deep dives into classic and contemporary literature, poetry analysis",
      subject: "Literature",
      memberCount: 22,
      maxMembers: 30,
      isPrivate: false,
      featured: true,
      lastActivity: "1 hour ago",
      avatar: "/placeholder.svg",
      members: [
        { id: 12, name: "Grace Taylor", avatar: "/placeholder.svg", role: "admin" }
      ]
    }
  ];

  const filteredGroups = prototypeGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredGroups = prototypeGroups.filter(group => group.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Study Groups
            </h1>
            <p className="text-slate-600 mt-2">Join collaborative learning communities</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl h-12">
                <Plus className="w-5 h-5 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 rounded-2xl border-0 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-800">Create Study Group</DialogTitle>
                <DialogDescription className="text-slate-600">Start a new collaborative learning community</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="groupName" className="text-sm font-medium text-slate-700">Group Name *</Label>
                  <Input
                    id="groupName"
                    placeholder="e.g. Advanced Physics Study Group"
                    className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what your group will focus on..."
                    rows={3}
                    className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="subject" className="text-sm font-medium text-slate-700">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="e.g. Mathematics"
                      className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxMembers" className="text-sm font-medium text-slate-700">Max Members</Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      placeholder="50"
                      className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => setIsCreateOpen(false)} variant="outline" className="flex-1 rounded-xl border-slate-200">
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl">
                    Create Group
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search study groups by name, subject, or description..."
                className="pl-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-14 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Featured Groups */}
        {featuredGroups.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-semibold text-slate-800">Featured Groups</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredGroups.map(group => (
                <Card key={group.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm rounded-2xl group relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-yellow-500 text-white rounded-lg">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                        <AvatarImage src={group.avatar} alt={group.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {group.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight text-slate-800">{group.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="rounded-lg">{group.subject}</Badge>
                          {group.isPrivate && <Badge variant="outline" className="rounded-lg">Private</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 line-clamp-2">{group.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{group.memberCount}/{group.maxMembers} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{group.lastActivity}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {group.members.slice(0, 3).map(member => (
                          <Avatar key={member.id} className="w-6 h-6 border-2 border-white">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback className="bg-slate-300 text-slate-600 text-xs">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {group.members.length > 3 && (
                        <span className="text-xs text-slate-500">+{group.members.length - 3} more</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl group-hover:shadow-lg transition-all duration-300">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join Group
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl border-slate-200">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Groups */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">All Study Groups</h2>
          {filteredGroups.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.map(group => (
                <Card key={group.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm rounded-2xl group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                        <AvatarImage src={group.avatar} alt={group.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {group.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight text-slate-800">{group.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="rounded-lg">{group.subject}</Badge>
                          {group.isPrivate && <Badge variant="outline" className="rounded-lg">Private</Badge>}
                          {group.featured && (
                            <Badge className="bg-yellow-500 text-white rounded-lg">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 line-clamp-2">{group.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{group.memberCount}/{group.maxMembers} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{group.lastActivity}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {group.members.slice(0, 3).map(member => (
                          <Avatar key={member.id} className="w-6 h-6 border-2 border-white">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback className="bg-slate-300 text-slate-600 text-xs">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {group.members.length > 3 && (
                        <span className="text-xs text-slate-500">+{group.members.length - 3} more</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl group-hover:shadow-lg transition-all duration-300">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join Group
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl border-slate-200">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No study groups found</h3>
                <p className="text-slate-500 mb-6">
                  Try adjusting your search or create a new study group to get started.
                </p>
                <Button 
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Study Group
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyGroups;
