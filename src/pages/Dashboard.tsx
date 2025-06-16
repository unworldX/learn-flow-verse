
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Users, MessageSquare, TrendingUp, Plus, Calendar } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const { stats, isLoading } = useSupabaseData();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to Study Assistant</h2>
          <p className="text-gray-600 mb-4">Please sign in to access your dashboard</p>
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
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.user_metadata?.username || user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your studies today</p>
        </div>
        <div className="flex gap-2">
          <Link to="/resources">
            <Button variant="outline" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Browse Resources
            </Button>
          </Link>
          <Link to="/ai-chat">
            <Button className="gap-2">
              <MessageSquare className="w-4 h-4" />
              AI Assistant
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.totalResources.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Available study materials</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.totalStudyGroups.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Active groups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.totalMessages.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total conversations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userProgress}%</div>
            <Progress value={stats.userProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Average completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Get started with your study session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/upload" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <BookOpen className="w-4 h-4" />
                Upload Study Material
              </Button>
            </Link>
            <Link to="/groups" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="w-4 h-4" />
                Create Study Group
              </Button>
            </Link>
            <Link to="/study-plans" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calendar className="w-4 h-4" />
                Plan Study Schedule
              </Button>
            </Link>
            <Link to="/ai-chat" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <MessageSquare className="w-4 h-4" />
                Ask AI Assistant
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Welcome to your study dashboard!</p>
                  <p className="text-xs text-gray-500">
                    Start by uploading study materials or joining study groups
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">AI Assistant is ready</p>
                  <p className="text-xs text-gray-500">
                    Configure your AI providers in Settings to get started
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
