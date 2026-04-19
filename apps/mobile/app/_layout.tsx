import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "../contexts/AuthContext";
import { MusicProviderProvider } from "../contexts/MusicProviderContext";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MusicProviderProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth/callback" />
              <Stack.Screen name="create/details" />
              <Stack.Screen name="create/source" />
              <Stack.Screen name="create/select-songs" />
              <Stack.Screen name="create/cover" />
              <Stack.Screen name="create/preview" />
              <Stack.Screen name="burner/[slug]" />
              <Stack.Screen name="playback/[burnerId]" />
            </Stack>
          </MusicProviderProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
