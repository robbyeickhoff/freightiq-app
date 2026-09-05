import { Tabs, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Borders } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { useTodayRoute } from "@/context/todays-route-context";
import { supabase } from "@/utils/supabase";

export default function TabLayout() {
  const { colors } = useAppTheme();
  const { route } = useTodayRoute();
  const upcomingStopCount = route.stops.filter((stop) => stop.status === "upcoming").length;
  const [operationsCount, setOperationsCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const refresh = async () => {
        const { data, error } = await supabase.rpc("get_operations_board", {
          p_area_slug: null,
          p_include_history: false,
        });
        if (active && !error) setOperationsCount(Array.isArray(data) ? data.length : 0);
      };
      void refresh();
      const timer = setInterval(() => void refresh(), 60_000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, []),
  );

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
        name="operations"
        options={{
          title: "Operations",
          popToTopOnBlur: true,
          tabBarBadge: operationsCount > 0 ? operationsCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.accent,
            color: colors.textOnAccent,
          },
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="exclamationmark.bubble.fill" color={color} />
          ),
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
