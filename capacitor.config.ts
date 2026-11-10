import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.youneek.airtraffic",
  appName: "YNK Air Traffic",
  webDir: "dist",
  backgroundColor: "#07140c",
  android: {
    backgroundColor: "#07140c",
    allowMixedContent: false,
  },
  ios: {
    backgroundColor: "#07140c",
    contentInset: "never",
    scrollEnabled: false,
    allowsLinkPreview: false,
    preferredContentMode: "mobile",
    zoomEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: "#07140c",
      showSpinner: false,
      androidSplashResourceName: "splash",
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: "native",
    },
    SystemBars: {
      insetsHandling: "css",
      initialViewportFitValueHint: "cover",
      style: "DARK",
      hidden: false,
    },
  },
};

export default config;
