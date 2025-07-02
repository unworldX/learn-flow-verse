
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Upload, Users, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Student Library</h1>
        <p className="text-lg text-muted-foreground">Your comprehensive learning platform</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <BookOpen className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Access study materials and resources</p>
            <Button asChild className="w-full">
              <Link to="/resources">Browse Resources</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Upload className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Share your study materials</p>
            <Button asChild className="w-full">
              <Link to="/upload">Upload Files</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Users className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Study Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Join or create study groups</p>
            <Button asChild className="w-full">
              <Link to="/study-groups">View Groups</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <MessageCircle className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Chat with other students</p>
            <Button asChild className="w-full">
              <Link to="/messages">Open Chat</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
