import { requireNativeView } from 'expo';
import * as React from 'react';

import { FreightIQ3DYardViewProps } from './FreightIQ3DYardView.types';

const NativeView: React.ComponentType<FreightIQ3DYardViewProps> = requireNativeView('FreightIQ3DYardView');

export default function FreightIQ3DYardView(props: FreightIQ3DYardViewProps) {
  return <NativeView {...props} />;
}
