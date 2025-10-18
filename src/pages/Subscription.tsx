
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Crown, Download, Users, Calendar, CheckCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { Skeleton } from "@/components/ui/skeleton";

const Subscription = () => {
  const { subscription, isLoading } = useSubscription();
  const { checkSubscriptionStatus, isChecking } = useSubscriptionStatus();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const downloadProgress = subscription ? (subscription.downloads_used / subscription.download_limit) * 100 : 0;
  const groupProgress = subscription ? (subscription.groups_joined / subscription.group_limit) * 100 : 0;

  return (
    <div className="container  mx-auto px-4 py-8">
      {/* <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-gray-600">Manage your subscription and usage</p>
        </div>
      </div> */}

      {/* Current Subscription Status */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Current Plan</CardTitle>
            <Button 
              variant="outline" 
              onClick={checkSubscriptionStatus}
              disabled={isChecking}
            >
              {isChecking ? 'Checking...' : 'Refresh Status'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {subscription?.subscribed ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <Crown className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <h3 className="font-semibold text-lg">
                {subscription?.subscribed 
                  ? subscription.subscription_tier?.toUpperCase() || 'SUBSCRIBED'
                  : 'FREE'
                }
              </h3>
              <p className="text-sm text-gray-600">
                {subscription?.subscribed ? 'Active Subscription' : 'No active subscription'}
              </p>
              {subscription?.subscription_end && (
                <p className="text-xs text-gray-500 mt-1">
                  Expires: {new Date(subscription.subscription_end).toLocaleDateString()}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Downloads Used</span>
                <span className="text-sm text-gray-600">
                  {subscription?.downloads_used || 0}/{subscription?.download_limit || 5}
                </span>
              </div>
              <Progress value={downloadProgress} className="mb-1" />
              <div className="flex items-center text-xs text-gray-500">
                <Download className="h-3 w-3 mr-1" />
                {subscription?.download_limit || 5} downloads per month
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Groups Joined</span>
                <span className="text-sm text-gray-600">
                  {subscription?.groups_joined || 0}/{subscription?.group_limit || 1}
                </span>
              </div>
              <Progress value={groupProgress} className="mb-1" />
              <div className="flex items-center text-xs text-gray-500">
                <Users className="h-3 w-3 mr-1" />
                {subscription?.group_limit || 1} groups maximum
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Subscription Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
        <SubscriptionPlans />
      </div>
    </div>
  );
};

export default Subscription;
