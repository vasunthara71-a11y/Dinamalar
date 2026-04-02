import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  ScrollView, SafeAreaView 
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

const FeedbackForm = () => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [city, setCity] = useState('');
  const [value, setValue] = useState(null);
  const [message, setMessage] = useState('');

  // Specific categories from Dinamalar's feedback system
  const data = [
    { label: 'செய்திகள் தொடர்பாக (News)', value: '1' },
    { label: 'விளம்பரம் தொடர்பாக (Ads)', value: '2' },
    { label: 'தொழில்நுட்பம் (Technical)', value: '3' },
    { label: 'சந்தா மற்றும் விநியோகம் (Subscription)', value: '4' },
    { label: 'ஆலோசனைகள் (Suggestions)', value: '5' },
    { label: 'இதர (Others)', value: '6' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.headerText}>உங்கள் கருத்துக்களை அனுப்பவும்!</Text>
          <View style={styles.underline} />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <View style={styles.blueBar} />
          <Text style={styles.infoText}>
            எங்கள் இணையதளத்தை மேம்படுத்த உங்கள் மேலான ஆலோசனைகளை வரவேற்கிறோம்.
          </Text>
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

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>SUBMIT</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { padding: 20 },
  titleContainer: { marginBottom: 20 },
  headerText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  underline: { height: 3, backgroundColor: '#1976D2', width: 60, marginTop: 5 },
  infoBox: { flexDirection: 'row', backgroundColor: '#E3F2FD', borderRadius: 4, marginBottom: 20 },
  blueBar: { width: 8, backgroundColor: '#1976D2' },
  infoText: { padding: 15, fontSize: 15, color: '#444', lineHeight: 22, flex: 1 },
  
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#FAFAFA',
  },
  textArea: { height: 120, paddingTop: 10 },
  
  // Dropdown Styles
  dropdown: {
    height: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#FAFAFA',
    marginBottom: 15,
  },
  dropdownContainer: {
    borderRadius: 8,
    marginTop: 2,
  },
  placeholderStyle: { fontSize: 16, color: '#999' },
  selectedTextStyle: { fontSize: 16, color: '#333' },

  submitButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    width: '50%',
    alignSelf: 'center',
  },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default FeedbackForm;