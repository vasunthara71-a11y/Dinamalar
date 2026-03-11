import React from 'react';
import { View, StatusBar } from 'react-native';
import TopMenuStrip from './TopMenuStrip';
import DrawerMenu from './DrawerMenu';
import LocationDrawer from './LocationDrawer';

// ─── Universal Header Component ─────────────────────────────────────────────────
export default function UniversalHeaderComponent({ 
  // StatusBar props
  statusBarStyle = 'dark-content',
  statusBarBackgroundColor = '#fff',
  
  // TopMenuStrip props
  onMenuPress,
  onNotification,
  notifCount = 0,
  
  // AppHeader props (you'll need to pass the actual AppHeader component as children)
  children,
  
  // DrawerMenu props
  isDrawerVisible,
  setIsDrawerVisible,
  navigation,
  
  // LocationDrawer props
  isLocationDrawerVisible,
  setIsLocationDrawerVisible,
  onSelectDistrict,
  selectedDistrict
}) {
  return (
    <>
      <View>
        <StatusBar 
          barStyle={statusBarStyle} 
          backgroundColor={statusBarBackgroundColor} 
        />
        
        <TopMenuStrip
          onMenuPress={onMenuPress}
          onNotification={onNotification}
          notifCount={notifCount}
        />
        
        {children}
        
        <DrawerMenu
          isVisible={isDrawerVisible}
          onClose={() => setIsDrawerVisible(false)}
          onMenuPress={onMenuPress}
          navigation={navigation}
        />
      </View>
      
      <LocationDrawer
        isVisible={isLocationDrawerVisible}
        onClose={() => {
          console.log('UniversalHeaderComponent: LocationDrawer onClose called');
          setIsLocationDrawerVisible(false);
        }}
        onSelectDistrict={onSelectDistrict}
        selectedDistrict={selectedDistrict}
      />
    </>
  );
}
