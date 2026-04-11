// utils/testCommentStorage.js
// Test file for comment storage functionality
import { 
  addComment, 
  addReply, 
  getCommentsForNews, 
  clearAllComments 
} from './commentStorage';

// Test function to verify comment functionality
export const testCommentStorage = async () => {
  try {
    console.log('🧪 Testing Comment Storage...');
    
    // Clear existing comments for clean test
    await clearAllComments();
    console.log('✅ Cleared all comments');
    
    // Test 1: Add a new comment
    const testNewsId = 'test-news-123';
    const comment = await addComment(testNewsId, {
      name: 'Test User',
      comments: 'This is a test comment',
      text: 'This is a test comment'
    });
    
    if (comment) {
      console.log('✅ Successfully added comment:', comment.id);
    } else {
      console.log('❌ Failed to add comment');
      return false;
    }
    
    // Test 2: Get comments for news
    const comments = await getCommentsForNews(testNewsId);
    if (comments.length === 1) {
      console.log('✅ Successfully retrieved comments:', comments.length);
    } else {
      console.log('❌ Failed to retrieve correct number of comments');
      return false;
    }
    
    // Test 3: Add a reply to the comment
    const reply = await addReply(testNewsId, comment.id, {
      name: 'Reply User',
      comments: 'This is a test reply',
      text: 'This is a test reply'
    });
    
    if (reply) {
      console.log('✅ Successfully added reply:', reply.id);
    } else {
      console.log('❌ Failed to add reply');
      return false;
    }
    
    // Test 4: Verify reply is attached to comment
    const updatedComments = await getCommentsForNews(testNewsId);
    if (updatedComments[0].reply && updatedComments[0].reply.length === 1) {
      console.log('✅ Reply is properly attached to comment');
    } else {
      console.log('❌ Reply not properly attached');
      return false;
    }
    
    console.log('🎉 All tests passed! Comment storage is working correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
};

// Manual test function that can be called from app
export const runManualTest = async () => {
  console.log('🔧 Running manual comment test...');
  
  const testNewsId = 'manual-test-' + Date.now();
  
  // Add a test comment
  const comment = await addComment(testNewsId, {
    name: 'Manual Tester',
    comments: 'This is a manual test comment',
    text: 'This is a manual test comment'
  });
  
  console.log('Added comment:', comment);
  
  // Add a reply
  const reply = await addReply(testNewsId, comment.id, {
    name: 'Manual Reply User',
    comments: 'This is a manual test reply',
    text: 'This is a manual test reply'
  });
  
  console.log('Added reply:', reply);
  
  // Get all comments
  const allComments = await getCommentsForNews(testNewsId);
  console.log('All comments for test news:', allComments);
  
  return {
    newsId: testNewsId,
    comments: allComments
  };
};
