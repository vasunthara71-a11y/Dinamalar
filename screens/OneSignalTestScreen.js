// screens/OneSignalTestScreen.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Alert, ActivityIndicator, ScrollView, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import { 
  sendTestNotification, 
  sendFlashNewsNotification, 
  sendMultipleTestNotifications,
  testOneSignalAPI 
} from '../services/oneSignalTestService';
import { validateOneSignalConfig } from '../utils/oneSignalConfig';

const PALETTE = {
  primary: '#096dd2',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  white: '#FFFFFF',
  grey100: '#F9FAFB',
  grey200: '#F4F6F8',
  grey300: '#DFE3E8',
  grey500: '#919EAB',
  grey800: '#212B36',
};

export default function OneSignalTestScreen() {
  const navigation = useNavigation();
  const [playerId, setPlayerId] = useState('');
  const [title, setTitle] = useState('டெஸ்ட் அறிவிப்பு');
  const [message, setMessage] = useState('இது ஒரு டெஸ்ட் அறிவிப்பு');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleSendTest = async () => {
    if (!playerId.trim()) {
      Alert.alert('பிழை', 'தயவு செய்து Player ID உள்ளிடவும்');
      return;
    }

    if (!validateOneSignalConfig()) {
      Alert.alert('கட்டமைப்பு பிழை', 'OneSignal கட்டமைப்பு முடிந்திருக்கவில்லை. தயவு செய்து APP_ID மற்றும் REST_API_KEY உள்ளிடவும்');
      return;
    }

    setLoading(true);
    try {
      const result = await sendTestNotification(playerId, title, message);
      setResults(prev => [{ 
        id: Date.now(), 
        type: 'test', 
        success: result.success, 
        message: result.success ? '✅ அறிவிப்பு அனுப்பப்பட்டது' : '❌ அனுப்புவதில் தோல்வி',
        details: result.error || result.data 
      }, ...prev]);
      
      Alert.alert(
        result.success ? 'வெற்றி' : 'தோல்வி',
        result.success ? 'அறிவிப்பு வெற்றிகரமாக அனுப்பப்பட்டது!' : 'அறிவிப்பு அனுப்புவதில் தோல்வி'
      );
    } catch (error) {
      Alert.alert('பிழை', 'ஏதோ தவறு நேர்ந்தது');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFlashNews = async () => {
    if (!playerId.trim()) {
      Alert.alert('பிழை', 'தயவு செய்து Player ID உள்ளிடவும்');
      return;
    }

    setLoading(true);
    try {
      const flashItem = { newstitle: 'புதிய ஃபிளாஷ் செய்தி: விரைவில் வரும்' };
      const result = await sendFlashNewsNotification(playerId, flashItem);
      setResults(prev => [{ 
        id: Date.now(), 
        type: 'flash', 
        success: result.success, 
        message: result.success ? '✅ ஃபிளாஷ் செய்தி அனுப்பப்பட்டது' : '❌ ஃபிளாஷ் செய்தி அனுப்புவதில் தோல்வி',
        details: result.error || result.data 
      }, ...prev]);
      
      Alert.alert(
        result.success ? 'வெற்றி' : 'தோல்வி',
        result.success ? 'ஃபிளாஷ் செய்தி வெற்றிகரமாக அனுப்பப்பட்டது!' : 'ஃபிளாஷ் செய்தி அனுப்புவதில் தோல்வி'
      );
    } catch (error) {
      Alert.alert('பிழை', 'ஏதோ தவறு நேர்ந்தது');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMultiple = async () => {
    if (!playerId.trim()) {
      Alert.alert('பிழை', 'தயவு செய்து Player ID உள்ளிடவும்');
      return;
    }

    setLoading(true);
    try {
      const results = await sendMultipleTestNotifications(playerId, 3);
      const successCount = results.filter(r => r.success).length;
      setResults(prev => [{ 
        id: Date.now(), 
        type: 'multiple', 
        success: successCount > 0, 
        message: `✅ ${successCount}/3 அறிவிப்புகள் அனுப்பப்பட்டன`,
        details: results 
      }, ...prev]);
      
      Alert.alert('முடிந்தது', `${successCount}/3 அறிவிப்புகள் வெற்றிகரமாக அனுப்பப்பட்டன`);
    } catch (error) {
      Alert.alert('பிழை', 'ஏதோ தவறு நேர்ந்தது');
    } finally {
      setLoading(false);
    }
  };

  const handleTestAPI = async () => {
    setLoading(true);
    try {
      const result = await testOneSignalAPI();
      setResults(prev => [{ 
        id: Date.now(), 
        type: 'api', 
        success: result.success, 
        message: result.success ? '✅ API இணைப்பு வெற்றி' : '❌ API இணைப்பு தோல்வி',
        details: result.error || result.data 
      }, ...prev]);
      
      Alert.alert(
        result.success ? 'வெற்றி' : 'தோல்வி',
        result.success ? 'OneSignal API இணைப்பு வெற்றிகரமாக உள்ளது!' : 'OneSignal API இணைப்பு தோல்வியடைந்தது'
      );
    } catch (error) {
      Alert.alert('பிழை', 'ஏதோ தவறு நேர்ந்தது');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={s(22)} color={PALETTE.grey800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OneSignal டெஸ்ட்</Text>
        <View style={{ width: s(30) }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Player ID Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Player ID *</Text>
          <TextInput
            style={styles.input}
            value={playerId}
            onChangeText={setPlayerId}
            placeholder="OneSignal Player ID உள்ளிடவும்"
            placeholderTextColor={PALETTE.grey500}
          />
        </View>

        {/* Title Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>தலைப்பு</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="அறிவிப்பு தலைப்பு"
            placeholderTextColor={PALETTE.grey500}
          />
        </View>

        {/* Message Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>செய்தி</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="அறிவிப்பு செய்தி"
            placeholderTextColor={PALETTE.grey500}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={handleSendTest}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={PALETTE.white} />
            ) : (
              <Text style={styles.buttonText}>📱 டெஸ்ட் அறிவிப்பு அனுப்பு</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.flashButton]} 
            onPress={handleSendFlashNews}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={PALETTE.white} />
            ) : (
              <Text style={styles.buttonText}>⚡ ஃபிளாஷ் செய்தி அனுப்பு</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.multipleButton]} 
            onPress={handleSendMultiple}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={PALETTE.white} />
            ) : (
              <Text style={styles.buttonText}>🔢 3 அறிவிப்புகள் அனுப்பு</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.testButton]} 
            onPress={handleTestAPI}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={PALETTE.white} />
            ) : (
              <Text style={styles.buttonText}>🔧 API டெஸ்ட்</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {results.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>முடிவுகள்</Text>
            {results.map(result => (
              <View key={result.id} style={[styles.resultItem, result.success ? styles.successItem : styles.errorItem]}>
                <Text style={styles.resultMessage}>{result.message}</Text>
                <Text style={styles.resultDetails} numberOfLines={2}>
                  {JSON.stringify(result.details, null, 2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>வழிகாட்டுதல்கள்:</Text>
          <Text style={styles.instructionsText}>1. OneSignal இல் பதிவு செய்து Player ID பெறுக</Text>
          <Text style={styles.instructionsText}>2. utils/oneSignalConfig.js ல் APP_ID மற்றும் REST_API_KEY உள்ளிடுக</Text>
          <Text style={styles.instructionsText}>3. Player ID ஐ மேலே உள்ளிட்டு டெஸ்ட் செய்க</Text>
          <Text style={styles.instructionsText}>4. அறிவிப்புகள் உங்கள் சாதனத்தில் வரும்</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.grey100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.white,
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.grey200,
  },
  backBtn: { padding: s(4) },
  headerTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(17),
    color: PALETTE.grey800,
  },
  content: {
    flex: 1,
    padding: s(16),
  },
  inputGroup: {
    marginBottom: vs(16),
  },
  label: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(14),
    color: PALETTE.grey800,
    marginBottom: vs(6),
  },
  input: {
    backgroundColor: PALETTE.white,
    borderWidth: 1,
    borderColor: PALETTE.grey300,
    borderRadius: s(8),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(14),
    color: PALETTE.grey800,
  },
  textArea: {
    height: vs(80),
    textAlignVertical: 'top',
  },
  buttonGroup: {
    marginBottom: vs(24),
    gap: vs(12),
  },
  button: {
    borderRadius: s(8),
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: vs(48),
  },
  primaryButton: {
    backgroundColor: PALETTE.primary,
  },
  flashButton: {
    backgroundColor: PALETTE.warning,
  },
  multipleButton: {
    backgroundColor: PALETTE.success,
  },
  testButton: {
    backgroundColor: PALETTE.grey500,
  },
  buttonText: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(14),
    color: PALETTE.white,
  },
  resultsSection: {
    marginBottom: vs(24),
  },
  resultsTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(16),
    color: PALETTE.grey800,
    marginBottom: vs(12),
  },
  resultItem: {
    padding: s(12),
    borderRadius: s(8),
    marginBottom: vs(8),
    borderLeftWidth: 3,
  },
  successItem: {
    backgroundColor: '#f6ffed',
    borderLeftColor: PALETTE.success,
  },
  errorItem: {
    backgroundColor: '#fff2f0',
    borderLeftColor: PALETTE.error,
  },
  resultMessage: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(13),
    color: PALETTE.grey800,
    marginBottom: vs(4),
  },
  resultDetails: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(11),
    color: PALETTE.grey600,
  },
  instructions: {
    backgroundColor: PALETTE.white,
    padding: s(16),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: PALETTE.grey300,
  },
  instructionsTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(14),
    color: PALETTE.grey800,
    marginBottom: vs(8),
  },
  instructionsText: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(12),
    color: PALETTE.grey600,
    marginBottom: vs(4),
    lineHeight: ms(18),
  },
});
