
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '₹40',
    duration: 'month',
    downloads: 20,
    groups: 3,
    features: [
      '20 downloads per month',
      'Join up to 3 study groups',
      'Basic forum access',
      'Email support'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹50',
    duration: 'month',
    downloads: 50,
    groups: 10,
    popular: true,
    features: [
      '50 downloads per month',
      'Join up to 10 study groups',
      'Full forum access',
      'Priority support',
      'Exclusive resources'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '₹100',
    duration: 'month',
    downloads: 'Unlimited',
    groups: 'Unlimited',
    features: [
      'Unlimited downloads',
      'Unlimited study groups',
      'Full platform access',
      '24/7 support',
      'Custom integrations',
      'Analytics dashboard'
    ]
  }
];

const SubscriptionPlans = () => {
  const { subscription } = useSubscription();
  const { toast } = useToast();

  const handleSubscribe = async (planId: string) => {
    try {
      // This would integrate with Stripe checkout
      toast({
        title: "Subscription",
        description: `${planId} plan subscription would be handled here with Stripe integration`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start subscription process",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {plans.map((plan) => (
        <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
          {plan.popular && (
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
              Most Popular
            </Badge>
          )}
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <div className="text-3xl font-bold text-blue-600">
              {plan.price}
              <span className="text-sm text-gray-500">/{plan.duration}</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full" 
              variant={subscription?.subscription_tier === plan.id ? "outline" : "default"}
              onClick={() => handleSubscribe(plan.id)}
              disabled={subscription?.subscription_tier === plan.id}
            >
              {subscription?.subscription_tier === plan.id ? 'Current Plan' : 'Subscribe'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SubscriptionPlans;
