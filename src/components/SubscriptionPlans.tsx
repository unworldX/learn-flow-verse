
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '₹40',
    description: 'Perfect for individual students',
    features: [
      '20 downloads per month',
      'Join up to 3 study groups',
      'Basic AI assistance',
      'Email support'
    ],
    popular: false
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹50',
    description: 'Best for active learners',
    features: [
      '50 downloads per month',
      'Join up to 10 study groups',
      'Advanced AI assistance',
      'Priority support',
      'Offline access to resources'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '₹100',
    description: 'For institutions and power users',
    features: [
      'Unlimited downloads',
      'Unlimited study groups',
      'Premium AI features',
      '24/7 support',
      'Advanced analytics',
      'Custom integrations'
    ],
    popular: false
  }
];

export const SubscriptionPlans = () => {
  const { subscription } = useSubscription();
  const { createCheckoutSession } = useSubscriptionStatus();

  const handleSubscribe = (planId: string) => {
    createCheckoutSession(planId);
  };

  const getCurrentPlan = () => {
    if (!subscription?.subscribed) return null;
    return subscription.subscription_tier;
  };

  const currentPlan = getCurrentPlan();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-500 text-white">
                <Star className="h-3 w-3 mr-1" />
                Most Popular
              </Badge>
            </div>
          )}
          
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
            <div className="text-3xl font-bold text-blue-600">
              {plan.price}
              <span className="text-sm font-normal text-gray-500">/month</span>
            </div>
            <p className="text-gray-600">{plan.description}</p>
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
            
            {currentPlan === plan.id ? (
              <Button className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={() => handleSubscribe(plan.id)}
                variant={plan.popular ? "default" : "outline"}
              >
                <Zap className="h-4 w-4 mr-2" />
                Subscribe Now
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
