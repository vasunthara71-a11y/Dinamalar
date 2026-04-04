// utils/commentStorage.js
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'dinamalar_comments';
const USER_NAME_KEY = 'dinamalar_user_name';
const USER_EMAIL_KEY = 'dinamalar_user_email';

// Generate unique ID for comments
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get all comments from local storage
export const getAllComments = async () => {
  try {
    const comments = await SecureStore.getItemAsync(STORAGE_KEY);
    return comments ? JSON.parse(comments) : {};
  } catch (error) {
    console.error('Error getting comments from storage:', error);
    return {};
  }
};

// Get comments for a specific news article
export const getCommentsForNews = async (newsId) => {
  try {
    const allComments = await getAllComments();
    return allComments[newsId] || [];
  } catch (error) {
    console.error('Error getting comments for news:', error);
    return [];
  }
};

// Save all comments to local storage
export const saveAllComments = async (comments) => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(comments));
    return true;
  } catch (error) {
    console.error('Error saving comments to storage:', error);
    return false;
  }
};

// Add a new comment to a news article
export const addComment = async (newsId, comment) => {
  try {
    const allComments = await getAllComments();
    const newsComments = allComments[newsId] || [];
    
    const newComment = {
      id: generateId(),
      ...comment,
      timestamp: new Date().toISOString(),
      ago: 'இப்போது',
      standarddate: new Date().toLocaleDateString('ta-IN'),
      com_like: 0,
      com_dislike: 0,
      reply: []
    };
    
    newsComments.unshift(newComment);
    allComments[newsId] = newsComments;
    
    await saveAllComments(allComments);
    return newComment;
  } catch (error) {
    console.error('Error adding comment:', error);
    return null;
  }
};

// Add a reply to a comment
export const addReply = async (newsId, parentCommentId, reply) => {
  try {
    const allComments = await getAllComments();
    const newsComments = allComments[newsId] || [];
    
    const parentComment = newsComments.find(c => c.id === parentCommentId);
    
    // If parent comment not found in local storage, create it with the reply
    if (!parentComment) {
      const newParentComment = {
        id: parentCommentId,
        name: 'Unknown User',
        comments: '',
        text: '',
        reply: []
      };
      
      const newReply = {
        id: generateId(),
        ...reply,
        timestamp: new Date().toISOString(),
        ago: 'இப்போது',
        standarddate: new Date().toLocaleDateString('ta-IN'),
        com_like: 0,
        com_dislike: 0
      };
      
      newParentComment.reply = [newReply];
      newsComments.push(newParentComment);
      allComments[newsId] = newsComments;
      await saveAllComments(allComments);
      return newReply;
    }
  } catch (error) {
    console.error('Error adding reply:', error);
    return null;
  }
};

// Delete a comment
export const deleteComment = async (newsId, commentId) => {
  try {
    const allComments = await getAllComments();
    const newsComments = allComments[newsId] || [];
    
    const filteredComments = newsComments.filter(c => c.id !== commentId);
    allComments[newsId] = filteredComments;
    
    await saveAllComments(allComments);
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
};

// Save user name to local storage
export const saveUserName = async (name) => {
  try {
    await SecureStore.setItemAsync(USER_NAME_KEY, name);
    return true;
  } catch (error) {
    console.error('Error saving user name:', error);
    return false;
  }
};

// Get user name from local storage
export const getUserName = async () => {
  try {
    const name = await SecureStore.getItemAsync(USER_NAME_KEY);
    return name || null;
  } catch (error) {
    console.error('Error getting user name:', error);
    return null;
  }
};

// Save user email to local storage
export const saveUserEmail = async (email) => {
  try {
    await SecureStore.setItemAsync(USER_EMAIL_KEY, email);
    return true;
  } catch (error) {
    console.error('Error saving user email:', error);
    return false;
  }
};

// Get user email from local storage
export const getUserEmail = async () => {
  try {
    const email = await SecureStore.getItemAsync(USER_EMAIL_KEY);
    return email || null;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
};

// Clear all comments (for testing)
export const clearAllComments = async () => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing comments:', error);
    return false;
  }
};
