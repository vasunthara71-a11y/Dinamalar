// services/firestoreService.js
import { db } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  increment 
} from 'firebase/firestore';

// Collections
const COMMENTS_COLLECTION = 'comments';
const REPLIES_COLLECTION = 'replies';
const LIKES_COLLECTION = 'commentLikes';
const DISLIKES_COLLECTION = 'commentDislikes';

// ─── Comments Service ───────────────────────────────────────────────────────

/**
 * Save a new comment to Firestore
 */
export const saveCommentToFirestore = async (newsId, commentData) => {
  try {
    console.log('🔥 FIRESTORE: Attempting to save comment:', { newsId, commentData });
    
    const commentRef = collection(db, COMMENTS_COLLECTION);
    const docRef = await addDoc(commentRef, {
      ...commentData,
      newsId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likeCount: 0,
      dislikeCount: 0
    });
    
    console.log('✅ FIRESTORE: Comment saved successfully:', docRef.id);
    return { id: docRef.id, ...commentData };
  } catch (error) {
    console.error('❌ FIRESTORE: Error saving comment to Firestore:', error);
    throw error;
  }
};

/**
 * Get comments for a specific news article
 */
export const getCommentsFromFirestore = async (newsId) => {
  try {
    const commentsQuery = query(
      collection(db, COMMENTS_COLLECTION),
      where('newsId', '==', newsId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(commentsQuery);
    const comments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Retrieved ${comments.length} comments for newsId: ${newsId}`);
    return comments;
  } catch (error) {
    console.error('Error getting comments from Firestore:', error);
    return [];
  }
};

/**
 * Update comment like/dislike counts
 */
export const updateCommentEngagement = async (commentId, engagementType) => {
  try {
    console.log('🔥 FIRESTORE: updateCommentEngagement called', { commentId, engagementType });
    
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    console.log('🔥 FIRESTORE: Comment ref created:', commentId);
    console.log('🔥 FIRESTORE: Full document path:', `comments/${commentId}`);
    
    if (engagementType === 'like') {
      console.log('🔥 FIRESTORE: Incrementing like count...');
      await updateDoc(commentRef, {
        likeCount: increment(1),
        updatedAt: serverTimestamp()
      });
      console.log('🔥 FIRESTORE: Like count incremented successfully');
    } else if (engagementType === 'dislike') {
      console.log('🔥 FIRESTORE: Incrementing dislike count...');
      await updateDoc(commentRef, {
        dislikeCount: increment(1),
        updatedAt: serverTimestamp()
      });
      console.log('🔥 FIRESTORE: Dislike count incremented successfully');
    }
    
    console.log(`✅ FIRESTORE: Updated ${engagementType} count for comment: ${commentId}`);
  } catch (error) {
    console.error(`❌ FIRESTORE: Error updating ${engagementType} count:`, error);
    console.error('❌ FIRESTORE: Error details:', {
      commentId,
      engagementType,
      errorCode: error.code,
      errorMessage: error.message
    });
    throw error;
  }
};

// ─── Replies Service ───────────────────────────────────────────────────────

/**
 * Save a new reply to Firestore
 */
export const saveReplyToFirestore = async (parentCommentId, replyData) => {
  try {
    const repliesRef = collection(db, REPLIES_COLLECTION);
    const docRef = await addDoc(repliesRef, {
      ...replyData,
      parentCommentId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likeCount: 0,
      dislikeCount: 0
    });
    
    console.log('Reply saved to Firestore:', docRef.id);
    return { id: docRef.id, ...replyData };
  } catch (error) {
    console.error('Error saving reply to Firestore:', error);
    throw error;
  }
};

/**
 * Get replies for a specific comment
 */
export const getRepliesFromFirestore = async (parentCommentId) => {
  try {
    const repliesQuery = query(
      collection(db, REPLIES_COLLECTION),
      where('parentCommentId', '==', parentCommentId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(repliesQuery);
    const replies = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Retrieved ${replies.length} replies for comment: ${parentCommentId}`);
    return replies;
  } catch (error) {
    console.error('Error getting replies from Firestore:', error);
    return [];
  }
};

// ─── User Engagement Tracking ───────────────────────────────────────────────

/**
 * Track user like/dislike for a comment
 */
export const trackUserEngagement = async (userId, commentId, engagementType) => {
  try {
    console.log('🔥 FIRESTORE: Starting trackUserEngagement', { userId, commentId, engagementType });
    
    const collectionName = engagementType === 'like' ? LIKES_COLLECTION : DISLIKES_COLLECTION;
    const engagementRef = collection(db, collectionName);
    
    // Check if user already engaged with this comment
    const existingQuery = query(
      engagementRef,
      where('userId', '==', userId),
      where('commentId', '==', commentId)
    );
    
    console.log('🔥 FIRESTORE: Checking existing engagement...');
    const querySnapshot = await getDocs(existingQuery);
    console.log('🔥 FIRESTORE: Query snapshot empty:', querySnapshot.empty);
    console.log('🔥 FIRESTORE: Docs found:', querySnapshot.docs.length);
    
    if (querySnapshot.empty) {
      // User hasn't engaged before, add new engagement
      console.log('🔥 FIRESTORE: Adding new engagement...');
      await addDoc(engagementRef, {
        userId,
        commentId,
        createdAt: serverTimestamp()
      });
      
      // Update comment engagement count
      console.log('🔥 FIRESTORE: Updating comment engagement count...');
      await updateCommentEngagement(commentId, engagementType);
      
      console.log(`User ${userId} ${engagementType}d comment: ${commentId}`);
      return { success: true, action: 'added' };
    } else {
      // User already engaged, remove engagement and decrement count
      console.log('🔥 FIRESTORE: Removing existing engagement...');
      const docId = querySnapshot.docs[0].id;
      await deleteDoc(doc(engagementRef, docId));
      
      // Update comment engagement count (decrement)
      const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
      if (engagementType === 'like') {
        await updateDoc(commentRef, {
          likeCount: increment(-1),
          updatedAt: serverTimestamp()
        });
      } else if (engagementType === 'dislike') {
        await updateDoc(commentRef, {
          dislikeCount: increment(-1),
          updatedAt: serverTimestamp()
        });
      }
      
      console.log(`User ${userId} removed ${engagementType} from comment: ${commentId}`);
      return { success: true, action: 'removed' };
    }
  } catch (error) {
    console.error('❌ FIRESTORE: Error tracking user engagement:', error);
    return { success: false, error };
  }
};

/**
 * Get user's engagement history for a comment
 */
export const getUserEngagementForComment = async (userId, commentId) => {
  try {
    const likesQuery = query(
      collection(db, LIKES_COLLECTION),
      where('userId', '==', userId),
      where('commentId', '==', commentId)
    );
    
    const likesSnapshot = await getDocs(likesQuery);
    const hasLiked = !likesSnapshot.empty;
    
    const dislikesQuery = query(
      collection(db, DISLIKES_COLLECTION),
      where('userId', '==', userId),
      where('commentId', '==', commentId)
    );
    
    const dislikesSnapshot = await getDocs(dislikesQuery);
    const hasDisliked = !dislikesSnapshot.empty;
    
    return {
      hasLiked,
      hasDisliked,
      likeCount: likesSnapshot.size,
      dislikeCount: dislikesSnapshot.size
    };
  } catch (error) {
    console.error('Error getting user engagement:', error);
    return { hasLiked: false, hasDisliked: false };
  }
};

// ─── Analytics & Stats ───────────────────────────────────────────────────────

/**
 * Get comment statistics for a news article
 */
export const getCommentStats = async (newsId) => {
  try {
    const commentsQuery = query(
      collection(db, COMMENTS_COLLECTION),
      where('newsId', '==', newsId)
    );
    
    const querySnapshot = await getDocs(commentsQuery);
    const comments = querySnapshot.docs.map(doc => doc.data());
    
    const totalComments = comments.length;
    const totalLikes = comments.reduce((sum, comment) => sum + (comment.likeCount || 0), 0);
    const totalDislikes = comments.reduce((sum, comment) => sum + (comment.dislikeCount || 0), 0);
    
    return {
      totalComments,
      totalLikes,
      totalDislikes,
      engagementRate: totalComments > 0 ? ((totalLikes + totalDislikes) / totalComments) : 0
    };
  } catch (error) {
    console.error('Error getting comment stats:', error);
    return {
      totalComments: 0,
      totalLikes: 0,
      totalDislikes: 0,
      engagementRate: 0
    };
  }
};

/**
 * Get user's comment history
 */
export const getUserCommentHistory = async (userId, limit = 20) => {
  try {
    const commentsQuery = query(
      collection(db, COMMENTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(commentsQuery);
    const comments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Retrieved ${comments.length} comments for user: ${userId}`);
    return comments;
  } catch (error) {
    console.error('Error getting user comment history:', error);
    return [];
  }
};
