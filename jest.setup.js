// Mock ExpoModulesCore
jest.mock('expo-modules-core', () => {
  return {
    ...jest.requireActual('expo-modules-core'),
    NativeModulesProxy: new Proxy(
      {},
      {
        get() {
          return () => {};
        },
      }
    ),
  };
}); 