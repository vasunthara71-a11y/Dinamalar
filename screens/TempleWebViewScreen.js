import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFontSize } from '../context/FontSizeContext';
import { COLORS, FONTS } from '../utils/constants';

const { width, height } = Dimensions.get('window');

export default function TempleWebViewScreen({ navigation, route }) {
  const { sf } = useFontSize();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const url = route?.params?.url || 'https://temple.dinamalar.com';

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(false);
    // WebView will automatically reload when we change the source slightly
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: sf(18) }]}>கோயில்கள்</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
          <Ionicons name="refresh" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View> */}

      {/* WebView Content */}
      <View style={styles.webViewContainer}>
        {/* {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.loadingText, { fontSize: sf(14) }]}>ஏற்றுகிறது...</Text>
          </View>
        )} */}
        
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={48} color={COLORS.error} />
            <Text style={[styles.errorText, { fontSize: sf(16) }]}>
              பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
              <Text style={[styles.retryBtnText, { fontSize: sf(14) }]}>மீண்டும் முயற்சி</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            source={{ uri: url }}
            style={styles.webView}
            onLoad={handleLoad}
            onError={handleError}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            mixedContentMode="compatibility"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontFamily: FONTS.muktaMalar.bold,
    flex: 1,
    textAlign: 'center',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: COLORS.text,
    fontFamily: FONTS.muktaMalar.regular,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: COLORS.text,
    fontFamily: FONTS.muktaMalar.regular,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.muktaMalar.bold,
  },
});
