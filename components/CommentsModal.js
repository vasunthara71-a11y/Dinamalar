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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Comment, CommentForChat } from '../assets/svg/Icons';
import { CDNApi, mainApi,  } from '../config/api';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs, ms, scaledSizes } from '../utils/scaling';
import FontSizeControl from './FontSizeControl';
import { useFontSize } from '../context/FontSizeContext';
import { addComment, addReply, getCommentsForNews, saveUserName, getUserName } from '../utils/commentStorage';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

// Generate unique key with timestamp and random to avoid duplicates
const generateUniqueKey = (item, index, prefix = 'comment') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const id = item.id || item.commentid || `no-id-${index}`;
  return `${prefix}-${id}-${timestamp}-${random}`;
};

// ─── Single Comment Row ───────────────────────────────────────────────────────
function CommentItem({ item, index, onReply, newsId, onLike, onDislike }) {
  const { sf } = useFontSize();
  const name = item.name || item.username || 'பயனர்';
  const text = item.comments || item.comment || item.text || '';
  const ago = item.ago || item.standarddate || item.date || '';
  const likes = parseInt(item.com_like || 0);
  const dislikes = parseInt(item.com_dislike || 0);
  const avatar = item.images || item.avatar || '';

  const colors = ['#e53935', '#8e24aa', '#1e88e5', '#00897b', '#f4511e', '#6d4c41'];
  const bgColor = colors[(name.charCodeAt(0) || index) % colors.length];
  const initials = name.charAt(0).toUpperCase();

  return (
    <View style={cs.row}>
      <View style={[cs.avatar, { backgroundColor: bgColor }]}>
        {!!avatar
          ? <Image source={{ uri: avatar }} style={cs.avatarImg} />
          : <Text style={[cs.avatarTxt, { fontSize: sf(15) }]}>{initials}</Text>
        }
      </View>
      <View style={cs.body}>
        <View style={cs.nameRow}>
          <Text style={[cs.name, { fontSize: sf(14) }]} numberOfLines={1}>{name}</Text>
          {!!ago && <Text style={[cs.date, { fontSize: sf(12) }]}>{ago}</Text>}
        </View>
        <Text style={[cs.text, { fontSize: sf(14), lineHeight: sf(20) }]}>{text}</Text>
        {item.reply && item.reply.length > 0 && (
          <View style={cs.repliesContainer}>
            {item.reply.map((reply, replyIndex) => (
              <View key={`reply-${reply.id || `reply-${replyIndex}`}`} style={cs.replyItem}>
                <View style={[cs.replyAvatar, { backgroundColor: colors[(reply.name?.charCodeAt(0) || replyIndex) % colors.length] }]}>
                  <Text style={[cs.avatarTxt, { fontSize: sf(12) }]}>
                    {reply.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={cs.replyBody}>
                  <Text style={[cs.replyName, { fontSize: sf(12) }]}>{reply.name || 'பயனர்'}</Text>
                  <Text style={[cs.replyText, { fontSize: sf(12), lineHeight: sf(18) }]}>{reply.comments || reply.text}</Text>
                  <Text style={[cs.replyDate, { fontSize: sf(10) }]}>{reply.ago || 'இப்போது'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={cs.actions}>
          <TouchableOpacity style={cs.actionBtn} onPress={() => onLike(item)}>
            <Ionicons name="thumbs-up-outline" size={ms(18)} color={item.userLiked ? COLORS.primary : "#888"} />
            {likes > 0 && <Text style={[cs.actionTxt, { fontSize: ms(14), color: item.userLiked ? COLORS.primary : "#888" }]}>{likes}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={cs.actionBtn} onPress={() => onDislike(item)}>
            <Ionicons name="thumbs-down-outline" size={ms(18)} color={item.userDisliked ? COLORS.primary : "#888"} />
            {dislikes > 0 && <Text style={[cs.actionTxt, { fontSize: ms(14), color: item.userDisliked ? COLORS.primary : "#888" }]}>{dislikes}</Text>}
          </TouchableOpacity>
          <TouchableOpacity 
            style={cs.actionBtn}
            onPress={() => onReply(item)}
          >
            <Ionicons name='chatbubble-outline' color={COLORS.grey600} size={20} />
            <Text style={[cs.actionTxt, { fontSize:ms(14) }]}>பதில்</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  avatar: {
    width: s(36), height: s(36), borderRadius: s(18),
    justifyContent: 'center', alignItems: 'center',
    marginRight: s(10), flexShrink: 0, overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarTxt: { fontSize: ms(15), fontFamily: FONTS.muktaMalar.bold, color: '#fff' },
  body: { flex: 1 },
  nameRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: vs(4),
  },
  name: { fontSize: scaledSizes.font.md, fontFamily: FONTS.muktaMalar.semibold, color: '#1a1a1a', flex: 1 },
  date: { fontSize: scaledSizes.font.sm, fontFamily: FONTS.muktaMalar.regular, color: '#aaa', flexShrink: 0 },
  text: { fontSize: scaledSizes.font.md, fontFamily: FONTS.muktaMalar.regular, color: COLORS.text, lineHeight: ms(20) },
  actions: { flexDirection: 'row', marginTop: vs(6), gap: s(14) ,alignItems:"center"},
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: s(4) },
  actionTxt: { fontSize: ms(11), fontFamily: FONTS.muktaMalar.medium, color: '#888' },
  repliesContainer: { marginTop: vs(8), paddingLeft: s(20) },
  replyItem: { flexDirection: 'row', marginBottom: vs(8), gap: s(8) },
  replyAvatar: {
    width: s(24), height: s(24), borderRadius: s(12),
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  replyBody: { flex: 1 },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(2),
  },
  replyDeleteBtn: {
    padding: s(2),
  },
  replyName: { 
    fontSize: ms(12), fontFamily: FONTS.muktaMalar.semibold, 
    color: '#666', marginBottom: vs(2) 
  },
  replyText: { 
    fontSize: ms(12), fontFamily: FONTS.muktaMalar.regular, 
    color: '#555', lineHeight: ms(16) 
  },
  replyDate: { 
    fontSize: ms(10), fontFamily: FONTS.muktaMalar.regular, 
    color: '#999', marginTop: vs(2) 
  },
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CommentSkeleton() {
  return (
    <View style={sk.row}>
      <View style={sk.avatar} />
      <View style={sk.body}>
        <View style={sk.name} />
        <View style={sk.line} />
        <View style={[sk.line, { width: '60%' }]} />
      </View>
    </View>
  );
}
const sk = StyleSheet.create({
  row: { flexDirection: 'row', padding: s(16), borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  avatar: { width: s(36), height: s(36), borderRadius: s(18), backgroundColor: '#eee', marginRight: s(10) },
  body: { flex: 1, gap: vs(6) },
  name: { width: s(80), height: vs(12), backgroundColor: '#eee', borderRadius: s(4) },
  line: { width: '90%', height: vs(10), backgroundColor: '#f2f2f2', borderRadius: s(4) },
});

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyComments() {
  const { sf } = useFontSize();
  return (
    <View style={em.wrap}>
      <Comment size={sf(52)} color="#ddd" />
      <Text style={[em.title, { fontSize: sf(16) }]}>கருத்துகள் இல்லை</Text>
      <Text style={[em.sub, { fontSize: sf(13) }]}>முதல் கருத்தை பதிவிடுங்கள்!</Text>
    </View>
  );
}
const em = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: vs(60) },
  title: { fontSize: ms(16), fontFamily: FONTS.muktaMalar.bold, color: '#aaa', marginTop: vs(12) },
  sub: { fontSize: ms(13), fontFamily: FONTS.muktaMalar.regular, color: '#ccc', marginTop: vs(6) },
});

// ─── Extract helpers ──────────────────────────────────────────────────────────
// u38Api /detaildata?newsid=ID response shape (CONFIRMED):
// { comments: { current_page: 1, data: [...], last_page: N } }
// Each comment: { id, name, city, images, comments, com_like, com_dislike, ago, standarddate, reply: [] }
function extractComments(d) {
  if (!d) return [];
  // Shape 1: { comments: { data: [...] } }
  if (Array.isArray(d?.comments?.data)) return d.comments.data.filter(Boolean);
  // Shape 2: { data: [...] }
  if (Array.isArray(d?.data)) return d.data.filter(Boolean);
  // Shape 3: { comments: [...] }
  if (Array.isArray(d?.comments)) return d.comments.filter(Boolean);
  // Shape 4: top-level array
  if (Array.isArray(d)) return d.filter(Boolean);
  return [];
}

function extractLastPage(d) {
  return d?.comments?.last_page || d?.last_page || d?.meta?.last_page || 1;
}

// ─── Main CommentsModal ───────────────────────────────────────────────────────
export default function CommentsModal({ visible, onClose, newsId, newsTitle, commentCount = 0 }) {
  const { sf } = useFontSize();
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const slideAnim = useRef(new Animated.Value(300)).current;

  // ── Load user name on component mount
  useEffect(() => {
    const loadUserName = async () => {
      const savedName = await getUserName();
      if (savedName) {
        setUserName(savedName);
      }
    };
    loadUserName();
  }, []);

  // ── Animate open ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300);
      Animated.spring(slideAnim, {
        toValue: 0, tension: 65, friction: 11, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // ── Fetch — Use dedicated /comments endpoint

  // ── Load local comments and fetch remote comments
  const loadLocalComments = useCallback(async () => {
    if (!newsId) return;
    try {
      const localComments = await getCommentsForNews(newsId);
      if (localComments.length > 0) {
        setComments(prev => [...localComments, ...prev]);
      }
    } catch (error) {
      console.error('Error loading local comments:', error);
    }
  }, [newsId]);

  const fetchComments = useCallback(async (id, pg = 1, append = false) => {
    if (!id) return;
    pg === 1 ? setLoading(true) : setLoadingMore(true);

    try {
      // detaildata always uses newsid — videoid values ARE the newsid
      const url = `/detaildata?newsid=${id}&page=${pg}`;
      console.log('[CommentsModal] fetching:', url);
      const res = await CDNApi.get(url);
      console.log('[CommentsModal] base URL used:', CDNApi.defaults?.baseURL);
      console.log('[CommentsModal] status:', res?.status);
      console.log('[CommentsModal] comments data length:', res?.data?.comments?.data?.length); const d = res?.data;

      const list = extractComments(d);
      const lp = extractLastPage(d);
      setLastPage(lp);
      setPage(pg);
      setComments(prev => append ? [...prev, ...list] : list);
    } catch (e) {
      console.error('[CommentsModal] error:', e?.message);
      setComments([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []); // no deps needed — URL is fixed



  useEffect(() => {
    if (visible && newsId) {
      setComments([]);
      setPage(1);
      setLastPage(1);
      loadLocalComments();
      fetchComments(newsId, 1, false);
    }
    if (!visible) {
      setComments([]);
      setPage(1);
      setLastPage(1);
      setInputText('');
      setReplyingTo(null);
      setShowNameInput(false);
    }
  }, [visible, newsId, fetchComments, loadLocalComments]); // ← add idType here too

  const handleLoadMore = () => {
    if (loadingMore || page >= lastPage) return;
    fetchComments(newsId, page + 1, true);
  };

  const totalCount = commentCount || comments.length;

  // Handle posting new comment or reply
  const handlePostComment = async () => {
    if (!inputText.trim()) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      navigation.navigate('LoginScreen');
      return;
    }

    const commentText = inputText.trim();
    setInputText('');

    // Use authenticated user's name or fallback to saved name
    let name = user?.displayName || user?.email?.split('@')[0] || userName.trim();
    if (!name) {
      setShowNameInput(true);
      return;
    }

    // Save user name for future use
    await saveUserName(name);

    try {
      if (replyingTo) {
        // Post reply
        const reply = await addReply(newsId, replyingTo.id, {
          name: name,
          comments: commentText,
          text: commentText
        });
        
        if (reply) {
          // Update the comment in state
          setComments(prev => prev.map(comment => {
            if (comment.id === replyingTo.id) {
              return {
                ...comment,
                reply: [reply, ...(comment.reply || [])]
              };
            }
            return comment;
          }));
        }
        setReplyingTo(null);
      } else {
        // Post new comment
        const comment = await addComment(newsId, {
          name: name,
          comments: commentText,
          text: commentText
        });
        
        if (comment) {
          setComments(prev => [comment, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setInputText('');
    // Don't show name input - just let user type reply directly
  };

  const handleNameSubmit = () => {
    if (userName.trim()) {
      setShowNameInput(false);
      if (inputText.trim()) {
        handlePostComment();
      }
    }
  };

  // Handle like/dislike functionality (mutually exclusive)
  const handleLike = (item) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === item.id) {
        // If user already disliked, remove dislike and add like
        // If user already liked, remove like
        // Otherwise, add like
        const newLikeCount = comment.userDisliked ? comment.com_like + 1 : (comment.userLiked ? comment.com_like - 1 : comment.com_like + 1);
        return {
          ...comment,
          com_like: newLikeCount,
          com_dislike: comment.userDisliked ? 0 : comment.com_dislike,
          userLiked: !comment.userLiked,
          userDisliked: false
        };
      }
      return comment;
    }));
  };

  const handleDislike = (item) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === item.id) {
        // If user already liked, remove like and add dislike
        // If user already disliked, remove dislike
        // Otherwise, add dislike
        const newDislikeCount = comment.userLiked ? comment.com_dislike + 1 : (comment.userDisliked ? comment.com_dislike - 1 : comment.com_dislike + 1);
        return {
          ...comment,
          com_like: comment.userLiked ? 0 : comment.com_like,
          com_dislike: newDislikeCount,
          userLiked: false,
          userDisliked: !comment.userDisliked
        };
      }
      return comment;
    }));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={modal.overlay}>
        <TouchableOpacity style={modal.backdrop} activeOpacity={1} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={modal.kavWrap}
        >
          <Animated.View style={[modal.sheet, { transform: [{ translateY: slideAnim }] }]}>

            {/* Handle */}
            <View style={modal.handleWrap}>
              <View style={modal.handle} />
            </View>

            {/* Header */}
            <View style={modal.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(5) }}>
                <CommentForChat size={22} color="#333" />
                <Text style={[modal.headerTitle, { fontSize: vs(16) }]}>வாசகர்கள் கருத்துகள்</Text>
                {totalCount > 0 && (
                  <Text style={[modal.headerCount, { fontSize: vs(16) }]}>( {totalCount} )</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={modal.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={sf(22)} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={modal.divider} />

            {/* List */}
            {loading ? (
              <FlatList
                data={[1, 2, 3, 4, 5]}
                keyExtractor={i => `sk-${i}`}
                renderItem={() => <CommentSkeleton />}
                style={{ flex: 1 }}
                ListFooterComponent={
                  loadingMore
                    ? <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: vs(16) }} />
                    : <View style={{ height: vs(20) }} />
                }
              />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item, i) => generateUniqueKey(item, i)}
                renderItem={({ item, index }) => (
                  <CommentItem 
                    item={item} 
                    index={index} 
                    onReply={handleReply}
                    onLike={handleLike}
                    onDislike={handleDislike}
                    newsId={newsId}
                  />
                )}
                ListEmptyComponent={<EmptyComments />}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.4}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                  loadingMore
                    ? <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: vs(16) }} />
                    : <View style={{ height: vs(20) }} />
                }
              />
            )}
            {!showNameInput ? (
              <View style={modal.inputWrap}>
                {replyingTo && (
                  <View style={modal.replyingBar}>
                    <Text style={[modal.replyingText, { fontSize: sf(12) }]}>
                      {replyingTo.name || 'பயனர்'}-க்கு பதிலளிக்கிறீர்கள்
                    </Text>
                    <TouchableOpacity onPress={() => setReplyingTo(null)}>
                      <Ionicons name="close" size={sf(16)} color="#666" />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={modal.inputRow}>
                  <View style={modal.inputAvatar}>
                    <Ionicons name="person" size={s(16)} color="#999" />
                  </View>
                  <TextInput
                    style={modal.input}
                    placeholder={replyingTo ? "பதில் எழுதுங்கள்..." : "உங்கள் கருத்தை பதிவிடுங்கள்..."}
                    placeholderTextColor="#bbb"
                    value={inputText}
                    onChangeText={(text) => {
                      setInputText(text);
                      // If user is not authenticated and starts typing, navigate directly to login
                      if (!isAuthenticated && text.trim().length > 0) {
                        navigation.navigate('LoginScreen');
                      }
                    }}
                    multiline
                    maxLength={500}
                    autoFocus={replyingTo !== null}
                  />
                  <TouchableOpacity
                    style={[modal.sendBtn, !!inputText.trim() && modal.sendBtnActive]}
                    onPress={handlePostComment}
                    disabled={!inputText.trim()}
                  >
                    <Ionicons name="send" size={s(16)} color={inputText.trim() ? '#fff' : '#ccc'} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={modal.nameInputWrap}>
                <View style={modal.nameInputRow}>
                  <Text style={[modal.nameLabel, { fontSize: sf(14) }]}>உங்கள் பெயர்:</Text>
                  <TextInput
                    style={modal.nameInput}
                    placeholder="பெயரை உள்ளிடுக"
                    placeholderTextColor="#bbb"
                    value={userName}
                    onChangeText={setUserName}
                    maxLength={50}
                    autoFocus
                    onSubmitEditing={handleNameSubmit}
                  />
                  <TouchableOpacity
                    style={[modal.nameSubmitBtn, !!userName.trim() && modal.sendBtnActive]}
                    onPress={handleNameSubmit}
                    disabled={!userName.trim()}
                  >
                    <Ionicons name="check" size={s(16)} color={userName.trim() ? '#fff' : '#ccc'} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
// ─── Styles ───────────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: s(20),
    borderTopRightRadius: s(20),
    maxHeight: '100%',
    paddingBottom: Platform.OS === 'ios' ? vs(34) : vs(10),
  },
  handleWrap: { alignItems: 'center', paddingTop: vs(10), paddingBottom: vs(4) },
  handle: { width: s(36), height: vs(4), borderRadius: s(2), backgroundColor: '#ddd' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(12), paddingTop: vs(8), paddingBottom: vs(12),

  },
  headerTitle: { fontFamily: FONTS.muktaMalar.semibold, color: '#1a1a1a' },
  headerCount: { fontFamily: FONTS.muktaMalar.semibold, color: COLORS.black },
  closeBtn: { padding: s(4) },
  divider: { height: 1, backgroundColor: '#f0f0f0' },
  inputWrap: {
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
    paddingHorizontal: s(12), paddingVertical: vs(10),
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: s(8) },
  inputAvatar: {
    width: s(34), height: s(34), borderRadius: s(17),
    backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  input: {
    flex: 1, minHeight: vs(36), maxHeight: vs(100),
    backgroundColor: '#f8f8f8', borderRadius: s(18),
    paddingHorizontal: s(14), paddingVertical: vs(8),
    fontSize: ms(13), fontFamily: FONTS.muktaMalar.regular,
    color: '#333', borderWidth: 1, borderColor: '#eee',
  },
  sendBtn: {
    width: s(36), height: s(36), borderRadius: s(18),
    backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  sendBtnActive: { backgroundColor: COLORS.primary },
  replyingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderTopWidth: 1,
    borderTopColor: '#e0f0ff',
  },
  replyingText: {
    fontFamily: FONTS.muktaMalar.medium,
    color: '#0066cc',
    flex: 1,
  },
  nameInputWrap: {
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
    paddingHorizontal: s(12), paddingVertical: vs(12),
    backgroundColor: '#fafafa',
  },
  nameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
  },
  nameLabel: {
    fontFamily: FONTS.muktaMalar.medium,
    color: '#333',
    flexShrink: 0,
  },
  nameInput: {
    flex: 1,
    height: vs(36),
    backgroundColor: '#fff',
    borderRadius: s(18),
    paddingHorizontal: s(14),
    fontSize: ms(13),
    fontFamily: FONTS.muktaMalar.regular,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  nameSubmitBtn: {
    width: s(36), height: s(36), borderRadius: s(18),
    backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  kavWrap: {
    justifyContent: 'flex-end',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
});

// Auth modal styles
const authModal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: s(16),
    padding: s(24),
    marginHorizontal: s(20),
    alignItems: 'center',
    maxWidth: s(320),
  },
  iconContainer: {
    marginBottom: vs(16),
  },
  title: {
    fontFamily: FONTS.muktaMalar.bold,
    color: '#1a1a1a',
    marginBottom: vs(8),
    textAlign: 'center',
  },
  message: {
    fontFamily: FONTS.muktaMalar.regular,
    color: '#666',
    textAlign: 'center',
    marginBottom: vs(24),
    lineHeight: vs(20),
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: s(12),
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: vs(12),
    borderRadius: s(8),
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    fontFamily: FONTS.muktaMalar.medium,
    color: '#666',
  },
  loginButtonText: {
    fontFamily: FONTS.muktaMalar.medium,
    color: '#fff',
  },
});