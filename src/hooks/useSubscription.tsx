
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cacheService } from '@/lib/cacheService';

export interface Subscription {
  id: string;
  user_id: string;
  email: string;
  stripe_customer_id: string | null;
  subscribed: boolean;
  subscription_tier: 'basic' | 'premium' | 'enterprise' | null;
  subscription_end: string | null;
  download_limit: number;
  downloads_used: number;
  group_limit: number;
  groups_joined: number;
  updated_at: string;
  created_at: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const cacheKey = `subscription_${user.id}`;
      
      // Try cache first
      let cachedSubscription = await cacheService.get<Subscription>(cacheKey);
      if (cachedSubscription) {
        setSubscription(cachedSubscription);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Create default subscription
        const { data: newSub, error: createError } = await supabase
          .from('subscribers')
          .insert({
            user_id: user.id,
            email: user.email!,
            subscribed: false,
            subscription_tier: null
          })
          .select()
          .single();
          
        if (createError) throw createError;
        
        // Type the new subscription properly
        const typedNewSub = {
          ...newSub,
          subscription_tier: newSub.subscription_tier as 'basic' | 'premium' | 'enterprise' | null
        };
        setSubscription(typedNewSub as Subscription);
        await cacheService.set(cacheKey, typedNewSub, { ttlMinutes: 15 });
      } else {
        // Ensure subscription_tier is properly typed
        const typedSubscription = {
          ...data,
          subscription_tier: data.subscription_tier as 'basic' | 'premium' | 'enterprise' | null
        };
        setSubscription(typedSubscription as Subscription);
        await cacheService.set(cacheKey, typedSubscription, { ttlMinutes: 15 });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast({
        title: "Error loading subscription",
        description: "Unable to fetch subscription data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkDownloadLimit = async () => {
    if (!subscription) return false;
    return subscription.downloads_used < subscription.download_limit;
  };

  const checkGroupLimit = async () => {
    if (!subscription) return false;
    return subscription.groups_joined < subscription.group_limit;
  };

  const updateUsage = async (type: 'download' | 'group', increment: number = 1) => {
    if (!subscription || !user) return;

    try {
      const updates: any = {};
      if (type === 'download') {
        updates.downloads_used = subscription.downloads_used + increment;
      } else if (type === 'group') {
        updates.groups_joined = subscription.groups_joined + increment;
      }

      const { error } = await supabase
        .from('subscribers')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setSubscription(prev => prev ? { ...prev, ...updates } : null);
      
      // Update cache
      const cacheKey = `subscription_${user.id}`;
      const updatedSub = { ...subscription, ...updates };
      await cacheService.set(cacheKey, updatedSub, { ttlMinutes: 15 });
    } catch (error) {
      console.error('Error updating usage:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  return {
    subscription,
    isLoading,
    checkDownloadLimit,
    checkGroupLimit,
    updateUsage,
    refetch: fetchSubscription
  };
};
