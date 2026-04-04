import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { s, vs, ms } from '../utils/scaling';
import { FONTS, COLORS } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';

export default function CommentUserForm({ 
  userName, 
  userEmail, 
  onUserNameChange, 
  onUserEmailChange, 
  onSubmit, 
  onCancel, 
  onBack,
  loading = false,
  commentText = '',
  onCommentChange
}) {
  const { sf } = useFontSize();
  const [errors, setErrors] = useState({ name: '', email: '' });

  const validateAndSubmit = () => {
    const newErrors = { name: '', email: '' };
    
    if (!userName.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!userEmail.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    setErrors(newErrors);
    
    if (!newErrors.name && !newErrors.email) {
      onSubmit();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.kavWrap}
      keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 34}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={sf(24)} color="#333" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: sf(18) }]}>
            Enter Your Details
          </Text>
          <TouchableOpacity
            onPress={onCancel}
            style={styles.cancelBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={sf(24)} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Form Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontSize: sf(14) }]}>Your Name:</Text>
              <TextInput
                style={[styles.input, errors.name ? styles.inputError : {}]}
                placeholder="Enter your name"
                placeholderTextColor="#bbb"
                value={userName}
                onChangeText={(text) => {
                  onUserNameChange(text);
                  if (errors.name) {
                    setErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                maxLength={50}
                autoFocus
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            <View style={[styles.inputGroup, { marginTop: vs(16) }]}>
              <Text style={[styles.label, { fontSize: sf(14) }]}>Email:</Text>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : {}]}
                placeholder="Enter your email address"
                placeholderTextColor="#bbb"
                value={userEmail}
                onChangeText={(text) => {
                  onUserEmailChange(text);
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                maxLength={100}
                keyboardType="email-address"
                autoCapitalize="none"
                onSubmitEditing={validateAndSubmit}
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={[styles.inputGroup, { marginTop: vs(16) }]}>
              <Text style={[styles.label, { fontSize: sf(14) }]}>Your Comment:</Text>
              <TextInput
                style={[styles.commentInput]}
                placeholder="Share your thoughts..."
                placeholderTextColor="#bbb"
                value={commentText}
                onChangeText={onCommentChange}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.clearBtn, { marginRight: s(8) }]}
            onPress={() => {
              onUserNameChange('');
              onUserEmailChange('');
              onCommentChange('');
              setErrors({ name: '', email: '' });
            }}
            disabled={loading}
          >
            <Text style={[styles.clearBtnText, { fontSize: sf(16) }]}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.postBtn, (!userName.trim() || !userEmail.trim() || loading) && styles.postBtnDisabled]}
            onPress={validateAndSubmit}
            disabled={!userName.trim() || !userEmail.trim() || loading}
          >
            {loading ? (
              <Text style={[styles.postBtnText, { fontSize: sf(16) }]}>Posting...</Text>
            ) : (
              <Text style={[styles.postBtnText, { fontSize: sf(16) }]}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kavWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: s(20),
    borderTopRightRadius: s(20),
    paddingBottom: Platform.OS === 'ios' ? vs(34) : vs(10),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(12),
    paddingVertical: vs(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    padding: s(8),
  },
  headerTitle: {
    fontFamily: FONTS.muktaMalar.semibold,
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  cancelBtn: {
    padding: s(8),
  },
  formContent: {
    paddingHorizontal: s(16),
    paddingVertical: vs(20),
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: vs(20),
  },
  inputGroup: {
    marginBottom: vs(8),
  },
  label: {
    fontFamily: FONTS.muktaMalar.medium,
    color: '#333',
    marginBottom: vs(8),
  },
  input: {
    flex: 1,
    height: vs(44),
    backgroundColor: '#fff',
    borderRadius: s(8),
    paddingHorizontal: s(14),
    fontSize: ms(14),
    fontFamily: FONTS.muktaMalar.regular,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  commentInput: {
    flex: 1,
    height: vs(100),
    backgroundColor: '#fff',
    borderRadius: s(8),
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    fontSize: ms(14),
    fontFamily: FONTS.muktaMalar.regular,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  errorText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: '#ff4444',
    fontSize: ms(12),
    marginTop: vs(4),
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: s(16),
    paddingVertical: vs(16),
    gap: s(8),
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  clearBtn: {
    height: vs(44),
    paddingHorizontal: s(20),
    borderRadius: s(8),
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    fontFamily: FONTS.muktaMalar.medium,
    color: '#666',
  },
  postBtn: {
    flex: 1,
    height: vs(44),
    borderRadius: s(8),
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postBtnDisabled: {
    backgroundColor: '#ccc',
  },
  postBtnText: {
    fontFamily: FONTS.muktaMalar.semibold,
    color: '#fff',
  },
});
