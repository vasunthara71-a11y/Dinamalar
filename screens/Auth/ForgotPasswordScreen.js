import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ms } from 'react-native-size-matters';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const hasLetters = /[a-zA-Z]/.test(email);
    const hasNumbers = /\d/.test(email);

    if (!email) {
      return 'Email or mobile number is required';
    }

    if (hasLetters && !hasNumbers) {
      // Email validation
      if (!email.includes('@')) {
        return 'Please enter a valid email address (must contain @)';
      }
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
        return 'Invalid email address format';
      }
    } else if (hasNumbers && !hasLetters) {
      // Mobile number validation
      const cleanNumber = email.replace(/\s/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
        return 'Invalid mobile number (10 digits starting with 6-9)';
      }
    } else if (hasLetters && hasNumbers) {
      if (email.includes('@')) {
        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
          return 'Invalid email address format';
        }
      } else {
        return 'Please enter either email address or mobile number';
      }
    } else {
      return 'Please enter email address or mobile number';
    }

    return null;
  };

  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        navigation.navigate('LoginScreen');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage, navigation]);

  const handleInputChange = (text) => {
    setEmail(text);
    // Validate in real-time and show error immediately
    const validationError = validateEmail(text);
    if (validationError) {
      setErrors({ email: validationError });
    } else {
      setErrors({ ...errors, email: '' });
    }
  };

  const getKeyboardType = () => {
    const hasLetters = /[a-zA-Z]/.test(email);
    const hasNumbers = /\d/.test(email);

    // If it contains letters and @ symbol, it's likely an email
    if (hasLetters && email.includes('@')) {
      return 'email-address';
    }
    // If it's mostly numbers, use numeric keypad
    else if (hasNumbers && !hasLetters) {
      return 'numeric';
    }
    // Default to email-address for mixed or text input
    else {
      return 'email-address';
    }
  };

  const handleSubmit = async () => {
    const validationError = validateEmail(email);
    if (validationError) {
      setErrors({ email: validationError });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const isEmail = email.includes('@');
      let resetEmail = email;

      // If mobile number, find associated email from Firestore
      if (!isEmail) {
        const cleanNumber = email.replace(/\s/g, '');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('mobileNumber', '==', cleanNumber));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          Alert.alert('Error', 'No account found with this mobile number');
          setIsLoading(false);
          return;
        }
        resetEmail = snapshot.docs[0].data().email;
      }

      console.log('Sending password reset to:', resetEmail);

      // Send reset email with detailed error handling
      await sendPasswordResetEmail(auth, resetEmail)
        .then(() => {
          console.log('Password reset email sent successfully');
          setShowSuccessMessage(true);
        })
        .catch((error) => {
          console.error('Password reset error:', error);
          throw error;
        });

      setShowSuccessMessage(true);

    } catch (error) {
      let errorMessage = 'Failed to send password reset link';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007BFF" />
        </TouchableOpacity>
        <Text style={styles.header}>Forgot Password</Text>
        <View style={{ width: 24 }} />
      </View> */}

      {/* Content */}

      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.header}>Forgot Password</Text>
      </View>
      <View style={styles.contentContainer}>
        {/* <Text style={styles.description}>
          Enter your email address or mobile number and we'll send you a link to reset your password.
        </Text> */}

        {/* Input Group */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email or Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your Email ID or Mobile Number"
            placeholderTextColor="#94A3B8"
            keyboardType={getKeyboardType()}
            autoCapitalize="none"
            value={email}
            onChangeText={handleInputChange}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Sending...' : 'Submit'}
          </Text>
        </TouchableOpacity>

        {/* Footer Link */}
        <TouchableOpacity style={styles.loginLinkContainer} onPress={() => navigation.goBack()}>
          <Text style={styles.loginLinkText}>Go to Login</Text>
        </TouchableOpacity>

        {/* Success Message */}
        {showSuccessMessage && (
          <View style={styles.successMessageContainer}>
            <Text style={styles.successMessageText}>
              Password reset link has been sent to registered email address. Redirecting you to the login page...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: Platform.OS === 'ios' ? ms(20) : ms(24),
    paddingTop: Platform.OS === 'ios' ? ms(40) : ms(40),
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
   },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  header: {
    fontSize: Platform.OS === 'ios' ? ms(22) : ms(24),
    color: '#7F8C8D',
    fontWeight: '400',
    textAlign: 'center',
    // paddingVertical: Platform.OS === 'ios' ? ms(15) : ms(20)
  },
  logoContainer: { alignItems: 'center',  },
  logo: {
    width: Platform.OS === 'ios' ? ms(180) : ms(200),
    height: Platform.OS === 'ios' ? ms(70) : ms(80)
  },
  contentContainer: {
    marginTop: Platform.OS === 'ios' ? ms(40) : ms(60),
    justifyContent: 'center',
  },
  description: {
    fontSize: ms(14),
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: ms(14),
    color: '#8E8E93',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D9E6',
    borderRadius: Platform.OS === 'ios' ? 8 : 6,
    paddingVertical: Platform.OS === 'ios' ? ms(12) : ms(14),
    paddingHorizontal: Platform.OS === 'ios' ? ms(12) : ms(15),
    fontSize: ms(14),
    color: '#000',
  },
  submitButton: {
    backgroundColor: '#007BFF',
    paddingVertical: Platform.OS === 'ios' ? ms(12) : ms(14),
    borderRadius: Platform.OS === 'ios' ? 8 : 6,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#B0B0B0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: ms(16),
    fontWeight: '600',
  },
  loginLinkContainer: {
    marginTop: ms(40),
    alignSelf: 'flex-end',
  },
  loginLinkText: {
    color: '#007BFF',
    fontSize: ms(14),
    fontWeight: '500',
  },
  successMessageContainer: {
    backgroundColor: '#D4EDDA',
    borderColor: '#C3E6CB',
    borderWidth: 1,
    borderRadius: 6,
    padding: 15,
    marginTop: 20,
  },
  successMessageText: {
    color: '#155724',
    fontSize: ms(14),
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    color: '#FF0000',
    fontSize: ms(12),
    marginBottom: 10,
    marginVertical:ms(2)
  },
});
