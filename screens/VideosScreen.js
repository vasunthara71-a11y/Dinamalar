import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const VideosScreen = () => {
  const videos = [
    { id: 1, title: 'செய்தி வீடியோ 1', duration: '2:30', category: 'முக்கிய செய்திகள்' },
    { id: 2, title: 'செய்தி வீடியோ 2', duration: '5:15', category: 'அரசியல்' },
    { id: 3, title: 'செய்தி வீடியோ 3', duration: '3:45', category: 'விளையாட்டு' },
    { id: 4, title: 'செய்தி வீடியோ 4', duration: '4:20', category: 'சினிமா' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>வீடியோக்கள்</Text>
      
      <View style={styles.categoryContainer}>
        <TouchableOpacity style={styles.categoryButton}>
          <Text style={styles.categoryText}>அனைத்தும்</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryButton}>
          <Text style={styles.categoryText}>முக்கிய செய்திகள்</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryButton}>
          <Text style={styles.categoryText}>அரசியல்</Text>
        </TouchableOpacity>
      </View>

      {videos.map((video) => (
        <View key={video.id} style={styles.videoItem}>
          <View style={styles.thumbnail}>
            <Text style={styles.playButton}>▶</Text>
            <Text style={styles.duration}>{video.duration}</Text>
          </View>
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle}>{video.title}</Text>
            <Text style={styles.videoCategory}>{video.category}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#d32f2f',
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  categoryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  videoItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 120,
    height: 80,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  playButton: {
    fontSize: 24,
    color: 'white',
  },
  duration: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    fontSize: 12,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  videoInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#000',
  },
  videoCategory: {
    fontSize: 14,
    color: '#666',
  },
});

export default VideosScreen;
