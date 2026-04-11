import React from 'react';
import { View, TouchableOpacity, Share, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { s } from '../utils/scaling';
const ShareComponent = ({ 
  shareUrl, 
  shareTitle, 
  shareText, 
  containerStyle, 
  circleStyle,
  iconSize = 15 
}) => {
  const shareButtons = [
    {
      icon: 'logo-facebook',
      bg: '#1877F2',
      onPress: () => Linking.openURL(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
      ),
    },
    {
      icon: 'logo-twitter',
      bg: '#000000',
      onPress: () => Linking.openURL(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText || shareTitle)}`
      ),
    },
    {
      icon: 'logo-whatsapp',
      bg: '#25D366',
      onPress: () => Linking.openURL(
        `whatsapp://send?text=${encodeURIComponent(`${shareText || shareTitle} ${shareUrl}`)}`
      ),
    },
    {
      icon: 'paper-plane-outline',
      bg: '#2AABEE',
      onPress: () => Linking.openURL(
        `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText || shareTitle)}`
      ),
    },
    {
      icon: 'copy-outline',
      bg: COLORS.grey || '#9CA3AF',
      onPress: async () => {
        try {
          await Share.share({ 
            message: `${shareText || shareTitle}\n${shareUrl}`,
            title: shareTitle
          });
        } catch (_) { }
      },
    },
  ];

  return (
    <View style={[styles.shareRow, containerStyle]}>
      {shareButtons.map((btn, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.shareCircle, circleStyle, { backgroundColor: btn.bg }]}
          onPress={btn.onPress}
          activeOpacity={0.8}
        >
          <Ionicons name={btn.icon} size={s(iconSize)} color="#fff" />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = {
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    justifyContent:"center"
  },
  shareCircle: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
};

export default ShareComponent;