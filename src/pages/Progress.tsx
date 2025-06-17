
import React from 'react';
import { useGamification } from '@/hooks/useGamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award, Target } from 'lucide-react';

const ProgressPage = () => {
  const { gamificationData, isLoading } = useGamification();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (!gamificationData) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Your Progress</h1>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p>No progress data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pointsToNextLevel = ((gamificationData.level) * 100) - gamificationData.points;
  const progressPercentage = (gamificationData.points % 100);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Progress</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Level Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level {gamificationData.level}</div>
            <p className="text-xs text-muted-foreground">
              {pointsToNextLevel} points to next level
            </p>
            <Progress value={progressPercentage} className="mt-2" />
          </CardContent>
        </Card>

        {/* Points Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Star className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gamificationData.points}</div>
            <p className="text-xs text-muted-foreground">
              Points earned from activities
            </p>
          </CardContent>
        </Card>

        {/* Badges Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gamificationData.badges?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Achievement badges collected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Badges Section */}
      {gamificationData.badges && gamificationData.badges.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {gamificationData.badges.map((badge, index) => (
                <Badge key={index} variant="outline" className="p-2">
                  <Award className="w-4 h-4 mr-1" />
                  {badge}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Goals */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Achievement Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Reach Level 5</span>
              </div>
              <Badge variant={gamificationData.level >= 5 ? "default" : "secondary"}>
                {gamificationData.level >= 5 ? "Completed" : "In Progress"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Earn 500 Points</span>
              </div>
              <Badge variant={gamificationData.points >= 500 ? "default" : "secondary"}>
                {gamificationData.points >= 500 ? "Completed" : "In Progress"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Collect 10 Badges</span>
              </div>
              <Badge variant={(gamificationData.badges?.length || 0) >= 10 ? "default" : "secondary"}>
                {(gamificationData.badges?.length || 0) >= 10 ? "Completed" : "In Progress"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressPage;
