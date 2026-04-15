import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ms,
  s,
  vs,
 
 } from 'react-native-size-matters';
import { COLORS, FONTS } from '../utils/constants';

const VaravaramComponent = ({
  apiEndpoint,
  activeTab,
  originalVaravaramNews,
  varavaramDropdownData,
  setTabNews,
  tabIsAll
}) => {
  // Varavaram dropdown state
  const [showVaravaramYearDropdown, setShowVaravaramYearDropdown] = useState(false);
  const [showVaravaramDateDropdown, setShowVaravaramDateDropdown] = useState(false);
  const [selectedVaravaramYear, setSelectedVaravaramYear] = useState(new Date().getFullYear());
  const [selectedVaravaramDate, setSelectedVaravaramDate] = useState(new Date().getDate());
  const [selectedVaravaramMonth, setSelectedVaravaramMonth] = useState(new Date().getMonth());
  const [availableYears, setAvailableYears] = useState([]);

  // Tab utilities
  const isAllTab = (tab) => !!tab?._isAllTab;

  // Handle year change for varavaram
  const handleVaravaramYearChange = useCallback((year) => {
    setSelectedVaravaramYear(year);
    console.log('[Varavaram] Year changed to:', year);
    setTimeout(() => {
      filterVaravaramNews();
    }, 100);
  }, []);

  // Handle date change for varavaram  
  const handleVaravaramDateChange = useCallback((date) => {
    setSelectedVaravaramDate(date);
    console.log('[Varavaram] Date changed to:', date);
    setTimeout(() => {
      filterVaravaramNews();
    }, 100);
  }, []);

  // Get available years
  const getAvailableYears = useCallback(() => {
    if (!originalVaravaramNews.length) return [];
    
    const yearSet = new Set();
    const currentYear = new Date().getFullYear();
    
    // Always include current year and previous year
    for (let i = currentYear; i >= currentYear - 5; i--) {
      yearSet.add(i);
    }
    
    originalVaravaramNews.forEach((item) => {
      const rawDate = item.ago || item.date || item.time_date || '';
      if (!rawDate) return;
      
      try {
        let itemDate;
        
        // Handle various date formats
        if (rawDate.includes('-')) {
          // ISO format: 2024-12-31
          itemDate = new Date(rawDate);
        } else if (rawDate.includes('/')) {
          // Format: 31/12/2024
          const parts = rawDate.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts.map(Number);
            itemDate = new Date(year, month - 1, day);
          }
        } else {
          // Try parsing as is
          itemDate = new Date(rawDate);
        }
        
        if (!isNaN(itemDate.getTime())) {
          yearSet.add(itemDate.getFullYear());
        }
      } catch (e) {
        // Skip invalid dates
      }
    });
    
    const years = Array.from(yearSet).sort((a, b) => b - a);
    setAvailableYears(years);
    return years;
  }, [originalVaravaramNews]);

  // Filter varavaram news
  const filterVaravaramNews = useCallback(() => {
    if (originalVaravaramNews.length === 0) return;
    
    console.log('[Varavaram] Filtering news for:', {
      selectedYear: selectedVaravaramYear,
      selectedMonth: selectedVaravaramMonth,
      selectedDate: selectedVaravaramDate
    });
    
    const today = new Date();
    const isDefaultSelection = selectedVaravaramYear === today.getFullYear() &&
      selectedVaravaramMonth === today.getMonth() &&
      selectedVaravaramDate === today.getDate();
    
    if (isDefaultSelection) {
      console.log('[Varavaram] Showing all items (default selection)');
      setTabNews(originalVaravaramNews);
      return;
    }
    
    const filtered = originalVaravaramNews.filter((item) => {
      const rawDate = item.ago || item.date || item.time_date || '';
      if (!rawDate) return false;
      
      try {
        let itemDate;
        
        // Handle various date formats
        if (rawDate.includes('-')) {
          // ISO format: 2024-12-31
          itemDate = new Date(rawDate);
        } else if (rawDate.includes('/')) {
          // Format: 31/12/2024
          const parts = rawDate.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts.map(Number);
            itemDate = new Date(year, month - 1, day);
          }
        } else {
          // Try parsing as is
          itemDate = new Date(rawDate);
        }
        
        if (isNaN(itemDate.getTime())) {
          return false;
        }
        
        return itemDate.getFullYear() === selectedVaravaramYear &&
          itemDate.getMonth() === selectedVaravaramMonth &&
          itemDate.getDate() === selectedVaravaramDate;
      } catch (e) {
        return false;
      }
    });
    
    console.log('[Varavaram] Filtered to', filtered.length, 'items');
    setTabNews(filtered);
  }, [originalVaravaramNews, selectedVaravaramYear, selectedVaravaramMonth, selectedVaravaramDate]);

  // Initialize available years when originalVaravaramNews changes
  useEffect(() => {
    getAvailableYears();
  }, [originalVaravaramNews, getAvailableYears]);

  // Don't render varavaram dropdown if not a varavaram endpoint
  if (!apiEndpoint?.includes('varavaram') || !activeTab?.title) {
    return null;
  }

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
    }}>
      {/* Sub-tab title label */}
      <Text style={{
        fontSize: ms(14),
        fontFamily: FONTS.muktaMalar.medium,
        color: '#333',
        flex: 1,
      }} numberOfLines={1}>
        {'\u0bae\u0bc1\u0ba8\u0bcd\u0ba4\u0bc8\u0bcd ' + (activeTab?.title || '')}
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
            paddingVertical: vs(5),
            backgroundColor: '#fff',
            gap: s(4),
            minWidth: s(75),
            justifyContent: 'space-between',
          }}
          onPress={() => {
            setShowVaravaramYearDropdown(!showVaravaramYearDropdown);
            setShowVaravaramDateDropdown(false);
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: ms(14), fontFamily: FONTS.muktaMalar.medium, color: '#111' }}>
            {selectedVaravaramYear}
          </Text>
          <Ionicons name={showVaravaramYearDropdown ? 'chevron-up' : 'chevron-down'} size={s(14)} color="#555" />
        </TouchableOpacity>

        {showVaravaramYearDropdown && (
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
            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {(availableYears.length > 0 ? availableYears : [new Date().getFullYear(), new Date().getFullYear() - 1]).map((year) => (
                <TouchableOpacity
                  key={year}
                  style={{
                    paddingHorizontal: s(12),
                    paddingVertical: vs(10),
                    borderBottomWidth: 1,
                    borderBottomColor: '#f0f0f0',
                    backgroundColor: year === selectedVaravaramYear ? '#f0f6ff' : '#fff',
                  }}
                  onPress={() => {
                    handleVaravaramYearChange(year);
                    setShowVaravaramYearDropdown(false);
                  }}
                >
                  <Text style={{
                    fontSize: ms(14),
                    fontFamily: FONTS.muktaMalar.medium,
                    color: year === selectedVaravaramYear ? COLORS.primary : '#111',
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
            paddingVertical: vs(5),
            backgroundColor: '#fff',
            gap: s(4),
            minWidth: s(90),
            justifyContent: 'space-between',
          }}
          onPress={() => {
            setShowVaravaramDateDropdown(!showVaravaramDateDropdown);
            setShowVaravaramYearDropdown(false);
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: ms(14), fontFamily: FONTS.muktaMalar.medium, color: '#111' }}>
            {(() => {
              const months = ['\u0b9c\u0ba9', '\u0baa\u0bbf\u0baa\u0bcd', '\u0bae\u0bbe\u0bb0\u0bcd', '\u0b8f\u0baa\u0bcd', '\u0bae\u0bc7', '\u0b9c\u0bc2\u0ba9\u0bcd', '\u0b9c\u0bc2\u0bb2\u0bc8', '\u0b86\u0b95', '\u0b9a\u0bc6\u0baa\u0bcd', '\u0b85\u0b95\u0bcd', '\u0ba8\u0bb5', '\u0b9f\u0bbf\u0b9a'];
              return `${months[selectedVaravaramMonth]} ${selectedVaravaramDate}`;
            })()}
          </Text>
          <Ionicons name={showVaravaramDateDropdown ? 'chevron-up' : 'chevron-down'} size={s(14)} color="#555" />
        </TouchableOpacity>

        {showVaravaramDateDropdown && (
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
            height: vs(300), // FIXED height instead of maxHeight
            overflow: 'hidden',
          }}>
            <ScrollView
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: vs(10) }}
            >
              {(() => {
                // Build list of all months for selected year, each with available dates
                const months = ['\u0b9c\u0ba9\u0bb5\u0bb0\u0bbf', '\u0baa\u0bbf\u0baa\u0bcd\u0bb0\u0bb5\u0bb0\u0bbf', '\u0bae\u0bbe\u0bb0\u0bcd\u0b9a\u0bcd', '\u0b8f\u0baa\u0bcd\u0bb0\u0bb2\u0bcd', '\u0bae\u0bc7', '\u0b9c\u0bc2\u0ba9\u0bcd', '\u0b9c\u0bc2\u0bb2\u0bc8', '\u0b86\u0b95\u0bb8\u0bcd\u0b9f\u0bcd', '\u0b9a\u0bc6\u0baa\u0bcd\u0b9f\u0bae\u0bcd\u0baa\u0bb0\u0bcd', '\u0b85\u0b95\u0bcd\u0b9f\u0bcb\u0baa\u0bb0\u0bcd', '\u0ba8\u0bb5\u0bae\u0bcd\u0baa\u0bb0\u0bcd', '\u0b9f\u0bbf\u0b9a\u0bae\u0bcd\u0baa\u0bb0\u0bcd'];
                const shortMonths = ['\u0b9c\u0ba9', '\u0baa\u0bbf\u0baa\u0bcd', '\u0bae\u0bbe\u0bb0\u0bcd', '\u0b8f\u0baa\u0bcd', '\u0bae\u0bc7', '\u0b9c\u0bc2\u0ba9\u0bcd', '\u0b9c\u0bc2\u0bb2\u0bc8', '\u0b86\u0b95', '\u0b9a\u0bc6\u0baa\u0bcd', '\u0b85\u0b95\u0bcd', '\u0ba8\u0bb5', '\u0b9f\u0bbf\u0b9a'];

                // Use API dropdown data instead of extracting from news items
                const datesByMonth = {};

                // Use stored varavaram dropdown data for current tab
                const currentTabKey = activeTab?.id || activeTab?.title || 'main';
                const dataSource = varavaramDropdownData[currentTabKey] || [];

                // Process the API dropdown data
                if (Array.isArray(dataSource) && dataSource.length > 0) {
                  dataSource.forEach((item, index) => {
                    if (item.date && item.date1) {
                      try {
                        const date = new Date(item.date);
                        const year = date.getFullYear();
                        const month = date.getMonth();
                        const day = date.getDate();

                        if (year === selectedVaravaramYear) {
                          if (!datesByMonth[month]) datesByMonth[month] = new Set();
                          datesByMonth[month].add(day);
                        }
                      } catch (e) {
                        // Skip invalid dates
                      }
                    }
                  });
                }

                // Build the list of all available dates for the selected year
                const allDates = [];
                Object.keys(datesByMonth).forEach(monthIndex => {
                  const month = parseInt(monthIndex);
                  const days = Array.from(datesByMonth[month]).sort((a, b) => a - b);
                  days.forEach(day => {
                    allDates.push({ month, day });
                  });
                });

                // Sort by month, then by day
                allDates.sort((a, b) => {
                  if (a.month !== b.month) return a.month - b.month;
                  return a.day - b.day;
                });

                return allDates.map((dateObj, index) => (
                  <TouchableOpacity
                    key={`${dateObj.month}-${dateObj.day}`}
                    style={{
                      paddingHorizontal: s(12),
                      paddingVertical: vs(10),
                      borderBottomWidth: 1,
                      borderBottomColor: '#f0f0f0',
                      backgroundColor: dateObj.month === selectedVaravaramMonth && dateObj.day === selectedVaravaramDate ? '#f0f6ff' : '#fff',
                    }}
                    onPress={() => {
                      setSelectedVaravaramMonth(dateObj.month);
                      setSelectedVaravaramDate(dateObj.day);
                      setShowVaravaramDateDropdown(false);
                      setTimeout(() => {
                        filterVaravaramNews();
                      }, 100);
                    }}
                  >
                    <Text style={{
                      fontSize: ms(14),
                      fontFamily: FONTS.muktaMalar.medium,
                      color: dateObj.month === selectedVaravaramMonth && dateObj.day === selectedVaravaramDate ? COLORS.primary : '#111',
                    }}>
                      {shortMonths[dateObj.month]} {dateObj.day}
                    </Text>
                  </TouchableOpacity>
                ));
              })()}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

export default VaravaramComponent;
