import type { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';

export type YardViewErrorEvent = NativeSyntheticEvent<{ message: string }>;

export type FreightIQ3DYardViewProps = {
  coordinates: {
    stopLatitude: number;
    stopLongitude: number;
    deliveryZoneLatitude: number;
    deliveryZoneLongitude: number;
  };
  resetToken: number;
  onInitialized?: () => void;
  onError?: (event: YardViewErrorEvent) => void;
  style?: StyleProp<ViewStyle>;
};
