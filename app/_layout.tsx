import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ERPProvider } from "@/contexts/ERPContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === 'login';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, segments, isLoading, router]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="analytics" options={{ headerShown: false }} />
      <Stack.Screen name="supply-chain" options={{ headerShown: false }} />
      <Stack.Screen name="fleet-management" options={{ headerShown: false }} />
      <Stack.Screen name="shipments" options={{ headerShown: false }} />
      <Stack.Screen name="returns" options={{ headerShown: false }} />
      <Stack.Screen name="documents" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="leave-requests" options={{ headerShown: false }} />
      <Stack.Screen name="approvals" options={{ headerShown: false }} />
      <Stack.Screen name="commissions" options={{ headerShown: false }} />
      <Stack.Screen name="sales-targets" options={{ headerShown: false }} />
      <Stack.Screen name="company" options={{ headerShown: false }} />
      <Stack.Screen name="pos" options={{ headerShown: false }} />
      <Stack.Screen name="sales" options={{ headerShown: false }} />
      <Stack.Screen name="scanner" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="users" options={{ headerShown: false }} />
      <Stack.Screen name="tasks" options={{ headerShown: false }} />
      <Stack.Screen name="contacts" options={{ headerShown: false }} />
      <Stack.Screen name="reminders" options={{ headerShown: false }} />
      <Stack.Screen name="enquiries" options={{ headerShown: false }} />
      <Stack.Screen name="vendors" options={{ headerShown: false }} />
      <Stack.Screen name="purchase-orders" options={{ headerShown: false }} />
      <Stack.Screen name="projects" options={{ headerShown: false }} />
      <Stack.Screen name="assets" options={{ headerShown: false }} />
      <Stack.Screen name="timesheets" options={{ headerShown: false }} />
      <Stack.Screen name="budgets" options={{ headerShown: false }} />
      <Stack.Screen name="payroll" options={{ headerShown: false }} />
      <Stack.Screen name="chart-of-accounts" options={{ headerShown: false }} />
      <Stack.Screen name="reports" options={{ headerShown: false }} />
      <Stack.Screen name="manufacturing" options={{ headerShown: false }} />
      <Stack.Screen name="quality-control" options={{ headerShown: false }} />
      <Stack.Screen name="workflows" options={{ headerShown: false }} />
      <Stack.Screen name="audit-logs" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ERPProvider>
          <GestureHandlerRootView>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </ERPProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
