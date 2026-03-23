import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';
import { scaledSizes, s, vs } from '../utils/scaling';

const HomeListHeader = ({ title, showViewAll = false, onViewAllPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {showViewAll && (
        <Text style={styles.viewAllText} onPress={onViewAllPress}>
          அனைத்தும்
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(12),
    paddingVertical: s(12),
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: scaledSizes.font.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  viewAllText: {
    fontSize: scaledSizes.font.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default HomeListHeader;
