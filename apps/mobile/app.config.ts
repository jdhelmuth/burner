import type { ExpoConfig } from "expo/config";

const appScheme = process.env.EXPO_PUBLIC_AUTH_SCHEME ?? "burner";

const config: ExpoConfig = {
  name: "Burner",
  slug: "burner",
  owner: "burner",
  scheme: appScheme,
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  ios: {
    bundleIdentifier: "com.burner.app",
    supportsTablet: true,
    usesAppleSignIn: true,
    associatedDomains: ["applinks:burner.example.com"],
  },
  android: {
    package: "com.burner.app",
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "burner.example.com",
            pathPrefix: "/open",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  experiments: {
    typedRoutes: true,
  },
  plugins: [
    "expo-router",
    "expo-apple-authentication",
    "expo-font",
    "expo-secure-store",
    [
      "expo-web-browser",
      {
        experimentalLauncherActivity: false,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Allow Burner to pull your cover image so your mixtape looks suspiciously perfect.",
      },
    ],
  ],
  extra: {
    EXPO_PUBLIC_AUTH_SCHEME: appScheme,
    EXPO_PUBLIC_BURNER_WEB_URL: process.env.EXPO_PUBLIC_BURNER_WEB_URL,
    eas: {
      projectId: "replace-in-eas",
    },
  },
};

export default config;
