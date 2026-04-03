import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Platform, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ms } from 'react-native-size-matters';

export default function LoginScreen() {
    const [activeTab, setActiveTab] = useState('login');
    const [rememberMe, setRememberMe] = useState(true);

    // Form states
    const [loginForm, setLoginForm] = useState({
        username: '',
        password: ''
    });
    const [signupForm, setSignupForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});

    const validateLoginForm = () => {
        const newErrors = {};
        if (!loginForm.username) {
            newErrors.username = 'Username is required';
        } else {
            // Check if input contains letters (English characters)
            const hasLetters = /[a-zA-Z]/.test(loginForm.username);
            // Check if input contains numbers
            const hasNumbers = /\d/.test(loginForm.username);
            
            if (hasLetters && !hasNumbers) {
                // User entered letters only - validate as email
                if (!loginForm.username.includes('@')) {
                    newErrors.username = 'Please enter a valid email address (must contain @)';
                } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(loginForm.username)) {
                    newErrors.username = 'Invalid email address format';
                }
            } else if (hasNumbers && !hasLetters) {
                // User entered numbers only - validate as mobile number
                const cleanNumber = loginForm.username.replace(/\s/g, '');
                if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
                    newErrors.username = 'Invalid mobile number (10 digits starting with 6-9)';
                }
            } else if (hasLetters && hasNumbers) {
                // User entered mixed characters - check if it's email
                if (loginForm.username.includes('@')) {
                    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(loginForm.username)) {
                        newErrors.username = 'Invalid email address format';
                    }
                } else {
                    newErrors.username = 'Please enter either email address or mobile number';
                }
            } else {
                // No valid characters
                newErrors.username = 'Please enter email address or mobile number';
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
        if (!signupForm.name) {
            newErrors.name = 'Name is required';
        }
        if (!signupForm.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(signupForm.email)) {
            newErrors.email = 'Invalid email address';
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

    const handleLoginSubmit = () => {
        if (validateLoginForm()) {
            // Login API call
        }
    };

    const handleSignupSubmit = () => {
        if (validateSignupForm()) {
            // Signup API call
        }
    };

    return (
        <View style={styles.container}>
            {/* Dinamalar Pavala Vizha Logo */}
            <View style={styles.logoContainer}>
                <Image 
                    source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
            
            {/* Tab Navigation - Kept as per your requirement */}
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

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {activeTab === 'login' ? (
                    <View style={styles.formCard}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Username</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Email / Mobile Number"
                                placeholderTextColor="#666"
                                value={loginForm.username}
                                onChangeText={(text) => {
                                    setLoginForm({...loginForm, username: text});
                                    const newErrors = {};
                                    if (!text) {
                                        newErrors.username = 'Username is required';
                                    } else {
                                        // Check if input contains letters (English characters)
                                        const hasLetters = /[a-zA-Z]/.test(text);
                                        // Check if input contains numbers
                                        const hasNumbers = /\d/.test(text);
                                        
                                        if (hasLetters && !hasNumbers) {
                                            // User entered letters only - validate as email
                                            if (!text.includes('@')) {
                                                newErrors.username = 'Please enter a valid email address (must contain @)';
                                            } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(text)) {
                                                newErrors.username = 'Invalid email address format';
                                            }
                                        } else if (hasNumbers && !hasLetters) {
                                            // User entered numbers only - validate as mobile number
                                            const cleanNumber = text.replace(/\s/g, '');
                                            if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
                                                newErrors.username = 'Invalid mobile number (10 digits starting with 6-9)';
                                            }
                                        } else if (hasLetters && hasNumbers) {
                                            // User entered mixed characters - check if it's email
                                            if (text.includes('@')) {
                                                if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(text)) {
                                                    newErrors.username = 'Invalid email address format';
                                                }
                                            } else {
                                                newErrors.username = 'Please enter either email address or mobile number';
                                            }
                                        } else {
                                            // No valid characters
                                            newErrors.username = 'Please enter email address or mobile number';
                                        }
                                    }
                                    setErrors({...errors, username: newErrors.username});
                                }}
                            />
                            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                secureTextEntry
                                style={styles.input}
                                placeholder="Type your password"
                                placeholderTextColor="#000"
                                value={loginForm.password}
                                onChangeText={(text) => {
                                    setLoginForm({...loginForm, password: text});
                                    const newErrors = {};
                                    if (!text) {
                                        newErrors.password = 'Password is required';
                                    } else if (text.length < 8) {
                                        newErrors.password = 'Password must be at least 8 characters';
                                    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(text)) {
                                        newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
                                    }
                                    setErrors({...errors, password: newErrors.password});
                                }}
                            />
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        <View style={styles.rowBetween}>
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setRememberMe(!rememberMe)}
                            >
                                <Ionicons
                                    name={rememberMe ? "checkbox" : "square-outline"}
                                    size={24}
                                    color="#1D4ED8"
                                />
                                <Text style={styles.rememberText}>Remember me</Text>
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Text style={styles.forgotText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={[styles.primaryButton,{marginTop:ms(25)}]} onPress={handleLoginSubmit}>
                            <Text style={styles.primaryButtonText}>Log In</Text>
                        </TouchableOpacity>

                        <View style={styles.dividerWrapper}>
                            <Text style={styles.dividerText}>— or —</Text>
                        </View>

                        <TouchableOpacity style={styles.googleCircle}>
                            <Ionicons name="logo-google" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.formCard}>
                        {/* <Text style={styles.signupHeader}>Sign Up</Text> */}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name <Text style={{ color: 'red' }}>*</Text></Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Type your Name"
                                value={signupForm.name}
                                onChangeText={(text) => {
                                    setSignupForm({...signupForm, name: text});
                                    const newErrors = {};
                                    if (!text) {
                                        newErrors.name = 'Name is required';
                                    }
                                    setErrors({...errors, name: newErrors.name});
                                }}
                            />
                            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mobile Number or Email ID <Text style={{ color: 'red' }}>*</Text></Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Type your Mobile Number or Email"
                                value={signupForm.email}
                                onChangeText={(text) => {
                                    setSignupForm({...signupForm, email: text});
                                    const newErrors = {};
                                    if (!text) {
                                        newErrors.email = 'Email is required';
                                    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(text)) {
                                        newErrors.email = 'Invalid email address';
                                    }
                                    setErrors({...errors, email: newErrors.email});
                                }}
                            />
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password <Text style={{ color: 'red' }}>*</Text></Text>
                            <TextInput 
                                secureTextEntry 
                                style={styles.input} 
                                placeholder="Type your password"
                                value={signupForm.password}
                                onChangeText={(text) => {
                                    setSignupForm({...signupForm, password: text});
                                    const newErrors = {};
                                    if (!text) {
                                        newErrors.password = 'Password is required';
                                    } else if (text.length < 8) {
                                        newErrors.password = 'Password must be at least 8 characters';
                                    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(text)) {
                                        newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
                                    }
                                    setErrors({...errors, password: newErrors.password});
                                }}
                            />
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm Password <Text style={{ color: 'red' }}>*</Text></Text>
                            <TextInput 
                                secureTextEntry 
                                style={styles.input} 
                                placeholder="Re-type your password"
                                value={signupForm.confirmPassword}
                                onChangeText={(text) => {
                                    setSignupForm({...signupForm, confirmPassword: text});
                                    const newErrors = {};
                                    if (!text) {
                                        newErrors.confirmPassword = 'Confirm Password is required';
                                    } else if (signupForm.password !== text) {
                                        newErrors.confirmPassword = 'Passwords do not match';
                                    }
                                    setErrors({...errors, confirmPassword: newErrors.confirmPassword});
                                }}
                            />
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

            {/* Footer matches the blue button style in screenshot */}
            <View style={styles.footerContainer}>
                <View style={styles.dividerLine} />
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    logo: {
        width: 200,
        height: 80,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#eeeeee',
        borderRadius: 12,
        // padding: 4,
        marginBottom: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#007BFF', // Match screenshot blue
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#fff',
    },
    formCard: {
        paddingVertical: 10,
    },
    signupHeader: {
        fontSize: 20,
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D9E6',
        borderRadius: 5,
        paddingVertical: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 20,
        color: '#000',
        backgroundColor: '#fff', // White background for better contrast
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical:ms(15)
     },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rememberText: {
        marginLeft: 8,
        color: '#8E8E93',
        fontSize: 16,
    },
    forgotText: {
        color: '#007BFF',
        fontSize: 16,
    },
    primaryButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    dividerWrapper: {
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerText: {
        color: '#8E8E93',
        fontSize: 16,
    },
    googleCircle: {
        alignSelf: 'center',
        backgroundColor: '#EA4335', // Google Red
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    footerContainer: {
        paddingBottom: 20,
    },
    dividerLine: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginBottom: 20,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 16,
        color: '#8E8E93',
    },
    footerButton: {
        backgroundColor: '#007BFF',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
        marginLeft: 10,
    },
    footerButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    inputError: {
        borderColor: '#FF0000',
        borderWidth: 2,
    },
    errorText: {
        color: '#FF0000',
        fontSize: 12,
        marginTop: -15,
        marginBottom: 10,
    },
});