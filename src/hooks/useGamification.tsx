import { useEffect, useState } from 'react';

interface GamificationData {
  level: number;
  points: number;
  badges: string[];
}

export function useGamification() {
  const [gamificationData, setData] = useState<GamificationData | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder: In real app, fetch from API
    const timer = setTimeout(() => {
      setData({ level: 2, points: 180, badges: ['Starter', 'Explorer'] });
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return { gamificationData, isLoading };
}
