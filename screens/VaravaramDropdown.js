import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ms, s, vs } from 'react-native-size-matters';
import { COLORS, FONTS } from '../utils/constants';
 
const VaravaramDropdown = ({ 
  selectedYear, 
  selectedMonth, 
  selectedDate, 
  availableYears, 
  availableDates, 
  onYearChange, 
  onDateChange, 
  showYearDropdown, 
  showDateDropdown, 
  setShowYearDropdown, 
  setShowDateDropdown 
}) => {
  // ── 1. Build display label for selected date ──────────────────────────
  const months = ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச'];
  const shortMonths = ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச'];
  
  const selectedDateLabel = useMemo(() => {
    if (selectedMonth >= 0 && selectedMonth < 12) {
      return `${shortMonths[selectedMonth]} ${selectedDate}`;
    }
    return `${selectedDate} ${months[selectedMonth]} ${selectedYear}`;
  }, [selectedMonth, selectedDate, selectedYear]);

  return (
    <View style={{
      backgroundColor: '#fff',
      paddingHorizontal: s(12),
      paddingVertical: vs(8),
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
      zIndex: 999,
      elevation: 5,
    }}>
      {/* Label */}
      <Text style={{
        fontSize: ms(14),
        fontFamily: FONTS.muktaMalar.medium,
        color: '#333',
        flex: 1,
      }} numberOfLines={1}>
        முந்தைய
      </Text>

      {/* Year Dropdown */}
      <View style={{ position: 'relative' }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#aaa',
            paddingHorizontal: s(10),
            paddingVertical: vs(6),
            backgroundColor: '#fff',
            gap: s(4),
            minWidth: s(75),
            justifyContent: 'space-between',
          }}
          onPress={() => {
            setShowYearDropdown(!showYearDropdown);
            setShowDateDropdown(false);
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: ms(14), fontFamily: FONTS.muktaMalar.medium, color: '#111' }}>
            {selectedYear}
          </Text>
          <Ionicons name={showYearDropdown ? 'chevron-up' : 'chevron-down'} size={s(14)} color="#555" />
        </TouchableOpacity>

        {showYearDropdown && (
          <View style={{
            position: 'absolute',
            top: vs(34),
            left: 0,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: '#ddd',
            zIndex: 1001,
            elevation: 12,
            minWidth: s(80),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: vs(2) },
            shadowOpacity: 0.15,
            shadowRadius: s(4),
            maxHeight: vs(200),
          }}>
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              nestedScrollEnabled={true}
              style={{ maxHeight: vs(200), minHeight: vs(100) }}
            >
              {(availableYears.length > 0 ? availableYears : [new Date().getFullYear(), new Date().getFullYear() - 1]).map((year) => (
                <TouchableOpacity
                  key={year}
                  style={{
                    paddingHorizontal: s(12),
                    paddingVertical: vs(10),
                    borderBottomWidth: 1,
                    borderBottomColor: '#f0f0f0',
                    backgroundColor: year === selectedYear ? '#f0f6ff' : '#fff',
                  }}
                  onPress={() => {
                    onYearChange(year);
                    setShowYearDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                   <Text style={{
                    fontSize: ms(14),
                    color: year === selectedYear ? COLORS.primary : '#111',
                    fontFamily: FONTS.muktaMalar.medium,
                   }}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Month-Date Dropdown */}
      <View style={{ position: 'relative' }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#aaa',
            paddingHorizontal: s(10),
            paddingVertical: vs(6),
            backgroundColor: '#fff',
            gap: s(4),
            minWidth: s(90),
            justifyContent: 'space-between',
          }}
          onPress={() => {
            setShowDateDropdown(!showDateDropdown);
            setShowYearDropdown(false);
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: ms(14), fontFamily: FONTS.muktaMalar.medium, color: '#111' }}>
            {selectedDateLabel}
          </Text>
          <Ionicons name={showDateDropdown ? 'chevron-up' : 'chevron-down'} size={s(14)} color="#555" />
        </TouchableOpacity>

        {showDateDropdown && (
          <View style={{
            position: 'absolute',
            top: vs(34),
            right: 0,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: '#ddd',
            zIndex: 1001,
            elevation: 12,
            minWidth: s(150),
            maxWidth: s(200),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: vs(2) },
            shadowOpacity: 0.15,
            shadowRadius: s(4),
          }}>
            <ScrollView 
              showsVerticalScrollIndicator={true} 
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: vs(300), minHeight: vs(100) }}
            >
              {availableDates.map((dateObj, index) => (
                <TouchableOpacity
                  key={`${dateObj.month}-${dateObj.day}`}
                  style={{
                    paddingHorizontal: s(14),
                    paddingVertical: vs(12),
                    borderBottomWidth: 1,
                    borderBottomColor: '#f0f0f0',
                    backgroundColor: dateObj.isSelected ? '#f0f6ff' : '#fff',
                  }}
                  onPress={() => {
                    onDateChange(dateObj);
                    setShowDateDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                   <Text style={{
                    fontSize: ms(14),
                    color: dateObj.isSelected ? COLORS.primary : '#111',
                    fontFamily: FONTS.muktaMalar.medium,
                   }}>
                    {dateObj.display}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

export default VaravaramDropdown;
