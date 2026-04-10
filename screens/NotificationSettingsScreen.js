// screens/NotificationSettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs, ms } from '../utils/scaling';
import { useFontSize } from '../context/FontSizeContext';
import {
  getPushNotificationPreferences,
  savePushNotificationPreferences,
  requestNotificationPermissions,
  removePushToken,
} from '../services/pushNotificationService';

export default function NotificationSettingsScreen() {
  const { sf } = useFontSize();
  const navigation = useNavigation();

  const [preferences, setPreferences] = useState({
    flashNews: true,
    breakingNews: true,
    videoUpdates: true,
    audioNews: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
    checkPermissionStatus();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await getPushNotificationPreferences();
      setPreferences(savedPreferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const checkPermissionStatus = async () => {
    try {
      const hasPermission = await requestNotificationPermissions();
      setPermissionGranted(hasPermission);
    } catch (error) {
      console.error('Error checking permission status:', error);
    }
  };

  const updatePreference = async (key, value) => {
    try {
      const updatedPreferences = { ...preferences, [key]: value };
      setPreferences(updatedPreferences);
      await savePushNotificationPreferences(updatedPreferences);
    } catch (error) {
      console.error('Error updating preference:', error);
    }
  };

  const updateQuietHours = async (enabled) => {
    try {
      const updatedPreferences = {
        ...preferences,
        quietHours: {
          ...preferences.quietHours,
          enabled,
        },
      };
      setPreferences(updatedPreferences);
      await savePushNotificationPreferences(updatedPreferences);
    } catch (error) {
      console.error('Error updating quiet hours:', error);
    }
  };

  const updateQuietHoursTime = async (type, time) => {
    try {
      const updatedPreferences = {
        ...preferences,
        quietHours: {
          ...preferences.quietHours,
          [type]: time,
        },
      };
      setPreferences(updatedPreferences);
      await savePushNotificationPreferences(updatedPreferences);
    } catch (error) {
      console.error('Error updating quiet hours time:', error);
    }
  };

  const requestPermissions = async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermissions();
      setPermissionGranted(granted);
      
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in your device settings to receive real-time news updates.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openDeviceSettings() },
          ]
        );
      } else {
        Alert.alert('Success', 'Notifications enabled successfully!');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions.');
    } finally {
      setLoading(false);
    }
  };

  const openDeviceSettings = () => {
    // This would open the device settings
    // In React Native, you might use Linking to open app settings
    // For now, we'll just show an alert
    Alert.alert(
      'Settings',
      'Please manually enable notifications in your device settings:\n\n1. Go to Settings > Notifications\n2. Find Dinamalar\n3. Enable notifications'
    );
  };

  const disableNotifications = async () => {
    Alert.alert(
      'Disable Notifications',
      'Are you sure you want to disable all notifications? You will not receive real-time news updates.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              await removePushToken();
              Alert.alert('Disabled', 'All notifications have been disabled.');
              navigation.goBack();
            } catch (error) {
              console.error('Error disabling notifications:', error);
              Alert.alert('Error', 'Failed to disable notifications.');
            }
          },
        },
      ]
    );
  };

  const renderTimePicker = (label, value, type) => (
    <View style={styles.timePickerContainer}>
      <Text style={[styles.timeLabel, { fontSize: sf(14) }]}>{label}</Text>
      <TouchableOpacity
        style={styles.timeButton}
        onPress={() => {
          // For simplicity, we'll just show a few preset times
          Alert.alert(
            `Select ${label}`,
            'Choose a time:',
            [
              '20:00',
              '21:00',
              '22:00',
              '23:00',
              '00:00',
              '01:00',
              '06:00',
              '07:00',
              '08:00',
              '09:00',
            ].map(time => ({
              text: time,
              onPress: () => updateQuietHoursTime(type, time),
            }))
          );
        }}
      >
        <Text style={[styles.timeValue, { fontSize: sf(16) }]}>{value}</Text>
        <Ionicons name="chevron-down" size={s(20)} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={s(24)} color={COLORS.grey800} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: sf(18) }]}>Notification Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Permission Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: sf(16) }]}>Permission Status</Text>
          <View style={styles.permissionContainer}>
            <View style={styles.permissionInfo}>
              <Ionicons 
                name={permissionGranted ? "checkmark-circle" : "close-circle"} 
                size={s(24)} 
                color={permissionGranted ? COLORS.success : COLORS.danger} 
              />
              <Text style={[styles.permissionText, { fontSize: sf(14) }]}>
                {permissionGranted ? 'Notifications Enabled' : 'Notifications Disabled'}
              </Text>
            </View>
            {!permissionGranted && (
              <TouchableOpacity
                style={styles.enableButton}
                onPress={requestPermissions}
                disabled={loading}
              >
                {loading ? (
                  <Text style={[styles.enableButtonText, { fontSize: sf(14) }]}>Loading...</Text>
                ) : (
                  <Text style={[styles.enableButtonText, { fontSize: sf(14) }]}>Enable Notifications</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: sf(16) }]}>Notification Types</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { fontSize: sf(14) }]}>Flash News</Text>
              <Text style={[styles.settingDescription, { fontSize: sf(12) }]}>
                Breaking news and urgent updates
              </Text>
            </View>
            <Switch
              value={preferences.flashNews}
              onValueChange={(value) => updatePreference('flashNews', value)}
              trackColor={{ false: COLORS.grey300, true: COLORS.primary + '40' }}
              thumbColor={preferences.flashNews ? COLORS.primary : COLORS.grey500}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { fontSize: sf(14) }]}>Breaking News</Text>
              <Text style={[styles.settingDescription, { fontSize: sf(12) }]}>
                Important news updates
              </Text>
            </View>
            <Switch
              value={preferences.breakingNews}
              onValueChange={(value) => updatePreference('breakingNews', value)}
              trackColor={{ false: COLORS.grey300, true: COLORS.primary + '40' }}
              thumbColor={preferences.breakingNews ? COLORS.primary : COLORS.grey500}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { fontSize: sf(14) }]}>Video Updates</Text>
              <Text style={[styles.settingDescription, { fontSize: sf(12) }]}>
                New video content
              </Text>
            </View>
            <Switch
              value={preferences.videoUpdates}
              onValueChange={(value) => updatePreference('videoUpdates', value)}
              trackColor={{ false: COLORS.grey300, true: COLORS.primary + '40' }}
              thumbColor={preferences.videoUpdates ? COLORS.primary : COLORS.grey500}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { fontSize: sf(14) }]}>Audio News</Text>
              <Text style={[styles.settingDescription, { fontSize: sf(12) }]}>
                Podcast and audio updates
              </Text>
            </View>
            <Switch
              value={preferences.audioNews}
              onValueChange={(value) => updatePreference('audioNews', value)}
              trackColor={{ false: COLORS.grey300, true: COLORS.primary + '40' }}
              thumbColor={preferences.audioNews ? COLORS.primary : COLORS.grey500}
            />
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: sf(16) }]}>Notification Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { fontSize: sf(14) }]}>Sound</Text>
              <Text style={[styles.settingDescription, { fontSize: sf(12) }]}>
                Play sound for notifications
              </Text>
            </View>
            <Switch
              value={preferences.soundEnabled}
              onValueChange={(value) => updatePreference('soundEnabled', value)}
              trackColor={{ false: COLORS.grey300, true: COLORS.primary + '40' }}
              thumbColor={preferences.soundEnabled ? COLORS.primary : COLORS.grey500}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { fontSize: sf(14) }]}>Vibration</Text>
              <Text style={[styles.settingDescription, { fontSize: sf(12) }]}>
                Vibrate for notifications
              </Text>
            </View>
            <Switch
              value={preferences.vibrationEnabled}
              onValueChange={(value) => updatePreference('vibrationEnabled', value)}
              trackColor={{ false: COLORS.grey300, true: COLORS.primary + '40' }}
              thumbColor={preferences.vibrationEnabled ? COLORS.primary : COLORS.grey500}
            />
          </View>
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: sf(16) }]}>Quiet Hours</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { fontSize: sf(14) }]}>Enable Quiet Hours</Text>
              <Text style={[styles.settingDescription, { fontSize: sf(12) }]}>
                Disable notifications during specific hours
              </Text>
            </View>
            <Switch
              value={preferences.quietHours.enabled}
              onValueChange={updateQuietHours}
              trackColor={{ false: COLORS.grey300, true: COLORS.primary + '40' }}
              thumbColor={preferences.quietHours.enabled ? COLORS.primary : COLORS.grey500}
            />
          </View>

          {preferences.quietHours.enabled && (
            <View style={styles.quietHoursContainer}>
              {renderTimePicker('From', preferences.quietHours.start, 'start')}
              {renderTimePicker('To', preferences.quietHours.end, 'end')}
            </View>
          )}
        </View>

        {/* Disable All */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.disableButton} onPress={disableNotifications}>
            <Ionicons name="notifications-off" size={s(20)} color={COLORS.danger} />
            <Text style={[styles.disableButtonText, { fontSize: sf(14) }]}>Disable All Notifications</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.grey100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingVertical: vs(16),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey200,
  },
  backButton: {
    padding: s(8),
  },
  headerTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.grey800,
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: s(40),
  },
  content: {
    flex: 1,
    padding: s(16),
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: s(12),
    padding: s(16),
    marginBottom: vs(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.grey800,
    marginBottom: vs(16),
  },
  permissionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: COLORS.grey600,
    marginLeft: s(8),
  },
  enableButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    borderRadius: s(8),
  },
  enableButtonText: {
    fontFamily: FONTS.muktaMalar.bold,
    color: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey200,
  },
  settingInfo: {
    flex: 1,
    marginRight: s(16),
  },
  settingTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.grey800,
    marginBottom: vs(2),
  },
  settingDescription: {
    fontFamily: FONTS.muktaMalar.regular,
    color: COLORS.grey600,
  },
  quietHoursContainer: {
    paddingTop: vs(8),
    paddingHorizontal: s(16),
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(8),
  },
  timeLabel: {
    fontFamily: FONTS.muktaMalar.regular,
    color: COLORS.grey600,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grey200,
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: s(8),
  },
  timeValue: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.grey800,
    marginRight: s(8),
  },
  disableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(12),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  disableButtonText: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.danger,
    marginLeft: s(8),
  },
});
