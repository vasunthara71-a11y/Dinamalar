import axios from 'axios';

// ─── Simple Request Cache ───────────────────────────────────────────────────────
const requestCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  requestCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// ─── API Base URLs ────────────────────────────────────────────────────────
export const API_BASE_URLS = {
  MAIN: 'https://api-st-cdn.dinamalar.com',
  // DMR_API: 'https://dmrapi.dinamalar.com',
  U38: 'https://u38.dinamalar.com',
  OPEN_API: 'https://openapi-st-cdn.dinamalar.com',
  CDN: 'https://api-st-cdn.dinamalar.com',
  CHUNK_BUCKET: 'https://d4zhduaroqbqc.cloudfront.net',
  WEBSITE: 'https://www.dinamalar.com',
  PROD_MAIN: 'https://www.dinamalar.com',
  // PROD_API: 'https://dmrapi.dinamalar.com',
};

// ─── API Endpoints ───────────────────────────────────────────────────────
export const API_ENDPOINTS = {
  // Core APIs
  HOME: '/home',
  MENU: '/menuindex1',
  LATEST_MAIN: '/latestmain',
  LATEST_NOTIFY: '/latestnotify',
  FLASH: '/flash',
  DETAIL: '/detaildata',

  // Content APIs
  NEWS_DATA: '/newsdata',
  VIDEO_DATA: '/videodata',
  PHOTO_MAIN: '/photomain',
  PHOTO_ITEM: '/photoitem',
  AUDIO: '/audio',
  VIDEO_MAIN: '/videomain',
  VIDEO_DETAIL: '/videodetail',
  SHORTS: '/shorts',

  // Category Specific
  VARthagam: '/varthagamdata',
  DISTRICT: '/district',
  DISTRICT_DATA: '/districtdata',
  DIST_VIDEO: '/videodata?cat=1585',
  SUBAM: '/subam',

  // Special Categories
  TEMPLE_MAIN: '/templemain',
  TEMPLE_LISTING: '/templelisting',
  JOSHIYAM: '/joshiyam',
  KADAL_THAMARAI: '/kadalthamarai',
  ANMEGAM: '/anmegam',
  ANMEGAMAIN: '/anmegammain',
  ANMEGAMAINLISTING: '/anmegammainlist',
  ANMIGASINTHANAI: '/aanmegasinthanaihome',
  ANMIGASINTHANAI_CAT: '/aanmegasinthanaimainlist',
  ANMIGASINTHANAI_DETAIL: '/aanmeegamnewsdetail',

  // NRI APIs
  NRI: '/nri',
  NRI_MAIN: '/nrimain',
  NRI_ENGLISH: '/nri?lang=en',
  NRITAMILCAT: '/nricategory?lang=ta&cat',
  NRIENGCAT: '/nricategory?lang=en&cat',
  NRIDETAIL: '/nridetail?cat',
  NRIDOMESTIC_DETAIL: '/otherstatenewsdetail?cat',

  // Astrology APIs
  TODAYRASI: '/todayrasidata',
  WEEKLYRASI: '/weeklyrasiupdate',
  MONTHLYRASI: '/monthlyrasi',
  GURUPEYARCHI_RASI: '/gurupeyerchi',
  SANIPEYARCHI_RASI: '/sanipeyerchi',
  RAGU_KEDHU_PEYARCHI_RASI: '/rahukethupeyerchi',
  TAMIL_NEW_YEAR: '/tamilnewyear',
  ENGLISH_NEW_YEAR: '/englishnewyear',
  ANMEEGACALENDAR: '/aanmegacalendar',
  VASTHUDAYS: '/vasthunatkal',
  KARINAAL: '/karinaal',
  VIRATHANAAL: '/importantviratham',

  // Educational
  KALVIMALAR: '/kalvimalarhome',
  KALVIMALARCATEGORY1: '/kalvimalarnews',
  KALVIMALARCATEGORY2: '/kalvimalararticle',
  KALVIMALARDETAIL: '/kalvimalardetails',
  KALVIMALAR_HOMEENG: '/kalvimalarenhome',
  KALVIMALARENG_CATEGORY1: '/kalvimalarennews',
  KALVIMALARENG_CATEGORY2: '/kalvimalarenarticle',
  KALVIMALARENG_DETAIL: '/kalvimalardetailsen',

  // Children
  KANNAMMA: '/kannammadata',
  MALARGAL: '/malargal',
  MALARGALMAIN: '/malargal',

  // Literature
  KURALFILTER: '/filter',
  KURALLISTING: '/kurallisting',
  KURALLISTINGMAIN: '/kurallisting?id=1',
  KURALDETAIL: '/kuraldetail',

  // Reels & Media
  REELS: '/getReels',
  MOBILEREELS: '/reelsmobiles',
  SHORTS: '/reelslist',
  SHORTSDETAIL: '/getreels',
  RECENT_REEELS: '/recentreels',

  // Special Content
  SPECIALMAIN: '/specialmain',
  SPECIALLIST: '/speciallist',
  SPECIALCATLIST: '/specialcatlist',
  EDITOR_CHOICE: '/editorchoice',
  TODAY_SPECIAL: '/todayspecial',

  // Static Pages
  CONTACT_US: '/contactus',
  COPYRIGHT: '/copyright',
  PRIVACY_POLICY: '/privacypolicy',
  TERMS_CONDITIONS: '/termsconditions',
  ABOUT_US: '/aboutus',

  // Web Stories
  WEBSTORY: '/webstoriesupdate',
  WEBSTORYLISTING: '/webstorieslisting',

  // Search
  SEARCH: '/search',
  SEARCH_FILTER: '/searchfilter',
  VIDEOSEARCH: '/videodata?search',

  // User & Auth
  PROFILE: '/profile',
  USER_COMMENTS: '/usercommentslist',
  COMMENTS: '/comments',
  POST_COMMENTS: '/postcomments',
  BOOKMARK: '/bookmark',
  BOOKMARK_CHECK: '/checkbookmark',
  BOOKMARK_REMOVE: '/unfavibookmark',

  // Location & Maps
  DISTMAP_HOME: '/mapdistrict',
  DISTMAP_CAT: '/mapdistrictcat',

  // Archive
  ARCHIEVE: '/archievecount',
  ARCHIEVEHOME: '/archiveyear',
  ARCHIEVEMONTH: '/archivemonth',
  ARCHIEVEDETAIL: '/archieve_new',
  ARCHIVENEW: '/archivenew',
  LINKLIST: '/archives',

  // Calendar
  CALENDARDATA: '/calendardata',
  DAILYCALENDAR: '/calendar/day',
  MONTHCALENDAR: '/calendar/month',
  CALYEARDATA: '/calendardata',

  // Business & Finance
  COMMODITY: '/bussinessbox',
  GOLD_SILVER: '/bussinessbox',

  // Social & Interactive
  SOCIALCARDSMAIN: '/getsocialmedia',
  RECENTCOMMENT: '/siranthavi',
  FEEDBACKFORM: '/feedbackform',
  VASAGARCOMMENT: '/vasagar',

  // Temple 360
  TEMPLEMAINENG: '/templemain?lang=en',

  // Other States
  OTHERSTATE_NEWS: '/otherstatenews',
  OTHERSTATE_CAT: '/otherstatenewscategory',

  // Sadhguru
  SADHGURU: '/sadhgurulist',
  SADHGURUDETAIL: '/detaildata',

  // Tours
  TOUR: '/tour',

  // Short News
  SHORT_NEWS: '/shortnews',

  // Tags
  TAGLIST: '/taglist',

  // Pugar Petti
  PUGARDATA: '/pugarpetti',
  PUGARMAINDATA: '/pugarmain',

  // Roadblocks
  HOME_ROADBLOCK: '/home_demoroadblock',
  HOMEMOBILE_ROADBLOCK: '/mobile_demoroadblock',

  // Rating
  STARRATING: '/rating',

  // OTP & Auth (Open API)
  SEND_OTP: '/sendotp',
  VERIFY_OTP: '/verifyotp',
  LOGOUT: '/logout',

  // User Activity
  GETUSER_ACTIVITY: '/images/useractivity/getuseracivity.php',
  BROWSING_HIST: '/images/useractivity/useractivity.php',

  // Error Handling
  ERROR_LOG: '/errorlog',

  // Feedback
  FEEDBACK_POSTAPI: '/feedback',

  // Captcha
  GCAPTCHA: '/images/useractivity/gcaptcha.php',

  // Sports
  SPORTS: '/sports',

  // Timeline APIs (using existing endpoints)
  TIMELINE: '/home',
  TIMELINE_NOTIFY: '/latestnotify',
};

// ─── News Category IDs ────────────────────────────────────────────────────
// Usage: dmrApi.get(`/newsdata?cat=${NEWS_CATS.TAMILAGAM}`)
export const NEWS_CATS = {
  THARPOTHAIYA: 5010,  // தற்போதைய செய்திகள்
  PREMIUM: 651,  // பிரீமியம்
  TAMILAGAM: 89,  // தமிழகம்
  INDIA: 100,  // இந்தியா
  WORLD: 34,  // உலகம்
};

// ─── Special (non-newsdata) Endpoints ────────────────────────────────────
// Usage: dmrApi.get(SPECIAL_ENDPOINTS.VARTHAGAM)
export const SPECIAL_ENDPOINTS = {
  VARTHAGAM: '/varthagam',   // வர்த்தகம்
  DISTRICT: '/district',    // உள்ளூர் செய்திகள்
  SPORTS: '/sports',      // விளையாட்டு
};

// ─── Category Map — for tab bars / screens ────────────────────────────────
// Full list of all categories with title + endpoint in one place.
// Usage: import { CATEGORY_MAP } from '../config/api';
//        CATEGORY_MAP.find(c => c.id === 'tamilagam').endpoint
export const CATEGORY_MAP = [
  {
    id: 'tharpothaiya',
    title: 'தற்போதைய',
    titleFull: 'தற்போதைய செய்திகள்',
    endpoint: `/newsdata?cat=${NEWS_CATS.THARPOTHAIYA}`,
  },
  {
    id: 'premium',
    title: 'பிரீமியம்',
    titleFull: 'பிரீமியம் செய்திகள்',
    endpoint: `/newsdata?cat=${NEWS_CATS.PREMIUM}`,
  },
  {
    id: 'tamilagam',
    title: 'தமிழகம்',
    titleFull: 'தமிழகம் செய்திகள்',
    endpoint: `/newsdata?cat=${NEWS_CATS.TAMILAGAM}`,
  },
  {
    id: 'india',
    title: 'இந்தியா',
    titleFull: 'இந்தியா செய்திகள்',
    endpoint: `/newsdata?cat=${NEWS_CATS.INDIA}`,
  },
  {
    id: 'world',
    title: 'உலகம்',
    titleFull: 'உலக செய்திகள்',
    endpoint: `/newsdata?cat=${NEWS_CATS.WORLD}`,
  },
  {
    id: 'varthagam',
    title: 'வர்த்தகம்',
    titleFull: 'வர்த்தக செய்திகள்',
    endpoint: SPECIAL_ENDPOINTS.VARTHAGAM,
  },
  {
    id: 'district',
    title: 'உள்ளூர்',
    titleFull: 'உள்ளூர் செய்திகள்',
    endpoint: SPECIAL_ENDPOINTS.DISTRICT,
  },
  {
    id: 'sports',
    title: 'விளையாட்டு',
    titleFull: 'விளையாட்டு செய்திகள்',
    endpoint: SPECIAL_ENDPOINTS.SPORTS,
  },
];

// ─── Axios Instances ───────────────────────────────────────────────────────
export const mainApi = axios.create({
  baseURL: API_BASE_URLS.MAIN,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

// export const dmrApi = axios.create({
//   baseURL: API_BASE_URLS.DMR_API,
//   timeout: 12000,
//   headers: { 'Content-Type': 'application/json' },
// });

export const u38Api = axios.create({
  baseURL: API_BASE_URLS.U38,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

export const CDNApi = axios.create({
  baseURL:API_BASE_URLS.CDN,
  timeout:15000, // Reduced to 15s for faster failure detection
  headers:{
    'Content-Type':'application/json',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br', // Enable compression
    'Connection': 'keep-alive' // Connection pooling
  },
});

// Add request interceptor with caching
CDNApi.interceptors.request.use(
   (config) => {
    // Check cache for GET requests
    if (config.method === 'get') {
      const cacheKey = `${config.baseURL}${config.url}`;
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        // Return cached data immediately
        config.adapter = () => Promise.resolve({
          data: cachedData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {},
        });
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response caching interceptor
CDNApi.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = `${response.config.baseURL}${response.config.url}`;
      setCachedData(cacheKey, response.data);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
// dmrApi.interceptors.response.use(
//   (response) => {
//     console.log('=== API RESPONSE DEBUG ===');
//     console.log('URL:', response.config.url);
//     console.log('Status:', response.status);
//     console.log('Data length:', JSON.stringify(response.data).length);
//     console.log('========================');
//     return response;
//   },
//   (error) => {
//     console.error('=== API RESPONSE ERROR ===');
//     console.error('URL:', error.config?.baseURL + error.config?.url);
//     console.error('Status:', error.response?.status);
//     console.error('Message:', error.message);
//     console.error('Code:', error.code);
//     console.error('==========================');
//     return Promise.reject(error);
//   }
// );

export const openApi = axios.create({
  baseURL: API_BASE_URLS.OPEN_API,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

export const cdnApi = axios.create({
  baseURL: API_BASE_URLS.CDN,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── API Functions ─────────────────────────────────────────────────────────
export const api = {
  // Core APIs
  getHome: () => mainApi.get(API_ENDPOINTS.HOME),
  getMenu: () => mainApi.get(API_ENDPOINTS.MENU),
  getMenuU38: () => mainApi.get(API_ENDPOINTS.MENU), // u38 server menu
  getLatestMain: (page = 1) => mainApi.get(`${API_ENDPOINTS.LATEST_MAIN}?page=${page}`),
  getFlash: () => mainApi.get(API_ENDPOINTS.FLASH),
  getDetail: (newsId) => mainApi.get(`${API_ENDPOINTS.DETAIL}?newsid=${newsId}`),
  getLatestNotify: () => mainApi.get(API_ENDPOINTS.LATEST_NOTIFY),

  // Content APIs
  getNewsData: (cat, scat) => mainApi.get(`${API_ENDPOINTS.NEWS_DATA}?cat=${cat}${scat ? `&scat=${scat}` : ''}`),
  getVideoData: (params) => mainApi.get(`${API_ENDPOINTS.VIDEO_DATA}${params ? `?${params}` : ''}`),
  getVideoSearch: (query) => mainApi.get(`${API_ENDPOINTS.VIDEOSEARCH}${query}`),
  getPhotoMain: () => mainApi.get(API_ENDPOINTS.PHOTO_MAIN),
  getPhotoItem: (cat) => mainApi.get(`${API_ENDPOINTS.PHOTO_ITEM}?cat=${cat}`),
  getAudio: () => dmrApi.get(API_ENDPOINTS.AUDIO),
  getVideoMain: () => mainApi.get(API_ENDPOINTS.VIDEO_MAIN),
  getVideoDetail: (id) => mainApi.get(`${API_ENDPOINTS.VIDEO_DETAIL}?id=${id}`),

  // Category Specific
  getVarthagam: () => mainApi.get(API_ENDPOINTS.VARthagam),
  getDistrict: () => mainApi.get(API_ENDPOINTS.DISTRICT),
  getDistrictData: () => mainApi.get(API_ENDPOINTS.DISTRICT_DATA),
  getDistVideo: () => mainApi.get(API_ENDPOINTS.DIST_VIDEO),
  getSubam: () => mainApi.get(API_ENDPOINTS.SUBAM),

  // ✅ News Category helpers — use CATEGORY_MAP or NEWS_CATS
  getNewsByCat: (catId, page = 1) =>
    u38Api.get(`/newsdata?cat=${catId}&page=${page}`),
  getNewsByEndpoint: (endpoint, page = 1) =>
    u38Api.get(`${endpoint}&page=${page}`),
  getTharpothaiya: (page = 1) =>
    u38Api.get(`/newsdata?cat=${NEWS_CATS.THARPOTHAIYA}&page=${page}`),
  getPremium: (page = 1) =>
    u38Api.get(`/newsdata?cat=${NEWS_CATS.PREMIUM}&page=${page}`),
  getTamilagam: (page = 1) =>
    u38Api.get(`/newsdata?cat=${NEWS_CATS.TAMILAGAM}&page=${page}`),
  getIndia: (page = 1) =>
    u38Api.get(`/newsdata?cat=${NEWS_CATS.INDIA}&page=${page}`),
  getWorld: (page = 1) =>
    u38Api.get(`/newsdata?cat=${NEWS_CATS.WORLD}&page=${page}`),
  getVarthagamNews: (page = 1) =>
    u38Api.get(`${SPECIAL_ENDPOINTS.VARTHAGAM}&page=${page}`),
  getDistrictNews: (page = 1) =>
    u38Api.get(`${SPECIAL_ENDPOINTS.DISTRICT}&page=${page}`),
  getSportsNews: (page = 1) =>
    u38Api.get(`${SPECIAL_ENDPOINTS.SPORTS}&page=${page}`),

  // Special Categories
  getTempleMain: () => mainApi.get(API_ENDPOINTS.TEMPLE_MAIN),
  getTempleListing: (id) => mainApi.get(`${API_ENDPOINTS.TEMPLE_LISTING}?id=${id}`),
  getTempleMainEng: () => mainApi.get(API_ENDPOINTS.TEMPLEMAINENG),
  getJoshiyam: () => mainApi.get(API_ENDPOINTS.JOSHIYAM),
  getKadalthamarai: () => mainApi.get(API_ENDPOINTS.KADAL_THAMARAI),
  getAnmegam: () => mainApi.get(API_ENDPOINTS.ANMEGAM),
  getAnmegamain: () => mainApi.get(API_ENDPOINTS.ANMEGAMAIN),
  getAnmegamainlisting: () => mainApi.get(API_ENDPOINTS.ANMEGAMAINLISTING),
  getAnmigasinthanai: () => mainApi.get(API_ENDPOINTS.ANMIGASINTHANAI),
  getAnmigasinthanaiCat: (id) => mainApi.get(`${API_ENDPOINTS.ANMIGASINTHANAI_CAT}?id=${id}`),
  getAnmigasinthanaiDetail: (newsId) => mainApi.get(`${API_ENDPOINTS.ANMIGASINTHANAI_DETAIL}?newsid=${newsId}`),

  // NRI APIs
  getNri: () => mainApi.get(API_ENDPOINTS.NRI),
  getNriMain: () => mainApi.get(API_ENDPOINTS.NRI_MAIN),
  getNriEnglish: () => mainApi.get(API_ENDPOINTS.NRI_ENGLISH),
  getNriTamilCat: (cat) => mainApi.get(`${API_ENDPOINTS.NRITAMILCAT}${cat}`),
  getNriEngCat: (cat) => mainApi.get(`${API_ENDPOINTS.NRIENGCAT}${cat}`),
  getNriDetail: (cat) => mainApi.get(`${API_ENDPOINTS.NRIDETAIL}?cat=${cat}`),
  getNriDomesticDetail: (cat) => mainApi.get(`${API_ENDPOINTS.NRIDOMESTIC_DETAIL}?cat=${cat}`),

  // Astrology APIs
  getTodayRasi: (jcat) => mainApi.get(`${API_ENDPOINTS.TODAYRASI}?jcat=${jcat}`),
  getWeeklyRasi: (jcat) => mainApi.get(`${API_ENDPOINTS.WEEKLYRASI}?jcat=${jcat}`),
  getMonthlyRasi: (jcat) => mainApi.get(`${API_ENDPOINTS.MONTHLYRASI}?jcat=${jcat}`),
  getGurupeyerchiRasi: (jcat) => mainApi.get(`${API_ENDPOINTS.GURUPEYARCHI_RASI}?jcat=${jcat}`),
  getSanipeyerchiRasi: (jcat) => mainApi.get(`${API_ENDPOINTS.SANIPEYARCHI_RASI}?jcat=${jcat}`),
  getRaguKedhuPeyarchiRasi: (jcat) => mainApi.get(`${API_ENDPOINTS.RAGU_KEDHU_PEYARCHI_RASI}?jcat=${jcat}`),
  getTamilNewYear: (jcat) => mainApi.get(`${API_ENDPOINTS.TAMIL_NEW_YEAR}?jcat=${jcat}`),
  getEnglishNewYear: (jcat) => mainApi.get(`${API_ENDPOINTS.ENGLISH_NEW_YEAR}?jcat=${jcat}`),
  getAnmigaCalendar: () => mainApi.get(API_ENDPOINTS.ANMEEGACALENDAR),
  getVasthudays: () => mainApi.get(API_ENDPOINTS.VASTHUDAYS),
  getKarinaal: () => mainApi.get(API_ENDPOINTS.KARINAAL),
  getVirathanaal: () => mainApi.get(API_ENDPOINTS.VIRATHANAAL),

  // Educational
  getKalvimalar: () => mainApi.get(API_ENDPOINTS.KALVIMALAR),
  getKalvimalarCategory1: () => mainApi.get(API_ENDPOINTS.KALVIMALARCATEGORY1),
  getKalvimalarCategory2: () => mainApi.get(API_ENDPOINTS.KALVIMALARCATEGORY2),
  getKalvimalarDetail: (newsId) => mainApi.get(`${API_ENDPOINTS.KALVIMALARDETAIL}?newsid=${newsId}`),
  getKalvimalarHomeEng: () => mainApi.get(API_ENDPOINTS.KALVIMALAR_HOMEENG),
  getKalvimalarEngCategory1: () => mainApi.get(API_ENDPOINTS.KALVIMALARENG_CATEGORY1),
  getKalvimalarEngCategory2: () => mainApi.get(API_ENDPOINTS.KALVIMALARENG_CATEGORY2),
  getKalvimalarEngDetail: () => mainApi.get(API_ENDPOINTS.KALVIMALARENG_DETAIL),

  // Children
  getKannamma: (cat) => mainApi.get(`${API_ENDPOINTS.KANNAMMA}?cat=${cat}`),
  getMalargal: () => mainApi.get(API_ENDPOINTS.MALARGAL),
  getMalargalMain: () => mainApi.get(API_ENDPOINTS.MALARGALMAIN),

  // Literature
  getKuralFilter: () => mainApi.get(API_ENDPOINTS.KURALFILTER),
  getKuralListing: () => mainApi.get(API_ENDPOINTS.KURALLISTING),
  getKuralListingMain: () => mainApi.get(API_ENDPOINTS.KURALLISTINGMAIN),
  getKuralDetail: () => mainApi.get(API_ENDPOINTS.KURALDETAIL),

  // Reels & Media
  getReels: () => mainApi.get(API_ENDPOINTS.REELS),
  getMobileReels: () => mainApi.get(API_ENDPOINTS.MOBILEREELS),
  getShorts: () => mainApi.get(API_ENDPOINTS.SHORTS),
  getShortsDetail: () => mainApi.get(API_ENDPOINTS.SHORTSDETAIL),
  getRecentReels: () => mainApi.get(API_ENDPOINTS.RECENT_REEELS),

  // Special Content
  getSpecialMain: () => mainApi.get(API_ENDPOINTS.SPECIALMAIN),
  getSpecialList: (cat) => mainApi.get(`${API_ENDPOINTS.SPECIALLIST}${cat}`),
  getSpecialCatList: () => mainApi.get(API_ENDPOINTS.SPECIALCATLIST),
  getEditorChoice: () => mainApi.get(API_ENDPOINTS.EDITOR_CHOICE),
  getTodaySpecial: () => mainApi.get(API_ENDPOINTS.TODAY_SPECIAL),

  // Static Pages
  getContactUs: () => mainApi.get(API_ENDPOINTS.CONTACT_US),
  getCopyright: () => mainApi.get(API_ENDPOINTS.COPYRIGHT),
  getPrivacyPolicy: () => mainApi.get(API_ENDPOINTS.PRIVACY_POLICY),
  getTermsConditions: () => mainApi.get(API_ENDPOINTS.TERMS_CONDITIONS),
  getAboutUs: () => mainApi.get(API_ENDPOINTS.ABOUT_US),

  // Web Stories
  getWebStory: () => mainApi.get(API_ENDPOINTS.WEBSTORY),
  getWebStoryListing: (cat) => mainApi.get(`${API_ENDPOINTS.WEBSTORYLISTING}${cat}`),

  // Search
  search: (query) => mainApi.get(`${API_ENDPOINTS.SEARCH}?search=${query}`),
  searchFilter: (params) => mainApi.get(`${API_ENDPOINTS.SEARCH_FILTER}?${params}`),

  // User & Auth
  getProfile: () => openApi.get(API_ENDPOINTS.PROFILE),
  getUserComments: (uid) => mainApi.get(`${API_ENDPOINTS.USER_COMMENTS}?uid=${uid}`),
  getComments: (newsId) => mainApi.get(`${API_ENDPOINTS.COMMENTS}?newsid=${newsId}`),
  postComments: () => openApi.post(API_ENDPOINTS.POST_COMMENTS),
  getBookmark: () => openApi.get(API_ENDPOINTS.BOOKMARK),
  checkBookmark: () => openApi.get(API_ENDPOINTS.BOOKMARK_CHECK),
  removeBookmark: () => openApi.get(API_ENDPOINTS.BOOKMARK_REMOVE),

  // Location & Maps
  getDistMapHome: () => mainApi.get(API_ENDPOINTS.DISTMAP_HOME),
  getDistMapCat: (cat) => mainApi.get(`${API_ENDPOINTS.DISTMAP_CAT}${cat}`),

  // Archive
  getArchieve: () => mainApi.get(API_ENDPOINTS.ARCHIEVE),
  getArchieveHome: () => mainApi.get(API_ENDPOINTS.ARCHIEVEHOME),
  getArchieveMonth: () => mainApi.get(API_ENDPOINTS.ARCHIEVEMONTH),
  getArchieveDetail: (year) => mainApi.get(`${API_ENDPOINTS.ARCHIEVEDETAIL}?year=${year}`),
  getArchiveNew: () => mainApi.get(API_ENDPOINTS.ARCHIVENEW),
  getLinkList: (year) => mainApi.get(`${API_ENDPOINTS.LINKLIST}?year=${year}`),

  // Calendar
  getCalendarData: () => mainApi.get(API_ENDPOINTS.CALENDARDATA),
  getDailyCalendar: () => mainApi.get(API_ENDPOINTS.DAILYCALENDAR),
  getMonthCalendar: () => mainApi.get(API_ENDPOINTS.MONTHCALENDAR),
  getCalYearData: () => mainApi.get(API_ENDPOINTS.CALYEARDATA),

  // Business & Finance
  getCommodity: () => mainApi.get(API_ENDPOINTS.COMMODITY),
  getGoldSilver: (duration) => mainApi.get(`${API_ENDPOINTS.GOLD_SILVER}${duration}`),

  // Social & Interactive
  getSocialCardsMain: () => mainApi.get(API_ENDPOINTS.SOCIALCARDSMAIN),
  getRecentComment: () => mainApi.get(API_ENDPOINTS.RECENTCOMMENT),
  getFeedbackForm: () => mainApi.get(API_ENDPOINTS.FEEDBACKFORM),
  getVasagarComment: () => mainApi.get(`${API_ENDPOINTS.VASAGARCOMMENT}?id=999&engtitle=common_comments`),

  // Other States
  getOtherStateNews: () => mainApi.get(API_ENDPOINTS.OTHERSTATE_NEWS),
  getOtherStateCat: (cat) => mainApi.get(`${API_ENDPOINTS.OTHERSTATE_CAT}?cat=${cat}`),

  // Sadhguru
  getSadhguru: (cat) => mainApi.get(`${API_ENDPOINTS.SADHGURU}?cat=${cat}`),
  getSadhguruDetail: (newsId) => mainApi.get(`${API_ENDPOINTS.SADHGURUDETAIL}?newsid=${newsId}`),

  // Tours
  getTour: () => mainApi.get(API_ENDPOINTS.TOUR),

  // Short News
  getShortNews: () => mainApi.get(API_ENDPOINTS.SHORT_NEWS),

  // Tags
  getTagList: () => mainApi.get(API_ENDPOINTS.TAGLIST),

  // Pugar Petti
  getPugarData: () => mainApi.get(API_ENDPOINTS.PUGARDATA),
  getPugarMainData: () => mainApi.get(API_ENDPOINTS.PUGARMAINDATA),

  // Roadblocks
  getHomeRoadblock: () => mainApi.get(API_ENDPOINTS.HOME_ROADBLOCK),
  getHomeMobileRoadblock: () => mainApi.get(API_ENDPOINTS.HOMEMOBILE_ROADBLOCK),

  // Rating
  getStarRating: () => cdnApi.get(API_ENDPOINTS.STARRATING),

  // OTP & Auth
  sendOtp: () => openApi.get(API_ENDPOINTS.SEND_OTP),
  verifyOtp: () => openApi.get(API_ENDPOINTS.VERIFY_OTP),
  logout: () => openApi.get(API_ENDPOINTS.LOGOUT),

  // User Activity
  getUserActivity: () => openApi.get(API_ENDPOINTS.GETUSER_ACTIVITY),
  getBrowsingHist: () => openApi.get(API_ENDPOINTS.BROWSING_HIST),

  // Error Handling
  errorLog: () => openApi.get(API_ENDPOINTS.ERROR_LOG),

  // Feedback
  postFeedback: () => openApi.get(API_ENDPOINTS.FEEDBACK_POSTAPI),

  // Captcha
  getGCaptcha: () => mainApi.get(API_ENDPOINTS.GCAPTCHA),

  // Sports
  getSports: (page = 1) => dmrApi.get(`${API_ENDPOINTS.SPORTS}?page=${page}`),

  // Timeline APIs
  getTimeline: (page = 1) => CDNApi.get(`${API_ENDPOINTS.TIMELINE}?page=${page}`),
  getTimelineNotify: () => CDNApi.get(API_ENDPOINTS.TIMELINE_NOTIFY),
};

// ─── Network Connectivity Test ───────────────────────────────────────────────────────
export const testNetworkConnectivity = async () => {
  try {
    // console.log('=== NETWORK CONNECTIVITY TEST ===');
    // console.log('Testing: https://dmrapi.dinamalar.com/home');

    const response = await axios.get('https://dmrapi.dinamalar.com/home', {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });

    // console.log('✅ Network connectivity OK');
    // console.log('Response status:', response.status);
    // console.log('Response data type:', typeof response.data);
    // console.log('==============================');
    return true;
  } catch (error) {
    console.error('❌ Network connectivity FAILED');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Status:', error.response?.status);
    console.error('==============================');

    // Try alternative test
    try {
      // console.log('Trying alternative test: https://httpbin.org/get');
      const altResponse = await axios.get('https://httpbin.org/get', { timeout: 3000 });
      console.log('✅ Internet connectivity OK, but API server might be down');
      return false;
    } catch (altError) {
      console.error('❌ No internet connectivity at all');
      return false;
    }
  }
};

// ─── Default Export ───────────────────────────────────────────────────────
export default api;