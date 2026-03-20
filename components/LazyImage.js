// components/LazyImage.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { s } from '../utils/scaling';

const LazyImage = ({ 
  source, 
  style, 
  placeholder = null,
  onLoadStart,
  onLoad,
  onError,
  ...props 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const imageRef = useRef(null);

  useEffect(() => {
    // Simple intersection observer simulation
    const timer = setTimeout(() => {
      setInView(true);
    }, 100); // Small delay to prevent immediate loading

    return () => clearTimeout(timer);
  }, []);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
    onLoadStart?.();
  };

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  if (!inView) {
    return (
      <View style={[style, styles.placeholder]}>
        {placeholder}
      </View>
    );
  }

  return (
    <View style={style}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}
      
      <Image
        ref={imageRef}
        source={source}
        style={[style, error && styles.errorImage]}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {error && (
        <View style={styles.errorOverlay}>
          <View style={styles.errorPlaceholder}>
            {/* Simple error icon */}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#f5f5f5',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorImage: {
    opacity: 0.3,
  },
  errorPlaceholder: {
    width: s(40),
    height: s(40),
    backgroundColor: '#ddd',
    borderRadius: s(8),
  },
});

export default React.memo(LazyImage);
