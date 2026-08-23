import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Borders } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { useTodayRoute } from "@/context/todays-route-context";

export default function TabLayout() {
  const { colors } = useAppTheme();
  const { route } = useTodayRoute();
  const upcomingStopCount = route.stops.filter((stop) => stop.status === "upcoming").length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: Borders.thin,
        },
      }}
    >
      <Tabs.Screen
        name="(map)"
        options={{
          title: "Map",
          popToTopOnBlur: true,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="route"
        options={{
          title: "Route",
          popToTopOnBlur: true,
          tabBarBadge: upcomingStopCount > 0 ? upcomingStopCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.accent,
            color: colors.textOnAccent,
          },
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          popToTopOnBlur: true,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="stop"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
