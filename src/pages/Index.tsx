
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Upload, Users, MessageCircle, Search, Bot, Zap, Star } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 gradient-text">
            Welcome to Student Library
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Your comprehensive learning platform with AI-powered assistance, collaborative tools, and endless resources
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">1000+</div>
            <div className="text-sm text-slate-600">Resources</div>
          </div>
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">500+</div>
            <div className="text-sm text-slate-600">Students</div>
          </div>
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">50+</div>
            <div className="text-sm text-slate-600">Study Groups</div>
          </div>
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1">24/7</div>
            <div className="text-sm text-slate-600">AI Support</div>
          </div>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="card-hover glass border-0 shadow-xl">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Study Resources</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-slate-600 mb-4">Access thousands of study materials, notes, and educational content</p>
              <Button asChild className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                <Link to="/resources">Browse Resources</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover glass border-0 shadow-xl">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">AI Assistant</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-slate-600 mb-4">Get instant help with your studies from our AI tutor</p>
              <Button asChild className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                <Link to="/ai-chat">Chat with AI</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover glass border-0 shadow-xl">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Study Groups</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-slate-600 mb-4">Join collaborative study groups and learn together</p>
              <Button asChild className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                <Link to="/study-groups">Join Groups</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover glass border-0 shadow-xl">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Smart Search</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-slate-600 mb-4">Find exactly what you need with advanced search filters</p>
              <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                <Link to="/search">Start Searching</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="card-hover glass border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Upload className="w-8 h-8 text-indigo-600" />
                <CardTitle className="text-lg">Share Content</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">Upload and share your study materials with the community</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/upload">Upload Files</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover glass border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-pink-600" />
                <CardTitle className="text-lg">Discussions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">Engage in academic discussions and forums</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/forums">Join Discussions</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover glass border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-600" />
                <CardTitle className="text-lg">Premium</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">Unlock advanced features with premium subscription</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/subscription">Learn More</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Start Learning Today
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
            Ready to supercharge your learning?
          </h2>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            Join thousands of students who are already using our platform to achieve their academic goals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link to="/resources">Explore Resources</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2">
              <Link to="/ai-chat">Try AI Assistant</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
