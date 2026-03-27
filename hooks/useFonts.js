import * as Font from 'expo-font';

export default function useCustomFonts() {
  const [fontsLoaded] = Font.useFonts({
    'MuktaMalar-Regular': require('../assets/fonts/mukta/Mukta_Malar/MuktaMalar-Regular.ttf'),
    'MuktaMalar-Bold':    require('../assets/fonts/mukta/Mukta_Malar/MuktaMalar-Bold.ttf'),
    'MuktaMalar-Medium':  require('../assets/fonts/mukta/Mukta_Malar/MuktaMalar-Medium.ttf'),
  });
  return fontsLoaded;
}