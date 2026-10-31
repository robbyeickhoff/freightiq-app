import { NativeModule, requireNativeModule } from 'expo';

import { YardCoordinates } from './FreightIQ3DYardView.types';

declare class FreightIQ3DYardViewModule extends NativeModule<Record<string, never>> {
  openAndroid3DYardView(coordinates: YardCoordinates, backLabel: string): Promise<'back' | 'open2D'>;
}

export default requireNativeModule<FreightIQ3DYardViewModule>('FreightIQ3DYardView');
