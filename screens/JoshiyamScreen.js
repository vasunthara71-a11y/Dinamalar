// // JoshiyamScreen.js
// import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   ActivityIndicator,
//   ScrollView,
//   StyleSheet,
//   Image,
//   Dimensions,
//   Platform,
//   RefreshControl,
//   SafeAreaView,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { u38Api } from '../config/api';
// import { COLORS, FONTS } from '../utils/constants';
// import { s, vs, scaledSizes } from '../utils/scaling';

// const { width: SCREEN_W } = Dimensions.get('window');
// const RASI_COLS = 4;

// // ─────────────────────────────────────────────────────────────────────
// // Categories that use special card styles
// // ─────────────────────────────────────────────────────────────────────
// const SUBAM_IDS  = new Set(['subamuhurthanaatkal']);
// const SIMPLE_IDS = new Set(['gragaorai', 'gowripanchangam', 'importantviratham', 'karinaal', 'vasthudays']);

// // ─────────────────────────────────────────────────────────────────────
// // flattenNewlist:  newlist → FlatList rows
// // ─────────────────────────────────────────────────────────────────────
// const flattenNewlist = (newlist = [], activeTabId = 'all') => {
//   const rows = [];
//   newlist.forEach((section) => {
//     const items = section.data || [];
//     if (!items.length) return;

//     const sectionId = String(section.id || section.etitle || '');

//     // Filter for specific tab
//     if (activeTabId !== 'all' && sectionId !== activeTabId) return;

//     const isRasiSection = section.title === 'ராசிகள்';

//     rows.push({ _type: 'SECTION_HEADER', title: section.title, sectionId });

//     if (isRasiSection) {
//       // Entire grid as one row
//       rows.push({ _type: 'RASI_GRID', items, sectionId });
//     } else {
//       items.forEach((item, idx) => {
//         rows.push({ _type: 'CARD', ...item, sectionId, _idx: idx });
//       });
//     }
//   });
//   return rows;
// };

// // ─────────────────────────────────────────────────────────────────────
// // RASI GRID
// // ─────────────────────────────────────────────────────────────────────
// const RasiGrid = React.memo(({ items, onPress }) => (
//   <View style={ss.rasiGrid}>
//     {items.map((item, i) => (
//       <TouchableOpacity
//         key={item.id || String(i)}
//         style={ss.rasiItem}
//         onPress={() => onPress && onPress(item)}
//         activeOpacity={0.75}
//       >
//         {!!item.icon && (
//           <Image source={{ uri: item.icon }} style={ss.rasiIcon} resizeMode="contain" />
//         )}
//         <Text style={ss.rasiLabel} numberOfLines={1}>{item.title || item.name || ''}</Text>
//       </TouchableOpacity>
//     ))}
//   </View>
// ));

// // ─────────────────────────────────────────────────────────────────────
// // NEWS CARD  (ராசி பலன்கள், பெயர்ச்சி etc.)
// // ─────────────────────────────────────────────────────────────────────
// const NewsCard = React.memo(({ item, onPress }) => {
//   const title = item.title || item.newstitle || item.heading || item.name || '';
//   const image = item.largeimages || item.image || item.img || item.thumb || item.thumbnail || '';
//   const date  = item.standarddate || item.ago || item.date || item.pubdate || '';
//   const desc  = item.newsdescription || item.desc || item.description || item.summary || '';

//   return (
//     <TouchableOpacity style={ss.card} onPress={() => onPress && onPress(item)} activeOpacity={0.75}>
//       {!!image && <Image source={{ uri: image }} style={ss.cardImage} resizeMode="cover" />}
//       <View style={ss.cardBody}>
//         {!!title && <Text style={ss.cardTitle} numberOfLines={3}>{title}</Text>}
//         {!!desc  && <Text style={ss.cardDesc}  numberOfLines={2}>{desc}</Text>}
//         {!!date  && <Text style={ss.cardDate}>{date}</Text>}
//       </View>
//     </TouchableOpacity>
//   );
// });

// // ─────────────────────────────────────────────────────────────────────
// // CALENDAR CARD  (சுப முகூர்த்தம்)
// // ─────────────────────────────────────────────────────────────────────
// const CalendarCard = React.memo(({ item, onPress }) => {
//   const image    = item.largeimages || item.image || '';
//   const category = item.category || item.maincat || '';
//   const dateStr  = item.standarddate || item.date || '';
//   const day      = item.eng_day || '';
//   const thithi   = item.thithi || '';
//   const natch    = item.natchathiram || '';

//   return (
//     <TouchableOpacity style={ss.card} onPress={() => onPress && onPress(item)} activeOpacity={0.75}>
//       {!!image && <Image source={{ uri: image }} style={ss.cardImage} resizeMode="cover" />}
//       <View style={ss.cardBody}>
//         {!!category && <Text style={ss.cardTitle} numberOfLines={2}>{category}</Text>}
//         {(!!dateStr || !!day) && (
//           <View style={ss.calRow}>
//             {!!dateStr && <Text style={ss.calDate}>{dateStr}</Text>}
//             {!!day     && <Text style={ss.calSub}>{day}</Text>}
//           </View>
//         )}
//         {!!thithi && <Text style={ss.calSub}>திதி: {thithi}</Text>}
//         {!!natch  && <Text style={ss.calSub}>நட்சத்திரம்: {natch}</Text>}
//       </View>
//     </TouchableOpacity>
//   );
// });

// // ─────────────────────────────────────────────────────────────────────
// // SIMPLE CARD  (கிரக ஓரை, கௌரி பஞ்சாங்கம், விரதம் etc.)
// // ─────────────────────────────────────────────────────────────────────
// const SimpleCard = React.memo(({ item, onPress }) => {
//   const image = item.largeimages || item.image || '';
//   const title = item.maincat || item.title || item.name || '';

//   return (
//     <TouchableOpacity style={ss.card} onPress={() => onPress && onPress(item)} activeOpacity={0.75}>
//       {!!image && <Image source={{ uri: image }} style={ss.cardImage} resizeMode="cover" />}
//       {!!title && <Text style={[ss.cardTitle, { padding: s(12) }]}>{title}</Text>}
//     </TouchableOpacity>
//   );
// });

// // ─────────────────────────────────────────────────────────────────────
// // TAB BAR
// // ─────────────────────────────────────────────────────────────────────
// const TabBar = ({ tabs, activeId, onSelect }) => (
//   <View style={ss.tabBarWrapper}>
//     <ScrollView
//       horizontal
//       showsHorizontalScrollIndicator={false}
//       contentContainerStyle={ss.tabBarContent}
//     >
//       {tabs.map((tab, i) => {
//         const isActive = tab.id === activeId;
//         return (
//           <TouchableOpacity
//             key={tab.id || String(i)}
//             style={[ss.tabItem, isActive && ss.tabItemActive]}
//             onPress={() => onSelect(tab)}
//             activeOpacity={0.75}
//           >
//             <Text style={[ss.tabText, isActive && ss.tabTextActive]} numberOfLines={1}>
//               {tab.title}
//             </Text>
//           </TouchableOpacity>
//         );
//       })}
//     </ScrollView>
//   </View>
// );

// // ─────────────────────────────────────────────────────────────────────
// // MAIN SCREEN
// // ─────────────────────────────────────────────────────────────────────
// const JoshiyamScreen = ({ navigation, route }) => {
//   const routeTabId    = route?.params?.initialTabId    || 'all';
//   const routeTabLink  = route?.params?.initialTabLink  || '';
//   const routeTabTitle = route?.params?.initialTabTitle || '';

//   const [tabs, setTabs]           = useState([{ title: 'அனைத்தும்', id: 'all', link: '/joshiyam' }]);
//   const [activeTab, setActiveTab] = useState({
//     title: routeTabTitle || 'அனைத்தும்',
//     id:    routeTabId    || 'all',
//     link:  routeTabLink  || '/joshiyam',
//   });
//   const [newlist, setNewlist]     = useState([]);
//   const [loading, setLoading]     = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   // ── Fetch
//   const fetchAll = useCallback(async () => {
//     try {
//       const res  = await u38Api.get('/joshiyam');
//       const data = res?.data || {};

//       // Build tabs from subcatlist
//       const subcatlist = data.subcatlist || [];
//       if (subcatlist.length > 0) {
//         const mapped = subcatlist.map(sc => ({
//           title: sc.title || '',
//           id:    String(sc.id || sc.etitle || sc.title || ''),
//           link:  sc.link || sc.reacturl || '',
//         }));
//         const hasAll = mapped.some(t => t.link === '/joshiyam' || !t.id);
//         const allTab = { title: 'அனைத்தும்', id: 'all', link: '/joshiyam' };
//         const finalTabs = hasAll ? mapped : [allTab, ...mapped];
//         setTabs(finalTabs);

//         // If we navigated with a specific tab, find and set it
//         if (routeTabId && routeTabId !== 'all') {
//           const found = finalTabs.find(t => t.id === routeTabId || t.link === routeTabLink);
//           if (found) setActiveTab(found);
//         }
//       }

//       // Store raw newlist
//       const nl = data.newlist || [];
//       setNewlist(nl);

//     } catch (e) {
//       console.error('[JoshiyamScreen] fetch error:', e?.message);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => { fetchAll(); }, []);

//   const handleRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchAll();
//   }, [fetchAll]);

//   const handleTabSelect = useCallback((tab) => {
//     setActiveTab(tab);
//   }, []);

//   // Re-derive rows when tab or data changes (no extra API call)
//   const flatRows = useMemo(
//     () => flattenNewlist(newlist, activeTab.id),
//     [newlist, activeTab.id]
//   );

//   // ── Card press
//   const handleCardPress = useCallback((item) => {
//     const slug  = item.slug || item.reacturl || item.link || '';
//     const title = item.title || item.maincat || '';
//     if (!slug || !navigation) return;
//     const url = slug.startsWith('http') ? slug : `https://www.dinamalar.com${slug}`;
//     navigation.navigate('WebViewScreen', { url, title });
//   }, [navigation]);

//   // ── Render row
//   const renderItem = useCallback(({ item }) => {
//     if (item._type === 'SECTION_HEADER') {
//       return (
//         <View style={ss.sectionHeader}>
//           <View style={ss.sectionBar} />
//           <Text style={ss.sectionTitle}>{item.title}</Text>
//         </View>
//       );
//     }
//     if (item._type === 'RASI_GRID') {
//       return <RasiGrid items={item.items} onPress={handleCardPress} />;
//     }

//     // CARD
//     const sId = item.sectionId || '';
//     if (SIMPLE_IDS.has(sId)) return <SimpleCard   item={item} onPress={handleCardPress} />;
//     if (SUBAM_IDS.has(sId))  return <CalendarCard item={item} onPress={handleCardPress} />;
//     return <NewsCard item={item} onPress={handleCardPress} />;
//   }, [handleCardPress]);

//   const keyExtractor = useCallback((item, index) => {
//     if (item._type === 'SECTION_HEADER') return `sh-${item.sectionId}-${index}`;
//     if (item._type === 'RASI_GRID')      return `rg-${index}`;
//     return String(item.rasiid || item.id || index);
//   }, []);

//   const renderEmpty = useCallback(() => {
//     if (loading) return null;
//     return (
//       <View style={ss.emptyWrap}>
//         <Ionicons name="moon-outline" size={s(44)} color={COLORS.subtext} />
//         <Text style={ss.emptyText}>தகவல்கள் இல்லை</Text>
//       </View>
//     );
//   }, [loading]);

//   // ─────────────────────────────────────────────────────────────────────
//   return (
//     <SafeAreaView style={ss.root}>

//       {/* Header */}
//       <View style={ss.header}>
//         <TouchableOpacity
//           onPress={() => navigation?.goBack()}
//           style={ss.backBtn}
//           hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="arrow-back" size={s(22)} color={COLORS.text} />
//         </TouchableOpacity>
//         <Text style={ss.headerTitle}>ஜோசியம்</Text>
//         <View style={{ width: s(36) }} />
//       </View>

//       {/* Tab Bar */}
//       <TabBar tabs={tabs} activeId={activeTab.id} onSelect={handleTabSelect} />

//       {/* Content */}
//       {loading ? (
//         <View style={ss.loaderWrap}>
//           <ActivityIndicator size="large" color={COLORS.primary} />
//         </View>
//       ) : (
//         <FlatList
//           data={flatRows}
//           keyExtractor={keyExtractor}
//           renderItem={renderItem}
//           ListEmptyComponent={renderEmpty}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={handleRefresh}
//               colors={[COLORS.primary]}
//               tintColor={COLORS.primary}
//             />
//           }
//           contentContainerStyle={
//             flatRows.length === 0 ? ss.emptyContainer : ss.listContent
//           }
//           showsVerticalScrollIndicator={false}
//         />
//       )}
//     </SafeAreaView>
//   );
// };

// export default JoshiyamScreen;

// // ─────────────────────────────────────────────────────────────────────────────
// // STYLES
// // ─────────────────────────────────────────────────────────────────────────────
// const ss = StyleSheet.create({
//   root: { flex: 1, backgroundColor: COLORS.background || '#f5f5f5' },

//   // Header
//   header: {
//     flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
//     paddingHorizontal: s(14), paddingVertical: vs(10),
//     backgroundColor: COLORS.white || '#fff',
//     borderBottomWidth: 1, borderBottomColor: COLORS.border || '#eee',
//     ...Platform.select({
//       android: { elevation: 3 },
//       ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
//     }),
//   },
//   backBtn: {
//     width: s(36), height: s(36), borderRadius: s(18),
//     backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center',
//   },
//   headerTitle: {
//     fontSize: s(17),
//     fontFamily: FONTS.muktaMalar?.bold || FONTS.bold || 'System',
//     color: COLORS.text || '#111',
//   },

//   // Tab Bar
//   tabBarWrapper: {
//     backgroundColor: COLORS.white || '#fff',
//     borderBottomWidth: 1, borderBottomColor: COLORS.border || '#eee',
//   },
//   tabBarContent:  { paddingHorizontal: s(10), paddingVertical: vs(6) },
//   tabItem: {
//     paddingHorizontal: s(14), paddingVertical: vs(6),
//     borderRadius: s(20), backgroundColor: '#f0f0f0', marginRight: s(6),
//   },
//   tabItemActive:  { backgroundColor: COLORS.primary || '#c0392b' },
//   tabText: {
//     fontSize: s(12),
//     fontFamily: FONTS.muktaMalar?.regular || FONTS.regular || 'System',
//     color: COLORS.subtext || '#666',
//   },
//   tabTextActive: {
//     color: '#fff',
//     fontFamily: FONTS.muktaMalar?.bold || FONTS.bold || 'System',
//   },

//   // List
//   listContent:    { paddingBottom: vs(30) },
//   emptyContainer: { flexGrow: 1 },

//   // Section Header
//   sectionHeader: {
//     flexDirection: 'row', alignItems: 'center',
//     paddingHorizontal: s(12), paddingTop: vs(14), paddingBottom: vs(6),
//     backgroundColor: COLORS.background || '#f5f5f5',
//   },
//   sectionBar: {
//     width: s(4), height: vs(18), borderRadius: s(2),
//     backgroundColor: COLORS.primary || '#c0392b', marginRight: s(8),
//   },
//   sectionTitle: {
//     fontSize: s(15),
//     fontFamily: FONTS.muktaMalar?.bold || FONTS.bold || 'System',
//     color: COLORS.text || '#111',
//   },

//   // Card (shared)
//   card: {
//     backgroundColor: COLORS.white || '#fff',
//     marginHorizontal: s(12), marginBottom: vs(10),
//     borderRadius: s(10), overflow: 'hidden',
//     borderWidth: 1, borderColor: COLORS.border || '#eee',
//     ...Platform.select({
//       android: { elevation: 2 },
//       ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
//     }),
//   },
//   cardImage:  { width: '100%', height: vs(180), backgroundColor: '#f0f0f0' },
//   cardBody:   { padding: s(12) },
//   cardTitle: {
//     fontSize: s(15),
//     fontFamily: FONTS.muktaMalar?.bold || FONTS.bold || 'System',
//     color: COLORS.text || '#111',
//     lineHeight: s(22), marginBottom: vs(4),
//   },
//   cardDesc: {
//     fontSize: s(13),
//     fontFamily: FONTS.muktaMalar?.regular || FONTS.regular || 'System',
//     color: COLORS.subtext || '#666',
//     lineHeight: s(19), marginBottom: vs(6),
//   },
//   cardDate: {
//     fontSize: s(11),
//     fontFamily: FONTS.muktaMalar?.regular || FONTS.regular || 'System',
//     color: COLORS.subtext || '#999',
//   },

//   // Calendar extras
//   calRow:  { flexDirection: 'row', alignItems: 'center', gap: s(8), marginBottom: vs(2) },
//   calDate: { fontSize: s(13), fontFamily: FONTS.muktaMalar?.bold || 'System', color: COLORS.primary || '#c0392b' },
//   calSub:  { fontSize: s(12), fontFamily: FONTS.muktaMalar?.regular || 'System', color: COLORS.subtext || '#666', marginBottom: vs(2) },

//   // Rasi Grid
//   rasiGrid: {
//     flexDirection: 'row', flexWrap: 'wrap',
//     marginHorizontal: s(12), marginBottom: vs(10),
//     backgroundColor: COLORS.white || '#fff',
//     borderRadius: s(10), overflow: 'hidden',
//     borderWidth: 1, borderColor: COLORS.border || '#eee',
//     paddingVertical: vs(6),
//   },
//   rasiItem:  { width: `${100 / RASI_COLS}%`, alignItems: 'center', paddingVertical: vs(10) },
//   rasiIcon:  { width: s(44), height: s(44), marginBottom: vs(4) },
//   rasiLabel: {
//     fontSize: s(11),
//     fontFamily: FONTS.muktaMalar?.regular || 'System',
//     color: COLORS.text || '#333',
//     textAlign: 'center',
//   },

//   // Loader / Empty
//   loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
//   emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: vs(80), gap: vs(12) },
//   emptyText:  {
//     fontSize: s(15),
//     fontFamily: FONTS.muktaMalar?.regular || 'System',
//     color: COLORS.subtext || '#999',
//   },
// });



import { View, Text } from 'react-native'
import React from 'react'

const JoshiyamScreen = () => {
  return (
    <View>
      <Text>JoshiyamScreen</Text>
    </View>
  )
}

export default JoshiyamScreen