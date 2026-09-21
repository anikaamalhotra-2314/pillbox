import { B612Mono_400Regular, B612Mono_400Regular_Italic, B612Mono_700Bold, B612Mono_700Bold_Italic } from '@expo-google-fonts/b612-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { color, fontFamily } from '@/design-system/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [fontFamily.regular]: B612Mono_400Regular,
    [fontFamily.italic]: B612Mono_400Regular_Italic,
    [fontFamily.bold]: B612Mono_700Bold,
    [fontFamily.boldItalic]: B612Mono_700Bold_Italic,
  });

  // On a font error, fall through to system fonts rather than trapping the user on the splash.
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.surface.page } }} />;
}
