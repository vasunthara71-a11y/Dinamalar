import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ms, vs } from '../utils/scaling';
import { PALETTE } from '../utils/constants';

const VideoSkeletonLoader = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.card}>
          {/* Image skeleton */}
          <View style={styles.imageSkeleton}>
            <View style={styles.playButtonSkeleton} />
          </View>
          
          {/* Content skeleton */}
          <View style={styles.content}>
            <View style={styles.titleSkeleton} />
            <View style={styles.metaRow}>
              <View style={[styles.pillSkeleton, { width: ms(60) }]} />
              <View style={[styles.timeSkeleton, { width: ms(40) }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: ms(12),
    paddingVertical: vs(8),
  },
  card: {
    backgroundColor: '#fff',
    marginBottom: vs(12),
    borderRadius: ms(8),
    overflow: 'hidden',
  },
  imageSkeleton: {
    height: ms(200),
    backgroundColor: PALETTE.grey200,
    position: 'relative',
  },
  playButtonSkeleton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -ms(18) }, { translateY: -ms(18) }],
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: PALETTE.grey300,
  },
  content: {
    padding: ms(12),
  },
  titleSkeleton: {
    height: vs(16),
    backgroundColor: PALETTE.grey200,
    borderRadius: ms(4),
    marginBottom: vs(8),
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillSkeleton: {
    height: vs(20),
    backgroundColor: PALETTE.grey200,
    borderRadius: ms(10),
  },
  timeSkeleton: {
    height: vs(12),
    backgroundColor: PALETTE.grey200,
    borderRadius: ms(4),
  },
});

export default VideoSkeletonLoader;
