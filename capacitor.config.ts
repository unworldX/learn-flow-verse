
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.0e15c8cf9b264383b7df9366ac0aa595',
  appName: 'Student Library',
  webDir: 'dist',
  server: {
    url: 'https://0e15c8cf-9b26-4383-b7df-9366ac0aa595.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
    },
  },
};

export default config;
