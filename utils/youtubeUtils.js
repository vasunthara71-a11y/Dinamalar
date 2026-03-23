// utils/youtubeUtils.js
// Save this file in the SAME folder as your other utils (scaling.js, constants.js etc.)

import { Linking } from 'react-native';

// Extract YouTube video ID from any YouTube URL or raw 11-char ID
export function getYouTubeId(url) {
  if (!url) return null;
  const str = String(url).trim();
  const patterns = [
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
    /youtube\.com\/shorts\/([^?&\s]+)/,
    /youtube-nocookie\.com\/embed\/([^?&\s]+)/,
  ];
  for (const re of patterns) {
    const m = str.match(re);
    if (m?.[1]) return m[1];
  }
  // Plain 11-char YouTube ID (vidg_path field from Dinamalar API e.g. "vytx5yh9X2A")
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  return null;
}

// Open a YouTube video in the YouTube app, fall back to browser
export function openInYouTube(videoId) {
  if (!videoId) return;
  const appUrl     = `vnd.youtube:${videoId}`;
  const browserUrl = `https://www.youtube.com/watch?v=${videoId}`;
  Linking.canOpenURL(appUrl)
    .then(supported => Linking.openURL(supported ? appUrl : browserUrl))
    .catch(() => Linking.openURL(browserUrl));
}