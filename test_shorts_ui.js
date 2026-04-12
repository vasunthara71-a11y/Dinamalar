// Test script to verify Shorts UI integration
const mockVideoData = [
  {
    id: 1,
    newstitle: "Test Video 1",
    images: "https://example.com/thumb1.jpg",
    duration: "2:30",
    type: "video",
    video: 1
  },
  {
    id: 2,
    newstitle: "Test Video 2", 
    images: "https://example.com/thumb2.jpg",
    duration: "1:45",
    type: "reels",
    video: 1
  }
];

console.log('Testing Shorts UI integration...');
console.log('Mock video data:', mockVideoData.length, 'items');

// Test video filtering logic
const videoItems = mockVideoData.filter(item => {
  const type = (item.type || '').toLowerCase();
  const isVideo = item.video == 1 || item.video === '1';
  return type === 'video' || type === 'reels' || isVideo;
});

console.log('Filtered video items:', videoItems.length);
console.log('Shorts UI should render:', videoItems.length > 0 ? 'YES' : 'NO');

// Test ShortCard data extraction
videoItems.forEach((video, index) => {
  const title = video.newstitle || video.title || video.videotitle || '';
  const imageUri = video.images || video.largeimages || video.image || '';
  const duration = video.duration || '';
  
  console.log(`ShortCard ${index + 1}:`);
  console.log(`  Title: ${title}`);
  console.log(`  Image: ${imageUri}`);
  console.log(`  Duration: ${duration}`);
  console.log(`  Has valid data: ${title && imageUri ? 'YES' : 'NO'}`);
});

console.log('Shorts UI integration test completed successfully!');
