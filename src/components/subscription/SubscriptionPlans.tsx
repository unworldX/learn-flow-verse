
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

const plans = [
  // {
  //   id: 'free',
  //   name: 'Free',
  //   price: '₹0',
  //   duration: 'month',
  //   description: 'Perfect for getting started and exploring core features.',
  //   features: [
  //     '5 downloads PDFs per month',
  //     'Access up to 1 course',
  //     'Watch videos in 480p',
  //     'Basic forum access'
  //   ]
  // },
  {
    id: 'basic',
    name: 'Basic',
    price: '₹40',
    duration: 'month',
    description: 'Ideal for casual learners who need the essentials for their studies.',
    features: [
      '20 downloads PDFs per month',
      'Access up to 3 courses',
      'Watch videos in 720p',
      'Full forum access',
      'Email support'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹100',
    duration: 'month',
    popular: true,
    description: 'The best value for dedicated students, offering a full range of features.',
    features: [
      '50 downloads PDFs per month',
      'Access up to 10 courses',
      'Watch videos in 1080p',
      'Priority support',
      'Exclusive resources & content'
    ]
  },
  {
    id: 'pro', // Renamed from Enterprise
    name: 'Pro',
    price: '₹200',
    duration: 'month',
    description: 'The ultimate package for power users who demand unlimited access.',
    features: [
      'Unlimited downloads PDFs',
      'Access up to 15 courses',
      'Watch videos in highest quality',
      '24/7 support',
      'Early access to new features'
    ]
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
