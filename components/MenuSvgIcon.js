import React from 'react';
import Svg, { Circle, Rect, Line, Path, Polygon, G } from 'react-native-svg';

// ─── தினம் தினம் — calendar with horizontal text lines ───────────────────────
const DinamDinamIcon = ({ size = 20, color = '#333' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="17" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.5"/>
    <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Line x1="6" y1="13" x2="18" y2="13" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    <Line x1="6" y1="17" x2="14" y2="17" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
  </Svg>
);

// ─── ஜோசியம் — dense sunburst: small center + 8 long rays + 8 short rays ──────
const JoshiyamIcon = ({ size = 20, color = '#333' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="2.2" stroke={color} strokeWidth="1.3"/>
    {/* 4 cardinal long rays */}
    <Line x1="12" y1="2.5" x2="12" y2="6"   stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <Line x1="12" y1="18"  x2="12" y2="21.5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <Line x1="2.5" y1="12" x2="6"   y2="12"  stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <Line x1="18"  y1="12" x2="21.5" y2="12" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    {/* 4 diagonal long rays */}
    <Line x1="5.2"  y1="5.2"  x2="7.5"  y2="7.5"  stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <Line x1="16.5" y1="16.5" x2="18.8" y2="18.8" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <Line x1="18.8" y1="5.2"  x2="16.5" y2="7.5"  stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <Line x1="7.5"  y1="16.5" x2="5.2"  y2="18.8" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    {/* 8 shorter in-between rays */}
    <Line x1="12" y1="6.8"  x2="12" y2="8.2"  stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    <Line x1="12" y1="15.8" x2="12" y2="17.2" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    <Line x1="6.8"  y1="12" x2="8.2"  y2="12" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    <Line x1="15.8" y1="12" x2="17.2" y2="12" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    <Line x1="7.1"  y1="8.9"  x2="8.1"  y2="9.9"  stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    <Line x1="15.9" y1="14.1" x2="16.9" y2="15.1" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    <Line x1="16.9" y1="8.9"  x2="15.9" y2="9.9"  stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    <Line x1="8.1"  y1="14.1" x2="7.1"  y2="15.1" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
  </Svg>
);

// ─── காலண்டர் — calendar with dot grid ───────────────────────────────────────
const CalendarIcon = ({ size = 20, color = '#333' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="17" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.5"/>
    <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="7"  cy="13.5" r="1" fill={color}/>
    <Circle cx="12" cy="13.5" r="1" fill={color}/>
    <Circle cx="17" cy="13.5" r="1" fill={color}/>
    <Circle cx="7"  cy="18"   r="1" fill={color}/>
    <Circle cx="12" cy="18"   r="1" fill={color}/>
    <Circle cx="17" cy="18"   r="1" fill={color}/>
  </Svg>
);

// ─── ஆன்மிகம் — Capitol dome building with columns ───────────────────────────
const AnmegamIcon = ({ size = 20, color = '#333' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* spire */}
    <Line x1="12" y1="1.5" x2="12" y2="4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    {/* dome arc */}
    <Path d="M7 10 Q7 4 12 4 Q17 4 17 10" stroke={color} strokeWidth="1.4" fill="none"/>
    {/* horizontal band below dome */}
    <Line x1="6" y1="10" x2="18" y2="10" stroke={color} strokeWidth="1.3"/>
    {/* 3 columns */}
    <Line x1="8"  y1="10" x2="8"  y2="17" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    <Line x1="12" y1="10" x2="12" y2="17" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    <Line x1="16" y1="10" x2="16" y2="17" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    {/* upper step */}
    <Rect x="4"  y="17" width="16" height="2" stroke={color} strokeWidth="1.3" fill="none"/>
    {/* lower step / base */}
    <Rect x="2"  y="19" width="20" height="2" stroke={color} strokeWidth="1.3" fill="none"/>
  </Svg>
);

// ─── வாராவாரம் — folder with star ────────────────────────────────────────────
const VaravaramIcon = ({ size = 20, color = '#333' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 8C3 6.9 3.9 6 5 6h4l2 2h8c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V8z"
      stroke={color} strokeWidth="1.5" fill="none"
    />
    <Path
      d="M12 10.5l.7 2.1H15l-1.8 1.3.7 2.1-1.9-1.4-1.9 1.4.7-2.1L9 12.6h2.3z"
      stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round"
    />
  </Svg>
);

// ─── இணைப்பு மலர் — open hand with plant/sprout growing from palm ─────────────
// ✅ FIXED - all on one line
const MalargalIcon = ({ size = 20, color = '#333' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* palm / cupped hand shape */}
    <Path
      d="M8 14 L8 10 C8 9.4 8.4 9 9 9 L9 13 M9 9 L9 8 C9 7.4 9.4 7 10 7 L10 13 M10 7 L10 7 C10 6.4 10.4 6 11 6 L11 13 M11 6 L11 7 C11 6.4 11.4 6 12 6 L12 13 M8 14 C8 16 10 18 12 18 C14 18 16 16 16 14 L16 12 C16 11.4 15.6 11 15 11 L12 11"
      stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"
    />
    {/* stem */}
    <Line x1="11" y1="6" x2="11" y2="2" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    {/* left leaf */}
    <Path d="M11 5 Q8 4 8 1.5 Q10.5 1.5 11 4" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    {/* right leaf */}
    <Path d="M11 4 Q14 3 14 0.5 Q11.5 0.5 11 3" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
  </Svg>
);

// ─── போட்டோ — camera ──────────────────────────────────────────────────────────
const PhotoIcon = ({ size = 20, color = '#333' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
      stroke={color} strokeWidth="1.5" fill="none"
    />
    <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.5"/>
    <Circle cx="12" cy="13" r="1.5" stroke={color} strokeWidth="1"/>
  </Svg>
);

// ─── உலக தமிழர் — calendar with full grid lines ──────────────────────────────
const UlagaTamilarIcon = ({ size = 20, color = '#333' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="17" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    <Line x1="3"  y1="9"  x2="21" y2="9"  stroke={color} strokeWidth="1.5"/>
    <Line x1="8"  y1="2"  x2="8"  y2="6"  stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Line x1="16" y1="2"  x2="16" y2="6"  stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Line x1="9"  y1="9"  x2="9"  y2="21" stroke={color} strokeWidth="1"/>
    <Line x1="15" y1="9"  x2="15" y2="21" stroke={color} strokeWidth="1"/>
    <Line x1="3"  y1="14" x2="21" y2="14" stroke={color} strokeWidth="1"/>
    <Line x1="3"  y1="18" x2="21" y2="18" stroke={color} strokeWidth="1"/>
  </Svg>
);

// ─── ஸ்பெஷல் — ID card / badge with face silhouette ──────────────────────────
const SpecialIcon = ({ size = 20, color = '#333' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.5" fill="none"/>
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.4"/>
    <Path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
  </Svg>
);

// ─── கோயில்கள் — tiered gopuram temple ───────────────────────────────────────
const KovilIcon = ({ size = 20, color = '#333' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="1.5" x2="12" y2="3.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Polygon points="12,3.5 9.5,6.5 14.5,6.5" stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
    <Polygon points="12,6.5 8,10 16,10"       stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
    <Rect x="5" y="10" width="14" height="3" stroke={color} strokeWidth="1.3" fill="none"/>
    <Path d="M10 13 L10 18 Q12 20 14 18 L14 13" stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
    <Line x1="3"  y1="21" x2="21" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Line x1="5"  y1="21" x2="5"  y2="19" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    <Line x1="19" y1="21" x2="19" y2="19" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
  </Svg>
);

// ─── சினிமா — film strip ─────────────────────────────────────────────────────
const CinemaIcon = ({ size = 20, color = '#333' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    <Line x1="2"  y1="8"  x2="22" y2="8"  stroke={color} strokeWidth="1"/>
    <Line x1="2"  y1="16" x2="22" y2="16" stroke={color} strokeWidth="1"/>
    <Rect x="4.5"  y="5"  width="2" height="3" rx="0.5" stroke={color} strokeWidth="1" fill="none"/>
    <Rect x="10.5" y="5"  width="2" height="3" rx="0.5" stroke={color} strokeWidth="1" fill="none"/>
    <Rect x="16.5" y="5"  width="2" height="3" rx="0.5" stroke={color} strokeWidth="1" fill="none"/>
    <Rect x="4.5"  y="16" width="2" height="3" rx="0.5" stroke={color} strokeWidth="1" fill="none"/>
    <Rect x="10.5" y="16" width="2" height="3" rx="0.5" stroke={color} strokeWidth="1" fill="none"/>
    <Rect x="16.5" y="16" width="2" height="3" rx="0.5" stroke={color} strokeWidth="1" fill="none"/>
    <Path d="M10 10.5 L10 13.5 L14 12 Z" stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
  </Svg>
);

// ─── உள்ளூர் செய்திகள் — location pin ───────────────────────────────────────
const UlluarIcon = ({ size = 20, color = '#333' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
      stroke={color} strokeWidth="1.5" fill="none"
    />
    <Circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.4"/>
  </Svg>
);

// ─── Map — Tamil title → component ───────────────────────────────────────────
export const MENU_ICON_MAP = {
  'தினம் தினம்'        : DinamDinamIcon,
  'ஜோசியம்'           : JoshiyamIcon,
  'காலண்டர்'          : CalendarIcon,
  'ஆன்மிகம்'          : AnmegamIcon,
  'ஆன்மீகம்'          : AnmegamIcon,
  'வாராவாரம்'         : VaravaramIcon,
  'இணைப்பு மலர்'      : MalargalIcon,
  'போட்டோ'            : PhotoIcon,
  'உலக தமிழர்'        : UlagaTamilarIcon,
  'ஸ்பெஷல்'           : SpecialIcon,
  'கோயில்கள்'         : KovilIcon,
  'கோவில்கள்'         : KovilIcon,
  'சினிமா'            : CinemaIcon,
  'உள்ளூர் செய்திகள்' : UlluarIcon,
};

// ─── Drop-in helper ───────────────────────────────────────────────────────────
export const MenuSvgIcon = ({ title, size = 20, color = '#333' }) => {
  const IconComp = MENU_ICON_MAP[title];
  if (!IconComp) return null;
  return <IconComp size={size} color={color} />;
};