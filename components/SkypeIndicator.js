import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const SkypeIndicator = ({ 
  color = '#ffffff', 
  count = 5, 
  size = 40, 
  minScale = 0.2, 
  maxScale = 1.0 
}) => {
  const animations = useRef(
    Array(count)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const createAnimation = (anim, delay) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.timing(anim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        )
      ]);
    };

    animations.forEach((anim, index) => {
      createAnimation(anim, index * 200).start();
    });

    return () => {
      animations.forEach(anim => anim.stopAnimation());
    };
  }, [animations]);

  const dots = Array(count).fill(0).map((_, index) => {
    const scale = animations[index].interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [minScale, maxScale, minScale],
    });

    const opacity = animations[index].interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 1, 0.3],
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.dot,
          {
            width: size / 4,
            height: size / 4,
            borderRadius: size / 8,
            backgroundColor: color,
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
    );
  });

  return <View style={styles.container}>{dots}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    marginHorizontal: 2,
  },
});

export default SkypeIndicator;
