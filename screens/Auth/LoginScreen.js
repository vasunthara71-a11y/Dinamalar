// LoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Image, Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ms } from 'react-native-size-matters';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Changed from @react-native-firebase to JS SDK
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('login');
  const [rememberMe, setRememberMe] = useState(true);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('savedEmail');
      const savedPassword = await AsyncStorage.getItem('savedPassword');
      const savedRememberMe = await AsyncStorage.getItem('rememberMe');

      if (savedRememberMe === 'true' && savedEmail && savedPassword) {
        setLoginForm({ email: savedEmail, password: savedPassword });
        setRememberMe(true);
      } else {
        setRememberMe(false);
      }
    } catch (error) {
      console.log('Error loading saved credentials:', error);
    }
  };

  const saveCredentials = async (email, password) => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem('savedEmail', email);
        await AsyncStorage.setItem('savedPassword', password);
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        await AsyncStorage.removeItem('savedEmail');
        await AsyncStorage.removeItem('savedPassword');
        await AsyncStorage.setItem('rememberMe', 'false');
      }
    } catch (error) {
      console.log('Error saving credentials:', error);
    }
  };

  const validateLoginForm = () => {
    const newErrors = {};
    if (!loginForm.email) {
      newErrors.email = 'Email is required';
    } else {
      const hasLetters = /[a-zA-Z]/.test(loginForm.email);
      const hasNumbers = /\d/.test(loginForm.email);
      if (hasLetters && !hasNumbers) {
        if (!loginForm.email.includes('@')) {
          newErrors.email = 'Please enter a valid email address (must contain @)';
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(loginForm.email)) {
          newErrors.email = 'Invalid email address format';
        }
      } else if (hasNumbers && !hasLetters) {
        const cleanNumber = loginForm.email.replace(/\s/g, '');
        if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
          newErrors.email = 'Invalid mobile number (10 digits starting with 6-9)';
        }
      } else if (hasLetters && hasNumbers) {
        if (loginForm.email.includes('@')) {
          if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(loginForm.email)) {
            newErrors.email = 'Invalid email address format';
          }
        } else {
          newErrors.email = 'Please enter either email address or mobile number';
        }
      } else {
        newErrors.email = 'Please enter email address or mobile number';
      }
    }
    if (!loginForm.password) {
      newErrors.password = 'Password is required';
    } else if (loginForm.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(loginForm.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignupForm = () => {
    const newErrors = {};
    if (!signupForm.name) newErrors.name = 'Name is required';
    if (!signupForm.email) {
      newErrors.email = 'Email is required';
    } else {
      const hasLetters = /[a-zA-Z]/.test(signupForm.email);
      const hasNumbers = /\d/.test(signupForm.email);
      if (hasLetters && !hasNumbers) {
        if (!signupForm.email.includes('@')) {
          newErrors.email = 'Please enter a valid email address (must contain @)';
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(signupForm.email)) {
          newErrors.email = 'Invalid email address format';
        }
      } else if (hasNumbers && !hasLetters) {
        const cleanNumber = signupForm.email.replace(/\s/g, '');
        if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
          newErrors.email = 'Invalid mobile number (10 digits starting with 6-9)';
        }
      } else if (hasLetters && hasNumbers) {
        if (signupForm.email.includes('@')) {
          if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(signupForm.email)) {
            newErrors.email = 'Invalid email address format';
          }
        } else {
          newErrors.email = 'Please enter either email address or mobile number';
        }
      } else {
        newErrors.email = 'Please enter email address or mobile number';
      }
    }
    if (!signupForm.password) {
      newErrors.password = 'Password is required';
    } else if (signupForm.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(signupForm.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }
    if (!signupForm.confirmPassword) {
      newErrors.confirmPassword = 'Confirm Password is required';
    } else if (signupForm.password !== signupForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async () => {
    if (validateLoginForm()) {
      setLoginError(''); // Clear previous errors
      try {
        const cleanNumber = loginForm.email.replace(/\s/g, '');
        const isEmail = loginForm.email.includes('@');
        let email = loginForm.email;

        // ✅ JS SDK: query Firestore for mobile number
        if (!isEmail) {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('mobileNumber', '==', cleanNumber));
          const usersSnapshot = await getDocs(q);

          if (usersSnapshot.empty) {
            setLoginError('User not found. Please create an account to continue.');
            return;
          }
          email = usersSnapshot.docs[0].data().email;
        }

        // ✅ JS SDK: signInWithEmailAndPassword
        const userCredential = await signInWithEmailAndPassword(auth, email, loginForm.password);
        console.log('User logged in:', userCredential.user.uid);

        // Save credentials if remember me is checked
        await saveCredentials(loginForm.email, loginForm.password);

        // Save user email to AsyncStorage for profile display
        await AsyncStorage.setItem('userEmail', email);
        console.log('LoginScreen: Saved email to AsyncStorage:', email);

        // Navigate to home screen after successful login
        navigation.replace('MainTabs');

      } catch (error) {
        let errorMessage = 'Login failed';
        if (error.code === 'auth/user-not-found') errorMessage = 'User not found. Please create an account to continue.';
        else if (error.code === 'auth/wrong-password') errorMessage = 'Incorrect password. Please try again.';
        else if (error.code === 'auth/invalid-email') errorMessage = 'Invalid email address';
        else if (error.code === 'auth/invalid-credential') errorMessage = 'Incorrect password. Please try again.';
        else if (error.code === 'auth/network-request-failed') errorMessage = 'Network error. Check your connection.';
        else if (error.code === 'auth/too-many-requests') errorMessage = 'Too many attempts. Try again later.';
        else errorMessage = error.message || 'Login failed';

        setLoginError(errorMessage);
      }
    }
  };

  const handleSignupSubmit = async () => {
    if (validateSignupForm()) {
      try {
        const cleanNumber = signupForm.email.replace(/\s/g, '');
        const isEmail = signupForm.email.includes('@');
        let emailForAuth = signupForm.email;

        // If it's a mobile number, we need to create a dummy email for Firebase Auth
        if (!isEmail) {
          emailForAuth = `${cleanNumber}@dinamalar.app`;
        }

        // ✅ JS SDK: createUserWithEmailAndPassword
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          emailForAuth,
          signupForm.password
        );

        // ✅ JS SDK: setDoc instead of firestore().collection().doc().set()
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: signupForm.name,
          email: isEmail ? signupForm.email : '',
          mobileNumber: !isEmail ? cleanNumber : '',
          createdAt: serverTimestamp(),  // JS SDK serverTimestamp
          updatedAt: serverTimestamp()
        });

        console.log('User created:', userCredential.user.uid);

        // Save user email to AsyncStorage for profile display
        await AsyncStorage.setItem('userEmail', isEmail ? signupForm.email : '');

        // Navigate to home screen after successful signup
        navigation.replace('MainTabs');
      } catch (error) {
        console.log('Signup error details:', error);
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);

        let errorMessage = 'Signup failed';
        if (error.code === 'auth/email-already-in-use') errorMessage = 'Account already exists';
        else if (error.code === 'auth/weak-password') errorMessage = 'Password is too weak';
        else if (error.code === 'auth/invalid-email') errorMessage = 'Invalid email address';
        else if (error.code === 'auth/network-request-failed') errorMessage = 'Network error. Check your connection.';
        else if (error.code === 'auth/too-many-requests') errorMessage = 'Too many attempts. Try again later.';
        else errorMessage = error.message || 'Signup failed';

        Alert.alert('Error', errorMessage);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : '0'}
    >
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'login' && styles.activeTab]}
            onPress={() => setActiveTab('login')}
          >
            <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
            onPress={() => setActiveTab('signup')}
          >
            <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>Signup</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {activeTab === 'login' ? (
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email/Mobile Number <Text style={{ color: 'red' }}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Email / Mobile Number"
                  placeholderTextColor="#666"
                  value={loginForm.email}
                  onChangeText={(text) => {
                    setLoginForm({ ...loginForm, email: text });
                    const newErrors = {};
                    if (!text) {
                      newErrors.email = 'Email is required';
                    } else {
                      const hasLetters = /[a-zA-Z]/.test(text);
                      const hasNumbers = /\d/.test(text);
                      if (hasLetters && !hasNumbers) {
                        if (!text.includes('@')) newErrors.email = 'Please enter a valid email address (must contain @)';
                        else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(text)) newErrors.email = 'Invalid email address format';
                      } else if (hasNumbers && !hasLetters) {
                        const cleanNumber = text.replace(/\s/g, '');
                        if (!/^[6-9]\d{9}$/.test(cleanNumber)) newErrors.email = 'Invalid mobile number (10 digits starting with 6-9)';
                      } else if (hasLetters && hasNumbers) {
                        if (text.includes('@')) {
                          if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(text)) newErrors.email = 'Invalid email address format';
                        } else {
                          newErrors.email = 'Please enter either email address or mobile number';
                        }
                      } else {
                        newErrors.email = 'Please enter email address or mobile number';
                      }
                    }
                    setErrors({ ...errors, email: newErrors.email });
                  }}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password <Text style={{ color: 'red' }}>*</Text></Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    secureTextEntry={!showLoginPassword}
                    style={styles.passwordInput}
                    placeholder="Type your password"
                    placeholderTextColor="#666"
                    value={loginForm.password}
                    onChangeText={(text) => {
                      setLoginForm({ ...loginForm, password: text });
                      const newErrors = {};
                      if (!text) newErrors.password = 'Password is required';
                      else if (text.length < 8) newErrors.password = 'Password must be at least 8 characters';
                      else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(text))
                        newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
                      setErrors({ ...errors, password: newErrors.password });
                    }}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    <Ionicons 
                      name={showLoginPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              <View style={styles.rowBetween}>
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity onPress={() => setRememberMe(!rememberMe)}>
                    <Ionicons
                      name={rememberMe ? "checkbox" : "square-outline"}
                      size={20}
                      color="#007BFF"
                    />
                  </TouchableOpacity>
                  <Text style={styles.rememberText}>Remember Me</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPasswordScreen')}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleLoginSubmit}>
                <Text style={styles.primaryButtonText}>Login</Text>
              </TouchableOpacity>

              {loginError && <Text style={[styles.errorText, { marginTop: ms(5) }]}>{loginError}</Text>}

              <View style={styles.dividerWrapper}>
                <Text style={styles.dividerText}>— or —</Text>
              </View>
              <TouchableOpacity style={styles.googleCircle}>
                <Ionicons name="logo-google" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name <Text style={{ color: 'red' }}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Type your Name"
                  placeholderTextColor="#666"

                  value={signupForm.name}
                  onChangeText={(text) => {
                    setSignupForm({ ...signupForm, name: text });
                    setErrors({ ...errors, name: !text ? 'Name is required' : undefined });
                  }}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email/Mobile Number <Text style={{ color: 'red' }}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Email / Mobile Number"
                  placeholderTextColor="#666"
                  value={signupForm.email}
                  onChangeText={(text) => {
                    setSignupForm({ ...signupForm, email: text });
                    const newErrors = {};
                    if (!text) {
                      newErrors.email = 'Email is required';
                    } else {
                      const hasLetters = /[a-zA-Z]/.test(text);
                      const hasNumbers = /\d/.test(text);
                      if (hasLetters && !hasNumbers) {
                        if (!text.includes('@')) newErrors.email = 'Please enter a valid email address (must contain @)';
                        else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(text)) newErrors.email = 'Invalid email address format';
                      } else if (hasNumbers && !hasLetters) {
                        const cleanNumber = text.replace(/\s/g, '');
                        if (!/^[6-9]\d{9}$/.test(cleanNumber)) newErrors.email = 'Invalid mobile number (10 digits starting with 6-9)';
                      } else if (hasLetters && hasNumbers) {
                        if (text.includes('@')) {
                          if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(text)) newErrors.email = 'Invalid email address format';
                        } else {
                          newErrors.email = 'Please enter either email address or mobile number';
                        }
                      } else {
                        newErrors.email = 'Please enter email address or mobile number';
                      }
                    }
                    setErrors({ ...errors, email: newErrors.email });
                  }}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password <Text style={{ color: 'red' }}>*</Text></Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    secureTextEntry={!showSignupPassword}
                    style={styles.passwordInput}
                    placeholder="Type your password"
                    value={signupForm.password}
                    placeholderTextColor="#666"

                    onChangeText={(text) => {
                      setSignupForm({ ...signupForm, password: text });
                      setErrors({ ...errors, password: !text ? 'Password is required' : text.length < 8 ? 'Password must be at least 8 characters' : !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(text) ? 'Password must contain uppercase, lowercase, number, and special character' : undefined });
                    }}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowSignupPassword(!showSignupPassword)}
                  >
                    <Ionicons 
                      name={showSignupPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password <Text style={{ color: 'red' }}>*</Text></Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    secureTextEntry={!showConfirmPassword}
                    style={styles.passwordInput}
                    placeholder="Re-type your password"
                    value={signupForm.confirmPassword}
                    onChangeText={(text) => {
                      setSignupForm({ ...signupForm, confirmPassword: text });
                      setErrors({ ...errors, confirmPassword: !text ? 'Confirm Password is required' : signupForm.password !== text ? 'Passwords do not match' : undefined });
                    }}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleSignupSubmit}>
                <Text style={styles.primaryButtonText}>Submit</Text>
              </TouchableOpacity>

              <View style={styles.dividerWrapper}>
                <Text style={styles.dividerText}>— or —</Text>
              </View>
              <TouchableOpacity style={styles.googleCircle}>
                <Ionicons name="logo-google" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <View style={styles.footerContainer}>
          {/* <View style={styles.dividerLine} /> */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              {activeTab === 'login' ? "Don't have account? " : "Already have an account? "}
            </Text>
            <TouchableOpacity
              style={styles.footerButton}
              onPress={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
            >
              <Text style={styles.footerButtonText}>
                {activeTab === 'login' ? "Create an account" : "Login"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: Platform.OS === 'ios' ? ms(20) : ms(24),
    paddingTop: Platform.OS === 'ios' ? ms(40) : ms(40)
  },
  logoContainer: { alignItems: 'center', marginBottom: ms(10) },
  logo: {
    width: Platform.OS === 'ios' ? ms(180) : ms(200),
    height: Platform.OS === 'ios' ? ms(70) : ms(80)
  },
  tabContainer: { flexDirection: 'row', backgroundColor: '#eeeeee', borderRadius: ms(12), marginBottom: ms(10) },
  tab: { flex: 1, paddingVertical: ms(15), alignItems: 'center', borderRadius: ms(10) },
  activeTab: { backgroundColor: '#007BFF' },
  tabText: { fontSize: ms(14), fontWeight: '600', color: '#666' },
  activeTabText: { color: '#fff' },
  formCard: { paddingVertical: ms(5) },
  inputGroup: {},
  label: { fontSize: ms(14), color: '#8E8E93', marginBottom: ms(8) },
  input: { borderWidth: 1, borderColor: '#D1D9E6', borderRadius: ms(5), paddingVertical: ms(12), paddingHorizontal: ms(15), fontSize: ms(14), marginBottom: ms(20), color: '#000', backgroundColor: '#fff' },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D9E6',
    borderRadius: ms(5),
    backgroundColor: '#fff',
    marginBottom: ms(20),
  },
  passwordInput: {
    flex: 1,
    paddingVertical: ms(12),
    paddingHorizontal: ms(15),
    fontSize: ms(14),
    color: '#000',
  },
  eyeIcon: {
    paddingHorizontal: ms(15),
    paddingVertical: ms(12),
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: ms(15) },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  rememberText: { marginLeft: ms(8), color: '#8E8E93', fontSize: ms(14) },
  forgotText: { color: '#007BFF', fontSize: ms(14) },
  primaryButton: { backgroundColor: '#007BFF', paddingVertical: ms(15), borderRadius: ms(8), alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: ms(16), fontWeight: '600' },
  dividerWrapper: { alignItems: 'center', marginVertical: ms(20) },
  dividerText: { color: '#8E8E93', fontSize: ms(16) },
  googleCircle: { alignSelf: 'center', backgroundColor: '#EA4335', width: ms(60), height: ms(60), borderRadius: ms(30), justifyContent: 'center', alignItems: 'center', elevation: 3 },
  footerContainer: { paddingBottom: Platform.OS === 'ios' ? ms(50) : ms(30) },
  dividerLine: { height: 1, backgroundColor: '#E5E7EB', marginBottom: ms(20) },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  footerText: { fontSize: ms(14), color: '#8E8E93' },
  footerButton: { backgroundColor: '#007BFF', paddingHorizontal: ms(15), paddingVertical: ms(8), borderRadius: ms(6), marginLeft: ms(10) },
  footerButtonText: { color: '#fff', fontWeight: '600' },
  errorText: { color: '#FF0000', fontSize: ms(12), marginBottom: ms(10), marginTop: ms(-15) },
});