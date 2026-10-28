import { registerWebModule, NativeModule } from 'expo';

// FreightIQ3DYardViewModule is not available on the web platform.
class FreightIQ3DYardViewModule extends NativeModule<Record<string, never>> {}

export default registerWebModule(FreightIQ3DYardViewModule, 'FreightIQ3DYardViewModule');
