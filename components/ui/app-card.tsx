import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { Borders, Elevation, Radius } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

type AppCardElevation = keyof typeof Elevation;
type AppCardRadius = keyof typeof Radius;
type AppCardSurface = "surface" | "surfaceElevated";

export type AppCardProps = ViewProps & {
  bordered?: boolean;
  clipContent?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  elevation?: AppCardElevation;
  radius?: AppCardRadius;
  surface?: AppCardSurface;
};

export function AppCard({
  bordered = true,
  children,
  clipContent = false,
  contentStyle,
  elevation = "none",
  radius = "large",
  style,
  surface = "surfaceElevated",
  ...props
}: AppCardProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        {
          borderRadius: Radius[radius],
        },
        Elevation[elevation],
        style,
      ]}
      {...props}
    >
      <View
        style={[
        {
          backgroundColor: colors[surface],
          borderColor: colors.border,
          borderRadius: Radius[radius],
          borderWidth: bordered ? Borders.thin : 0,
        },
        clipContent ? styles.clipped : null,
        contentStyle,
      ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clipped: {
    overflow: "hidden",
  },
});
