// DrawerMenu.js

import React, { useEffect, useState, useRef, useCallback } from 'react';

import {

  View,

  Text,

  TouchableOpacity,

  ScrollView,

  ActivityIndicator,

  Image,

  StyleSheet,

  Linking,

  Modal,

  Animated,

  Dimensions,

  Platform,

} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { mainApi, CDNApi, API_ENDPOINTS } from '../config/api';

import { COLORS, FONTS } from '../utils/constants';

import { s, vs, scaledSizes } from '../utils/scaling';

import { ms } from 'react-native-size-matters';

import { SvgXml, SvgUri } from 'react-native-svg';

import DistrictDrawer from './DistrictDrawer';

import TEXT_STYLES from '../utils/textStyles';

import { SignOut, Home, RightArrow, Calendar, Joshiyam, Aanmigam, Varavaram, Inaippumalar, Photo, UlagaTamilar, Special, Kovil, Cinema, UllurSeithigal, DinamDinam, District, Malargal, Light, Logout, Login } from '../assets/svg/Icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W } = Dimensions.get('window');

const DRAWER_W = SCREEN_W;



// ─── Palette ──────────────────────────────────────────────────────────────────

const P = {

  primary: '#096DD2',

  grey100: '#F9FAFB',

  grey200: '#F4F6F8',

  grey300: '#DFE3E8',

  grey500: '#919EAB',

  grey600: '#637381',

  grey700: '#454F5B',

  grey800: '#212B36',

  white: '#FFFFFF',

  border: '#EBEBEB',

};



const LINK_ROUTE_MAP = [

  { match: ['cat=5010'], screen: 'TharpothaiyaSeithigalScreen' },

  { match: ['latestmain'], screen: 'TimelineScreen' },

  { match: ['dinamalartv', 'videodata'], screen: 'VideoScreen' },

  { match: ['podcast'], screen: 'PodcastScreen' },

  { match: ['ipaper'], screen: 'IpaperScreen' },

  { match: ['books'], screen: 'BooksScreen' },

  { match: ['subscription'], screen: 'SubscriptionScreen' },

  { match: ['thirukural'], screen: 'ThirukkuralScreen' },

  { match: ['kadal'], screen: 'KadalThamaraiScreen' },

];



const resolveScreenFromLink = (link = '') => {

  if (!link) return null;

  const lower = link.toLowerCase();

  for (const { match, screen } of LINK_ROUTE_MAP) {

    if (match.some((kw) => lower.includes(kw))) {

      if (screen === 'CategoryNewsScreen') {

        const m = lower.match(/cat=(\d+)/);

        return { screen, params: m ? { catId: m[1] } : {} };

      }

      return { screen, params: null };

    }

  }

  const catMatch = lower.match(/cat=(\d+)/);

  if (catMatch) return { screen: 'CategoryNewsScreen', params: { catId: catMatch[1] } };

  if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('www.')) {

    return { screen: '__external__', params: null };

  }

  return null;

};



const getIconName = (index) => {

  const icons = [

    'newspaper-outline', 'star-outline', 'calendar-outline', 'home-outline',

    'card-outline', 'book-outline', 'camera-outline', 'football-outline',

    'globe-outline', 'settings-outline', 'notifications-outline', 'help-circle-outline',

  ];

  return icons[index % icons.length];

};



function MenuIcon({ uri, size = scaledSizes.icon.md }) {

  if (!uri) return null;

  if (uri.includes('<svg') && uri.includes('</svg>')) return <SvgXml xml={uri} width={size} height={size} />;

  if (uri.endsWith('.svg')) return <SvgUri uri={uri} width={size} height={size} />;

  if (uri.startsWith('http') || uri.startsWith('//')) return <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" />;

  return null;

}



const isJoshiyamItem = (title = '', link = '', id = '') => {

  return (

    title === 'ஜோசியம்' ||

    id === 'astrology' ||

    link === '/joshiyam' ||

    link.includes('joshiyam') ||

    link.includes('todayrasidata') ||

    link.includes('weeklyrasiupdate') ||

    link.includes('monthlyrasi') ||

    link.includes('gurupeyerchi') ||

    link.includes('sanipeyerchi') ||

    link.includes('rahukethupeyarchi') ||

    link.includes('tamilnewyear') ||

    link.includes('englishnewyear') ||

    link.includes('/subam') ||

    link.includes('graha-oorai') ||

    link.includes('gowri-panjangam') ||

    link.includes('importantviratham') ||

    link.includes('karinaal') ||

    link.includes('vasthunatkal')

  );

};



const toArray = (val) => {

  if (Array.isArray(val)) return val;

  if (val && Array.isArray(val.data)) return val.data;

  if (val && Array.isArray(val.menu)) return val.menu;

  if (val && Array.isArray(val.items)) return val.items;

  if (val && Array.isArray(val.result)) return val.result;

  if (val && typeof val === 'object') {

    const arrKey = Object.keys(val).find(k => Array.isArray(val[k]));

    if (arrKey) return val[arrKey];

  }

  return [];

};



const isValidSubItem = (sub) => {

  const t = (sub?.Title || sub?.title || sub?.name || '').trim();

  const l = (sub?.Link || sub?.link || sub?.slug || '').trim();

  if (!t || !l) return false;

  if (Array.isArray(sub.data) && sub.data.length === 0) return false;

  return true;

};



const isValidMenuItem = (item) => {

  const t = (item?.Title || item?.title || item?.name || '').trim();

  return t.length > 0;

};



const isValidMenu2Item = (item) => {

  const t = (item?.Title || item?.title || item?.name || '').trim();

  return t.length > 0;

};



const isValidFollowItem = (item) => {

  const icon = (item?.Icon || item?.icon || '').trim();

  return icon.length > 0;

};



const THARPOTHAIYA_TAB_MAP = [

  { titles: ['அனைத்தும்', 'All', 'all'], catIds: ['5010'], tabTitle: null },

  { titles: ['தமிழகம்'], catIds: ['89'], tabTitle: 'தமிழகம்' },

  { titles: ['இந்தியா'], catIds: ['100'], tabTitle: 'இந்தியா' },

  { titles: ['உலகம்'], catIds: ['34'], tabTitle: 'உலகம்' },

  { titles: ['Premium', 'பிரீமியம்', 'ப்ரீமியம்'], catIds: ['651'], tabTitle: 'பிரீமியம்' },

  { titles: ['விளையாட்டு', 'Sports'], catIds: [], tabTitle: '__sports__' },

  { titles: ['வர்த்தகம்', 'Business'], catIds: [], tabTitle: '__varthagam__' },

  { titles: ['நேரலை', 'Timeline', 'Latest'], catIds: ['latestmain'], tabTitle: '__timeline__' },

];



const DrawerMenu = ({ isVisible, onClose, onMenuPress, navigation }) => {



  const slideAnim = useRef(new Animated.Value(-DRAWER_W)).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;


  const [menuData, setMenuData] = useState({ menu1: [], menu2: [], title: '', follow: [], menuIndex1: [] });

  const [loading, setLoading] = useState(true);

  const [showDistrictDrawer, setShowDistrictDrawer] = useState(false);

  const [district, setdistrict] = useState(null);

  const [expandedItem, setExpandedItem] = useState(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  const [dinamDinamSubcats, setDinamDinamSubcats] = useState(null);

  const [selectedSubItems, setSelectedSubItems] = useState(new Set());

  const [activeSubKey, setActiveSubKey] = useState(null);

  const [hoveredMenuItem, setHoveredMenuItem] = useState(null);

  // format: "parentKey__subLink"



  useEffect(() => {

    if (isVisible) {

      Animated.parallel([

        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),

        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),

      ]).start();

    } else {

      Animated.parallel([

        Animated.timing(slideAnim, { toValue: -DRAWER_W, duration: 220, useNativeDriver: true }),

        Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),

      ]).start();

      // Clear selected sub-items when drawer closes

      setSelectedSubItems(new Set());
      setHoveredMenuItem(null);

    }

  }, [isVisible]);



  useEffect(() => {

    if (!isVisible) return;

    const checkAuthStatus = async () => {
      try {
        const email = await AsyncStorage.getItem('userEmail');
        setIsLoggedIn(!!email);
        setUserEmail(email);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
        setUserEmail(null);
      }
    };

    checkAuthStatus();

    const fetchDrawerMenu = async () => {

      try {

        const res = await mainApi.get(API_ENDPOINTS.MENU);

        const d = res.data || {};

        let menuIndex1Data = [];

        try {

          const menuIndex1Res = await mainApi.get('/menuindex1');

          menuIndex1Data = menuIndex1Res.data || [];

        } catch (menuIndex1Error) {

          console.error('Failed to load menuindex1:', menuIndex1Error);

        }

        setMenuData({

          menu1: toArray(d.menu1),

          menu2: toArray(d.menu2),

          title: d.title || '',

          follow: toArray(d.follow),

          menuIndex1: toArray(menuIndex1Data),

        });

        if (d.district) setdistrict(d.district);

      } catch (err) {

        console.error('Failed to load drawer menu:', err);

      } finally {

        setLoading(false);

      }

    };



    const fetchDinamDinamSubcats = async () => {

      try {

        const res = await CDNApi.get('/dinamdinam');

        setDinamDinamSubcats(res?.data?.subcatlist || []);

      } catch (e) {

        console.error('DinamDinam subcats fetch error:', e?.message);

      }

    };



    fetchDrawerMenu();

    fetchDinamDinamSubcats();

  }, [isVisible]);



  // Add this:

  const toggleExpandedItem = (key) => {

    setExpandedItem((prev) => (prev === key ? null : key));

  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      // Immediately hide email by clearing state
      setUserEmail(null);
      setIsLoggedIn(false);
      
      // Clear all user data from AsyncStorage
      await AsyncStorage.multiRemove(['userEmail', 'savedEmail', 'savedPassword', 'rememberMe']);
      
      // Close drawer
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };



  // ─── Navigation — UNTOUCHED ───────────────────────────────────────────────

  const handleMenuItemPress = (item, parentItem = null) => {

    const link = item.Link || item.link || '';

    const title = item.Title || item.title || item.name || '';

    const id = String(item.id || '');



    // ── Track active sub-item ──────────────────────────────────────────

    if (parentItem) {

      const parentKey = String(parentItem.id || parentItem.title || '');

      setActiveSubKey(`${parentKey}__${link || title}`);

    }





    const parentTitle = parentItem?.Title || parentItem?.title || parentItem?.name || '';

    const parentLink = parentItem?.Link || parentItem?.link || '';

    const parentId = String(parentItem?.id || '');

 if (
  title === 'முந்தய பதிப்புகள்' ||
  title === 'முந்தய பதிப்புகள்' ||
  title.toLowerCase().includes('mundhaiya') ||
  title.toLowerCase().includes('pathippu')
) {
  const url = 'https://www.dinamalar.com/archive';

  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        console.log("Can't open URL:", url);
      }
    })
    .catch((err) => console.error('Error opening URL:', err));

  onClose();
  return;
}

    const catFromLink = (link.match(/cat=(\w+)/i) || [])[1] || '';

    for (const entry of THARPOTHAIYA_TAB_MAP) {

      const titleMatch = entry.titles.some(t => t === title);

      const catMatch = entry.catIds.length > 0 && entry.catIds.some(

        c => c === id || c === catFromLink || link.includes(c)

      );

      if (titleMatch || catMatch) {

        if (entry.tabTitle === '__timeline__') navigation?.navigate('TimelineScreen');

        else if (entry.tabTitle === '__sports__') navigation?.navigate('SportsScreen');

        else if (entry.tabTitle === '__varthagam__') navigation?.navigate('VarthagamScreen');

        else if (entry.tabTitle === '__tamilnadu__') navigation?.navigate('TamilNaduScreen');

        else if (entry.tabTitle === '__india__') navigation?.navigate('CategoryNewsScreen', { catName: 'இந்தியா', catId: '100' });

        else if (entry.tabTitle === 'தமிழகம்') navigation?.navigate('TharpothaiyaSeithigalScreen', { initialTabTitle: 'தமிழகம்' });

        else if (entry.tabTitle === 'இந்தியா') navigation?.navigate('TharpothaiyaSeithigalScreen', { initialTabTitle: 'இந்தியா' });

        else if (entry.tabTitle === 'உலகம்') navigation?.navigate('TharpothaiyaSeithigalScreen', { initialTabTitle: 'உலகம்' });

        else if (entry.tabTitle === 'பிரீமியம்') navigation?.navigate('TharpothaiyaSeithigalScreen', { initialTabTitle: 'பிரீமியம்' });

        else if (entry.tabTitle === null) navigation?.navigate('TharpothaiyaSeithigalScreen');

        else navigation?.navigate('TharpothaiyaSeithigalScreen', { initialTabTitle: entry.tabTitle });

        onClose(); return;

      }

    }



    if (link.includes('cat=5010') || id === '5010' || title.includes('தற்போதைய')) { navigation?.navigate('TharpothaiyaSeithigalScreen'); onClose(); return; }

    if (link.includes('latestmain') || title === 'நேரலை' || title.toLowerCase().includes('timeline')) { navigation?.navigate('TimelineScreen'); onClose(); return; }

    if (title === 'தமிழகம்' || id === '89' || link.includes('cat=89')) { navigation?.navigate('TharpothaiyaSeithigalScreen', { initialTabTitle: 'தமிழகம்' }); onClose(); return; }

    if (title === 'உலகம்' || id === '34' || link.includes('cat=34')) { navigation?.navigate('TharpothaiyaSeithigalScreen', { initialTabTitle: 'உலகம்' }); onClose(); return; }

    if (title === 'Premium' || title === 'பிரீமியம்' || id === '651' || link.includes('cat=651')) { navigation?.navigate('TharpothaiyaSeithigalScreen', { initialTabTitle: 'பிரீமியம்' }); onClose(); return; }

    if (title === 'வர்த்தகம்' || link.includes('varthagam') || link.includes('varthagamdata')) { navigation?.navigate('VarthagamScreen'); onClose(); return; }

    if (title === 'உள்ளூர்' && (link === '/district' || link === '')) { navigation?.navigate('DistrictNewsScreen'); onClose(); return; }

    if (link.includes('districtdata') && item.id) { navigation?.navigate('DistrictNewsScreen', { districtId: item.id, districtTitle: title, districtLink: link }); onClose(); return; }

    if (title === 'தினம் தினம்' || link === '/dinamdinam' || link === 'dinamdinam') { navigation?.navigate('CommonSectionScreen', { screenTitle: 'தினம் தினம்', apiEndpoint: '/dinamdinam', allTabLink: '/dinamdinam' }); onClose(); return; }

    const reacturl = item.reacturl || item.slug || '';

    const isDinamDinamSub = parentTitle === 'தினம் தினம்' && (reacturl.startsWith('/dinamdinam/') || reacturl === '/pugarpetti' || link === '/pugarpetti');

    if (isDinamDinamSub) { 
      // Check if this is the PugarPetti item - navigate to PugarPettiScreen directly
      if (title === 'புகார் பெட்டி' || link === '/pugarpetti') {
        navigation?.navigate('PugarPettiScreen', {
          screenTitle: 'புகார் பெட்டி',
          initialDistrictId: null,
        });
        onClose();
        return;
      }
      navigation?.navigate('CommonSectionScreen', { 
        screenTitle: 'தினம் தினம்', 
        apiEndpoint: '/dinamdinam', 
        allTabLink: '/dinamdinam', 
        initialTabId: item.id != null ? item.id : null, 
        initialTabLink: link || '', 
        initialTabTitle: title || '' 
      }); 
      onClose(); 
      return;
    }
  
    if (title === 'விளையாட்டு' || link.includes('sports')) { navigation?.navigate('SportsScreen'); onClose(); return; }

    if (dinamDinamSubcats && dinamDinamSubcats.length > 0) {

      const matchedSubcat = dinamDinamSubcats.find(sc => sc.link === link || (sc.id && item.id && String(sc.id) === String(item.id)));

      if (matchedSubcat) { 
      // Handle dinam-dinam subcategories in WebView
      navigation?.navigate('TempleWebViewScreen', {
        url: `https://www.dinamalar.com${matchedSubcat.link || link}`
      });
      onClose(); 
      return; 
    }

    }

    if (title === 'வாராவாரம்' || id === 'varavaram' || link === '/varavaram' || link.includes('varavaram')) { navigation?.navigate('CommonSectionScreen', { screenTitle: 'வாராவாரம்', apiEndpoint: 'https://api-st-cdn.dinamalar.com/varavaram', allTabLink: 'https://api-st-cdn.dinamalar.com/varavaram', initialTabId: 'all' }); onClose(); return; }

    const isVaravaramParent = parentTitle === 'வாராவாரம்' || parentId === 'varavaram' || parentLink === '/varavaram';

    if (isVaravaramParent) { 
      navigation?.navigate('TempleWebViewScreen', {
        url: 'https://www.dinamalar.com/varavaram'
      });
      onClose(); 
      return; 
    }

    if (title === 'ஜோசியம்' || id === 'astrology' || link === '/joshiyam' || link === 'joshiyam') { 
      navigation?.navigate('TempleWebViewScreen', {
        url: 'https://or-staging-kalvimalar.dinamalar.com/astrology'
      });
      onClose(); 
      return;
    }

    const isJoshiyamParent = isJoshiyamItem(parentTitle, parentLink, parentId);

    if (isJoshiyamParent || isJoshiyamItem('', link, id)) { 
      // Navigate to specific joshiyam link instead of always going to main page
      let joshiyamUrl;
      
      // Use reacturl if available, otherwise fall back to link
      const targetUrl = item.reacturl || item.slug || link;
      
      if (targetUrl.startsWith('/astrology/')) {
        joshiyamUrl = `https://or-staging-kalvimalar.dinamalar.com${targetUrl}`;
      } else if (targetUrl.startsWith('/')) {
        joshiyamUrl = `https://or-staging-kalvimalar.dinamalar.com${targetUrl}`;
      } else {
        joshiyamUrl = `https://or-staging-kalvimalar.dinamalar.com/${targetUrl}`;
      }
      navigation?.navigate('TempleWebViewScreen', {
        url: joshiyamUrl
      });
      onClose(); 
      return; 
    }

    if (title === 'உலக தமிழர்' || id === 'nrimain' || link === '/nrimain' || link.includes('nrimain')) { navigation?.navigate('CommonSectionScreen', { screenTitle: 'உலக தமிழர்', apiEndpoint: '/nrimain', allTabLink: '/nrimain' }); onClose(); return; }

    const isNriParent = parentTitle === 'உலக தமிழர்' || parentId === 'nrimain' || parentLink === '/nrimain';

    if (isNriParent) { navigation?.navigate('CommonSectionScreen', { screenTitle: 'உலக தமிழர்', apiEndpoint: '/nrimain', allTabLink: '/nrimain', initialTabId: id || '', initialTabLink: link || '', initialTabTitle: title || '' }); onClose(); return; }

    if (title === 'ஸ்பெஷல்' || id === 'special' || link === '/specialmain' || link.includes('specialmain')) { navigation?.navigate('CommonSectionScreen', { screenTitle: 'ஸ்பெஷல்', apiEndpoint: '/specialmain', allTabLink: '/specialmain', initialTabId: 'All', initialTabLink: '/specialmain', initialTabTitle: 'அனைத்தும்' }); onClose(); return; }

    const isSpecialParent = parentTitle === 'ஸ்பெஷல்' || parentId === 'special' || parentLink === '/specialmain';

    if (isSpecialParent || link.includes('specialcatlist') || link.includes('speciallist')) { navigation?.navigate('CommonSectionScreen', { screenTitle: 'ஸ்பெஷல்', apiEndpoint: '/specialmain', allTabLink: '/specialmain', initialTabId: id || item.etitle || 'all', initialTabLink: link || '', initialTabTitle: title || '' }); onClose(); return; }

    if (title === 'ஆன்மீகம்' || id === 'anmegam' || link === '/anmegam') {

      navigation?.navigate('CommonSectionScreen', { screenTitle: 'ஆன்மீகம்', apiEndpoint: '/anmegam', allTabLink: '/anmegam' });

      onClose(); return;

    } const isAnmegamParent = parentTitle === 'ஆன்மீகம்' || parentId === 'anmegam' || parentLink === '/anmegam';

    if (isAnmegamParent) { 
      // Handle 360 degree virtual tours
      if (title === '360 deg' || title === '360°' || title.toLowerCase().includes('360') || link.includes('360') || title.toLowerCase().includes('virtual') || title.toLowerCase().includes('tour')) {
        Linking.openURL('https://www.dinamalar.com/anmegam-spirituality/temple-360-degree-virtual-tours').catch(() => 
          console.log('Failed to open 360 degree virtual tours page')
        );
        onClose(); 
        return; 
      }
      
      navigation?.navigate('CommonSectionScreen', { screenTitle: 'ஆன்மீகம்', apiEndpoint: '/anmegam', allTabLink: '/anmegam', initialTabId: id || '', initialTabLink: link || '', initialTabTitle: title || '' }); onClose(); return; 
    }

    if (title === 'காலண்டர்' || id === 'calendar' || link === '/calendar' || link.includes('calendar')) { 
      Linking.openURL('https://play.google.com/store/apps/details?id=com.daily.dinamalar&pcampaignid=web_share').catch(() => 
        console.log('Failed to open Google Play Store link')
      );
      onClose(); 
      return; 
    }

    const isCalendarParent = parentTitle === 'காலண்டர்' || parentId === 'calendar' || parentLink === '/calendar';

    if (isCalendarParent) { 
      Linking.openURL('https://play.google.com/store/apps/details?id=com.daily.dinamalar&pcampaignid=web_share').catch(() => 
        console.log('Failed to open Google Play Store link')
      );
      onClose(); 
      return; 
    }

    if (title === 'கோவில்கள்' || title === 'கோவில்' || id === 'temple' || link === '/temple' || link.includes('temple') || link.includes('kovil') || title.includes('கோவில்')) {
      navigation?.navigate('TempleWebViewScreen', {
        url: 'https://temple.dinamalar.com/'
      });
      onClose(); 
      return; 
    }

    if (title === 'சினிமா' || id === 'cinema' || link === '/cinema' || link.includes('cinema')) {
      navigation?.navigate('TempleWebViewScreen', {
        url: 'https://cinema.dinamalar.com/'
      });
      onClose(); 
      return; 
    }

    if (title === 'மலர்கள்' || id === 'malargal' || link === '/malargal' || link.includes('malargal')) { navigation?.navigate('CommonSectionScreen', { screenTitle: 'மலர்கள்', apiEndpoint: '/malargal', allTabLink: '/malargal' }); onClose(); return; }

    const isMalargalParent = parentTitle === 'மலர்கள்' || parentId === 'malargal' || parentLink === '/malargal';

    if (isMalargalParent) { navigation?.navigate('CommonSectionScreen', { screenTitle: 'மலர்கள்', apiEndpoint: '/malargal', allTabLink: '/malaragal', initialTabId: id || '', initialTabLink: link || '', initialTabTitle: title || '' }); onClose(); return; }

    if (title === 'போட்டோ' || id === 'photo' || link === '/photo' || link.includes('photo')) { navigation?.navigate('CommonSectionScreen', { screenTitle: 'போட்டோ', apiEndpoint: 'https://api-st-cdn.dinamalar.com/photodata', allTabLink: 'https://api-st-cdn.dinamalar.com/photodata', useFullUrl: true }); onClose(); return; }

    const isPhotoParent = parentTitle === 'போட்டோ' || parentId === 'photo' || parentLink === '/photo';

    if (isPhotoParent) { navigation?.navigate('CommonSectionScreen', { screenTitle: 'போட்டோ', apiEndpoint: 'https://api-st-cdn.dinamalar.com/photodata', allTabLink: 'https://api-st-cdn.dinamalar.com/photodata', useFullUrl: true, initialTabId: id || '', initialTabLink: link || '', initialTabTitle: title || '' }); onClose(); return; }

    if (title === 'மாவட்டங்கள்' || id === 'district' || link === '/district' || link.includes('district')) { navigation?.navigate('CommonSectionScreen', { screenTitle: 'மாவட்டங்கள்', apiEndpoint: '/district', allTabLink: '/district' }); onClose(); return; }

    const isdistrictParent = parentTitle === 'மாவட்டங்கள்' || parentId === 'district' || parentLink === '/district';

    if (isdistrictParent) { navigation?.navigate('CommonSectionScreen', { screenTitle: 'மாவட்டங்கள்', apiEndpoint: '/district', allTabLink: '/district', initialTabId: id || '', initialTabLink: link || '', initialTabTitle: title || '' }); onClose(); return; }

    if (title === 'தமிழ்நாடு செய்திகள்' && district) { setShowDistrictDrawer(true); return; }

    const resolved = resolveScreenFromLink(link);

    if (resolved) {
      if (resolved.screen === '__external__') Linking.openURL(link);
      else navigation?.navigate(resolved.screen, { catName: title, ...(resolved.params || {})});
      onClose(); return;
    }

    // Handle rasi categories - open in WebView
    if (link.includes('todayrasidata') || link.includes('weeklyrasiupdate') || link.includes('monthlyrasi') || 
        link.includes('gurupeyerchi') || link.includes('sanipeyerchi') || 
        link.includes('rahukethupeyarchi') || link.includes('tamilnewyear') || 
        link.includes('englishnewyear') || link.includes('/subam') || 
        link.includes('graha-oorai') || link.includes('gowri-panjangam') || 
        link.includes('importantviratham')) {
      navigation?.navigate('TempleWebViewScreen', {
        url: `https://or-staging-kalvimalar.dinamalar.com${link.startsWith('/') ? link : `/${link}`}`
      });
      onClose(); 
      return; 
    }

    // Only use CommonSectionScreen for other categories that don't need WebView
    if (link && link.startsWith('/') && title && 
        !link.includes('todayrasidata') && !link.includes('weeklyrasiupdate') && 
        !link.includes('monthlyrasi') && !link.includes('gurupeyerchi') && 
        !link.includes('sanipeyerchi') && !link.includes('rahukethupeyarchi') && 
        !link.includes('tamilnewyear') && !link.includes('englishnewyear') && 
        !link.includes('/subam') && !link.includes('graha-oorai') && 
        !link.includes('gowri-panjangam') && !link.includes('importantviratham')) {
      navigation?.navigate('CommonSectionScreen', { screenTitle: title, apiEndpoint: link, allTabLink: link }); onClose(); return; 
    }

    onClose();
  };

// ...

  // ─── Filtered data ────────────────────────────────────────────────────────

  const validMenu1 = menuData.menu1.filter(isValidMenuItem);

  const validMenuIndex1 = menuData.menuIndex1.filter(isValidMenuItem);

  const validMenu2 = menuData.menu2.filter(isValidMenu2Item);

  const validFollow = menuData.follow.filter(isValidFollowItem);



  // ── Render ─────────────────────────────────────────────────────────────────

  return (

    <Modal

      visible={isVisible}

      transparent

      animationType="none"

      onRequestClose={onClose}

      statusBarTranslucent

    >

      <View style={ds.root}>

        <Animated.View style={[ds.backdrop, { opacity: fadeAnim }]}>

          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        </Animated.View>



        <Animated.View style={[ds.drawerPanel, { transform: [{ translateX: slideAnim }] }]}>




          {/* ── Header ─────────────────────────────────────────────────── */}
          <View style={ds.drawerHeader}>
            <View style={ds.headerLeft}>
              <Image
                source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
                style={ds.logo}
                resizeMode="contain"
              />
             
            </View>

            {/* X close button */}
            <TouchableOpacity
              onPress={onClose}
              style={ds.closeBtn}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={s(30)} color={P.grey700} />
            </TouchableOpacity>
          </View>

          {/* ── Sign Up ────────────────────────────────────────────────── */}
          {/* <View style={ds.signUpWrap}>
            <TouchableOpacity 
              style={ds.signUpBtn} 
              activeOpacity={0.8}
              onPress={isLoggedIn ? handleSignOut : () => navigation?.replace('LoginScreen')}
            >
              <Text style={{ fontFamily: FONTS.muktaMalar.semibold, fontSize: ms(16), color: P.grey700 }}>
                {isLoggedIn ? 'Sign Out' : 'Sign Up'}
              </Text>
              {isLoggedIn ? <Logout color={P.grey700} size={16} /> : <Login color={P.grey700} size={16} />}
            </TouchableOpacity>
          </View> */}




          {loading ? (

            <View style={ds.loaderWrap}>

              <ActivityIndicator size="large" color={P.primary} />

            </View>

          ) : (

            <ScrollView

              style={ds.scrollView}

              showsVerticalScrollIndicator={false}

              keyboardShouldPersistTaps="handled"

            >

              {/* ── Menu 1 (Home + blue-arrow items) ───────────────────── */}

              <View style={ds.section}>

                {/* Home row */}

                <TouchableOpacity

                  style={[ds.homeRow, hoveredMenuItem === 'home' && ds.homeRowHover]}

                  onPress={() => { navigation?.navigate('MainTabs', { screen: 'Home' }); onClose(); }}

                  activeOpacity={0.7}
                  onPressIn={() => setHoveredMenuItem('home')}
                  onPressOut={() => setHoveredMenuItem(null)}

                >

                  <Home color={hoveredMenuItem === 'home' ? P.primary : P.grey800} size={20} style={{ marginRight: s(12) }} />

                  <Text style={{ fontFamily: FONTS.muktaMalar.semibold, fontSize: ms(17), color: hoveredMenuItem === 'home' ? P.primary : P.grey700 }}>

                    முகப்பு

                  </Text>

                </TouchableOpacity>





                {/* ── Divider under sign up ──────────────────────────────────── */}

                <View style={ds.topDivider} />


                {/* menu1 rows */}

                {validMenu1.map((item, index) => (

                  <TouchableOpacity

                    key={`m1-${index}`}

                    style={[ds.menuRow, hoveredMenuItem === `m1-${index}` && ds.menuRowHover]}

                    onPress={() => handleMenuItemPress(item)}

                    activeOpacity={0.7}
                    onPressIn={() => setHoveredMenuItem(`m1-${index}`)}
                    onPressOut={() => setHoveredMenuItem(null)}

                  >

                  <RightArrow color={hoveredMenuItem === `m1-${index}` ? P.primary : P.primary} size={16} style={{ marginRight: s(8) }} />

                  <Text style={{ fontFamily: FONTS.muktaMalar.semibold, fontSize: ms(17), color: hoveredMenuItem === `m1-${index}` ? P.primary : "#454F5B", flex: 1 }} numberOfLines={1}>

                    {item.Title || item.title || item.name || ''}

                  </Text>

                </TouchableOpacity>

                ))}

                {/* menuIndex1 rows — same style as menu1 */}
                {validMenuIndex1.map((item, index) => (
                  <TouchableOpacity
                    key={`mi1-${index}`}
                    style={[ds.menuRow, hoveredMenuItem === `mi1-${index}` && ds.menuRowHover]}
                    onPress={() => handleMenuItemPress(item)}
                    activeOpacity={0.7}
                    onPressIn={() => setHoveredMenuItem(`mi1-${index}`)}
                    onPressOut={() => setHoveredMenuItem(null)}
                  >
                    <RightArrow color={hoveredMenuItem === `mi1-${index}` ? P.primary : P.primary} size={25} style={{ marginRight: s(8) }} />
                    <Text style={{ fontFamily: FONTS.muktaMalar.semibold, fontSize: ms(25), color: hoveredMenuItem === `mi1-${index}` ? P.primary : P.grey800, flex: 1 }} numberOfLines={1}>
                      {item.Title || item.title || item.name || ''}
                    </Text>
                  </TouchableOpacity>
                ))}

              </View>



              {/* ── Divider before menu2 ────────────────────────────────── */}

              {validMenu2.length > 0 && <View style={ds.sectionDivider} />}



              {/* ── Menu 2 (icon + text + chevron rows) ────────────────── */}

              {validMenu2.length > 0 && (

                <View>

                  {validMenu2.map((item, index) => {

                    const rawSub = item.sub || item.subcatlist || [];

                    const itemTitle = item.Title || item.title || item.name || '';

                    const itemLink = item.Link || item.link || '';

                    const itemId = String(item.id || '');

                    const iconUri = item.Icon || item.icon || '';



                    const isDinamDinam = itemTitle === 'தினம் தினம்' || itemId === 'dinamdinam' || itemLink === '/dinamdinam';

                    const isJoshiyam = itemTitle === 'ஜோசியம்' || itemId === 'astrology' || itemLink === '/joshiyam';

                    const isNri = itemTitle === 'உலக தமிழர்' || itemId === 'nrimain' || itemLink === '/nrimain';

                    const isSpecial = itemTitle === 'ஸ்பெஷல்' || itemId === 'special ' || itemLink === '/specialmain';

                    const isweekly = itemTitle === 'வாராவாரம்' || itemId === 'varavaram' || itemLink === '/varavaram';

                    const isSpritual = itemTitle === 'ஆன்மீகம்' || itemId === 'anmigam' || itemLink === '/anmegam';

                    const isCalendar = itemTitle === 'காலண்டர்' || itemId === 'calendar' || itemLink === '/calendar';

                    const isMalargal = itemTitle === 'மலர்கள்' || itemId === 'malargal' || itemLink === '/malargal';

                    const isPhoto = itemTitle === 'போட்டோ' || itemId === 'photo' || itemLink === '/photodata';

                    const isDistrict = itemTitle === 'மாவட்டங்கள்' || itemId === 'district' || itemLink === '/district';

                    const isKovil = itemTitle === 'கோயில்கள்' || itemId === 'temple' || itemLink === '/temple';

                    const isCinema = itemTitle === 'சினிமா' || itemId === 'cinema' || itemLink === '/cinema';

                    const isLight = itemTitle === 'ஒளி' || itemId === 'light' || itemLink === '/light';



                    let subItems = rawSub;

                    if (isDinamDinam && dinamDinamSubcats && dinamDinamSubcats.length > 0) {

                      subItems = dinamDinamSubcats;

                    } else if (isDinamDinam && rawSub.length > 0) {

                      subItems = !rawSub.find(s => s.link === '/dinamdinam' || s.title === 'All')

                        ? [{ title: 'All', link: '/dinamdinam', reacturl: '/dinamdinam' }, ...rawSub] : rawSub;

                    } else if (isJoshiyam && rawSub.length > 0) {

                      const normalized = rawSub.map(s => ({ ...s, link: s.link || s.slug || '', title: s.title || s.Title || s.name || '' }));

                      subItems = !normalized.find(s => s.link === '/joshiyam' || s.title === 'All')

                        ? [{ title: 'All', link: '/joshiyam', id: 'all', etitle: 'all' }, ...normalized] : normalized;

                    } else if (isNri && rawSub.length > 0) {

                      subItems = !rawSub.find(s => s.link === '/nrimain' || s.title === 'All')

                        ? [{ title: 'All', link: '/nrimain', id: 'all', etitle: 'all' }, ...rawSub] : rawSub;

                    } else if (isSpecial && rawSub.length > 0) {

                      subItems = !rawSub.find(s => s.link === '/specialmain' || s.title === 'All')

                        ? [{ title: 'All', link: '/specialmain', id: 'all', etitle: 'all' }, ...rawSub] : rawSub;

                    } else if (isweekly && rawSub.length > 0) {

                      subItems = !rawSub.find(s => s.link === '/weekly' || s.title === 'All')

                        ? [{ title: 'All', link: '/weekly', id: 'all', etitle: 'all' }, ...rawSub] : rawSub;

                    } else if (isSpritual && rawSub.length > 0) {

                      subItems = !rawSub.find(s => s.link === '/anmegam' || s.title === 'All')

                        ? [{ title: 'All', link: '/anmegam', id: 'all', etitle: 'all' }, ...rawSub] : rawSub;

                    } else if (isCalendar && rawSub.length > 0) {

                      subItems = !rawSub.find(s => s.link === '/calendar' || s.title === 'All')

                        ? [{ title: 'All', link: '/calendar', id: 'all', etitle: 'all' }, ...rawSub] : rawSub;

                    } else if (isMalargal && rawSub.length > 0) {

                      subItems = !rawSub.find(s => s.link === '/malargal' || s.title === 'All')

                        ? [{ title: 'All', link: '/malargal', id: 'all', etitle: 'all' }, ...rawSub] : rawSub;

                    } else if (isPhoto && rawSub.length > 0) {

                      subItems = !rawSub.find(s => s.link === 'https://api-st-cdn.dinamalar.com/photodata' || s.title === 'All')

                        ? [{ title: 'All', link: 'https://api-st-cdn.dinamalar.com/photodata', id: 'all', etitle: 'all' }, ...rawSub] : rawSub;

                    } else if (isDistrict && rawSub.length > 0) {

                      subItems = !rawSub.find(s => s.link === '/district' || s.title === 'All')

                        ? [{ title: 'All', link: '/district', id: 'all', etitle: 'all' }, ...rawSub] : rawSub;

                    }



                    const validSubItems = subItems.filter(isValidSubItem);

                    const hasSub = validSubItems.length > 0;

                    const key = item.id || item.title || String(index);

                    // Add this:

                    const isExpanded = expandedItem === key;

                    return (

                      <View key={`m2-${index}`}>

                        {/* Main row: icon | text (flex:1) | chevron */}

                        <TouchableOpacity

                          style={[ds.menu2Row, hoveredMenuItem === `m2-${index}` && ds.menu2RowHover]}

                          onPress={() => hasSub ? toggleExpandedItem(key) : handleMenuItemPress(item)}

                          activeOpacity={0.7}
                          onPressIn={() => setHoveredMenuItem(`m2-${index}`)}
                          onPressOut={() => setHoveredMenuItem(null)}

                        >

                          {/* Icon box — fixed 36px width, centered */}

                          <View style={ds.menu2IconBox}>

                            {isDinamDinam ? (
                              <DinamDinam color={hoveredMenuItem === `m2-${index}` ? P.primary : P.grey800} size={s(20)} />

                            ) : isJoshiyam ? (
                              <Joshiyam color={hoveredMenuItem === `m2-${index}` ? P.primary : P.grey800} size={s(20)} />

                            ) : isweekly ? (
                              <Varavaram color={hoveredMenuItem === `m2-${index}` ? P.primary : P.grey800} size={s(20)} />

                            ) : isNri ? (
                              <UlagaTamilar color={hoveredMenuItem === `m2-${index}` ? P.primary : P.grey800} size={s(20)} />

                            ) : isSpecial ? (
                              <Special color={hoveredMenuItem === `m2-${index}` ? P.primary : P.grey800} size={s(20)} />

                            ) : isKovil ? (
                              <Kovil color={hoveredMenuItem === `m2-${index}` ? P.primary : P.grey800} size={s(20)} />

                            ) : isCalendar ? (
                              <Calendar color={hoveredMenuItem === `m2-${index}` ? P.primary : P.grey800} size={s(20)} />

                            ) : isSpritual ? (
                              <Aanmigam color={hoveredMenuItem === `m2-${index}` ? P.primary : P.grey800} size={s(20)} />

                            ) : isMalargal ? (
                              <Malargal color={hoveredMenuItem === `m2-${index}` ? P.primary : P.grey800} size={s(20)} />

                            ) : isPhoto ? (
                              <Photo color={hoveredMenuItem === `m2-${index}` ? P.primary : P.grey800} size={s(20)} />

                            ) : isDistrict ? (
                              <District color={hoveredMenuItem === `m2-${index}` ? P.primary : P.grey800} size={s(20)} />

                            ) : isCinema ? (
                              <Cinema color={hoveredMenuItem === `m2-${index}` ? P.primary : P.grey800} size={s(20)} />

                            ) : isLight ? (
                              <Light color={hoveredMenuItem === `m2-${index}` ? P.primary : P.grey800} size={s(20)} />

                            ) : null}

                          </View>



                          {/* Title — flex:1 pushes chevron to right edge */}

                          <Text
                            style={{
                              fontFamily: FONTS.muktaMalar.semibold,
                              fontSize: ms(16),
                              color: hoveredMenuItem === `m2-${index}` ? P.primary : P.grey800,
                              flex: 1,
                            }}
                            numberOfLines={2}
                          >

                            {itemTitle}

                          </Text>



                          {/* Chevron — only shown if has sub-items */}

                          {hasSub && (

                            <Ionicons

                              name={isExpanded ? 'chevron-up' : 'chevron-down'}

                              size={s(11)}

                              color={P.grey700}

                              style={{ marginLeft: s(6) }}

                            />

                          )}

                        </TouchableOpacity>



                        {/* Sub-items */}

                        {hasSub && isExpanded && (

                          <View style={ds.subList}>

                            {validSubItems.map((sub, si) => {

                              const subTitle = sub.Title || sub.title || sub.name || '';

                              const subLink = sub.Link || sub.link || '';

                              const parentKey = String(item.id || item.title || String(index));



                              // ── Active = this sub was last tapped (not hardcoded "All") ──────

                              const isActive = activeSubKey === `${parentKey}__${subLink || subTitle}`;



                              return (

                                <TouchableOpacity

                                  key={`sub-${index}-${si}`}

                                  style={[ds.subRow, isActive && ds.subRowAll, hoveredMenuItem === `sub-${index}-${si}` && !isActive && ds.subRowHover]}

                                  onPress={() => subTitle === 'All'

                                    ? handleMenuItemPress(item)

                                    : handleMenuItemPress(sub, item)

                                  }

                                  activeOpacity={0.7}
                                  onPressIn={() => setHoveredMenuItem(`sub-${index}-${si}`)}
                                  onPressOut={() => setHoveredMenuItem(null)}

                                >

                                  <Text

                                    style={{
                                      flex: 1,
                                      fontFamily: isActive ? FONTS.muktaMalar.semibold : FONTS.muktaMalar.regular,
                                      fontSize: ms(16),
                                      color: isActive ? P.primary : (hoveredMenuItem === `sub-${index}-${si}` ? P.primary : P.grey800),
                                      marginLeft: ms(10),
                                    }}
                                    numberOfLines={1}

                                  >

                                    {subTitle}

                                  </Text>

                                  <Ionicons

                                    name="chevron-forward"

                                    size={s(12)}

                                    color={isActive ? P.primary : P.grey700}

                                  />

                                </TouchableOpacity>

                              );

                            })}

                          </View>

                        )}

                      </View>

                    );

                  })}

                </View>

              )}



              {/* ── Follow Us ───────────────────────────────────────────── */}

              {validFollow.length > 0 && (

                <View style={ds.followSection}>

                  <Text style={{ fontFamily: FONTS.muktaMalar.bold, fontSize: 16, color: P.grey800, letterSpacing: 1, marginBottom: vs(10) }}>

                    Follow us

                  </Text>

                  <View style={ds.followRow}>

                    {validFollow.map((item, i) => (

                      <TouchableOpacity

                        key={`follow-${i}`}

                        style={[ds.followItem, hoveredMenuItem === `follow-${i}` && ds.followItemHover]}

                        onPress={() => item.Link && Linking.openURL(item.Link)}

                        activeOpacity={0.7}
                        onPressIn={() => setHoveredMenuItem(`follow-${i}`)}
                        onPressOut={() => setHoveredMenuItem(null)}

                      >

                        <MenuIcon uri={item.Icon} size={s(18)} />

                      </TouchableOpacity>

                    ))}

                  </View>

                </View>

              )}



              <View style={{ height: vs(40) }} />

            </ScrollView>

          )}

        </Animated.View>

      </View>



      {showDistrictDrawer && (

        <DistrictDrawer

          isVisible={showDistrictDrawer}

          onClose={() => { setShowDistrictDrawer(false); onClose(); }}

          district={district}

          navigation={navigation}

        />

      )}

    </Modal>

  );

};



export default DrawerMenu;



// ── Styles ────────────────────────────────────────────────────────────────────

const ds = StyleSheet.create({

  root: { flex: 1, flexDirection: 'row' },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },



  drawerPanel: {

    position: 'absolute', top: 0, left: 0, bottom: 0, width: DRAWER_W,

    backgroundColor: P.white,

    shadowColor: '#000', shadowOffset: { width: s(2), height: 0 },

    shadowOpacity: 0.15, shadowRadius: s(8), elevation: 12,

    paddingTop: Platform.OS === 'android' ? vs(30) : vs(48),

  },



  // ── Header ──────────────────────────────────────────────────────────────

  drawerHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: s(14),

    paddingVertical: vs(8),

    justifyContent: 'space-between',

  },

  logo: { width: s(120), height: vs(30) },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  userEmailText: {
    fontFamily: FONTS.muktaMalar.semibold,
    fontSize: ms(16),
    color: P.primary,
    marginLeft: s(10),
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
  },



  themeToggle: {

    flexDirection: 'row',

    alignItems: 'center',

    borderWidth: 1,

    borderColor: P.grey300,

    borderRadius: s(20),

    paddingHorizontal: s(12),

    paddingVertical: vs(4),

  },



  closeBtn: {

    width: s(30), height: s(30),

    borderRadius: s(15),

    // backgroundColor: P.grey200,

    alignItems: 'center',

    justifyContent: 'center',

  },



  // ── Sign Up ─────────────────────────────────────────────────────────────

  signUpWrap: { paddingHorizontal: s(14), paddingVertical: vs(8),flexDirection:"row",alignItems:"center",justifyContent:"space-between" },

  signUpBtn: {

    flexDirection: 'row',

    alignItems: 'center',

    // gap: s(6),

    alignSelf: 'flex-start',

    borderWidth: 1,

    borderColor: P.grey300,

    borderRadius: s(6),

    paddingHorizontal: s(14),

    paddingVertical: vs(6),

    justifyContent: "space-around",
    gap:ms(5)

  },



  topDivider: { height: 1, backgroundColor: P.border },



  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: vs(40) },

  scrollView: { flex: 1 },

  section: { paddingVertical: vs(0) },



  // ── Menu 1 rows (Home + blue-arrow list) ────────────────────────────────

  homeRow: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: s(12),

    paddingVertical: vs(5),

  },

  menuRow: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: s(12),

    paddingVertical: vs(6),

    backgroundColor: P.white,

  },



  sectionDivider: { height: 1, backgroundColor: P.border, marginVertical: vs(2) },



  // ── Menu 2 rows (icon + text + chevron) ─────────────────────────────────

  menu2Row: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: s(12),

    paddingVertical: vs(8),

    borderBottomWidth: 1,

    borderBottomColor: P.grey200,

    backgroundColor: P.white,

  },

  menu2IconBox: {

    // width: s(28),

    alignItems: 'center',

    marginRight: s(12),

  },



  // ── Sub-items ────────────────────────────────────────────────────────────

  subList: { backgroundColor: P.grey100, borderTopWidth: 1, borderTopColor: P.grey200 },

  subRow: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: s(12),

    paddingVertical: vs(9),

    borderBottomWidth: 1,

    borderBottomColor: P.grey200,



  },

  subRowAll: { backgroundColor: P.primary + '14' },



  // ── Follow Us ────────────────────────────────────────────────────────────

  followSection: {

    marginTop: vs(10),

    // borderTopWidth: 1,

    borderTopColor: P.border,

    paddingTop: vs(12),

    paddingHorizontal: s(12),

    alignItems: 'center',

  },

  followRow: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'center',

},

followItem: {

width: s(32), height: s(32),

borderRadius: s(16),

backgroundColor: P.grey100,

borderWidth: 1,

borderColor: P.grey300,

alignItems: 'center',

justifyContent: 'center',

overflow: 'hidden',

},

// ── Hover styles ─────────────────────────────────────────────────────

homeRowHover: {

backgroundColor: P.primary + '10',

},

menuRowHover: {

backgroundColor: P.primary + '10',

},

menu2RowHover: {

backgroundColor: P.primary + '10',

},

subRowHover: {

backgroundColor: P.primary + '08',

},

followItemHover: {

backgroundColor: P.primary + '15',

borderColor: P.primary,

},

});