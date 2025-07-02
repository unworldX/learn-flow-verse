
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useSubscriptionStatus = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);

  const checkSubscriptionStatus = async () => {
    if (!user || !session) return;

    setIsChecking(true);
    try {
      const { data, error } = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      }).then(res => res.json());

      if (error) throw new Error(error);

      toast({
        title: "Subscription updated",
        description: `Subscription status: ${data.subscribed ? 'Active' : 'Inactive'}`,
      });

      return data;
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        title: "Error",
        description: "Failed to check subscription status",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const createCheckoutSession = async (planId: string) => {
    if (!user || !session) return;

    try {
      const { data, error } = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId })
      }).then(res => res.json());

      if (error) throw new Error(error);

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive"
      });
    }
  };

  return {
    isChecking,
    checkSubscriptionStatus,
    createCheckoutSession
  };
};
