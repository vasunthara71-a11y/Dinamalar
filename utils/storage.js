import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  BOOKMARKED_NEWS: 'bookmarked_news',
};

// Save bookmarked news to secure storage
export const saveBookmarkedNews = async (newsItems) => {
  try {
    const serializedData = JSON.stringify(newsItems);
    await SecureStore.setItemAsync(STORAGE_KEYS.BOOKMARKED_NEWS, serializedData);
    return true;
  } catch (error) {
    console.error('Error saving bookmarked news:', error);
    return false;
  }
};

// Get bookmarked news from secure storage
export const getBookmarkedNews = async () => {
  try {
    const serializedData = await SecureStore.getItemAsync(STORAGE_KEYS.BOOKMARKED_NEWS);
    return serializedData ? JSON.parse(serializedData) : [];
  } catch (error) {
    console.error('Error getting bookmarked news:', error);
    return [];
  }
};

// Generate a unique identifier for news items
const getNewsUniqueId = (newsItem) => {
  // Use multiple fields to create a unique identifier
  const identifier = [
    newsItem.id || '',
    newsItem.newsid || '',
    newsItem.newstitle || '',
    newsItem.slug || '',
    newsItem.newsdate || ''
  ].join('|');
  
  return identifier;
};

// Add a news item to bookmarks
export const addBookmark = async (newsItem) => {
  try {
    const currentBookmarks = await getBookmarkedNews();
    const newsUniqueId = getNewsUniqueId(newsItem);
    
    // Check if already bookmarked using unique identifier
    const exists = currentBookmarks.some(item => 
      getNewsUniqueId(item) === newsUniqueId
    );
    
    if (!exists) {
      currentBookmarks.push({
        ...newsItem,
        _bookmarkId: newsUniqueId, // Store the unique identifier
        bookmarkedAt: new Date().toISOString()
      });
      await saveBookmarkedNews(currentBookmarks);
      return true;
    }
    
    return false; // Already bookmarked
  } catch (error) {
    console.error('Error adding bookmark:', error);
    return false;
  }
};

// Remove a news item from bookmarks
export const removeBookmark = async (newsItem) => {
  try {
    const currentBookmarks = await getBookmarkedNews();
    const newsUniqueId = getNewsUniqueId(newsItem);
    
    const updatedBookmarks = currentBookmarks.filter(item => 
      getNewsUniqueId(item) !== newsUniqueId
    );
    
    await saveBookmarkedNews(updatedBookmarks);
    return true;
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return false;
  }
};

// Check if a news item is bookmarked
export const isBookmarked = async (newsItem) => {
  try {
    const currentBookmarks = await getBookmarkedNews();
    const newsUniqueId = getNewsUniqueId(newsItem);
    
    return currentBookmarks.some(item => 
      getNewsUniqueId(item) === newsUniqueId
    );
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
};
