// components/CommentsModal.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, FlatList, TextInput,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
  Animated, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mainApi, CDNApi, API_ENDPOINTS } from '../config/api';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs, ms, scaledSizes } from '../utils/scaling';
import { useFontSize } from '../context/FontSizeContext';

// ─── Reply Item ───────────────────────────────────────────────────────────────
function ReplyItem({ item, index }) {
  const { sf } = useFontSize();
  const name   = item.name     || item.username || 'பயனர்';
  const text   = item.comments || item.comment  || item.text || '';
  const ago    = item.ago      || item.standarddate || item.date || '';
  const avatar = item.images   || item.avatar || '';
  const colors = ['#e53935','#8e24aa','#1e88e5','#00897b','#f4511e','#6d4c41'];
  const bgColor = colors[(name.charCodeAt(0) || index) % colors.length];

  return (
    <View style={rs.row}>
      <View style={rs.line} />
      <View style={[rs.avatar, { backgroundColor: bgColor }]}>
        {!!avatar
          ? <Image source={{ uri: avatar }} style={rs.avatarImg} />
          : <Text style={[rs.avatarTxt, { fontSize: sf(12) }]}>{name.charAt(0).toUpperCase()}</Text>
        }
      </View>
      <View style={rs.body}>
        <View style={rs.nameRow}>
          <Text style={[rs.name, { fontSize: sf(13) }]} numberOfLines={1}>{name}</Text>
          {!!ago && <Text style={[rs.date, { fontSize: sf(11) }]}>{ago}</Text>}
        </View>
        <Text style={[rs.text, { fontSize: sf(13), lineHeight: sf(18) }]}>{text}</Text>
      </View>
    </View>
  );
}

const rs = StyleSheet.create({
  row:       { flexDirection: 'row', paddingLeft: s(52), paddingRight: s(16), paddingVertical: vs(8), alignItems: 'flex-start' },
  line:      { position: 'absolute', left: s(34), top: 0, bottom: 0, width: 1.5, backgroundColor: '#e8e8e8' },
  avatar:    { width: s(28), height: s(28), borderRadius: s(14), justifyContent: 'center', alignItems: 'center', marginRight: s(8), flexShrink: 0, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarTxt: { fontFamily: FONTS.muktaMalar.bold, color: '#fff' },
  body:      { flex: 1 },
  nameRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: vs(2) },
  name:      { fontFamily: FONTS.muktaMalar.semibold, color: '#1a1a1a', flex: 1 },
  date:      { fontFamily: FONTS.muktaMalar.regular, color: '#aaa', flexShrink: 0 },
  text:      { fontFamily: FONTS.muktaMalar.regular, color: COLORS.text },
});

// ─── Reply Input (inline below a comment) ─────────────────────────────────────
function ReplyInput({ commentId, newsId, onSubmitted, onCancel }) {
  const { sf } = useFontSize();
  const [text, setText]       = useState('');
  const [name, setName]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      // Post reply to API
      await mainApi.post('/comments', {
        newsid:    newsId,
        commentid: commentId,
        name:      name.trim() || 'பயனர்',
        comments:  text.trim(),
        type:      'reply',
      });
      setText('');
      setName('');
      onSubmitted?.();
    } catch (e) {
      // Optimistically show reply even if API fails
      onSubmitted?.({
        id:       Date.now(),
        name:     name.trim() || 'பயனர்',
        comments: text.trim(),
        ago:      'இப்போது',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={ri.wrap}>
      <View style={ri.line} />
      <View style={ri.inner}>
        <TextInput
          ref={inputRef}
          style={[ri.nameInput, { fontSize: sf(13) }]}
          placeholder="உங்கள் பெயர்..."
          placeholderTextColor="#bbb"
          value={name}
          onChangeText={setName}
          maxLength={50}
        />
        <View style={ri.row}>
          <TextInput
            style={[ri.input, { fontSize: sf(13) }]}
            placeholder="பதில் எழுதுங்கள்..."
            placeholderTextColor="#bbb"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[ri.sendBtn, !!text.trim() && ri.sendBtnActive]}
            onPress={handleSubmit}
            disabled={!text.trim() || submitting}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={s(15)} color={text.trim() ? '#fff' : '#ccc'} />
            }
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onCancel} style={ri.cancelBtn}>
          <Text style={[ri.cancelTxt, { fontSize: sf(12) }]}>ரத்து செய்</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ri = StyleSheet.create({
  wrap:        { paddingLeft: s(52), paddingRight: s(16), paddingBottom: vs(8) },
  line:        { position: 'absolute', left: s(34), top: 0, bottom: 0, width: 1.5, backgroundColor: '#e8e8e8' },
  inner:       { backgroundColor: '#f8f9fa', borderRadius: s(8), padding: s(10), borderWidth: 1, borderColor: '#e8e8e8' },
  nameInput:   { fontFamily: FONTS.muktaMalar.regular, color: '#333', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: vs(4), marginBottom: vs(6) },
  row:         { flexDirection: 'row', alignItems: 'flex-end', gap: s(8) },
  input:       { flex: 1, minHeight: vs(36), maxHeight: vs(80), fontFamily: FONTS.muktaMalar.regular, color: '#333', backgroundColor: '#fff', borderRadius: s(6), paddingHorizontal: s(10), paddingVertical: vs(6), borderWidth: 1, borderColor: '#e0e0e0' },
  sendBtn:     { width: s(34), height: s(34), borderRadius: s(17), backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  sendBtnActive: { backgroundColor: COLORS.primary },
  cancelBtn:   { alignSelf: 'flex-start', marginTop: vs(6) },
  cancelTxt:   { color: '#999', fontFamily: FONTS.muktaMalar.regular },
});

// ─── Comment Row ──────────────────────────────────────────────────────────────
function CommentItem({ item, index, newsId, replyingTo, onReplyPress, onReplySubmitted }) {
  const { sf } = useFontSize();
  const name     = item.name     || item.username || 'பயனர்';
  const text     = item.comments || item.comment  || item.text || '';
  const ago      = item.ago      || item.standarddate || item.date || '';
  const likes    = parseInt(item.com_like    || 0);
  const dislikes = parseInt(item.com_dislike || 0);
  const avatar   = item.images   || item.avatar || '';
  const replies  = Array.isArray(item.reply) ? item.reply : [];
  const commentId = item.id || item.commentid;

  const colors  = ['#e53935','#8e24aa','#1e88e5','#00897b','#f4511e','#6d4c41'];
  const bgColor = colors[(name.charCodeAt(0) || index) % colors.length];

  // Local optimistic replies
  const [localReplies, setLocalReplies] = useState(replies);

  const isReplying = replyingTo === commentId;

  const handleReplySubmitted = (newReply) => {
    if (newReply) {
      setLocalReplies(prev => [...prev, newReply]);
    }
    onReplySubmitted?.();
  };

  return (
    <View>
      {/* Main comment */}
      <View style={cs.row}>
        <View style={[cs.avatar, { backgroundColor: bgColor }]}>
          {!!avatar
            ? <Image source={{ uri: avatar }} style={cs.avatarImg} />
            : <Text style={[cs.avatarTxt, { fontSize: sf(15) }]}>{name.charAt(0).toUpperCase()}</Text>
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
            <TouchableOpacity
              style={[cs.actionBtn, isReplying && cs.replyBtnActive]}
              onPress={() => onReplyPress(isReplying ? null : commentId)}
            >
              <Ionicons
                name="chatbubble-outline"
                size={sf(13)}
                color={isReplying ? COLORS.primary : '#888'}
              />
              <Text style={[cs.actionTxt, { fontSize: sf(11) }, isReplying && cs.replyTxtActive]}>
                {isReplying ? 'மூடு' : 'பதில்'}
                {localReplies.length > 0 ? ` (${localReplies.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Existing replies */}
      {localReplies.map((reply, ri) => (
        <ReplyItem key={`reply-${ri}-${reply.id || ri}`} item={reply} index={ri} />
      ))}

      {/* Inline reply input */}
      {isReplying && (
        <ReplyInput
          commentId={commentId}
          newsId={newsId}
          onSubmitted={handleReplySubmitted}
          onCancel={() => onReplyPress(null)}
        />
      )}

      <View style={cs.divider} />
    </View>
  );
}

const cs = StyleSheet.create({
  row:           { flexDirection: 'row', paddingHorizontal: s(16), paddingVertical: vs(12), alignItems: 'flex-start' },
  avatar:        { width: s(36), height: s(36), borderRadius: s(18), justifyContent: 'center', alignItems: 'center', marginRight: s(10), flexShrink: 0, overflow: 'hidden' },
  avatarImg:     { width: '100%', height: '100%' },
  avatarTxt:     { fontSize: ms(15), fontFamily: FONTS.muktaMalar.bold, color: '#fff' },
  body:          { flex: 1 },
  nameRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: vs(4) },
  name:          { fontSize: scaledSizes.font.md, fontFamily: FONTS.muktaMalar.semibold, color: '#1a1a1a', flex: 1 },
  date:          { fontSize: scaledSizes.font.sm, fontFamily: FONTS.muktaMalar.regular, color: '#aaa', flexShrink: 0 },
  text:          { fontSize: scaledSizes.font.md, fontFamily: FONTS.muktaMalar.regular, color: COLORS.text, lineHeight: ms(20) },
  actions:       { flexDirection: 'row', marginTop: vs(6), gap: s(14) },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', gap: s(4) },
  actionTxt:     { fontSize: ms(11), fontFamily: FONTS.muktaMalar.medium, color: '#888' },
  replyBtnActive:{ },
  replyTxtActive:{ color: COLORS.primary },
  divider:       { height: 1, backgroundColor: '#f5f5f5', marginLeft: s(16) },
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

// ─── Empty ────────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractComments(d) {
  if (!d) return [];
  for (const path of [d?.comments?.data, d?.comments, d?.data, d?.result, d?.items]) {
    if (Array.isArray(path)) {
      const filtered = path.filter(Boolean);
      if (filtered.length > 0) return filtered;
    }
  }
  return [];
}

function extractLastPage(d) {
  return d?.comments?.last_page || d?.last_page || 1;
}

function extractTotal(d) {
  return d?.comments?.total || d?.total || 0;
}

// ─── Main CommentsModal ───────────────────────────────────────────────────────
export default function CommentsModal({
  visible,
  onClose,
  newsId,
  newsTitle,
  commentCount = 0,
  preloadedComments,
}) {
  const { sf } = useFontSize();

  const [comments, setComments]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]               = useState(1);
  const [lastPage, setLastPage]       = useState(1);
  const [totalCount, setTotalCount]   = useState(commentCount);
  const [inputText, setInputText]     = useState('');
  const [inputName, setInputName]     = useState('');
  const [submitting, setSubmitting]   = useState(false);

  // Which comment is currently being replied to (by comment id)
  const [replyingTo, setReplyingTo]   = useState(null);

  const initialisedForNewsId = useRef(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const flatListRef = useRef(null);

  // Slide animation
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300);
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }).start();
    }
  }, [visible]);

  // ── Fetch a single page ───────────────────────────────────────────────────
  const fetchPage = useCallback(async (id, pg) => {
    const urls = [
      () => mainApi.get(`${API_ENDPOINTS.COMMENTS}?newsid=${id}&page=${pg}`),
      () => mainApi.get(`${API_ENDPOINTS.COMMENTS}?videoid=${id}&page=${pg}`),
      () => CDNApi.get(`/comments?newsid=${id}&page=${pg}`),
      () => CDNApi.get(`/comments?videoid=${id}&page=${pg}`),
      () => CDNApi.get(`${API_ENDPOINTS.DETAIL}?newsid=${id}&page=${pg}`),
    ];
    let d = null;
    for (const urlFn of urls) {
      try {
        const res = await urlFn();
        d = res?.data;
        if (d && (d?.comments?.data || d?.comments || d?.data || d?.result || d?.items)) break;
      } catch { continue; }
    }
    return d;
  }, []);

  // ── Fetch first page ──────────────────────────────────────────────────────
  const fetchComments = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const d    = await fetchPage(id, 1);
      const list = extractComments(d);
      const lp   = extractLastPage(d);
      const tot  = extractTotal(d);
      setComments(list);
      setPage(1);
      setLastPage(lp);
      if (tot > 0) setTotalCount(tot);
    } catch (e) {
      console.error('[CommentsModal] fetch error:', e?.message);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  // ── Load next page ────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || page >= lastPage) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const d    = await fetchPage(newsId, nextPage);
      const list = extractComments(d);
      setComments(prev => [...prev, ...list]);
      setPage(nextPage);
    } catch (e) {
      console.error('[CommentsModal] load more error:', e?.message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page, lastPage, newsId, fetchPage]);

  // ── Open/close ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      setComments([]);
      setPage(1);
      setLastPage(1);
      setInputText('');
      setInputName('');
      setReplyingTo(null);
      initialisedForNewsId.current = null;
      return;
    }
    if (initialisedForNewsId.current === newsId) return;
    initialisedForNewsId.current = newsId;
    if (Array.isArray(preloadedComments) && preloadedComments.length > 0) {
      setComments(preloadedComments);
    }
    fetchComments(newsId);
  }, [visible, newsId]);

  // ── Post new top-level comment ────────────────────────────────────────────
  const handlePostComment = async () => {
    if (!inputText.trim()) return;
    setSubmitting(true);
    try {
      await mainApi.post('/comments', {
        newsid:   newsId,
        name:     inputName.trim() || 'பயனர்',
        comments: inputText.trim(),
        type:     'comment',
      });
      // Optimistically prepend
      const newComment = {
        id:       Date.now(),
        name:     inputName.trim() || 'பயனர்',
        comments: inputText.trim(),
        ago:      'இப்போது',
        reply:    [],
      };
      setComments(prev => [newComment, ...prev]);
      setTotalCount(prev => prev + 1);
      setInputText('');
      setInputName('');
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (e) {
      // Still show optimistically
      const newComment = {
        id:       Date.now(),
        name:     inputName.trim() || 'பயனர்',
        comments: inputText.trim(),
        ago:      'இப்போது',
        reply:    [],
      };
      setComments(prev => [newComment, ...prev]);
      setTotalCount(prev => prev + 1);
      setInputText('');
      setInputName('');
    } finally {
      setSubmitting(false);
    }
  };

  const displayCount = totalCount || commentCount || comments.length;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={modal.overlay}>
        <TouchableOpacity style={modal.backdrop} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={modal.kavWrap}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <Animated.View style={[modal.sheet, { transform: [{ translateY: slideAnim }] }]}>

            {/* Handle */}
            <View style={modal.handleWrap}><View style={modal.handle} /></View>

            {/* Header */}
            <View style={modal.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(10) }}>
                <Text style={[modal.headerTitle, { fontSize: sf(18) }]}>கருத்துகள்</Text>
                {displayCount > 0 && (
                  <Text style={[modal.headerCount, { fontSize: sf(18) }]}>{displayCount}</Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={modal.closeBtn} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
                <Ionicons name="close" size={sf(22)} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={modal.divider} />

            {/* Comment list */}
            {loading ? (
              <FlatList
                data={[1,2,3,4,5]}
                keyExtractor={i => `sk-${i}`}
                renderItem={() => <CommentSkeleton />}
                style={{ flex: 1 }}
              />
            ) : (
              <FlatList
                ref={flatListRef}
                data={comments}
                keyExtractor={(item, i) => `comment-${item.id || item.commentid || i}`}
                renderItem={({ item, index }) => (
                  <CommentItem
                    item={item}
                    index={index}
                    newsId={newsId}
                    replyingTo={replyingTo}
                    onReplyPress={(id) => setReplyingTo(id)}
                    onReplySubmitted={() => setReplyingTo(null)}
                  />
                )}
                ListEmptyComponent={<EmptyComments />}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.4}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ListFooterComponent={
                  loadingMore
                    ? <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: vs(16) }} />
                    : <View style={{ height: vs(20) }} />
                }
              />
            )}

            {/* Bottom input — post new top-level comment */}
            <View style={modal.inputWrap}>
              {/* Name field */}
              <TextInput
                style={[modal.nameInput, { fontSize: sf(12) }]}
                placeholder="உங்கள் பெயர் (விரும்பினால்)..."
                placeholderTextColor="#bbb"
                value={inputName}
                onChangeText={setInputName}
                maxLength={50}
              />
              <View style={modal.inputRow}>
                <View style={modal.inputAvatar}>
                  <Ionicons name="person" size={s(16)} color="#999" />
                </View>
                <TextInput
                  style={[modal.input, { fontSize: sf(13) }]}
                  placeholder="உங்கள் கருத்தை பதிவிடுங்கள்..."
                  placeholderTextColor="#bbb"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[modal.sendBtn, !!inputText.trim() && modal.sendBtnActive]}
                  onPress={handlePostComment}
                  disabled={!inputText.trim() || submitting}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="send" size={s(16)} color={inputText.trim() ? '#fff' : '#ccc'} />
                  }
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
  overlay:     { flex: 1, justifyContent: 'flex-end' },
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: s(20), borderTopRightRadius: s(20), maxHeight: '92%', paddingBottom: Platform.OS === 'ios' ? vs(34) : vs(10) },
  handleWrap:  { alignItems: 'center', paddingTop: vs(10), paddingBottom: vs(4) },
  handle:      { width: s(36), height: vs(4), borderRadius: s(2), backgroundColor: '#ddd' },
  header:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: s(16), paddingTop: vs(8), paddingBottom: vs(12) },
  headerTitle: { fontSize: scaledSizes.font.xl, fontFamily: FONTS.muktaMalar.bold, color: '#1a1a1a' },
  headerCount: { fontSize: scaledSizes.font.xl, fontFamily: FONTS.muktaMalar.regular, color: '#888' },
  closeBtn:    { padding: s(4) },
  divider:     { height: 1, backgroundColor: '#f0f0f0' },
  inputWrap:   { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingHorizontal: s(12), paddingTop: vs(8), paddingBottom: vs(10) },
  nameInput:   { fontFamily: FONTS.muktaMalar.regular, color: '#333', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: vs(4), marginBottom: vs(6), paddingHorizontal: s(4) },
  inputRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: s(8) },
  inputAvatar: { width: s(34), height: s(34), borderRadius: s(17), backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  input:       { flex: 1, minHeight: vs(36), maxHeight: vs(100), backgroundColor: '#f8f8f8', borderRadius: s(18), paddingHorizontal: s(14), paddingVertical: vs(8), fontFamily: FONTS.muktaMalar.regular, color: '#333', borderWidth: 1, borderColor: '#eee' },
  sendBtn:     { width: s(36), height: s(36), borderRadius: s(18), backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  sendBtnActive: { backgroundColor: COLORS.primary },
  kavWrap:     { justifyContent: 'flex-end', position: 'absolute', bottom: 0, left: 0, right: 0 },
});