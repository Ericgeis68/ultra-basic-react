import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cdrs.app',
  appName: 'gmao-optimisateur',
  webDir: 'dist',
  plugins: {
    Permissions: {
      camera: "Nous avons besoin d'accéder à votre caméra pour scanner les QR codes.",
      storage: "Nous avons besoin d'accéder à votre stockage pour enregistrer les données en local.",
      notifications: "Nous avons besoin d'envoyer des notifications pour vous alerter des maintenances."
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP"
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF"
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    contentInset: "always",
    allowsLinkPreview: true,
    scrollEnabled: true,
    useOnlineAssets: true
  }
};

export default config;
