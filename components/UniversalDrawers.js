import React from 'react';
import DrawerMenu from './DrawerMenu';
import LocationDrawer from './LocationDrawer';

// ─── Universal Drawers Wrapper Component ───────────────────────────────────────
export default function UniversalDrawers({ 
  isDrawerVisible,
  setIsDrawerVisible,
  isLocationDrawerVisible,
  setIsLocationDrawerVisible,
  handleMenuPress,
  navigation,
  handleSelectDistrict,
  selectedDistrict,
  children
}) {
  return (
    <>
      {children}
      
      <DrawerMenu
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        onMenuPress={handleMenuPress}
        navigation={navigation}
      />
      
      <LocationDrawer
        isVisible={isLocationDrawerVisible}
        onClose={() => setIsLocationDrawerVisible(false)}
        onSelectDistrict={handleSelectDistrict}
        selectedDistrict={selectedDistrict}
      />
    </>
  );
}
