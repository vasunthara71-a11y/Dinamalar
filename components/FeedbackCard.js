import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Svg, Path } from 'react-native-svg';
import { s, vs } from '../utils/scaling';
import { FONTS } from '../utils/constants';
import { ms } from 'react-native-size-matters';

const ArrowIcon = ({ size, color }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 24 24"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M13.22 19.03a.75.75 0 0 1 0-1.06L18.19 13H3.75a.75.75 0 0 1 0-1.5h14.44l-4.97-4.97a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l6.25 6.25a.75.75 0 0 1 0 1.06l-6.25 6.25a.75.75 0 0 1-1.06 0Z" />
  </Svg>
);

const BUTTON_SIZE = s(100);

const FeedbackCard = ({ newsId }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    const feedbackUrl = newsId ? `/feedback?page=/news/${newsId}` : '/feedback';
    navigation.navigate('FeedbackFormScreen', { page: feedbackUrl });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View style={styles.contentContainer}>

          {/* Text area — full width, centered, with right padding to avoid button overlap */}
          <View style={styles.textArea}>
            <Text style={styles.feedbackText}>
              வாசகரே! தினமலர் இணையதளம் மற்றும் செய்திகள் / கட்டுரைகள் பற்றிய{' '}
              <Text style={styles.highlightText}>ஆலோசனையை பதிவிடுங்கள்.</Text>
            </Text>
          </View>

          {/* Button — absolute bottom-right, clipped by overflow:hidden */}
         

        </View>
         <View style={styles.buttonContainer}>
            <View style={styles.arrowButton}>
              <ArrowIcon size={s(26)} color="#ffffff" />
            </View>
          </View>
      </TouchableOpacity>
    </View>
  );
};

export default FeedbackCard;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: s(16),
    paddingVertical: vs(20),
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    borderWidth: 6,
    borderColor: '#1a56c4',
    // borderRadius: s(8),
    backgroundColor: '#ffffff',
    overflow: 'hidden',            // Clips button to border radius
    position: 'relative',
  },
  textArea: {
    // Full width so text centers relative to entire box width
    width: '100%',
    paddingTop: vs(18),
    paddingBottom: vs(18),
    paddingLeft: s(16),
    paddingRight: s(16),           // Equal padding both sides — text truly centered
    marginBottom: 20,     // Push text up, leaving space for button below
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: ms(15.5),
    color: '#1a1a1a',
    lineHeight: ms(27),
    fontFamily: FONTS?.muktaMalar?.regular || 'System',
    textAlign: 'center',           // Center aligned like original
    width: '100%',
  },
  highlightText: {
    color: '#1a56c4',
    fontWeight: '600',
  },
  arrowButton: {
    position: 'absolute',
    right: 0,
    bottom: 6,
    width: 80,
    height: 50,
    backgroundColor: '#1a56c4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    right: -0,
    bottom: -25,
    borderWidth: 0.5,
    borderColor: '#1a56c4',
    width:90,
    height:65,
    alignItems: 'center',
    justifyContent: 'center',
  },
});