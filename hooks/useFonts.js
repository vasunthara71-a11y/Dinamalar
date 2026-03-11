import * as Font from 'expo-font';

export default function useCustomFonts() {
  const [fontsLoaded] = Font.useFonts({
    'MuktaMalar-Regular': require('../assets/fonts/MuktaMalar-Regular.ttf'),
    'MuktaMalar-Bold':    require('../assets/fonts/MuktaMalar-Bold.ttf'),
    'MuktaMalar-Medium':  require('../assets/fonts/MuktaMalar-Medium.ttf'),
  });
  return fontsLoaded;
}