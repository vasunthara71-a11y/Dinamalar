import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { useFontSize } from '../context/FontSizeContext';
import { ms, s, vs } from 'react-native-size-matters';
import { FONTS } from '../utils/fonts';
import { COLORS } from '../utils/constants';
import { useNavigation } from '@react-navigation/native';

// --- Palette ------------------------------------------------------------------
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

const KuralAmutham = ({ onSeeMore, title }) => {
    const navigation = useNavigation();

    const [kural, setKural] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);

    const { sf } = useFontSize();

    useEffect(() => {
        fetchKural();
    }, []);

    const fetchKural = async () => {
        try {
            const res = await fetch('https://api-st-cdn.dinamalar.com/home');
            const data = await res.json();
            const kuralSection = data?.kural?.[0];
            const item = kuralSection?.data?.[0];
            if (!kuralSection || !item) {
                setError(true);
                return;
            }
            setKural({ section: kuralSection, item });
        } catch (e) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const parseKuralText = (txt = '') =>
        txt.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');

    const handleLink = () => {
        const kuralId = kural?.item?.kural_id;
        const sectionId = kural?.section?.id || '22'; // Default section ID from HTML example
        navigation?.navigate('GenericWebViewScreen', {
            url: `https://or-staging-kalvimalar.dinamalar.com/thirukkural/${sectionId}/${kuralId}`,
            title: 'திருக்குறள்'

        });

    };

    if (loading) {
        return (
            <View style={styles.card}>
                <ActivityIndicator size="small" color="#e63946" style={{ padding: 20 }} />
            </View>
        );
    }

    if (error || !kural) {
        return (
            <View style={styles.card}>
                <Text style={styles.errorText}>தகவல் ஏற்றுவதில் பிழை.</Text>
            </View>
        );
    }

    const { section, item } = kural;
    const kuralText = parseKuralText(item.kural_txt);
    const kuralNo = item.kural_No || item.kural_id;
    const vilakkam = item.kural_vilakkam_muuva || '';
    const imageUri = section.images || '';

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarFallback} />
                )}
                <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={onSeeMore}
                    activeOpacity={0.8}

                >
                    <Text style={[styles.sectionTitle, { fontSize: sf(17) }]}>{title}</Text>
                    <View style={styles.sectionUnderline} />
                    <View style={styles.greyLine} />
                </TouchableOpacity>
            </View>

            {/* Kural Text */}
            <TouchableOpacity
                style={styles.explanationBox}
                onPress={handleLink}
                activeOpacity={0.8}
                onPressIn={() => setHoveredItem('kuralText')}
                onPressOut={() => setHoveredItem(null)}
            >
                <Text style={[styles.kuralText, { color: hoveredItem === 'kuralText' ? PALETTE.primary : '#111111' }]}>{kuralText}</Text>

            </TouchableOpacity>

            {/* Kural Number */}
            <Text style={styles.kuralNo}>(குறள்எண்: {kuralNo})</Text>

            {/* Explanation Box */}
            <TouchableOpacity
                style={styles.explanationBox}
                onPress={handleLink}
                activeOpacity={0.8}
                onPressIn={() => setHoveredItem('kuralVilakkam')}
                onPressOut={() => setHoveredItem(null)}
            >
                <Text style={[styles.explanationLabel, { color: hoveredItem === 'kuralVilakkam' ? PALETTE.primary : COLORS.black }]}>குறள் விளக்கம் :</Text>
                <Text style={[styles.explanationText, { color: hoveredItem === 'kuralVilakkam' ? PALETTE.primary : COLORS.black }]}>{vilakkam}</Text>
            </TouchableOpacity>

            {/* Read More Link */}
            {/* <TouchableOpacity onPress={handleLink} activeOpacity={0.7}>
        <Text style={styles.readMore}>மேலும் படிக்க →</Text>
      </TouchableOpacity> */}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#e0e0e0',
        padding: 16,
        margin: 12,
        maxWidth: 420,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f0f0f0',
    },
    avatarFallback: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f0f0f0',
    },
    title: {
        fontSize: 15,
        fontWeight: '500',
        color: '#111111',
        marginBottom: 4,
    },
    underline: {
        height: 3,
        width: 40,
        backgroundColor: '#e63946',
        borderRadius: 2,
    },
    kuralText: {
        fontSize: ms(15),
        fontWeight: '500',
        color: '#111111',
        fontFamily: FONTS.muktaMalar.semibold,
        lineHeight: ms(18),
        marginVertical: ms(5)
    },
    sectionHeader: {
        backgroundColor: PALETTE.white,
        paddingHorizontal: s(12),
        paddingTop: vs(14),
        paddingBottom: vs(10),
    },
    sectionTitle: {
        fontFamily: FONTS.muktaMalar.bold,
        color: PALETTE.grey800,
        // marginBottom: vs(2),
    },
    sectionUnderline: {
        height: vs(3),
        width: s(40),
        backgroundColor: PALETTE.primary,

    },
    greyLine: {
        borderBottomWidth: 0.75,
        borderBottomColor: COLORS.grey300
    },
    kuralNo: {
        fontSize: s(12),
        color: '#888888',
        textAlign: 'right',
        marginVertical: ms(10),
        fontFamily: FONTS.muktaMalar.regular
    },
    explanationBox: {
        backgroundColor: '#f5f5f5',
        padding: ms(12)


    },
    explanationLabel: {
        fontSize: ms(12),
        fontWeight: '500',
        color: COLORS.black,
        marginBottom: 6,
        fontFamily: FONTS.muktaMalar.regular
    },
    explanationText: {
        fontSize: ms(12),
        color: COLORS.black,
        lineHeight: 22,
        fontFamily: FONTS.muktaMalar.regular
    },
    readMore: {
        fontSize: 12,
        color: '#1a73e8',
    },
    errorText: {
        fontSize: 13,
        color: '#888888',
        padding: 16,
        textAlign: 'center',
    },
});

export default KuralAmutham;