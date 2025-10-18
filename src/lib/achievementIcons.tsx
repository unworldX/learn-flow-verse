import { Award, Star, Target, Trophy, Crown, Medal, Shield, Rocket, type LucideProps } from 'lucide-react';
import React from 'react';

type IconType = React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;

export const achievementIconMap: Record<string, IconType> = {
  Award,
  Star,
  Target,
  Trophy,
  Crown,
  Medal,
  Shield,
  Rocket
};

export function getAchievementIcon(nameOrKey?: string): IconType {
  if (!nameOrKey) return Award;
  return achievementIconMap[nameOrKey] || Award;
}
