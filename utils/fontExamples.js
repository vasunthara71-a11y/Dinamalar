// ─── Anek Font Usage Examples ───────────────────────────────────────────────
// Import constants
import { FONTS, FONT_STYLES } from './constants';

// ─── USAGE EXAMPLES ───────────────────────────────────────────────────

// 1. Basic Anek font usage
const styles = StyleSheet.create({
  heading: {
    fontFamily: FONTS.anek.bold, // Direct access
    fontSize: 20,
    color: '#000',
  },
  
  // 2. Using shortcuts
  subtitle: {
    fontFamily: FONT_STYLES.anekBold.fontFamily, // Shortcut access
    fontSize: 16,
    color: '#333',
  },
  
  // 3. Using condensed variants
  tightHeading: {
    fontFamily: FONTS.anek.condensed.bold,
    fontSize: 18,
    color: '#000',
  },
  
  // 4. Using expanded variants
  wideHeading: {
    fontFamily: FONTS.anek.expanded.bold,
    fontSize: 18,
    color: '#000',
  },
  
  // 5. Mixed typography (Tamil + English)
  title: {
    fontFamily: FONT_STYLES.heading.fontFamily, // Anek for English headings
    fontSize: FONT_STYLES.heading.fontSize,
    color: FONT_STYLES.heading.color,
  },
  
  body: {
    fontFamily: FONT_STYLES.body.fontFamily, // MuktaMalar for Tamil text
    fontSize: FONT_STYLES.body.fontSize,
    color: FONT_STYLES.body.color,
    lineHeight: FONT_STYLES.body.lineHeight,
  },
  
  // 6. Quick shortcuts
  quickBold: {
    fontFamily: FONT_STYLES.anekBold.fontFamily, // Quick access
    fontSize: 14,
  },
  
  quickLight: {
    fontFamily: FONT_STYLES.anekLight.fontFamily, // Quick access
    fontSize: 14,
  },
});

// ─── COMPONENT EXAMPLE ───────────────────────────────────────────────────
export const TypographyExample = () => {
  return (
    <View>
      {/* English headings with Anek */}
      <Text style={styles.heading}>English Heading with Anek Bold</Text>
      <Text style={styles.subtitle}>English Subtitle with Anek Bold</Text>
      
      {/* Condensed variant for tight spaces */}
      <Text style={styles.tightHeading}>Tight Heading with Condensed</Text>
      
      {/* Expanded variant for elegant look */}
      <Text style={styles.wideHeading}>Wide Heading with Expanded</Text>
      
      {/* Mixed content */}
      <Text style={styles.title}>தமிழ் மற்றும் English Mix</Text>
      <Text style={styles.body}>
        இது தமிழ் உரை முக்கியமாக MuktaMalar எழுத்துருவைப் பயன்படுத்துகிறது. 
        This is English text with Anek font.
      </Text>
      
      {/* Quick shortcuts */}
      <Text style={styles.quickBold}>Quick Bold Text</Text>
      <Text style={styles.quickLight}>Quick Light Text</Text>
    </View>
  );
};

export default {
  styles,
  TypographyExample,
};
