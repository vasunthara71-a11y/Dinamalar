import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { ms, s } from 'react-native-size-matters';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';
import { COLORS, FONTS } from '../utils/constants';

const FeedbackForm = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [city, setCity] = useState('');
  const [value, setValue] = useState(null);
  const [message, setMessage] = useState('');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Header action handlers
  const goToSearch = () => navigation.navigate('SearchScreen');

  const handleNotification = () => {
    navigation.navigate('TimelineScreen');
  };

  const handleMenuPress = (menuItem) => {
    const link = menuItem?.Link || menuItem?.link || '';
    const title = menuItem?.Title || menuItem?.title || '';
    if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
      console.log('External menu link:', link);
    } else {
      navigation?.navigate('TimelineScreen', { catName: title });
    }
  };

  const handleSelectDistrict = (district) => {
    setSelectedDistrict(district.title);
    setIsLocationDrawerVisible(false);
    if (district.id) {
      navigation?.navigate('DistrictNewsScreen', {
        districtId: district.id,
        districtTitle: district.title,
      });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setSubmitMessage('பெயர் கட்டாயமானது');
      setTimeout(() => setSubmitMessage(''), 3000);
      return;
    }
    if (!message.trim()) {
      setSubmitMessage('செய்தியை உள்ளிட வேண்டும்');
      setTimeout(() => setSubmitMessage(''), 3000);
      return;
    }
    if (!value) {
      setSubmitMessage('பிரிவைத் தேர்ந்தெடுக்க வேண்டும்');
      setTimeout(() => setSubmitMessage(''), 3000);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const feedbackData = {
        name: name.trim(),
        contact: contact.trim(),
        city: city.trim(),
        category: value,
        categoryLabel: data.find(item => item.value === value)?.label || '',
        message: message.trim(),
        timestamp: serverTimestamp(),
        status: 'pending'
      };

      await addDoc(collection(db, 'feedback'), feedbackData);

      // Success
      setSubmitMessage('உங்கள் கருத்து வெற்றிகரமாக அனுப்பப்பட்டது!');

      // Reset form
      setName('');
      setContact('');
      setCity('');
      setValue(null);
      setMessage('');

      setTimeout(() => {
        setSubmitMessage('');
        setIsSubmitting(false);
      }, 3000);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitMessage('பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.');
      setIsSubmitting(false);
      setTimeout(() => setSubmitMessage(''), 3000);
    }
  };

  // Specific categories from Dinamalar's feedback system
  const data = [
    { label: 'செய்திகள்', value: '1' },
    { label: 'விளம்பரம்', value: '2' },
    { label: 'நாளிதழ்', value: '3' },
    { label: 'ஐ-பேப்பர்', value: '4' },
    { label: 'இணையதள வடிவமைப்பு', value: '4' },
    { label: 'உங்களின் எதிர்பார்ப்பு', value: '5' },
    { label: 'பிற கருத்துக்கள்', value: '6' },
  ];

  return (
    <ScrollView style={styles.container}>

      <UniversalHeaderComponent
        showMenu
        showSearch
        showNotifications
        showLocation
        onMenuPress={handleMenuPress}
        onNotification={handleNotification}
        onSearch={goToSearch}
        onLocation={() => setIsLocationDrawerVisible(true)}
        selectedDistrict={selectedDistrict}
        navigation={navigation}
        isDrawerVisible={isDrawerVisible}
        setIsDrawerVisible={setIsDrawerVisible}
        isLocationDrawerVisible={isLocationDrawerVisible}
        setIsLocationDrawerVisible={setIsLocationDrawerVisible}
        onSelectDistrict={handleSelectDistrict}
      >
        <AppHeaderComponent
          onSearch={goToSearch}
          onMenu={() => setIsDrawerVisible(true)}
          onLocation={() => setIsLocationDrawerVisible(true)}
          selectedDistrict={selectedDistrict}
        />
      </UniversalHeaderComponent>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.headerText}>உங்கள் கருத்துக்களை அனுப்பவும்!</Text>
          <View style={styles.underline} />
          <View style={styles.greyLine} />

        </View>

        {/* Info Box */}
        <View style={{ paddingHorizontal: s(15) }}>
          <View style={styles.infoBox}>
            <View style={styles.blueBar} />
            <Text style={styles.infoText}>
              எங்கள் இணையதளத்தை மேம்படுத்த உங்கள் மேலான ஆலோசனைகளை வரவேற்கிறோம்.
            </Text>
          </View>
        </View>


        {/* Name Input */}
        <TextInput
          style={styles.input}
          placeholder="உங்கள் பெயர்:*"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />

        {/* Contact Input */}
        <TextInput
          style={styles.input}
          placeholder="இ-மெயில் / தொலைபேசி எண்:"
          placeholderTextColor="#999"
          value={contact}
          onChangeText={setContact}
        />

        {/* City Input */}
        <TextInput
          style={styles.input}
          placeholder="ஊர்:"
          placeholderTextColor="#999"
          value={city}
          onChangeText={setCity}
        />

        {/* Dropdown (Not a Modal) */}
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          data={data}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="கருத்து தெரிவிக்கும் பிரிவுகள்"
          value={value}
          onChange={item => {
            setValue(item.value);
          }}
          containerStyle={styles.dropdownContainer}
        />

        {/* Message Area */}
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="கருத்துக்களை பதிவிடுங்கள்.*"
          placeholderTextColor="#999"
          multiline={true}
          numberOfLines={5}
          textAlignVertical="top"
          value={message}
          onChangeText={setMessage}
        />

        {/* Submit Message */}
        {submitMessage ? (
          <Text style={[
            styles.messageText,
            submitMessage.includes('வெற்றிகரமாக') ? styles.successMessage : styles.errorMessage
          ]}>
            {submitMessage}
          </Text>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}> SUBMIT
            {/* {isSubmitting ? 'அனுப்புகிறது...' : 'SUBMIT'} */}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </ScrollView>

  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { padding: 20 },
  titleContainer: { paddingBottom: ms(20) },
  headerText: { fontSize: ms(22), color: '#333', fontFamily: FONTS.muktaMalar.bold },
  underline: { height: 4, backgroundColor: '#1976D2', width: 65, marginTop: 5 },
  greyLine: {
    borderBottomWidth: 0.75,
    borderBottomColor: COLORS.grey300
  },
  infoBox: { flexDirection: 'row', backgroundColor: '#E3F2FD', borderRadius: 4, marginBottom: 20 },
  blueBar: { width: 8, backgroundColor: '#1976D2' },
  infoText: { padding: 15, fontSize: ms(16), color: '#444', lineHeight: s(24), flex: 1, fontFamily: FONTS.muktaMalar.regular, textAlign: "center" },

  input: {
    height: ms(60),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: s(15),
    fontSize: ms(16),
    marginBottom: ms(15),
    fontFamily: FONTS.muktaMalar.regular
    // backgroundColor: '#FAFAFA',
  },
  textArea: { height: ms(150), },

  // Dropdown Styles
  dropdown: {
    height: ms(60),
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    // backgroundColor: '#FAFAFA',
    marginBottom: 15,

  },
  dropdownContainer: {
    borderRadius: 8,
    marginTop: 2,
    height: ms(200)

  },
  placeholderStyle: { fontSize: ms(16), color: '#999', fontFamily: FONTS.muktaMalar.regular },
  selectedTextStyle: { fontSize: ms(16), color: '#333', fontFamily: FONTS.muktaMalar.regular },

  submitButton: {
    backgroundColor: '#1976D2',
    paddingVertical: ms(12),
    borderRadius: 5,
    alignItems: 'center',
    width: '45%',
    alignSelf: 'center',
    marginTop:ms(30)
   },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: { color: '#fff', fontSize: ms(18), fontFamily: FONTS.muktaMalar.bold },
  messageText: {
    textAlign: 'center',
    marginBottom: ms(15),
    fontSize: ms(14),
    fontFamily: FONTS.muktaMalar.semibold
  },
  successMessage: {
    color: '#4CAF50',
  },
  errorMessage: {
    color: '#F44336',
  },
});

export default FeedbackForm;