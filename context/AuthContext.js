// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user session on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // Check Firebase auth state
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in with Firebase
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            emailVerified: firebaseUser.emailVerified
          };
          
          // Check if we have additional user data in AsyncStorage
          const storedUserData = await AsyncStorage.getItem('userData');
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            setUser({ ...userData, ...parsedData });
          } else {
            setUser(userData);
          }
        } else {
          // Check if we have a stored session (for backward compatibility)
          const storedUser = await AsyncStorage.getItem('userToken');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
            } catch (error) {
              console.error('Error parsing stored user data:', error);
              await AsyncStorage.removeItem('userToken');
            }
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error checking auth state:', error);
      setLoading(false);
    }
  };

  const login = async (userData) => {
    try {
      await AsyncStorage.setItem('userToken', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Sign out from Firebase if authenticated
      if (auth.currentUser) {
        await auth.signOut();
      }
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const updateUser = async (userData) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(prev => ({ ...prev, ...userData }));
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
