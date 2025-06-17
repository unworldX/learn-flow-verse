
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { Calendar, Download, Users } from "lucide-react";

const SubscriptionStatus = () => {
  const { subscription, isLoading } = useSubscription();

  if (isLoading) {
    return <div>Loading subscription status...</div>;
  }

  if (!subscription) {
    return <div>No subscription found</div>;
  }

  const downloadProgress = (subscription.downloads_used / subscription.download_limit) * 100;
  const groupProgress = (subscription.groups_joined / subscription.group_limit) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Subscription Status
          <Badge variant={subscription.subscribed ? "default" : "secondary"}>
            {subscription.subscribed ? subscription.subscription_tier?.toUpperCase() : 'FREE'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription.subscribed && subscription.subscription_end && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            Valid until: {new Date(subscription.subscription_end).toLocaleDateString()}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center text-sm">
                <Download className="h-4 w-4 mr-2" />
                Downloads Used
              </span>
              <span className="text-sm font-medium">
                {subscription.downloads_used} / {subscription.download_limit}
              </span>
            </div>
            <Progress value={downloadProgress} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2" />
                Groups Joined
              </span>
              <span className="text-sm font-medium">
                {subscription.groups_joined} / {subscription.group_limit}
              </span>
            </div>
            <Progress value={groupProgress} className="h-2" />
          </div>
        </div>

        {!subscription.subscribed && (
          <div className="pt-4">
            <Button className="w-full">
              Upgrade to Premium
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;
