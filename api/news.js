import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

export const fetchHomeData = async () => {
  try {
    const response = await axios.get('https://api-st-cdn.dinamalar.com/home');
    return response;
  } catch (error) {
    console.error('Error fetching home data:', error);
    throw error;
  }
};

export const fetchTrending = async () => {
  try {
    const response = await api.get('/trending');
    return response;
  } catch (error) {
    console.error('Error fetching trending:', error);
    throw error;
  }
};

export const fetchShortNews = async () => {
  try {
    const response = await api.get('/shortnews');
    return response;
  } catch (error) {
    console.error('Error fetching short news:', error);
    throw error;
  }
};

export const extractNewsArray = (data) => {
  if (!data) return [];
  
  if (Array.isArray(data)) {
    return data;
  }
  
  if (data.data && Array.isArray(data.data)) {
    return data.data;
  }
  
  if (data.tharpothaiya_seithigal && data.tharpothaiya_seithigal[0]?.data) {
    return data.tharpothaiya_seithigal[0].data;
  }
  
  return [];
};
