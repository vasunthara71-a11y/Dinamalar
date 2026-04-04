// debugFirestore.js - Simple test to verify Firestore setup
import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

const testFirestore = async () => {
  console.log('🔥 Starting Firestore debug test...');
  console.log('🔥 Database instance:', db);
  
  try {
    // Test 1: Create a test document
    const testRef = collection(db, 'debugTest');
    const docRef = await addDoc(testRef, {
      message: 'Test message from debug script',
      timestamp: serverTimestamp(),
      test: true,
      app: 'Dinamalar Comments Debug'
    });
    
    console.log('✅ Test document created with ID:', docRef.id);
    
    // Test 2: Read the document back
    const snapshot = await getDocs(testRef);
    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('✅ Documents retrieved:', docs.length);
    console.log('✅ Retrieved documents:', docs);
    
    if (docs.length > 0) {
      console.log('🎉 Firestore is working correctly!');
      return true;
    } else {
      console.log('❌ No documents found in Firestore');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Firestore debug test failed:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    return false;
  }
};

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  testFirestore();
}

export { testFirestore };
