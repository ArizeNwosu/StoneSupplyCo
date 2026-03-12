import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trycallmate.app',
  appName: 'Callmate',
  webDir: 'dist',
  ios: {
    scheme: 'Callmate',
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#F2F2F2',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      // Controlled at runtime via StatusBar.setStyle()
      overlaysWebView: false,
    },
  },
};

export default config;
