import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import AppNavigator from './navigation/AppNavigator';
import { ThemeProvider } from './theme/ThemeContext';
import { FontSizeProvider } from './context/FontSizeContext';

export default function App() {
  const [fontsLoaded] = useFonts({
    'MuktaMalar-Light':     require('./assets/fonts/mukta/Mukta_Malar/MuktaMalar-Light.ttf'),
    'MuktaMalar-Regular':   require('./assets/fonts/mukta/Mukta_Malar/MuktaMalar-Regular.ttf'),
    'MuktaMalar-Medium':    require('./assets/fonts/mukta/Mukta_Malar/MuktaMalar-Medium.ttf'),
    'MuktaMalar-SemiBold':  require('./assets/fonts/mukta/Mukta_Malar/MuktaMalar-SemiBold.ttf'),
    'MuktaMalar-Bold':      require('./assets/fonts/mukta/Mukta_Malar/MuktaMalar-Bold.ttf'),
    'MuktaMalar-ExtraBold': require('./assets/fonts/mukta/Mukta_Malar/MuktaMalar-ExtraBold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <FontSizeProvider>
        <View style={{ flex: 1 }}>
          <StatusBar style="dark" backgroundColor="#fff" />
          <AppNavigator />
        </View>
      </FontSizeProvider>
    </ThemeProvider>
  );
}