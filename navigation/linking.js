import * as Linking from 'expo-linking';

const linking = {
  prefixes: [
    'dinamalar://',
    'https://www.dinamalar.com',
    Linking.createURL('/'),  // for Expo Go testing
  ],
  config: {
    initialRouteName: 'Home',
    screens: {
      Home: '',

      // ✅ More specific route MUST come before the general one
      PhotoDetails: {
        path: 'photo/:catid/:eventid',
        parse: {
          catid: (catid) => String(catid),
          eventid: (eventid) => Number(eventid),
        },
      },

      PhotoAlbum: {
        path: 'photo/:catid',
        parse: {
          catid: (catid) => String(catid),
        },
      },
    },
  },
};

export default linking;