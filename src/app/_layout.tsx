import { B612Mono_400Regular, B612Mono_400Regular_Italic, B612Mono_700Bold, B612Mono_700Bold_Italic } from '@expo-google-fonts/b612-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';

import { color, fontFamily } from '@/design-system/tokens';
import { useHydrated } from '@/store/use-hydrated';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [fontFamily.regular]: B612Mono_400Regular,
    [fontFamily.italic]: B612Mono_400Regular_Italic,
    [fontFamily.bold]: B612Mono_700Bold,
    [fontFamily.boldItalic]: B612Mono_700Bold_Italic,
  });

  const hydrated = useHydrated();
  // On a font error, fall through to system fonts rather than trapping the user on the splash.
  const ready = (loaded || error) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  // On wide screens (web) the app stays a phone-width column, as designed.
  return (
    <View style={{ flex: 1, backgroundColor: color.surface.page }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.surface.page } }} />
      </View>
    </View>
  );
}
