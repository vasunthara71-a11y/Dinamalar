    import React, { useState, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { s, vs, ms } from 'react-native-size-matters';
import { COLORS, FONTS } from '../utils/constants';

const MONTH_NAMES = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];
const WEEK_DAYS = ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'];

const toISO = (date) => {
  if (!date || typeof date.getFullYear !== 'function') return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CustomCalendarModal = ({ 
  visible, 
  onClose, 
  availableDates = [], 
  onDateSelect, 
  selectedDate 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { year, month, cells } = useMemo(() => {
    const date = new Date(currentMonth);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const cells = [];
    
    // Empty cells before month starts
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    
    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    
    return { year, month, cells };
  }, [currentMonth]);

  const availableSet = useMemo(() => {
    return new Set(availableDates);
  }, [availableDates]);

  const isAvailable = (d) => {
    if (!d) return false;
    // Check if date has data
    const dateISO = toISO(new Date(year, month, d));
    console.log('[Calendar] Checking date:', d, 'ISO:', dateISO, 'Available:', availableSet.has(dateISO));
    const hasData = availableSet.has(dateISO);
    if (!hasData) return false;
    // Check if date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(year, month, d);
    cellDate.setHours(0, 0, 0, 0);
    return cellDate <= today;
  };

  const isSelected = (d) => {
    if (!d || !selectedDate || typeof selectedDate.getFullYear !== 'function') return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth()    === month &&
      selectedDate.getDate()     === d
    );
  };

  const handleDayPress = (d) => {
    if (!isAvailable(d)) return;
    onDateSelect(new Date(year, month, d));
    onClose();
  };

  const changeMonth = (delta) => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  // Chunk cells into rows of 7
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={cal.overlay}>
        <View style={cal.card}>

          {/* ── Header: month/year + nav ── */}
          <View style={cal.header}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={cal.navBtn} hitSlop={{top:8,bottom:8,left:8,right:8}}>
              <Ionicons name="chevron-back" size={s(20)} color="#fff" />
            </TouchableOpacity>

            <Text style={cal.headerTitle}>
              {MONTH_NAMES[month]}  {year}
            </Text>

            <TouchableOpacity onPress={() => changeMonth(1)} style={cal.navBtn} hitSlop={{top:8,bottom:8,left:8,right:8}}>
              <Ionicons name="chevron-forward" size={s(20)} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={cal.closeBtn} hitSlop={{top:8,bottom:8,left:8,right:8}}>
              <Ionicons name="close" size={s(20)} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── Week-day labels ── */}
          <View style={cal.weekRow}>
            {WEEK_DAYS.map(wd => (
              <Text key={wd} style={cal.weekLabel}>{wd}</Text>
            ))}
          </View>

          {/* ── Date grid ── */}
          <View style={cal.grid}>
            {rows.map((row, ri) => (
              <View key={ri} style={cal.row}>
                {row.map((cell, ci) => {
                  const selected = isSelected(cell);
                  const available = isAvailable(cell);

                  // Empty cell → render nothing
                  if (!cell) {
                    return <View key={ci} style={cal.cell} />;
                  }

                  // Available date → clickable button
                  if (available) {
                    return (
                      <TouchableOpacity
                        key={ci}
                        style={[cal.cell, cal.cellAvailable, selected && cal.cellSelected]}
                        onPress={() => handleDayPress(cell)}
                        activeOpacity={0.7}
                      >
                        <Text style={[cal.dayText, cal.dayTextAvailable, selected && cal.dayTextSelected]}>
                          {cell}
                        </Text>
                      </TouchableOpacity>
                    );
                  }

                  // Unavailable date → visible but not clickable
                  return (
                    <View key={ci} style={[cal.cell, cal.cellUnavailable]}>
                      <Text style={cal.dayTextUnavailable}>
                        {cell}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {/* ── Footer hint ── */}
          <Text style={cal.hint}>
            தரவு உள்ள தேதிகள் - செய்திகள் மட்டும் காட்டப்படி
          </Text>

        </View>
      </View>
    </Modal>
  );
}

const cal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: s(12),
    overflow: 'hidden',
    width: s(320),
    maxHeight: vs(350),
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: s(8),
    paddingVertical: vs(12),
  },
  navBtn: { padding: s(4) },
  closeBtn: { padding: s(4), marginLeft: s(8) },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: ms(16),
    fontFamily: FONTS.muktaMalar.bold,
    color: '#fff',
    fontWeight: '700',
  },

  // Week labels
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0f4ff',
    paddingVertical: vs(6),
  },
  weekLabel: {
    width: s(40),
    textAlign: 'center',
    fontSize: ms(12),
    fontFamily: FONTS.muktaMalar.medium,
    color: '#555',
    fontWeight: '600',
  },

  // Grid
  grid: {
    paddingHorizontal: s(8),
    paddingVertical: vs(8),
  },
  row: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    marginBottom: vs(4),
  },
  cell: {
    width: s(40),
    height: s(40),
    justifyContent: 'center',
    alignItems: 'center',
    margin: s(1),
    borderRadius: s(20),
  },
  cellAvailable: {
    backgroundColor: '#e8f4e8',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cellUnavailable: {
    backgroundColor: '#f8f8f8',
  },
  cellSelected: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    fontSize: ms(15),
    fontFamily: FONTS.muktaMalar.bold,
    color: '#1a1a1a',
    fontWeight: '700',
  },
  dayTextAvailable: {
    color: COLORS.primary,
  },
  dayTextUnavailable: {
    color: '#ccc',
  },
  dayTextSelected: {
    color: '#fff',
  },

  // Footer
  hint: {
    textAlign: 'center',
    fontSize: ms(11),
    fontFamily: FONTS.muktaMalar.regular,
    color: '#999',
    paddingVertical: vs(10),
    paddingHorizontal: s(16),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
});

export default CustomCalendarModal;
