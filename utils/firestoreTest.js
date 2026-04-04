// utils/firestoreTest.js
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';

export const testFirestoreConnection = async () => {
  try {
    console.log('🔥 Testing Firestore connection...');
    console.log('🔥 DB instance:', db);
    
    // Test 1: Try to write a test document
    const testCollection = collection(db, 'test');
    const testDoc = await addDoc(testCollection, {
      message: 'Test comment',
      timestamp: serverTimestamp(),
      test: true
    });
    
    console.log('✅ Test document written:', testDoc.id);
    
    // Test 2: Try to read documents
    const querySnapshot = await getDocs(testCollection);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('✅ Documents read:', docs.length);
    console.log('✅ All test documents:', docs);
    
    return { success: true, testId: testDoc.id };
  } catch (error) {
    console.error('❌ Firestore test failed:', error);
    console.error('❌ Error details:', error.code, error.message);
    return { success: false, error: error.message };
  }
};
