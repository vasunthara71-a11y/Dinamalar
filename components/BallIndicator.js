import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const BallIndicator = ({ 
  color = '#ffffff', 
  count = 8, 
  size = 10, 
  duration = 1000 
}) => {
  const animations = useRef(
    Array(count)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const createAnimation = (anim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    animations.forEach((anim, index) => {
      createAnimation(anim, (index * duration) / count).start();
    });

    return () => {
      animations.forEach(anim => anim.stopAnimation());
    };
  }, [animations, count, duration]);

  const balls = Array(count).fill(0).map((_, index) => {
    const scale = animations[index].interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.5, 1],
    });

    const opacity = animations[index].interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 1, 0.3],
    });

    const angle = (index * 360) / count;
    const radius = size * 2;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;

    return (
      <Animated.View
        key={index}
        style={[
          styles.ball,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [
              { translateX: x },
              { translateY: y },
              { scale },
            ],
            opacity,
          },
        ]}
      />
    );
  });

  return <View style={styles.container}>{balls}</View>;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 80,
  },
  ball: {
    position: 'absolute',
  },
});

export default BallIndicator;
