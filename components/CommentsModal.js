// components/CommentsModal.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment, CommentForChat } from '../assets/svg/Icons';
import { CDNApi } from '../config/api';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs, ms } from '../utils/scaling';
import { useFontSize } from '../context/FontSizeContext';
import {
  addComment, addReply, getCommentsForNews,
  saveUserName, getUserName, saveUserEmail, getUserEmail
} from '../utils/commentStorage';
import { useAuth } from '../context/AuthContext';
import CommentUserForm from './CommentUserForm';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_MAX_H = SCREEN_H * 0.88;

const AVATAR_COLORS = ['#e53935', '#8e24aa', '#1e88e5', '#00897b', '#f4511e', '#6d4c41', '#0288d1', '#2e7d32'];

const generateUniqueKey = (item, index, prefix = 'c') => {
  const id = item.id || item.commentid || index;
  return `${prefix}-${id}-${index}`;
};

function extractComments(d) {
  if (!d) return [];
  if (Array.isArray(d?.comments?.data)) return d.comments.data.filter(Boolean);
  if (Array.isArray(d?.data)) return d.data.filter(Boolean);
  if (Array.isArray(d?.comments)) return d.comments.filter(Boolean);
  if (Array.isArray(d)) return d.filter(Boolean);
  return [];
}

function extractLastPage(d) {
  return d?.comments?.last_page || d?.last_page || d?.meta?.last_page || 1;
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ name, uri, size = s(38), index = 0 }) {
  const bg = AVATAR_COLORS[(name?.charCodeAt(0) || index) % AVATAR_COLORS.length];
  const initial = (name || 'U').charAt(0).toUpperCase();
  return (
    <View style={[av.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      {uri
        ? <Image source={{ uri }} style={av.img} />
        : <Text style={[av.letter, { fontSize: size * 0.42 }]}>{initial}</Text>
      }
    </View>
  );
}
const av = StyleSheet.create({
  circle: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexShrink: 0 },
  img: { width: '100%', height: '100%' },
  letter: { color: '#fff', fontFamily: FONTS.muktaMalar.bold },
});

// ─── Reply Row ────────────────────────────────────────────────────────────────
function ReplyRow({ reply, index }) {
  const { sf } = useFontSize();
  return (
    <View style={rp.wrap}>
      <View style={rp.line} />
      <Avatar name={reply.name} size={s(24)} index={index + 10} />
      <View style={rp.body}>
        <Text style={[rp.name, { fontSize: sf(12) }]}>{reply.name || 'பயனர்'}</Text>
        <Text style={[rp.text, { fontSize: sf(12), lineHeight: sf(18) }]}>
          {reply.comments || reply.text || ''}
        </Text>
        {!!reply.ago && (
          <Text style={[rp.time, { fontSize: sf(11) }]}>{reply.ago}</Text>
        )}
      </View>
    </View>
  );
}
const rp = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', marginTop: vs(10), gap: s(8) },
  line: {
    width: 2, alignSelf: 'stretch', backgroundColor: '#e8e8e8',
    borderRadius: 1, marginRight: s(4),
  },
  body: { flex: 1 },
  name: { fontFamily: FONTS.muktaMalar.semibold, color: '#555', marginBottom: vs(2) },
  text: { fontFamily: FONTS.muktaMalar.regular, color: '#444' },
  time: { fontFamily: FONTS.muktaMalar.regular, color: '#bbb', marginTop: vs(3) },
});

// ─── Comment Item ─────────────────────────────────────────────────────────────
function CommentItem({ item, index, onReply, onLike, onDislike }) {
  const { sf } = useFontSize();
  const name = item.name || item.username || 'பயனர்';
  const text = item.comments || item.comment || item.text || '';
  const ago = item.ago || item.standarddate || '';
  const likes = parseInt(item.com_like || 0);
  const dislikes = parseInt(item.com_dislike || 0);
  const replies = Array.isArray(item.reply) ? item.reply : [];

  return (
    <View style={ci.wrap}>
      <Avatar name={name} uri={item.images || item.avatar} index={index} />
      <View style={ci.body}>
        {/* Name + time */}
        <View style={ci.nameRow}>
          <Text style={[ci.name, { fontSize: sf(13) }]} numberOfLines={1}>{name}</Text>
          {!!ago && <Text style={[ci.time, { fontSize: sf(11) }]}>{ago}</Text>}
        </View>

        {/* Comment text */}
        <Text style={[ci.text, { fontSize: sf(14), lineHeight: sf(21) }]}>{text}</Text>

        {/* Replies */}
        {replies.length > 0 && (
          <View style={ci.repliesWrap}>
            {replies.map((reply, ri) => (
              <ReplyRow key={`reply-${reply.id || ri}`} reply={reply} index={ri} />
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={ci.actions}>
          <TouchableOpacity style={ci.actionBtn} onPress={() => onLike(item)} activeOpacity={0.7}>
            <Ionicons
              name={item.userLiked ? 'thumbs-up' : 'thumbs-up-outline'}
              size={s(16)} color={item.userLiked ? COLORS.primary : '#999'}
            />
            {likes > 0 && (
              <Text style={[ci.actionTxt, { color: item.userLiked ? COLORS.primary : '#999' }]}>
                {likes}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={ci.actionBtn} onPress={() => onDislike(item)} activeOpacity={0.7}>
            <Ionicons
              name={item.userDisliked ? 'thumbs-down' : 'thumbs-down-outline'}
              size={s(16)} color={item.userDisliked ? '#e53935' : '#999'}
            />
            {dislikes > 0 && (
              <Text style={[ci.actionTxt, { color: item.userDisliked ? '#e53935' : '#999' }]}>
                {dislikes}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={ci.actionBtn} onPress={() => onReply(item)} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={s(15)} color="#999" />
            <Text style={ci.actionTxt}>பதில்</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const ci = StyleSheet.create({
  wrap: {
    flexDirection: 'row', gap: s(10),
    paddingHorizontal: s(14), paddingVertical: vs(12),
    borderBottomWidth: 0.5, borderBottomColor: '#f2f2f2',
  },
  body: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: vs(4) },
  name: { fontFamily: FONTS.muktaMalar.semibold, color: '#1a1a1a', flex: 1, marginRight: s(8) },
  time: { fontFamily: FONTS.muktaMalar.regular, color: '#bbb', flexShrink: 0 },
  text: { fontFamily: FONTS.muktaMalar.regular, color: '#333' },
  repliesWrap: { marginTop: vs(4) },
  actions: { flexDirection: 'row', alignItems: 'center', gap: s(18), marginTop: vs(10) },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: s(4) },
  actionTxt: { fontSize: ms(12), fontFamily: FONTS.muktaMalar.medium, color: '#999' },
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonItem() {
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fade, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[sk.wrap, { opacity: fade }]}>
      <View style={sk.avatar} />
      <View style={sk.body}>
        <View style={sk.name} />
        <View style={sk.line} />
        <View style={[sk.line, { width: '60%', marginTop: vs(4) }]} />
      </View>
    </Animated.View>
  );
}
const sk = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: s(10), padding: s(14), borderBottomWidth: 0.5, borderBottomColor: '#f2f2f2' },
  avatar: { width: s(38), height: s(38), borderRadius: s(19), backgroundColor: '#ececec', flexShrink: 0 },
  body: { flex: 1, gap: vs(6) },
  name: { width: s(90), height: vs(11), backgroundColor: '#ececec', borderRadius: s(4) },
  line: { width: '90%', height: vs(10), backgroundColor: '#f4f4f4', borderRadius: s(4) },
});

// ─── Empty ────────────────────────────────────────────────────────────────────
function EmptyComments() {
  const { sf } = useFontSize();
  return (
    <View style={em.wrap}>
      <Ionicons name="chatbubbles-outline" size={s(52)} color="#e0e0e0" />
      <Text style={[em.title, { fontSize: sf(16) }]}>கருத்துகள் இல்லை</Text>
      <Text style={[em.sub, { fontSize: sf(13) }]}>முதல் கருத்தை பதிவிடுங்கள்!</Text>
    </View>
  );
}
const em = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: vs(60) },
  title: { fontFamily: FONTS.muktaMalar.bold, color: '#ccc', marginTop: vs(14) },
  sub: { fontFamily: FONTS.muktaMalar.regular, color: '#ddd', marginTop: vs(6) },
});

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function CommentsModal({ visible, onClose, newsId, commentCount = 0 }) {
  const { sf } = useFontSize();
  const { user, isAuthenticated } = useAuth();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [userDetailsLoaded, setUserDetailsLoaded] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const inputRef = useRef(null);

  // Load saved user details
  useEffect(() => {
    (async () => {
      try {
        const n = await getUserName(); if (n) setUserName(n);
        const e = await getUserEmail(); if (e) setUserEmail(e);
      } finally { setUserDetailsLoaded(true); }
    })();
  }, []);

  // Animate sheet in/out
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(SCREEN_H);
      Animated.spring(slideAnim, {
        toValue: 0, tension: 60, friction: 12, useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_H, duration: 220, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Fetch comments
  const fetchComments = useCallback(async (id, pg = 1, append = false) => {
    if (!id) return;
    pg === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const res = await CDNApi.get(`/detaildata?newsid=${id}&page=${pg}`);
      const d = res?.data;
      const list = extractComments(d);
      setLastPage(extractLastPage(d));
      setPage(pg);
      setComments(prev => append ? [...prev, ...list] : list);
    } catch (e) {
      console.error('[CommentsModal]', e?.message);
      if (!append) setComments([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Load local + remote on open
  useEffect(() => {
    if (visible && newsId) {
      setComments([]);
      setPage(1);
      setLastPage(1);
      setInputText('');
      setReplyingTo(null);
      setShowNameInput(false);

      // Load local optimistic comments first
      getCommentsForNews(newsId).then(local => {
        if (local?.length) setComments(local);
      }).catch(() => { });

      fetchComments(newsId, 1, false);
    }
  }, [visible, newsId]);

  const handleLoadMore = () => {
    if (loadingMore || page >= lastPage) return;
    fetchComments(newsId, page + 1, true);
  };

  // Post comment / reply
  const handlePost = async () => {
    const text = inputText.trim();
    if (!text) return;

    if (!isAuthenticated) {
      if (!userDetailsLoaded) return;
      if (!userName.trim() || !userEmail.trim()) {
        setShowNameInput(true);
        return;
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim());
      if (!emailOk) { setShowNameInput(true); return; }
    }

    setInputText('');
    setReplyingTo(null);

    const name = isAuthenticated
      ? (user?.displayName || user?.email?.split('@')[0] || userName)
      : userName.trim();

    if (!isAuthenticated) {
      await saveUserName(userName);
      await saveUserEmail(userEmail);
    }

    try {
      if (replyingTo) {
        const reply = await addReply(newsId, replyingTo.id, { name, comments: text, text });
        if (reply) {
          setComments(prev => prev.map(c =>
            c.id === replyingTo.id
              ? { ...c, reply: [reply, ...(c.reply || [])] }
              : c
          ));
        }
      } else {
        const comment = await addComment(newsId, { name, comments: text, text });
        if (comment) setComments(prev => [comment, ...prev]);
      }
    } catch (e) {
      console.error('Post error:', e);
    }
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setInputText('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleLike = (item) => {
    setComments(prev => prev.map(c => {
      if (c.id !== item.id) return c;
      const wasDisliked = c.userDisliked;
      const wasLiked = c.userLiked;
      return {
        ...c,
        com_like: wasLiked ? c.com_like - 1 : c.com_like + 1,
        com_dislike: wasDisliked ? c.com_dislike - 1 : c.com_dislike,
        userLiked: !wasLiked,
        userDisliked: false,
      };
    }));
  };

  const handleDislike = (item) => {
    setComments(prev => prev.map(c => {
      if (c.id !== item.id) return c;
      const wasLiked = c.userLiked;
      const wasDisliked = c.userDisliked;
      return {
        ...c,
        com_like: wasLiked ? c.com_like - 1 : c.com_like,
        com_dislike: wasDisliked ? c.com_dislike - 1 : c.com_dislike + 1,
        userLiked: false,
        userDisliked: !wasDisliked,
      };
    }));
  };

  const totalCount = commentCount || comments.length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Full-screen backdrop */}
      <View style={st.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        {showNameInput ? (
          <CommentUserForm
            userName={userName}
            userEmail={userEmail}
            onUserNameChange={setUserName}
            onUserEmailChange={setUserEmail}
            commentText={inputText}
            onCommentChange={setInputText}
            onSubmit={() => {
              const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim());
              if (!userName.trim() || !userEmail.trim() || !emailOk) return;
              setShowNameInput(false);
              if (inputText.trim()) handlePost();
            }}
            onCancel={() => {
              setShowNameInput(false);
              setUserName('');
              setUserEmail('');
              setInputText('');
            }}
            onBack={() => setShowNameInput(false)}
            loading={false}
          />
        ) : (
          <Animated.View style={[st.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >

              {/* Drag handle */}
              <View style={st.handleBar}>
                <View style={st.handle} />
              </View>

              {/* Header */}
              <View style={st.header}>
                <View style={st.headerLeft}>
                  <Ionicons name="chatbubbles-outline" size={s(20)} color="#333" />
                  <Text style={[st.headerTitle, { fontSize: sf(15) }]}>வாசகர்கள் கருத்துகள்</Text>
                  {totalCount > 0 && (
                    <View style={st.countBadge}>
                      <Text style={[st.countText, { fontSize: sf(12) }]}>{totalCount}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={onClose} style={st.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={s(20)} color="#555" />
                </TouchableOpacity>
              </View>

              <View style={st.headerDivider} />

              {/* Comments list — takes all remaining space */}
              <View style={st.listWrapper}>
                {loading ? (
                  // Skeleton
                  <FlatList
                    data={[1, 2, 3, 4, 5]}
                    keyExtractor={i => `sk-${i}`}
                    renderItem={() => <SkeletonItem />}
                    scrollEnabled={false}
                  />
                ) : (
                  <FlatList
                    data={comments}
                    keyExtractor={(item, i) => generateUniqueKey(item, i)}
                    keyboardDismissMode="on-drag"
                    
                    renderItem={({ item, index }) => (
                      <CommentItem
                        item={item}
                        index={index}
                        onReply={handleReply}
                        onLike={handleLike}
                        onDislike={handleDislike}
                      />
                    )}
                    ListEmptyComponent={<EmptyComments />}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.4}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    ListFooterComponent={
                      loadingMore
                        ? <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: vs(16) }} />
                        : <View style={{ height: vs(16) }} />
                    }
                  />
                )}
              </View>

              {/* Input bar — pinned to bottom */}
              <View style={st.inputArea}>
                {replyingTo && (
                  <View style={st.replyBar}>
                    <Ionicons name="return-down-forward" size={s(14)} color={COLORS.primary} />
                    <Text style={[st.replyBarText, { fontSize: sf(12) }]} numberOfLines={1}>
                      {replyingTo.name || 'பயனர்'}-க்கு பதிலளிக்கிறீர்கள்
                    </Text>
                    <TouchableOpacity onPress={() => setReplyingTo(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={s(18)} color="#aaa" />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={st.inputRow}>
                  {/* Avatar placeholder */}
                  <View style={st.inputAvatar}>
                    <Ionicons name="person" size={s(16)} color="#bbb" />
                  </View>

                  <TextInput
                    ref={inputRef}
                    style={[st.textInput, { fontSize: sf(13) }]}
                    placeholder={replyingTo ? 'பதிலை உள்ளிடுங்கள்...' : 'உங்கள் கருத்தை பதிவிடுங்கள்...'}
                    placeholderTextColor="#bbb"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={500}
                    returnKeyType="default"
                  />

                  <TouchableOpacity
                    style={[st.sendBtn, !!inputText.trim() && st.sendBtnActive]}
                    onPress={handlePost}
                    disabled={!inputText.trim()}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="send" size={s(16)} color={inputText.trim() ? '#fff' : '#ccc'} />
                  </TouchableOpacity>
                </View>
              </View>
          </KeyboardAvoidingView>

          </Animated.View>
        )}
    </View>
    </Modal >
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  kavWrapper: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: s(20),
    borderTopRightRadius: s(20),
    maxHeight: SHEET_MAX_H,
    // KEY: use flex so inner FlatList can scroll
    flexDirection: 'column',
    overflow: 'hidden',
    height: "90%"
  },

  // Handle
  handleBar: { alignItems: 'center', paddingTop: vs(10), paddingBottom: vs(2) },
  handle: { width: s(36), height: vs(4), borderRadius: s(2), backgroundColor: '#ddd' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(14),
    paddingTop: vs(8), paddingBottom: vs(12),
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
  headerTitle: { fontFamily: FONTS.muktaMalar.semibold, color: '#1a1a1a' },
  countBadge: {
    backgroundColor: '#f0f0f0', borderRadius: s(12),
    paddingHorizontal: s(8), paddingVertical: vs(2),
  },
  countText: { fontFamily: FONTS.muktaMalar.semibold, color: '#666' },
  closeBtn: {
    width: s(30), height: s(30), borderRadius: s(15),
    backgroundColor: '#f5f5f5',
    justifyContent: 'center', alignItems: 'center',
  },
  headerDivider: { height: 0.5, backgroundColor: '#f0f0f0' },

  // List — flex: 1 so it expands and FlatList scrolls inside
  listWrapper: { flex: 1 },

  // Input area — never scrolls, pinned at bottom
  inputArea: {
    borderTopWidth: 0.5,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: s(12),
    paddingTop: vs(10),
    paddingBottom: Platform.OS === 'ios' ? vs(28) : vs(12),
    backgroundColor: '#fff',
  },
  replyBar: {
    flexDirection: 'row', alignItems: 'center', gap: s(6),
    backgroundColor: '#f0f8ff',
    borderWidth: 0.5, borderColor: '#cce4ff',
    borderRadius: s(8),
    paddingHorizontal: s(10), paddingVertical: vs(7),
    marginBottom: vs(8),
  },
  replyBarText: {
    flex: 1, fontFamily: FONTS.muktaMalar.medium, color: COLORS.primary,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: s(8) },
  inputAvatar: {
    width: s(34), height: s(34), borderRadius: s(17),
    backgroundColor: '#f4f4f4',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    minHeight: vs(38),
    backgroundColor: '#f8f8f8',
    borderRadius: s(20),
    borderWidth: 0.5, borderColor: '#eee',
    paddingHorizontal: s(14),
    paddingTop: vs(9), paddingBottom: vs(9),
    fontFamily: FONTS.muktaMalar.regular,
    color: '#333',
  },
  sendBtn: {
    width: s(36), height: s(36), borderRadius: s(18),
    backgroundColor: '#e0e0e0',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  sendBtnActive: { backgroundColor: COLORS.primary },
});