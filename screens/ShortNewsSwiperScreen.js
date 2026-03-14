// screens/ShortNewsSwiperScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    FlatList,
    StatusBar,
    Platform,
    Share,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FONTS } from '../utils/constants';
import { ms, s, vs } from '../utils/scaling';
import { useFontSize } from '../context/FontSizeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PALETTE = {
    primary: '#096dd2',
    grey100: '#F9FAFB',
    grey200: '#F4F6F8',
    grey300: '#DFE3E8',
    grey400: '#C4CDD5',
    grey500: '#919EAB',
    grey600: '#637381',
    grey700: '#637381',
    grey800: '#212B36',
    white: '#FFFFFF',
};

const API_URL = 'https://u38.dinamalar.com/shortnews';

// Use full SCREEN_HEIGHT for each page — FlatList fills remaining space after header
// snapToInterval handles the snapping, pagingEnabled removed to avoid conflict
const PAGE_H = SCREEN_HEIGHT;
// ─── Single swipe page ────────────────────────────────────────────────────────
function ShortNewsCard({ item, onFullDetail }) {
    const { sf } = useFontSize();

    const mainImage =
        item.largeimages || item.images || item.image || item.thumbnail ||
        'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

    const insetImage =
        item.thumbnail || item.thumb || item.smallimage || mainImage;

    const title = item.newstitle || item.title || '';
    const category = item.maincat || item.ctitle || item.categrorytitle || '';
    const ago = item.ago || item.time_ago || item.date || '';
    const desc = item.newsdescription || item.neewsdescription ||
        item.shortdesc || item.description || item.summary || '';
    const hasAudio = item.audio === 1 || item.audio === '1' ||
        (typeof item.audio === 'string' && item.audio.length > 1 && item.audio !== '0');
    const hasComments = item.newscomment > 0 || item.comment_count > 0;

    // Debug: Log comment data
    console.log('ShortNewsCard item:', {
        id: item.newsid || item.id,
        comments: item.newscomment,
        comment_count: item.comment_count,
        hasComments
    });

    const articleUrl = item.slug
        ? `https://www.dinamalar.com${item.slug}`
        : item.share_url || item.url || item.weburl || item.link || '';

    const openArticle = () => {
        if (articleUrl.startsWith('http')) {
            Linking.openURL(articleUrl).catch(() => onFullDetail?.(item));
        } else {
            onFullDetail?.(item);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `${title}\n${articleUrl || 'https://www.dinamalar.com/'}`,
                url: articleUrl || 'https://www.dinamalar.com/',
            });
        } catch (e) { console.error(e); }
    };

    return (
        // PAGE_H wrapper — FlatList paging snaps to exactly this height
        <View style={pageSt.page}>

            {/* ── HomeScreen card UI ─────────────────────────────────────────────── */}
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onFullDetail?.(item)}
                style={pageSt.card}
            >

                {/* Image — overflow:hidden clips the inset so it can't bleed outside */}
                <View style={pageSt.imageContainer}>
                    <Image source={{ uri: mainImage }} style={pageSt.mainImage} resizeMode="cover" />

                    {/* Circular inset top-right */}
                    {/* <View style={pageSt.insetWrapper}>
                        <Image source={{ uri: insetImage }} style={pageSt.insetImage} resizeMode="cover" />
                    </View> */}
                </View>

                {/* White content — matches HomeScreen ShortNewsCard exactly */}
                <View style={pageSt.contentCard}>

                    {/* Title */}
                    <Text style={[pageSt.title, { fontSize: sf(16), lineHeight: sf(22) }]} numberOfLines={3}>
                        {title}
                    </Text>

                    {/* Category pill + time + audio */}
                    <View style={pageSt.metaRow}>
                        {!!category && (
                            <View style={pageSt.catPill}>
                                <Text style={[pageSt.catText, { fontSize: sf(11) }]}>{category}</Text>
                            </View>
                        )}
                        <View style={pageSt.metaRight}>
                            {!!ago && (
                                <Text style={[pageSt.agoText, { fontSize: sf(11) }]}>{ago}</Text>
                            )}
                            {hasAudio && (
                                <Ionicons name="volume-medium-outline" size={s(15)} color={PALETTE.grey500} />
                            )}
                            {hasComments && (
                                <Ionicons name="chatbox" size={s(15)} color={PALETTE.grey500} />
                            )}
                        </View>
                    </View>

                    {/* Description */}
                    {!!desc && (
                        <Text style={[pageSt.desc, { fontSize: sf(13), lineHeight: sf(20) }]} numberOfLines={6}>
                            {desc.trim()}
                        </Text>
                    )}

                    {/* ── Bottom bar: share | swipe up | முழு விவரம் ─────────────────── */}
                    <View style={pageSt.bottomBar}>

                        <TouchableOpacity onPress={handleShare} activeOpacity={0.7} style={pageSt.shareBtn}>
                            <Ionicons name="share-social-outline" size={s(22)} color={PALETTE.grey600} />
                        </TouchableOpacity>

                        <View style={pageSt.swipeHint}>
                            <Ionicons name="chevron-up" size={s(15)} color={PALETTE.grey500} style={{ marginBottom: -vs(6) }} />
                            <Ionicons name="chevron-up" size={s(15)} color={PALETTE.grey300} />
                            <Text style={[pageSt.swipeText, { fontSize: sf(10) }]}>Swipe up</Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => onFullDetail?.(item)}
                            activeOpacity={0.8}
                            style={pageSt.detailBtn}
                        >
                            <Text style={[pageSt.detailBtnText, { fontSize: sf(13) }]}>முழு விவரம்</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}

// ─── Loading skeleton page ────────────────────────────────────────────────────
function SkeletonPage() {
    return (
        <View style={pageSt.page}>
            <View style={pageSt.card}>
                <View style={{ height: vs(220), backgroundColor: PALETTE.grey200 }} />
                <View style={{ backgroundColor: PALETTE.white, padding: s(14) }}>
                    <View style={{ height: vs(16), backgroundColor: PALETTE.grey200, borderRadius: s(4), marginBottom: vs(8), width: '88%' }} />
                    <View style={{ height: vs(14), backgroundColor: PALETTE.grey200, borderRadius: s(4), marginBottom: vs(12), width: '55%' }} />
                    <View style={{ height: vs(12), backgroundColor: PALETTE.grey100, borderRadius: s(4), marginBottom: vs(6) }} />
                    <View style={{ height: vs(12), backgroundColor: PALETTE.grey100, borderRadius: s(4), width: '80%' }} />
                </View>
            </View>
        </View>
    );
}

// ─── ShortNewsSwiperScreen ────────────────────────────────────────────────────
export default function ShortNewsSwiperScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { sf } = useFontSize();

    // homeData from HomeScreen shown instantly while API loads
    const homeData = route.params?.data || route.params?.newsData || [];

    const [data, setData] = useState(homeData);
    const [loading, setLoading] = useState(true);   // always fetch API
    const [error, setError] = useState(null);
    const [curIndex, setCurIndex] = useState(0);

    const listRef = useRef(null);

    useEffect(() => { fetchFromApi(); }, []);

    const fetchFromApi = async () => {
        try {
            setLoading(homeData.length === 0); // show skeleton only if no homeData
            setError(null);

            const res = await fetch(API_URL);
            const json = await res.json();

            // API data lives at json.newlist.data
            const apiItems = json?.newlist?.data || json?.data || [];

            if (apiItems.length === 0) {
                // Fallback: keep homeData if API returns nothing
                if (homeData.length === 0) setError('தகவல் இல்லை');
                return;
            }

            if (homeData.length > 0) {
                // Merge: homeData first, then API items not already in homeData
                const homeIds = new Set(homeData.map(i => String(i.newsid || i.id)));
                const extra = apiItems.filter(i => !homeIds.has(String(i.newsid || i.id)));
                setData([...homeData, ...extra]);
            } else {
                // No homeData — show full API list
                setData(apiItems);
            }
        } catch (e) {
            console.error('ShortNews fetch error:', e);
            if (homeData.length === 0) setError('தகவல் பெற முடியவில்லை');
        } finally {
            setLoading(false);
        }
    };

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems[0]) setCurIndex(viewableItems[0].index ?? 0);
    }).current;

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

    const handleFullDetail = useCallback((item) => {
        navigation.navigate('NewsDetailsScreen', {
            newsId: item.newsid || item.id,
            newsItem: item,
            slug: item.slug || '',
        });
    }, [navigation]);

    const renderItem = useCallback(({ item }) => (
        <ShortNewsCard item={item} onFullDetail={handleFullDetail} />
    ), [handleFullDetail]);

    const keyExtractor = useCallback((item, i) =>
        `sn-${item.newsid || item.id || i}`, []);

    const getItemLayout = useCallback((_, index) => ({
        length: PAGE_H,
        offset: PAGE_H * index,
        index,
    }), []);

    // ── Header ───────────────────────────────────────────────────────────────────
    const Header = (
        <View style={[screenSt.header, {
            paddingTop: Platform.OS === 'android' ? vs(30) : insets.top,
        }]}>
            {/* <TouchableOpacity
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ padding: s(4) }}
      >
        <Ionicons name="arrow-back" size={s(22)} color={PALETTE.grey800} />
      </TouchableOpacity> */}

            <Image
                source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
                style={screenSt.logo}
                resizeMode="contain"
            />

            <Text style={[screenSt.headerTitle, { fontSize: ms(15) }]}>ஷார்ட் நியூஸ்</Text>
        </View>
    );

    // ── Loading ───────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={screenSt.container}>
                <StatusBar barStyle="dark-content" backgroundColor={PALETTE.white} />
                {Header}
                <SkeletonPage />
            </View>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────────
    if (error && data.length === 0) {
        return (
            <View style={screenSt.container}>
                <StatusBar barStyle="dark-content" backgroundColor={PALETTE.white} />
                {Header}
                <View style={screenSt.centered}>
                    <Ionicons name="cloud-offline-outline" size={s(48)} color={PALETTE.grey400} />
                    <Text style={{ fontSize: sf(14), color: PALETTE.grey500, fontFamily: FONTS.muktaMalar.regular }}>
                        {error}
                    </Text>
                    <TouchableOpacity style={screenSt.retryBtn} onPress={fetchFromApi}>
                        <Text style={{ fontSize: sf(13), color: PALETTE.primary, fontFamily: FONTS.muktaMalar.medium }}>
                            மீண்டும் முயற்சி
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ── Main ──────────────────────────────────────────────────────────────────────
    return (
        <View style={screenSt.container}>
            <StatusBar barStyle="dark-content" backgroundColor={PALETTE.white} translucent={false} />

            {Header}

            {/* ── Vertical paging swiper ───────────────────────────────────────────── */}
            <FlatList
                ref={listRef}
                data={data}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                getItemLayout={getItemLayout}
                // Use ONLY snapToInterval — do NOT use pagingEnabled together, they conflict
                pagingEnabled={false}
                snapToInterval={PAGE_H}
                snapToAlignment="start"
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                removeClippedSubviews={false}
                maxToRenderPerBatch={5}
                windowSize={5}
                initialNumToRender={2}
                ListFooterComponent={null}
            />

            {/* ── Right side dot indicators ────────────────────────────────────────── */}
            {/* {data.length > 1 && (
        <View style={screenSt.dots}>
          {data.slice(0, 12).map((_, i) => (
            <View key={i} style={[screenSt.dot, i === curIndex && screenSt.dotActive]} />
          ))}
          {data.length > 12 && (
            <Text style={{ fontSize: sf(9), color: PALETTE.grey400, fontFamily: FONTS.muktaMalar.regular }}>
              +{data.length - 12}
            </Text>
          )}
        </View>
      )} */}

            {/* ── Counter top-right ─────────────────────────────────────────────────── */}
            {/* <View style={screenSt.counter}>
        <Text style={[screenSt.counterText, { fontSize: sf(11) }]}>
          {curIndex + 1} / {data.length}
        </Text>
      </View> */}

        </View>
    );
}

// ─── Page / Card styles ───────────────────────────────────────────────────────
const pageSt = StyleSheet.create({

    // Full screen height wrapper — snapToInterval snaps to exactly this
    page: {
        height: SCREEN_HEIGHT,
        backgroundColor: PALETTE.grey200,
        paddingHorizontal: s(16),
        // paddingTop:       vs(16),
        // paddingBottom:    vs(16),
        justifyContent: 'center',
        bottom: ms(50)
    },

    // Floating card — not full width, rounded corners
    card: {
        backgroundColor: PALETTE.white,
        borderRadius: s(16),
        overflow: 'hidden',   // clips image corners + inset circle
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
    },

    // Image — height kept, overflow handled by card
    imageContainer: {
        width: '100%',
        height: vs(210),
        overflow: 'hidden',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },

    // Circular inset — top-right, clipped by imageContainer
    insetWrapper: {
        position: 'absolute',
        top: s(10),
        right: s(10),
        width: s(80),
        height: s(80),
        borderRadius: s(40),
        borderWidth: 3,
        borderColor: PALETTE.white,
        overflow: 'hidden',
    },
    insetImage: {
        width: '100%',
        height: '100%',
    },

    // White content area
    contentCard: {
        backgroundColor: PALETTE.white,
        paddingHorizontal: s(14),
        paddingTop: vs(14),
        paddingBottom: vs(12),
    },

    title: {
        fontFamily: FONTS.muktaMalar.bold,
        color: PALETTE.grey800,
        marginBottom: vs(8),
    },

    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: vs(10),
    },
    metaRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap:ms(20)
     },
    catPill: {
        borderWidth: 1,
        borderColor: PALETTE.grey400,
        borderRadius: s(4),
        paddingHorizontal: s(10),
        paddingVertical: vs(2),
    },
    catText: {
        fontFamily: FONTS.muktaMalar.medium,
        color: PALETTE.grey600,
    },
    agoText: {
        fontFamily: FONTS.muktaMalar.regular,
        color: PALETTE.grey600,
    },

    desc: {
        fontFamily: FONTS.muktaMalar.regular,
        color: PALETTE.grey700,
        marginBottom: vs(10),
    },

    // Bottom bar
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: PALETTE.grey200,
        paddingTop: vs(10),
        marginTop: vs(4),
    },
    shareBtn: { padding: s(4) },
    swipeHint: { alignItems: 'center', justifyContent: 'center' },
    swipeText: {
        fontFamily: FONTS.muktaMalar.regular,
        color: PALETTE.grey500,
        marginTop: vs(2),
    },
    detailBtn: {
        borderWidth: 1,
        borderColor: PALETTE.primary,
        borderRadius: s(6),
        paddingHorizontal: s(14),
        paddingVertical: vs(7),
    },
    detailBtnText: {
        fontFamily: FONTS.muktaMalar.medium,
        color: PALETTE.primary,
    },
});

// ─── Screen styles ────────────────────────────────────────────────────────────
const screenSt = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: PALETTE.grey200,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: PALETTE.white,
        paddingHorizontal: s(14),
        paddingVertical: vs(10),
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.grey200,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
    },
    logo: {
        width: s(120),
        height: vs(30),
    },
    headerTitle: {
        fontFamily: FONTS.muktaMalar.bold,
        color: PALETTE.grey800,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: vs(12),
    },
    retryBtn: {
        borderWidth: 1,
        borderColor: PALETTE.primary,
        borderRadius: s(6),
        paddingHorizontal: s(20),
        paddingVertical: vs(8),
    },
    // Counter badge — shown inside the page area, positioned absolute
    counter: {
        position: 'absolute',
        top: vs(70),
        right: s(24),
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderRadius: s(10),
        paddingHorizontal: s(8),
        paddingVertical: vs(2),
        zIndex: 10,
    },
    counterText: {
        fontFamily: FONTS.muktaMalar.regular,
        color: PALETTE.white,
    },
    // Right-side dot indicators
    dots: {
        position: 'absolute',
        right: s(6),
        top: '50%',
        transform: [{ translateY: -vs(60) }],
        alignItems: 'center',
        gap: vs(5),
        zIndex: 10,
    },
    dot: {
        width: s(5),
        height: s(5),
        borderRadius: s(3),
        backgroundColor: PALETTE.grey400,
    },
    dotActive: {
        width: s(7),
        height: s(18),
        borderRadius: s(4),
        backgroundColor: PALETTE.primary,
    },
});