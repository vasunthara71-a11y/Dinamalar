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
import { Ionicons } from '@expo/vector-icons';
import { mainApi, CDNApi, API_ENDPOINTS } from '../config/api';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs, ms, scaledSizes } from '../utils/scaling';
import FontSizeControl from './FontSizeControl';
import { useFontSize } from '../context/FontSizeContext';

// ─── Single Comment Row ───────────────────────────────────────────────────────
function CommentItem({ item, index }) {
  const { sf } = useFontSize();
  const name     = item.name         || item.username || 'பயனர்';
  const text     = item.comments     || item.comment  || item.text || '';
  const ago      = item.ago          || item.standarddate || item.date || '';
  const likes    = parseInt(item.com_like    || 0);
  const dislikes = parseInt(item.com_dislike || 0);
  const avatar   = item.images       || item.avatar   || '';

  const colors  = ['#e53935','#8e24aa','#1e88e5','#00897b','#f4511e','#6d4c41'];
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
        <View style={cs.actions}>
          <TouchableOpacity style={cs.actionBtn}>
            <Ionicons name="thumbs-up-outline" size={sf(13)} color="#888" />
            {likes > 0 && <Text style={[cs.actionTxt, { fontSize: sf(11) }]}>{likes}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={cs.actionBtn}>
            <Ionicons name="thumbs-down-outline" size={sf(13)} color="#888" />
            {dislikes > 0 && <Text style={[cs.actionTxt, { fontSize: sf(11) }]}>{dislikes}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={cs.actionBtn}>
            <Ionicons name="chatbubble-outline" size={sf(13)} color="#888" />
            <Text style={[cs.actionTxt, { fontSize: sf(11) }]}>பதில்</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: s(16),
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
  actions: { flexDirection: 'row', marginTop: vs(6), gap: s(14) },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: s(4) },
  actionTxt: { fontSize: ms(11), fontFamily: FONTS.muktaMalar.medium, color: '#888' },
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
  row:    { flexDirection: 'row', padding: s(16), borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  avatar: { width: s(36), height: s(36), borderRadius: s(18), backgroundColor: '#eee', marginRight: s(10) },
  body:   { flex: 1, gap: vs(6) },
  name:   { width: s(80), height: vs(12), backgroundColor: '#eee', borderRadius: s(4) },
  line:   { width: '90%', height: vs(10), backgroundColor: '#f2f2f2', borderRadius: s(4) },
});

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyComments() {
  const { sf } = useFontSize();
  return (
    <View style={em.wrap}>
      <Ionicons name="chatbubbles-outline" size={sf(52)} color="#ddd" />
      <Text style={[em.title, { fontSize: sf(16) }]}>கருத்துகள் இல்லை</Text>
      <Text style={[em.sub, { fontSize: sf(13) }]}>முதல் கருத்தை பதிவிடுங்கள்!</Text>
    </View>
  );
}
const em = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: vs(60) },
  title: { fontSize: ms(16), fontFamily: FONTS.muktaMalar.bold, color: '#aaa', marginTop: vs(12) },
  sub:   { fontSize: ms(13), fontFamily: FONTS.muktaMalar.regular, color: '#ccc', marginTop: vs(6) },
});

// ─── Extract helpers ──────────────────────────────────────────────────────────
// u38Api /detaildata?newsid=ID response shape (CONFIRMED):
// { comments: { current_page: 1, data: [...], last_page: N } }
// Each comment: { id, name, city, images, comments, com_like, com_dislike, ago, standarddate, reply: [] }
function extractComments(d) {
  if (!d) return [];
  
  // Try multiple possible paths for comments data
  const possiblePaths = [
    d?.comments?.data,      // Standard path
    d?.comments,            // Direct comments array
    d?.data,                // Top-level data
    d?.result,              // Result field
    d?.items,               // Items field
  ];
  
  for (const path of possiblePaths) {
    if (Array.isArray(path)) {
      const filtered = path.filter(Boolean);
      if (filtered.length > 0) {
        console.log('[CommentsModal] found comments in path:', path);
        return filtered;
      }
    }
  }
  
  console.log('[CommentsModal] no comments found in any path');
  return [];
}

function extractLastPage(d) {
  return d?.comments?.last_page || 1;
}

// ─── Main CommentsModal ───────────────────────────────────────────────────────
export default function CommentsModal({ visible, onClose, newsId, newsTitle, commentCount = 0, preloadedComments = [] }) {
  const { sf } = useFontSize();
  const [comments, setComments] = useState(preloadedComments);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [inputText, setInputText] = useState('');

  const slideAnim = useRef(new Animated.Value(300)).current;

  // ── Animate open ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300);
      Animated.spring(slideAnim, {
        toValue: 0, tension: 65, friction: 11, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // ── Fetch — u38Api /detaildata?newsid=ID (CONFIRMED: comments at d.comments.data)
  const fetchComments = useCallback(async (id, pg = 1, append = false) => {
    if (!id) return;
    
    console.log('[CommentsModal] fetchComments called with ID:', id);
    console.log('[CommentsModal] fetchComments called with page:', pg);
    console.log('[CommentsModal] fetchComments called with append:', append);
    
    pg === 1 ? setLoading(true) : setLoadingMore(true);

    try {
      // Try different APIs and endpoints for video comments
      const urls = [
        // First try the dedicated comments helper function
        () => mainApi.get(`${API_ENDPOINTS.COMMENTS}?newsid=${id}&page=${pg}`),
        () => mainApi.get(`${API_ENDPOINTS.COMMENTS}?videoid=${id}&page=${pg}`),
        // Then try CDNApi with different endpoints
        () => CDNApi.get(`/comments?newsid=${id}&page=${pg}`),
        () => CDNApi.get(`/comments?videoid=${id}&page=${pg}`),
        // Finally try detail data endpoints
        () => CDNApi.get(`${API_ENDPOINTS.DETAIL}?newsid=${id}&page=${pg}`),
        () => CDNApi.get(`${API_ENDPOINTS.DETAIL}?videoid=${id}&page=${pg}`),
        () => CDNApi.get(`${API_ENDPOINTS.DETAIL}?id=${id}&page=${pg}`),
      ];
      
      let res = null;
      let d = null;
      let usedUrl = null;
      let usedApi = null;
      
      // Try each URL/API until one works
      for (const urlFn of urls) {
        try {
          const url = typeof urlFn === 'function' ? '[function]' : urlFn;
          console.log('[CommentsModal] trying API call:', url);
          
          if (typeof urlFn === 'function') {
            res = await urlFn();
            usedApi = 'mainApi';
          } else {
            res = await CDNApi.get(urlFn);
            usedApi = 'CDNApi';
          }
          
          d = res?.data;
          
          if (d && (d?.comments?.data || d?.comments || d?.data || d?.result || d?.items)) {
            usedUrl = typeof urlFn === 'function' ? '[function]' : urlFn;
            console.log('[CommentsModal] SUCCESS with API:', usedApi, 'URL:', usedUrl);
            break;
          }
        } catch (e) {
          console.log('[CommentsModal] FAILED API call:', e?.message);
          continue;
        }
      }
      
      if (!usedUrl) {
        console.log('[CommentsModal] all API calls failed, showing error response');
        // Try one more time to show what the actual error is
        try {
          res = await mainApi.get(`${API_ENDPOINTS.COMMENTS}?newsid=${id}&page=${pg}`);
          d = res?.data;
          usedApi = 'mainApi';
          usedUrl = `${API_ENDPOINTS.COMMENTS}?newsid=${id}&page=${pg}`;
        } catch (e) {
          console.log('[CommentsModal] Final error:', e?.response?.status, e?.response?.data);
          throw e;
        }
      }
      
      console.log('[CommentsModal] final API used:', usedApi);
      console.log('[CommentsModal] final URL used:', usedUrl);
      console.log('[CommentsModal] full API response:', JSON.stringify(d, null, 2));
      console.log('[CommentsModal] response keys:', Object.keys(d || {}));
      console.log('[CommentsModal] comments structure:', d?.comments);
      console.log('[CommentsModal] comments data:', d?.comments?.data);
      console.log('[CommentsModal] alternative paths:', {
        'd.comments': d?.comments,
        'd.data': d?.data,
        'd.result': d?.result,
        'd.items': d?.items,
      });

      const list = extractComments(d);
      const lp   = extractLastPage(d);
      
      console.log('[CommentsModal] extracted comments:', list);
      console.log('[CommentsModal] last page:', lp);

      setLastPage(lp);
      setPage(pg);
      setComments(prev => append ? [...prev, ...list] : list);
    } catch (e) {
      console.error('[CommentsModal] error:', e?.message, e?.response?.status);
      setComments([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [newsId]);

  useEffect(() => {
    if (visible) {
      if (preloadedComments && preloadedComments.length > 0) {
        console.log('[CommentsModal] using preloaded comments:', preloadedComments.length);
        setComments(preloadedComments);
        setPage(1);
        setLastPage(1);
        setLoading(false);
      } else {
        console.log('[CommentsModal] no preloaded comments, showing empty state');
        setComments([]);
        setPage(1);
        setLastPage(1);
        setLoading(false);
      }
    }
    if (!visible) {
      setComments([]);
      setPage(1);
      setLastPage(1);
      setInputText('');
    }
  }, [visible]);

  const handleLoadMore = () => {
    if (loadingMore || page >= lastPage) return;
    fetchComments(newsId, page + 1, true);
  };

  const totalCount = commentCount || comments.length;

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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(10) }}>
                <Text style={[modal.headerTitle, { fontSize: sf(18) }]}>கருத்துகள்</Text>
                {totalCount > 0 && (
                  <Text style={[modal.headerCount, { fontSize: sf(18) }]}>{totalCount}</Text>
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
              />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item, i) => `comment-${item.id || item.commentid || i}`}
                renderItem={({ item, index }) => <CommentItem item={item} index={index} />}
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

            {/* Input */}
            <View style={modal.inputWrap}>
              <View style={modal.inputRow}>
                <View style={modal.inputAvatar}>
                  <Ionicons name="person" size={s(16)} color="#999" />
                </View>
                <TextInput
                  style={modal.input}
                  placeholder="உங்கள் கருத்தை பதிவிடுங்கள்..."
                  placeholderTextColor="#bbb"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[modal.sendBtn, !!inputText.trim() && modal.sendBtnActive]}
                  onPress={() => { if (inputText.trim()) setInputText(''); }}
                  disabled={!inputText.trim()}
                >
                  <Ionicons name="send" size={s(16)} color={inputText.trim() ? '#fff' : '#ccc'} />
                </TouchableOpacity>
              </View>
            </View>

          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
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
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: s(16), paddingTop: vs(8), paddingBottom: vs(12),
  },
  headerTitle: { fontSize: scaledSizes.font.xl, fontFamily: FONTS.muktaMalar.bold, color: '#1a1a1a' },
  headerCount: { fontSize: scaledSizes.font.xl, fontFamily: FONTS.muktaMalar.regular, color: '#888' },
  closeBtn: { padding: s(4) },
  divider:  { height: 1, backgroundColor: '#f0f0f0' },
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
  kavWrap: {
    justifyContent: 'flex-end',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
});