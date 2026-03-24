// JoshiyamSection.js  — FIXED VERSION
// Correctly shows the selected rasi's description + matching image

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ms, s, vs } from '../utils/scaling';
import { FONTS } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';

// ── Palette ──────────────────────────────────────────────────────────────────
const PALETTE = {
    primary: '#096dd2',
    grey100: '#F9FAFB',
    grey200: '#F4F6F8',
    grey300: '#DFE3E8',
    grey500: '#919EAB',
    grey600: '#637381',
    grey800: '#212B36',
    white: '#FFFFFF',
};

// ── 12 Rasi definitions ───────────────────────────────────────────────────────
const RASI_LIST = [
    { id: 1, ta: 'மேஷம்', en: 'Mesham' },
    { id: 2, ta: 'ரிஷபம்', en: 'Rishabam' },
    { id: 3, ta: 'மிதுனம்', en: 'Mithunam' },
    { id: 4, ta: 'கடகம்', en: 'Kadagam' },
    { id: 5, ta: 'சிம்மம்', en: 'Simmam' },
    { id: 6, ta: 'கன்னி', en: 'Kanni' },
    { id: 7, ta: 'துலாம்', en: 'Thulam' },
    { id: 8, ta: 'விருச்சிகம்', en: 'Viruchigam' },
    { id: 9, ta: 'தனுசு', en: 'Thanusu' },
    { id: 10, ta: 'மகரம்', en: 'Makaram' },
    { id: 11, ta: 'கும்பம்', en: 'Kumbam' },
    { id: 12, ta: 'மீனம்', en: 'Meenam' },
];

// ── Per-rasi CDN thumbnail images ─────────────────────────────────────────────
// Each rasi has its OWN image — never use the API image which is always Mesham
const RASI_IMAGES = {
    1: 'https://images.dinamalar.com/data/rasi/rasi_1_L.jpg',
    2: 'https://images.dinamalar.com/data/rasi/rasi_2_L.jpg',
    3: 'https://images.dinamalar.com/data/rasi/rasi_3_L.jpg',
    4: 'https://images.dinamalar.com/data/rasi/rasi_4_L.jpg',
    5: 'https://images.dinamalar.com/data/rasi/rasi_5_L.jpg',
    6: 'https://images.dinamalar.com/data/rasi/rasi_6_L.jpg',
    7: 'https://images.dinamalar.com/data/rasi/rasi_7_L.jpg',
    8: 'https://images.dinamalar.com/data/rasi/rasi_8_L.jpg',
    9: 'https://images.dinamalar.com/data/rasi/rasi_9_L.jpg',
    10: 'https://images.dinamalar.com/data/rasi/rasi_10_L.jpg',
    11: 'https://images.dinamalar.com/data/rasi/rasi_11_L.jpg',
    12: 'https://images.dinamalar.com/data/rasi/rasi_12_L.jpg',
};

// ── 2-column grid menu ────────────────────────────────────────────────────────
const JOSHI_MENU = [
    {
        title: 'வார ராசிபலன்',
        img: 'https://images.dinamalar.com/2024/weekly-rasi.jpg',
        screen: 'CommonSectionScreen',
        params: { 
            screenTitle: 'ஜோசியம்',
            apiEndpoint: '/joshiyam',
            allTabLink: '/joshiyam',
            initialTabId: 'weeklyrasi' 
        },
    },
    {
        title: 'மாத ராசி பலன்',
        img: 'https://images.dinamalar.com/2024/monthly-rasi.jpg',
        screen: 'CommonSectionScreen',
        params: { 
            screenTitle: 'ஜோசியம்',
            apiEndpoint: '/joshiyam',
            allTabLink: '/joshiyam',
            initialTabId: 'monthlyrasipplan' 
        },
    },
];

// ── Bullet links ──────────────────────────────────────────────────────────────
const BULLET_ITEMS = [
    { 
        title: 'குருபெயர்ச்சி பலன்கள்', 
        screen: 'CommonSectionScreen', 
        params: { 
            screenTitle: 'ஜோசியம்',
            apiEndpoint: '/joshiyam',
            allTabLink: '/joshiyam',
            initialTabId: 'guru_pairchi_palangal' 
        } 
    },
    
];

// ── Extract selected rasi text from combined API description ──────────────────
// The API description field contains ALL 12 rasi texts in sequence.
// e.g. "மேஷம் அசுவினி: ... பரணி: ... கார்த்திகை 1: ... ரிஷபம் கார்த்திகை 2: ..."
// We find the block starting at selectedRasi.ta and ending before the next rasi name.
function extractRasiDescription(fullText = '', selectedRasi) {
    if (!fullText) return '';

    // Remove HTML tags
    const clean = fullText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Find start of selected rasi section
    const startIdx = clean.indexOf(selectedRasi.ta);
    if (startIdx === -1) return clean.slice(0, 300); // fallback

    // Find where the NEXT rasi starts to know where to cut off
    let endIdx = clean.length;
    for (const rasi of RASI_LIST) {
        if (rasi.id === selectedRasi.id) continue;
        // Look for next rasi name AFTER our start position
        const nextIdx = clean.indexOf(rasi.ta, startIdx + selectedRasi.ta.length + 10);
        if (nextIdx !== -1 && nextIdx < endIdx) {
            endIdx = nextIdx;
        }
    }

    return clean.slice(startIdx, endIdx).trim();
}

// ── Play Icon ─────────────────────────────────────────────────────────────────
const PlayIcon = () => (
    <View style={jSt.playCircle}>
        <View style={jSt.playTriangle} />
    </View>
);

// ── Rasi Dropdown Modal ───────────────────────────────────────────────────────
function RasiDropdown({ selected, onSelect }) {
    const [open, setOpen] = useState(false);
    const { sf } = useFontSize();

    return (
        <View style={jSt.dropdownWrapper}>
            {/* Trigger button */}
            <TouchableOpacity
                style={jSt.dropdownBtn}
                onPress={() => setOpen(true)}
                activeOpacity={0.85}
            >
                <Text style={[jSt.dropdownBtnText, { fontSize: sf(14) }]}>
                    {selected.ta}
                </Text>
                <Ionicons name="chevron-down" size={s(16)} color={PALETTE.grey600} />
            </TouchableOpacity>

            {/* Modal list */}
            <Modal
                visible={open}
                transparent
                animationType="fade"
                onRequestClose={() => setOpen(false)}
            >
                <TouchableOpacity
                    style={jSt.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setOpen(false)}
                >
                    <View style={jSt.dropdownList}>
                        <FlatList
                            data={RASI_LIST}
                            keyExtractor={(r) => String(r.id)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        jSt.dropdownItem,
                                        item.id === selected.id && jSt.dropdownItemActive,
                                    ]}
                                    onPress={() => {
                                        onSelect(item);  // ← update selected rasi
                                        setOpen(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            jSt.dropdownItemText,
                                            { fontSize: sf(14) },
                                            item.id === selected.id && jSt.dropdownItemTextActive,
                                        ]}
                                    >
                                        {item.ta}
                                    </Text>
                                    {item.id === selected.id && (
                                        <Ionicons name="checkmark" size={s(16)} color={PALETTE.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function JoshiyamSection({ josiyamData, onSeeMore }) {
    const navigation = useNavigation();
    const { sf } = useFontSize();

    // Selected rasi state — starts at மேஷம்
    const [selectedRasi, setSelectedRasi] = useState(RASI_LIST[0]);

    // ── Pull the latest today-rasi item from API ────────────────────────────
    // josiyamData.data[] contains sections; the one with items having `description`
    // is the today-rasi section (index 2 in the sample JSON).
    const latestRasiItem = useMemo(() => {
        if (!josiyamData?.data) return null;
        for (const section of josiyamData.data) {
            if (
                Array.isArray(section.data) &&
                section.data.length > 0 &&
                (section.data[0]?.description || section.data[0]?.newstitle)
            ) {
                return section.data[0]; // most recent
            }
        }
        return null;
    }, [josiyamData]);

    // ── Description: extract ONLY the selected rasi's portion ──────────────
    // KEY FIX: use extractRasiDescription so changing dropdown shows correct text
    const rasiDescription = useMemo(() => {
        const raw = latestRasiItem?.description || latestRasiItem?.newstitle || '';

        // ADD THIS DEBUG LOG
        console.log('RAW API TEXT:', raw.slice(0, 200));
        console.log('SELECTED RASI:', selectedRasi.ta);
        console.log('FOUND AT INDEX:', raw.indexOf(selectedRasi.ta));

        return extractRasiDescription(raw, selectedRasi);
    }, [latestRasiItem, selectedRasi]);

    const ago = latestRasiItem?.ago || latestRasiItem?.standarddate || '';

    // ── Image: ALWAYS use the per-rasi static image (API image is always Mesham)
    // KEY FIX: use RASI_IMAGES[selectedRasi.id] not the API item's images field
    const rasiImage = RASI_IMAGES[selectedRasi.id];

    return (
        <View style={jSt.container}>

            {/* ── Section Header ──────────────────────────────────────────────── */}
            <View style={jSt.sectionHeader}>
                <Text style={[jSt.sectionTitle, { fontSize: sf(18) }]}>ஜோசியம்</Text>
                <View style={jSt.sectionUnderline} />
            </View>

            {/* ── Rasi Selector Row ───────────────────────────────────────────── */}
            <View style={jSt.rasiSelectorRow}>
                <Text style={[jSt.rasiLabel, { fontSize: sf(14) }]}>
                    இன்றைய ராசிபலன் :
                </Text>
                <RasiDropdown
                    selected={selectedRasi}
                    onSelect={(rasi) => setSelectedRasi(rasi)}  // ← update state
                />
            </View>

            {/* ── Rasi Description (only selected rasi's text) ────────────────── */}
            {!!rasiDescription && (
                <Text
                    style={[jSt.descriptionText, { fontSize: sf(14), lineHeight: sf(22) }]}
                >
                    {rasiDescription}
                </Text>
            )}

            {/* ── Ago ─────────────────────────────────────────────────────────── */}
            {!!ago && (
                <Text style={[jSt.agoText, { fontSize: sf(13) }]}>{ago}</Text>
            )}

            {/* ── Rasi Image / Video Card ─────────────────────────────────────── */}
            <TouchableOpacity
                style={jSt.videoCard}
                onPress={() =>
                    navigation?.navigate('CommonSectionScreen', {
                        rasiId: selectedRasi.id,
                        rasiName: selectedRasi.ta,
                    })
                }
                activeOpacity={0.9}
            >
                {/* KEY: key={selectedRasi.id} forces Image to reload when rasi changes */}
                <Image
                    key={selectedRasi.id}
                    source={{ uri: rasiImage }}
                    style={jSt.videoImage}
                    resizeMode="contain"
                />
                <View style={jSt.playOverlay}>
                    <PlayIcon />
                </View>
            </TouchableOpacity>

            {/* ── 2-column grid (வார + மாத ராசிபலன்) ─────────────────────────── */}
            <View style={jSt.menuGrid}>
                {JOSHI_MENU.map((menuItem, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={jSt.menuCard}
                        onPress={() => navigation?.navigate(menuItem.screen, menuItem.params)}
                        activeOpacity={0.85}
                    >
                        <Image
                            source={{ uri: menuItem.img }}
                            style={jSt.menuCardImage}
                            resizeMode="contain"
                        />
                        <Text style={[jSt.menuCardTitle, { fontSize: sf(13) }]}>
                            {menuItem.title}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── Bullet links ────────────────────────────────────────────────── */}
            <View style={jSt.bulletList}>
                {BULLET_ITEMS.map((item, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={jSt.bulletRow}
                        onPress={() => navigation?.navigate(item.screen, item.params)}
                        activeOpacity={0.8}
                    >
                        <View style={jSt.bullet} />
                        <Text style={[jSt.bulletText, { fontSize: sf(14) }]}>
                            {item.title}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── See More ────────────────────────────────────────────────────── */}
            {/* <TouchableOpacity
                style={jSt.seeMoreRow}
                onPress={onSeeMore}
                activeOpacity={0.8}
            >
                <Text style={[jSt.seeMoreText, { fontSize: sf(14) }]}>
                    மேலும் ஜோசியம் &gt;
                </Text>
            </TouchableOpacity> */}

            <View style={jSt.bottomDivider} />
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const jSt = StyleSheet.create({
    container: {
        backgroundColor: PALETTE.white,
        marginBottom: vs(8),
    },

    sectionHeader: {
        paddingHorizontal: s(12),
        paddingTop: vs(14),
        paddingBottom: vs(6),
    },
    sectionTitle: {
        fontFamily: FONTS.muktaMalar.bold,
        color: PALETTE.grey800,
    },
    sectionUnderline: {
        height: vs(3),
        width: s(40),
        backgroundColor: PALETTE.primary,
        marginTop: vs(2),
    },

    rasiSelectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: s(12),
        paddingVertical: vs(10),
        gap: s(10),
    },
    rasiLabel: {
        fontFamily: FONTS.muktaMalar.regular,
        color: PALETTE.grey800,
    },

    dropdownWrapper: {
        flex: 1,
        maxWidth: s(180),
    },
    dropdownBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: PALETTE.grey300,
        borderRadius: s(4),
        paddingHorizontal: s(12),
        paddingVertical: vs(7),
        backgroundColor: PALETTE.white,
    },
    dropdownBtnText: {
        fontFamily: FONTS.muktaMalar.regular,
        color: PALETTE.grey800,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownList: {
        backgroundColor: PALETTE.white,
        borderRadius: s(8),
        width: s(220),
        maxHeight: vs(360),
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: vs(4) },
        shadowOpacity: 0.2,
        shadowRadius: s(8),
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: s(16),
        paddingVertical: vs(11),
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.grey200,
    },
    dropdownItemActive: {
        backgroundColor: '#EBF4FF',
    },
    dropdownItemText: {
        fontFamily: FONTS.muktaMalar.regular,
        color: PALETTE.grey800,
    },
    dropdownItemTextActive: {
        fontFamily: FONTS.muktaMalar.bold,
        color: PALETTE.primary,
    },

    descriptionText: {
        fontFamily: FONTS.muktaMalar.regular,
        color: PALETTE.grey800,
        paddingHorizontal: s(12),
        paddingBottom: vs(4),
    },
    agoText: {
        fontFamily: FONTS.muktaMalar.regular,
        color: PALETTE.grey500,
        paddingHorizontal: s(12),
        paddingBottom: vs(10),
    },

    videoCard: {
        marginHorizontal: s(12),
        marginBottom: vs(14),
        backgroundColor: PALETTE.grey200,
    },
    videoImage: {
        width: '100%',
        height: vs(160),
    },
    playOverlay: {
        position: 'absolute',
        bottom: s(10),
        left: s(10),
    },
    playCircle: {
        width: s(44),
        height: s(44),
        borderRadius: s(22),
        backgroundColor: 'rgba(9,109,210,0.88)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: s(3),
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.65)',
    },
    playTriangle: {
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: '#fff',
        borderTopWidth: s(9),
        borderBottomWidth: s(9),
        borderLeftWidth: s(15),
        marginLeft: s(2),
    },

    menuGrid: {
        flexDirection: 'row',
        paddingHorizontal: s(12),
        gap: s(10),
        marginBottom: vs(14),
    },
    menuCard: {
        flex: 1,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: PALETTE.grey300,
        backgroundColor: PALETTE.grey100,
    },
    menuCardImage: {
        width: '100%',
        height: vs(80),
        backgroundColor: PALETTE.grey200,
    },
    menuCardTitle: {
        fontFamily: FONTS.muktaMalar.regular,
        color: PALETTE.grey800,
        textAlign: 'center',
        paddingVertical: vs(8),
        paddingHorizontal: s(4),
    },

    bulletList: {
        paddingHorizontal: s(12),
        marginBottom: vs(4),
     },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vs(9),
        gap: s(10),
         paddingHorizontal:ms(14),
         backgroundColor:PALETTE.grey200
    },
    bullet: {
        width: s(8),
        height: s(8),
        borderRadius: s(4),
        backgroundColor: PALETTE.primary,
    },
    bulletText: {
        fontFamily: FONTS.muktaMalar.semibold,
        color: PALETTE.grey800,
    },

    seeMoreRow: {
        alignItems: 'flex-end',
        paddingHorizontal: s(12),
        paddingVertical: vs(10),
    },
    seeMoreText: {
        fontFamily: FONTS.muktaMalar.bold,
        color: PALETTE.primary,
        textDecorationLine: 'underline',
    },

    bottomDivider: {
        height: vs(6),
        backgroundColor: PALETTE.grey200,
    },
});