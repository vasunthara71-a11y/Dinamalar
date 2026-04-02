 import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import AppNavigator from './navigation/AppNavigator';
import { ThemeProvider } from './theme/ThemeContext';
import { FontSizeProvider } from './context/FontSizeContext';
import { View } from 'react-native';
import { useAppOptimization } from './hooks/useAppOptimization';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  // Initialize app optimizations
  useAppOptimization();

  return <AppNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    // MuktaMalar fonts
    'MuktaMalar-Light':     require('./assets/fonts/mukta/Mukta_Malar/MuktaMalar-Light.ttf'),
    'MuktaMalar-Regular':   require('./assets/fonts/mukta/Mukta_Malar/MuktaMalar-Regular.ttf'),
    'MuktaMalar-Medium':    require('./assets/fonts/mukta/Mukta_Malar/MuktaMalar-Medium.ttf'),
    'MuktaMalar-SemiBold':  require('./assets/fonts/mukta/Mukta_Malar/MuktaMalar-SemiBold.ttf'),
    'MuktaMalar-Bold':      require('./assets/fonts/mukta/Mukta_Malar/MuktaMalar-Bold.ttf'),
    'MuktaMalar-ExtraBold': require('./assets/fonts/mukta/Mukta_Malar/MuktaMalar-ExtraBold.ttf'),
    
    // AnekTamil fonts
    'AnekTamil-Thin':       require('./assets/fonts/Anek/AnekTamil-Thin.ttf'),
    'AnekTamil-ExtraLight': require('./assets/fonts/Anek/AnekTamil-ExtraLight.ttf'),
    'AnekTamil-Light':      require('./assets/fonts/Anek/AnekTamil-Light.ttf'),
    'AnekTamil-Regular':    require('./assets/fonts/Anek/AnekTamil-Regular.ttf'),
    'AnekTamil-Medium':     require('./assets/fonts/Anek/AnekTamil-Medium.ttf'),
    'AnekTamil-SemiBold':   require('./assets/fonts/Anek/AnekTamil-SemiBold.ttf'),
    'AnekTamil-Bold':       require('./assets/fonts/Anek/AnekTamil-Bold.ttf'),
    'AnekTamil-ExtraBold':  require('./assets/fonts/Anek/AnekTamil-ExtraBold.ttf'),
    
    // AnekTamil Condensed fonts
    'AnekTamil_Condensed-Thin':       require('./assets/fonts/Anek/AnekTamil_Condensed-Thin.ttf'),
    'AnekTamil_Condensed-ExtraLight':  require('./assets/fonts/Anek/AnekTamil_Condensed-ExtraLight.ttf'),
    'AnekTamil_Condensed-Light':       require('./assets/fonts/Anek/AnekTamil_Condensed-Light.ttf'),
    'AnekTamil_Condensed-Regular':     require('./assets/fonts/Anek/AnekTamil_Condensed-Regular.ttf'),
    'AnekTamil_Condensed-Medium':      require('./assets/fonts/Anek/AnekTamil_Condensed-Medium.ttf'),
    'AnekTamil_Condensed-SemiBold':    require('./assets/fonts/Anek/AnekTamil_Condensed-SemiBold.ttf'),
    'AnekTamil_Condensed-Bold':        require('./assets/fonts/Anek/AnekTamil_Condensed-Bold.ttf'),
    'AnekTamil_Condensed-ExtraBold':   require('./assets/fonts/Anek/AnekTamil_Condensed-ExtraBold.ttf'),
    
    // AnekTamil Expanded fonts
    'AnekTamil_Expanded-Thin':       require('./assets/fonts/Anek/AnekTamil_Expanded-Thin.ttf'),
    'AnekTamil_Expanded-ExtraLight':  require('./assets/fonts/Anek/AnekTamil_Expanded-ExtraLight.ttf'),
    'AnekTamil_Expanded-Light':       require('./assets/fonts/Anek/AnekTamil_Expanded-Light.ttf'),
    'AnekTamil_Expanded-Regular':     require('./assets/fonts/Anek/AnekTamil_Expanded-Regular.ttf'),
    'AnekTamil_Expanded-Medium':      require('./assets/fonts/Anek/AnekTamil_Expanded-Medium.ttf'),
    'AnekTamil_Expanded-SemiBold':    require('./assets/fonts/Anek/AnekTamil_Expanded-SemiBold.ttf'),
    'AnekTamil_Expanded-Bold':        require('./assets/fonts/Anek/AnekTamil_Expanded-Bold.ttf'),
    'AnekTamil_Expanded-ExtraBold':   require('./assets/fonts/Anek/AnekTamil_Expanded-ExtraBold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <FontSizeProvider>
        <View style={{ flex: 1 }}>
          <StatusBar style="dark" backgroundColor="#fff" />
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </View>
      </FontSizeProvider>
    </ThemeProvider>
  );
}