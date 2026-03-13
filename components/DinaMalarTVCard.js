// ─── Dinamalar TV Card ────────────────────────────────────────────────────────
// NewsCard-style layout but with play button overlay on image — tapping opens VideoPlayerModal
function DinaMalarTVCard({ item, onPress }) {
  const { sf } = useFontSize();

  const imageUri =
    item.largeimages || item.images || item.image || item.thumbnail || item.thumb ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const title    = item.newstitle || item.title || item.videotitle || item.name || '';
  const category = item.maincat   || item.categrorytitle || item.ctitle || item.maincategory || '';
  const ago      = item.ago       || item.time_ago || '';
  const newscomment = item.newscomment || item.commentcount || '';

  return (
    <View style={NewsCardStyles.wrap}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>

        {/* Thumbnail with play-button overlay */}
        <View style={NewsCardStyles.imageWrap}>
          <Image source={{ uri: imageUri }} style={NewsCardStyles.image} resizeMode="contain" />

          {/* Dark scrim + play circle */}
          <View style={tvCardSt.playOverlay}>
            <View style={tvCardSt.playCircle}>
              <Ionicons name="play" size={s(22)} color="#fff" />
            </View>
          </View>

          {/* "LIVE TV" badge in top-left */}
          <View style={tvCardSt.badge}>
            <Ionicons name="videocam" size={s(10)} color="#fff" style={{ marginRight: s(3) }} />
            <Text style={tvCardSt.badgeText}>TV</Text>
          </View>
        </View>

        {/* Text content — identical to NewsCard */}
        <View style={NewsCardStyles.contentContainer}>
          {!!title && (
            <Text
              style={[NewsCardStyles.title, { fontSize: sf(15), lineHeight: sf(22) }]}
              numberOfLines={3}
            >
              {title}
            </Text>
          )}

          {!!category && (
            <View style={NewsCardStyles.catPill}>
              <Text style={[NewsCardStyles.catText, { fontSize: sf(11) }]}>{category}</Text>
            </View>
          )}

          <View style={NewsCardStyles.metaRow}>
            <Text style={[NewsCardStyles.timeText, { fontSize: sf(11) }]}>{ago}</Text>
            {!!newscomment && newscomment !== '0' && (
              <View style={NewsCardStyles.commentRow}>
                <Ionicons name="chatbox" size={s(14)} color={PALETTE.grey700} />
                <Text style={[NewsCardStyles.commentText, { fontSize: sf(11) }]}> {newscomment}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <View style={NewsCardStyles.divider} />
    </View>
  );
}

const tvCardSt = StyleSheet.create({
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: 'rgba(9, 109, 210, 0.85)', // PALETTE.primary with opacity
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: s(3),                           // optical nudge for play icon
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  badge: {
    position: 'absolute',
    top: s(8),
    left: s(8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: s(4),
    paddingHorizontal: s(6),
    paddingVertical: s(3),
  },
  badgeText: {
    color: '#fff',
    fontSize: ms(9),
    fontFamily: FONTS.muktaMalar.bold,
    letterSpacing: 0.5,
  },
});
export default DinaMalarTVCard;