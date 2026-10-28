// Re-export the native module. On web, it will be resolved to FreightIQ3DYardViewModule.web.ts
// and on native platforms to FreightIQ3DYardViewModule.ts
export { default } from './src/FreightIQ3DYardViewModule';
export { default as FreightIQ3DYardView } from './src/FreightIQ3DYardView';
export * from './src/FreightIQ3DYardView.types';
