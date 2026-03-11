import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import FontSizeControl from '../components/FontSizeControl';
import { useFontSize } from '../context/FontSizeContext';

const ProfileScreen = () => {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const { sf, ss, sv, sh } = useFontSize();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={[styles.avatarText, { fontSize: sf(32) }]}>பி</Text>
        </View>
        <Text style={[styles.userName, { fontSize: sf(20) }]}>பயனர்</Text>
        <Text style={[styles.userEmail, { fontSize: sf(14) }]}>user@dinamalar.com</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: sf(16) }]}>சேமித்த செய்திகள்</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={[styles.menuText, { fontSize: sf(16) }]}>புக்மார்க் செய்தவை</Text>
          <Text style={[styles.arrow, { fontSize: sf(20) }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={[styles.menuText, { fontSize: sf(16) }]}>வாசித்த செய்திகள்</Text>
          <Text style={[styles.arrow, { fontSize: sf(20) }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: sf(16) }]}>அமைப்புகள்</Text>
        <View style={styles.menuItem}>
          <Text style={[styles.menuText, { fontSize: sf(16) }]}>அறிவிப்புகள்</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>
        <View style={styles.menuItem}>
          <Text style={[styles.menuText, { fontSize: sf(16) }]}>இருண்ட பயன்முறை</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </View>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={[styles.menuText, { fontSize: sf(16) }]}>மொழி</Text>
          <Text style={[styles.menuValue, { fontSize: sf(16) }]}>தமிழ்</Text>
        </TouchableOpacity>
        <View style={styles.fontControlContainer}>
          <Text style={[styles.menuText, { fontSize: sf(16) }]}>எழுத்து அளவு</Text>
          <FontSizeControl />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={[styles.menuText, { fontSize: sf(16) }]}>எங்களைப் பற்றி</Text>
          <Text style={[styles.arrow, { fontSize: sf(20) }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={[styles.menuText, { fontSize: sf(16) }]}>தனியுரிமைக் கொள்கை</Text>
          <Text style={[styles.arrow, { fontSize: sf(20) }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={[styles.menuText, { fontSize: sf(16) }]}>நிபந்தனைகள்</Text>
          <Text style={[styles.arrow, { fontSize: sf(20) }]}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.logoutButton,  ]}>
        <Text style={[styles.logoutText, { fontSize: sf(16) }]}>வெளியேறு</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#d32f2f',
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  userName: {
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  userEmail: {
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    color: '#333',
  },
  menuValue: {
    color: '#666',
  },
  arrow: {
    color: '#666',
  },
  fontControlContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoutButton: {
    backgroundColor: '#d32f2f',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;