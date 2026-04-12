import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Image, Animated, StatusBar, Dimensions, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { api, CDNApi, API_ENDPOINTS } from '../config/api';
import { setDataCache } from '../utils/dataCache';
import BallIndicator from '../components/BallIndicator';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [loadingText, setLoadingText] = useState('Loading...');
  const dataReadyRef = useRef(false);
  const animDoneRef = useRef(false);

  const tryNavigate = useCallback(() => {
    if (dataReadyRef.current && animDoneRef.current) {
      navigation.replace('MainTabs');
    }
  }, [navigation]);

  const loadAll = useCallback(async () => {
    try {
      setLoadingText('Loading news...');

      // Fire ALL requests simultaneously - don't await one by one
      const [
        homeRes,
        notifRes,
        shortRes,
        shortsRes,
        varthagamRes,
        varavaramRes,
        joshiyamRes,
        districtRes,
        premiumRes,
        photosRes,
        kalvimalarRes,
        malargalRes,
      ] = await Promise.allSettled([
        api.getHome(),
        api.getLatestNotify(),
        api.getShortNews(),
        CDNApi.get(API_ENDPOINTS.SHORTS),
        CDNApi.get(API_ENDPOINTS.VARthagam),
        axios.get('https://api-st.dinamalar.com/varavaram'),
        CDNApi.get(API_ENDPOINTS.JOSHIYAM),
        CDNApi.get(API_ENDPOINTS.DISTRICT),
        api.getPremium(),
        CDNApi.get('/photos'),
        api.getKalvimalar(),
        CDNApi.get('/malargal'),
      ]);

      const get = (res) => res?.status === 'fulfilled' ? res.value?.data : null;

      setDataCache({
        homeData:         get(homeRes),
        notificationData: get(notifRes),
        shortNewsData:    get(shortRes),
        shortsData:       get(shortsRes),
        varthagamData:    get(varthagamRes),
        varavaramData:    get(varavaramRes),
        joshiyamData:     get(joshiyamRes),
        districtData:     get(districtRes),
        premiumData:      get(premiumRes),
        photosData:       get(photosRes),
        kalvimalarData:   get(kalvimalarRes),
        malargalData:     get(malargalRes),
        timestamp:        Date.now(),
      });

      setLoadingText('Ready!');
    } catch (e) {
      // Cache whatever we have so HomeScreen doesn't crash
      setDataCache({ homeData: null, timestamp: Date.now(), error: e.message });
    } finally {
      dataReadyRef.current = true;
      tryNavigate();
    }
  }, [tryNavigate]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start(() => {
      animDoneRef.current = true;
      tryNavigate();
    });

    loadAll();
  }, []);

  return (
  <View style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
    
    {/* Background — matches logo's outer edge color exactly */}
    <LinearGradient
      colors={['#8B0000', '#A00000', '#C0001A', '#A00000', '#8B0000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    />

    {/* Radial glow simulation — brightens center like logo does */}
    <LinearGradient
      colors={['#CC002299', '#AA001166', '#00000000']}
      start={{ x: 0.5, y: 0.5 }}
      end={{ x: 0, y: 0 }}
      style={StyleSheet.absoluteFillObject}
    />
    <LinearGradient
      colors={['#CC002299', '#AA001166', '#00000000']}
      start={{ x: 0.5, y: 0.5 }}
      end={{ x: 1, y: 0 }}
      style={StyleSheet.absoluteFillObject}
    />
    <LinearGradient
      colors={['#CC002299', '#AA001166', '#00000000']}
      start={{ x: 0.5, y: 0.5 }}
      end={{ x: 0, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    />
    <LinearGradient
      colors={['#CC002299', '#AA001166', '#00000000']}
      start={{ x: 0.5, y: 0.5 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    />

    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <Image source={require('../assets/icon.png')} style={styles.logo} resizeMode="contain" />
    </Animated.View>

    <View style={styles.loadingContainer}>
      <BallIndicator color="#ffffff" count={8} size={10} duration={1000} />
    </View>
  </View>
);
 };

const styles = StyleSheet.create({
  container:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo:             { width: width * 0.7, height: 150 },
  loadingContainer: { marginTop: 30, alignItems: 'center' },
  loadingText:      { marginTop: 10, fontSize: 14, color: '#ffffff' },
});

export default SplashScreen;