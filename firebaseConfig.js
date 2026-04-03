// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyCY6Mty-tmx4nJ6SFGmCMUSHpQe_YmsMP8",
  authDomain:        "dmrmobileapp.firebaseapp.com",
  projectId:         "dmrmobileapp",
  storageBucket:     "dmrmobileapp.firebasestorage.app",
  messagingSenderId: "636469607657",
  appId:             "1:636469607657:web:418ab9ffc9e4e20f118478"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);