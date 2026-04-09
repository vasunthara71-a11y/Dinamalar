import * as Linking from 'expo-linking';

const linking = {
  prefixes: [
    'https://www.dinamalar.com',
    'https://dinamalar.com',
    'dinamalar://',
    Linking.createURL('/'),  // for Expo Go testing
  ],
  config: {
    initialRouteName: 'Home',
    screens: {
      Home: '',

      // Videos Screen Deep Link (for video list)
      VideosScreen: {
        path: 'videos/:id',
        parse: {
          id: (id) => String(id),
        },
      },

      // VideoDetailScreen Deep Link (Universal Links)
      VideoDetailScreen: {
        path: 'video/:videoId',
        parse: {
          videoId: (videoId) => String(videoId),
        },
      },
    },
  },
};

export default linking;