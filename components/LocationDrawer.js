import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../utils/constants';
import { s, vs } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import { mainApi, API_ENDPOINTS } from '../config/api';
import { useFontSize } from '../context/FontSizeContext';

const SCREEN_H = Dimensions.get('window').height;

// ─── Palette ──────────────────────────────────────────────────────────────────
const P = {
  primary: '#096dd2',
  grey800: '#212B36',
  white:   '#FFFFFF',
  overlay: 'rgba(0,0,0,0.45)',
};

// ─── Fallback districts ───────────────────────────────────────────────────────
const FALLBACK = [
  { title: 'அரியலூர்',       id: 'ariyalur' },
  { title: 'செங்கல்பட்டு',   id: 'chengalpattu' },
  { title: 'சென்னை',         id: 'chennai' },
  { title: 'கோயம்புத்தூர்',  id: 'coimbatore' },
  { title: 'கடலூர்',         id: 'cuddalore' },
  { title: 'தர்மபுரி',       id: 'dharmapuri' },
  { title: 'திண்டுக்கல்',    id: 'dindigul' },
  { title: 'ஈரோடு',          id: 'erode' },
  { title: 'கள்ளக்குறிச்சி', id: 'kallakurichi' },
  { title: 'காஞ்சிபுரம்',    id: 'kanchipuram' },
  { title: 'கரூர்',          id: 'karur' },
  { title: 'கிருஷ்ணகிரி',    id: 'krishnagiri' },
  { title: 'மதுரை',          id: 'madurai' },
  { title: 'மயிலாடுதுறை',    id: 'mayiladuthurai' },
  { title: 'நாகப்பட்டினம்',  id: 'nagapattinam' },
  { title: 'கன்னியாகுமரி',   id: 'kanniyakumari' },
  { title: 'நாமக்கல்',       id: 'namakkal' },
  { title: 'நீலகிரி',        id: 'nilgiris' },
  { title: 'பெரம்பலூர்',     id: 'perambalur' },
  { title: 'புதுக்கோட்டை',   id: 'pudukkottai' },
  { title: 'ராணிப்பேட்டை',   id: 'ranipet' },
  { title: 'ராமநாதபுரம்',    id: 'ramanathapuram' },
  { title: 'சேலம்',          id: 'salem' },
  { title: 'சிவகங்கை',       id: 'sivaganga' },
  { title: 'தஞ்சாவூர்',      id: 'thanjavur' },
  { title: 'தேனி',           id: 'theni' },
  { title: 'தென்காசி',       id: 'tenkasi' },
  { title: 'திருவாரூர்',     id: 'thiruvarur' },
  { title: 'திருச்சி',       id: 'trichy' },
  { title: 'திருநெல்வேலி',   id: 'tirunelveli' },
  { title: 'திருப்பத்தூர்',  id: 'tirupathur' },
  { title: 'திருப்பூர்',     id: 'tiruppur' },
  { title: 'திருவண்ணாமலை',   id: 'tiruvannamalai' },
  { title: 'திருவள்ளூர்',    id: 'tiruvallur' },
  { title: 'தூத்துக்குடி',   id: 'tuticorin' },
  { title: 'வேலூர்',         id: 'vellore' },
  { title: 'விழுப்புரம்',    id: 'viluppuram' },
  { title: 'விருதுநகர்',     id: 'virudhunagar' },
];

function LocationDrawer({ isVisible, onClose, onSelectDistrict, selectedDistrict }) {
  const { sf } = useFontSize();
  const [districts, setDistricts] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!isVisible) return;
    setLoading(true);
    mainApi.get(API_ENDPOINTS.MENU)
      .then(res => {
        const menu2        = res.data?.menu2 || [];
        const districtMenu = menu2.find(m => m.id === 'district');
        const list         = districtMenu?.sub || [];
        setDistricts(list.length > 0 ? list : FALLBACK);
      })
      .catch(() => setDistricts(FALLBACK))
      .finally(() => setLoading(false));
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <View style={st.overlay}>
      {/* Backdrop */}
      <TouchableOpacity style={st.backdrop} onPress={onClose} activeOpacity={1} />

      {/* Panel */}
      <View style={st.panel}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <View style={st.header}>
          <Text style={st.headerTitle}>உள்ளூர் செய்திகள்</Text>
          <TouchableOpacity onPress={onClose} style={st.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={s(26)} color={P.grey800} />
          </TouchableOpacity>
        </View>

        {/* ── List ─────────────────────────────────────────────────────── */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color={P.primary}
            style={{ marginTop: vs(60) }}
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {districts.map((district, i) => {
              const isActive = selectedDistrict === district.title;
              return (
                <TouchableOpacity
                  key={`${district.id || i}-${district.title}`}
                  style={[st.item, isActive && st.itemActive]}
                  onPress={() => { onSelectDistrict(district.title); onClose(); }}
                  activeOpacity={0.6}
                >
                  {/* Large filled blue location pin — matches screenshot */}
                  <Ionicons
                    name="location"
                    size={s(20)}
                    color={P.primary}
                    style={st.pin}
                  />
                  <Text style={[st.itemText, isActive && st.itemTextActive]}>
                    {district.title}
                  </Text>
                  {isActive && (
                    <Ionicons name="checkmark" size={s(20)} color={P.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
            {/* Bottom padding */}
            <View style={{ height: vs(40) }} />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

export default LocationDrawer;

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({

  overlay: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    bottom:          0,
    backgroundColor: P.overlay,
    zIndex:          9999,
    elevation:       9999,
    flexDirection:   'row',
  },

  backdrop: {
    flex: 1,
  },

  // White panel — right side, ~75% width matches screenshot
  panel: {
    width:           '75%',
    height:          '100%',
    backgroundColor: P.white,
    shadowColor:     '#000',
    shadowOffset:    { width: -4, height: 0 },
    shadowOpacity:   0.18,
    shadowRadius:    12,
    elevation:       20,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: s(20),
    paddingTop:       Platform.OS === 'android' ? vs(22) : vs(58),
    paddingBottom:    vs(20),
  },

  // Blue bold title — matches screenshot exactly
  headerTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize:   ms(20),               // large — matches screenshot
    color:      P.primary,            // blue
    flex:       1,
  },

  closeBtn: {
    padding: s(4),
  },

  // ── Each district row ────────────────────────────────────────────────────────
  // Very spacious rows — matches screenshot's generous row height
  item: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: s(12),
    paddingVertical:   vs(7),        // tall rows — matches screenshot
    backgroundColor:   P.white,
  },

  itemActive: {
    backgroundColor: '#EBF3FF',
  },

  // Big pin icon with right margin
  pin: {
    marginRight: s(10),
  },

  // Large district text — matches screenshot font size
  itemText: {
    flex:       1,
    fontFamily: FONTS.muktaMalar.semibold,
    fontSize:   ms(15),               // large — matches screenshot
    color:      P.grey800,            // #212B36 dark
    // lineHeight: ms(26),
  },

  itemTextActive: {
    fontFamily: FONTS.muktaMalar.bold,
    color:      P.primary,
  },
});