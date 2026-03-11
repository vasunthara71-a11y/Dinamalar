// src/components/FontSizeControl.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { s, vs } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import { useFontSize, THEME_COLORS } from '../context/FontSizeContext';

const SWATCH_ORDER = ['black', 'blue', 'brown', 'red'];

const FontSizeControl = ({ style }) => {
  const {
    currentSize,
    changeFontSize,
    availableSizes,
    themeColorId,
    changeThemeColor,
    FONT_SIZE_LABELS,
  } = useFontSize();

  const idx         = availableSizes.indexOf(currentSize);
  const canDecrease = idx > 0;
  const canIncrease = idx < availableSizes.length - 1;

  const decrease = () => { 
    if (canDecrease) changeFontSize(availableSizes[idx - 1]); 
  };
  const increase = () => { 
    if (canIncrease) changeFontSize(availableSizes[idx + 1]); 
  };

  return (
    <View style={[st.wrapper, style]}>

      {/* Label */}
      <Text style={[st.label, st.labelBase]}>
        நிறம் மற்றும் எழுத்துரு அளவு மாற்ற
      </Text>

      {/* Color swatches */}
      <View style={st.swatchRow}>
        {SWATCH_ORDER.map((colorId) => (
          <TouchableOpacity
            key={colorId}
            style={[
              st.swatch,
              { backgroundColor: THEME_COLORS[colorId] },
              themeColorId === colorId && st.swatchActive,
            ]}
            onPress={() => changeThemeColor(colorId)}
            activeOpacity={0.8}
          />
        ))}
      </View>

      {/* Divider */}
      <View style={st.divider} />

      {/* Current font size display */}

      {/* A- decrease button */}
      <TouchableOpacity
        style={[st.fontBtn, !canDecrease && st.fontBtnOff]}
        onPress={decrease}
        disabled={!canDecrease}
        activeOpacity={0.75}
      >
        <Text style={[st.btnTextDecrease, !canDecrease && st.textOff]}>
          -அ
        </Text>
      </TouchableOpacity>

      {/* A+ increase button */}
      <TouchableOpacity
        style={[st.fontBtn, !canIncrease && st.fontBtnOff]}
        onPress={increase}
        disabled={!canIncrease}
        activeOpacity={0.75}
      >
        <Text style={[st.btnTextIncrease, !canIncrease && st.textOff]}>
          {currentSize === 'huge' ? '⁺⁺அ' : '⁺அ'}
        </Text>
      </TouchableOpacity>

    </View>
  );
};

// Only layout/color/shape here — NO fontSize
const st = StyleSheet.create({
  // Static font sizes for the control panel (won't scale with user font size)
  label: {
    fontSize:   ms(12),
    color:      '#555',
    fontWeight: '400',
  },
  btnTextDecrease: {
    fontSize:   ms(14),
    fontWeight: '600',
    color:      '#333',
    lineHeight: ms(17),
  },
  btnTextIncrease: {
    fontSize:   ms(14),
    fontWeight: '700',
    color:      '#333',
    lineHeight: ms(19),
  },
  
  wrapper: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   '#f2f2f2',
    borderRadius:      ms(10),
    borderWidth:       1,
    borderColor:       '#e0e0e0',
    paddingVertical:   vs(8),
    paddingHorizontal: s(12),
    gap:               s(7),
    marginHorizontal:  s(12),
    marginVertical:    vs(6),
  },
  labelBase: {
    flexShrink:  1,
    marginRight: s(2),
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           s(5),
  },
  swatch: {
    width:        s(26),
    height:       s(26),
    borderRadius: ms(3),
  },
  swatchActive: {
    borderWidth:   2.5,
    borderColor:   '#fff',
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius:  3,
    elevation:     5,
  },
  divider: {
    width:            1,
    height:           s(26),
    backgroundColor:  '#ccc',
    marginHorizontal: s(2),
  },
  fontBtn: {
    width:           s(36),
    height:          s(36),
    borderRadius:    s(18),
    borderWidth:     1.5,
    borderColor:     '#aaa',
    justifyContent:  'center',
    alignItems:      'center',
    backgroundColor: '#fff',
  },
  fontBtnOff: {
    borderColor:     '#ddd',
    backgroundColor: '#f9f9f9',
  },
  textOff: {
    color: '#ccc',
  },
  currentSize: {
    color: '#096dd2',
    fontWeight: '700',
    marginHorizontal: s(4),
  },
});

export default FontSizeControl;