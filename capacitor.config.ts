import type { CapacitorConfig } from '@capacitor/cli';

// The store app (design doc 12.6, MARKETING.md): the same game, packaged for Google Play.
// `npm run app:sync` builds the game into dist-app/ and copies it into the Android project (android/).
// appId is permanent once the app is published on Google Play.
const config: CapacitorConfig = {
  appId: 'io.github.mohammadayeshh.hotboycoolgirl',
  appName: 'Hot Boy & Cool Girl',
  webDir: 'dist-app',
  backgroundColor: '#07110d',
  android: { allowMixedContent: false },
};

export default config;
