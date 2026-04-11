// context/PodcastContext.js
import React, { createContext, useContext, useState, useRef } from 'react';

const PodcastContext = createContext(null);

export function PodcastProvider({ children }) {
  const [currentPodcast, setCurrentPodcast] = useState(null);
  const [podcastList, setPodcastList] = useState([]);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [playerState, setPlayerState] = useState('expanded'); // 'expanded' | 'collapsed'

  const playPodcast = (podcast, list = []) => {
    setCurrentPodcast(podcast);
    if (list.length > 0) setPodcastList(list);
    setIsPlayerVisible(true);
    setPlayerState('expanded');
  };

  const dismissPlayer = () => {
    setPlayerState('collapsed');
  };

  const expandPlayer = () => {
    setPlayerState('expanded');
  };

  const hidePlayer = () => {
    setIsPlayerVisible(false);
    setCurrentPodcast(null);
  };

  return (
    <PodcastContext.Provider value={{
      currentPodcast,
      setCurrentPodcast,
      podcastList,
      setPodcastList,
      isPlayerVisible,
      setIsPlayerVisible,
      playerState,
      setPlayerState,
      playPodcast,
      dismissPlayer,
      expandPlayer,
      hidePlayer,
    }}>
      {children}
    </PodcastContext.Provider>
  );
}

export const usePodcast = () => useContext(PodcastContext);