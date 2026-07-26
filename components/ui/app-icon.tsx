import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import type { StyleProp, TextStyle } from "react-native";

import { useAppTheme } from "@/context/theme-context";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

const ICONS = {
  add: { default: "add" },
  appearance: { default: "palette" },
  backIn: { default: "keyboard-backspace" },
  check: { default: "check" },
  chevronRight: { default: "chevron-right" },
  close: { default: "close" },
  deliveryType: { default: "inventory-2" },
  deliveryZone: { default: "place" },
  filter: { default: "filter-list" },
  findingStops: { default: "location-searching" },
  gettingStarted: { default: "local-shipping" },
  help: { default: "help-outline", active: "help" },
  incomplete: { default: "pending-actions" },
  location: { default: "location-searching", active: "my-location" },
  logout: { default: "logout" },
  map: { default: "map" },
  profile: { default: "person-outline", active: "person" },
  satellite: { default: "satellite-alt" },
  search: { default: "search" },
  settings: { default: "settings" },
  truckFit: { default: "local-shipping" },
  understandingIntel: { default: "fact-check" },
  usingMap: { default: "map" },
  contributingIntel: { default: "edit-note" },
} satisfies Record<
  string,
  {
    active?: MaterialIconName;
    default: MaterialIconName;
  }
>;

export type AppIconName = keyof typeof ICONS;

export type AppIconProps = {
  accessibilityLabel?: string;
  active?: boolean;
  color?: string;
  name: AppIconName;
  size?: number;
  style?: StyleProp<TextStyle>;
};

export function AppIcon({
  accessibilityLabel,
  active = false,
  color,
  name,
  size = 24,
  style,
}: AppIconProps) {
  const { colors } = useAppTheme();
  const icon = ICONS[name];
  const iconName = active && "active" in icon && icon.active ? icon.active : icon.default;

  return (
    <MaterialIcons
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? "image" : undefined}
      accessible={Boolean(accessibilityLabel)}
      color={color ?? colors.icon}
      name={iconName}
      size={size}
      style={style}
    />
  );
}
