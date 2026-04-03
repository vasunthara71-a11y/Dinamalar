import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import VideosScreen from '../screens/VideosScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TimelineScreen from '../screens/TimelineScreen';
import NewsDetailsScreen from '../screens/NewsDetailsScreen';
import TharpothaiyaSeithigalScreen from '../screens/TharpothaiyaSeithigalScreen';
import CategoryNewsScreen from '../screens/CategoryNewsScreen';
import IndiaScreen from '../screens/IndiaScreen';
import TamilNaduScreen from '../screens/TamilNaduScreen';
import WorldScreen from '../screens/WorldScreen';
import DinamalarTVScreen from '../screens/DinamalarTVScreen';
import TabNavigator from './TabNavigator';
import ThirukkuralScreen from "../screens/ThirukkuralScreen";
import KadalThamaraiScreen from "../screens/KadalThamaraiScreen";
import VarthagamScreen from '../screens/VarthagamScreen';
import SportsScreen from '../screens/SportsScreen';
import DistrictNewsScreen from '../screens/DistrictNewsScreen';
 import CommonSectionScreen from '../screens/CommonSectionScreen';
import RasiDetailScreen from '../screens/RasiDetailScreen';
import PhotoDetailsScreen from '../screens/PhotoDetailsScreen';
import ShortNewsSwiperScreen from '../screens/ShortNewsSwiperScreen';
import VideoDetailScreen from '../screens/VideoDetailScreen';
import PodcastPlayer from '../screens/PodcastPlayer';
import CommodityScreen from '../screens/CommodityScreen';
import BookmarkListScreen from '../screens/BookmarkListScreen';
import AuthorScreen from '../screens/AuthorScreen';
import TagsScreen from '../screens/TagsScreen';
import SpecialTodayScreen from '../screens/SpecialTodayScreen';
import EditorChoiceScreen from '../screens/EditorChoiceScreen';
import linking from './linking';
import FeedbackForm from '../screens/FeedbackForm';
import LoginScreen from '../screens/Auth/LoginScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
// import SignupScreen from '../screens/Auth/SignUpScreen';
   
const Stack = createNativeStackNavigator();

// Stack Navigator for individual screens
const AppNavigator = () => {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="LoginScreen"
      >
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="SearchScreen" component={SearchScreen} />
        <Stack.Screen name="VideosScreen" component={VideosScreen} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        
        {/* Additional screens for navigation */}
        <Stack.Screen name="NewsDetailsScreen" component={NewsDetailsScreen} />
        <Stack.Screen name="NotificationScreen" component={HomeScreen} />
        <Stack.Screen name="VideoScreen" component={VideosScreen} />
        <Stack.Screen name="PodcastScreen" component={HomeScreen} />
        <Stack.Screen name="IpaperScreen" component={HomeScreen} />
        <Stack.Screen name="BooksScreen" component={HomeScreen} />
        <Stack.Screen name="SubscriptionScreen" component={ProfileScreen} />
        <Stack.Screen name="ThirukkuralScreen" component={ThirukkuralScreen} />
        <Stack.Screen name="KadalThamaraiScreen" component={KadalThamaraiScreen} />
        <Stack.Screen name="TimelineScreen" component={TimelineScreen} />
        <Stack.Screen name="TharpothaiyaSeithigalScreen" component={TharpothaiyaSeithigalScreen} />
        <Stack.Screen name="IndiaScreen" component={IndiaScreen} />
        <Stack.Screen name="TamilNaduScreen" component={TamilNaduScreen} />
        <Stack.Screen name="WorldScreen" component={WorldScreen} />
        <Stack.Screen name="DinamalarTVScreen" component={DinamalarTVScreen} />
        {/* <Stack.Screen name="CategoryNewsScreen" component={CategoryNewsScreen} /> */}
        <Stack.Screen name="CategoryNewsScreen" component={HomeScreen} />
        <Stack.Screen name="Settings" component={ProfileScreen} />
        <Stack.Screen name="VarthagamScreen" component={VarthagamScreen}/>
        <Stack.Screen name="About" component={ProfileScreen} />
        <Stack.Screen name='SportsScreen' component={SportsScreen}/>
        <Stack.Screen name='DistrictNewsScreen' component={DistrictNewsScreen}/>
 
         <Stack.Screen name='CommonSectionScreen' component={CommonSectionScreen}/>
        <Stack.Screen name='RasiDetailScreen' component={RasiDetailScreen}/>
        <Stack.Screen name='PhotoDetailsScreen' component={PhotoDetailsScreen}/>
        <Stack.Screen name='ShortNewsSwiperScreen' component={ShortNewsSwiperScreen}/>
        <Stack.Screen name='VideoDetailScreen' component={VideoDetailScreen}/>
        <Stack.Screen name='PodcastPlayer' component={PodcastPlayer}/>
        <Stack.Screen name='CommodityScreen' component={CommodityScreen}/>
        <Stack.Screen name='BookmarkListScreen' component={BookmarkListScreen}/>
        <Stack.Screen name='AuthorScreen' component={AuthorScreen}/>
        <Stack.Screen name='TagsScreen' component={TagsScreen}/>
        <Stack.Screen name='SpecialTodayScreen' component={SpecialTodayScreen}/>
        <Stack.Screen name='EditorChoiceScreen' component={EditorChoiceScreen}/>
        <Stack.Screen name='FeedbackFormScreen' component={FeedbackForm}/>


        <Stack.Screen name='LoginScreen' component={LoginScreen}/>
        <Stack.Screen name='ForgotPasswordScreen' component={ForgotPasswordScreen}/>
        {/* <Stack.Screen name='SignupScreen' component={SignupScreen}/> */}

        
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
