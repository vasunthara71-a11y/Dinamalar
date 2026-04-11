import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Linking, Share } from "react-native";
import { FacebookIcon, TwitterIcon, WhatsAppIcon, TelegramIcon, ShareIcon, Bookmark, BookmarkSaved } from "../assets/svg/Icons";
import { s } from "../utils/scaling";

const ShareInfo = ({ url, title }) => {
  const shareUrl = url || 'https://www.dinamalar.com';
  const shareTitle = title || '';

  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleSocialShare = async (platform) => {
    const url = shareUrl;
    const text = encodeURIComponent(shareTitle);
    const encodedUrl = encodeURIComponent(url);

    const links = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`,
      whatsapp: `https://wa.me/?text=${text}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${text}`,
    };

    if (platform === 'share') {
      await Share.share({ title: shareTitle, message: `${shareTitle}\n\n${url}`, url });
    } else {
      Linking.openURL(links[platform]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Share and Bookmark Container */}
      <View style={styles.shareContainer}>
        <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialShare('facebook')}>
          <FacebookIcon size={s(20)} color="#1877F2" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialShare('twitter')}>
          <TwitterIcon size={s(20)} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialShare('whatsapp')}>
          <WhatsAppIcon size={s(20)} color="#25D366" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialShare('telegram')}>
          <TelegramIcon size={s(20)} color="#229ED9" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialShare('share')}>
          <ShareIcon size={s(20)} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.bookmarkBtn} 
          onPress={() => setIsBookmarked(!isBookmarked)}
        >
          {isBookmarked ? (
            <BookmarkSaved size={s(20)} color="#FF6B35" />
          ) : (
            <Bookmark size={s(20)} color="#888" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ShareInfo;

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    // paddingVertical: 10,
  },
  shareContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    justifyContent:"center"
  },
  socialBtn: {
    marginRight: 15,
    backgroundColor: "#eef3f7",
    padding: 10,
    borderRadius: 25,
  },
  bookmarkBtn: {
    marginRight: 15,
    backgroundColor: "#eef3f7",
    padding: 10,
    borderRadius: 25,
  },
});