import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.callmate.app',
  appName: 'Callmate',
  webDir: 'dist',
  ios: {
    scheme: 'Callmate',
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0A0A0A',
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
