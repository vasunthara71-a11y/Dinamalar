// Helper function to add alpha transparency to colors (React Native compatible)
function alpha(color, opacity) {
  // Convert hex to RGB, apply alpha, and return rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function createGradient(color1, color2) {
  return `linear-gradient(to bottom, ${color1}, ${color2})`;
}

function boxGradient(color1, color2){
  return `linear-gradient(to right, ${color1}, ${color2})`;
}
// SETUP COLORS
const PRIMARY = {
  lighter: '#FFF4F4',
  // lighter: '#ffff',
  light: '#FFCCCB',
  // light: '#e6fff9',
  mainGradient: boxGradient('#5bd9bd','#4ca2cd'),
  // main: '#5bd9bd',
  // main: '#E49393',
  // main: '#FFBF9B',
  // main: '#8EA7E9',
  // main: '#B7B78A',
  // main: '#C69749',
  // main: '#C3B091',
  // main: '#B4CFB0',
  // main: '#34626C',
  // main: '#0093AB',
  // main: '#06c0d9',
  main: '#096dd2', 
  // main: '#5f7cc8', 
  // main: '#ec0505',  current red
  // main: '#73A9AD',
  // dark: '#0eb796',
  // dark: '#B46060',   
  // dark: '#F4B183',     
  // dark: '#7286D3',
  // dark: '#658864',
  // dark: '#735F32',
  // dark: '#8E806A',
  // dark: '#839B97',
  // dark: '#006778',
  dark: '#8B0000',
  menu:"#092d3e",
  // menu:"#135c81",
  // menu:"#526D82",
  // dark: '#73A9AD',
  // darker: '#005249',
  darker: '#3399CC',
  // link:'#56ccb2',
  link:'#3399CC',
};
const SECONDARY = {
  lighter: '#D6E4FF',
  light: '#84A9FF',
  main: '#3366FF',
  dark: '#1939B7',
  darker: '#091A7A',
};
const INFO = {
  lighter: '#D0F2FF',
  light: '#74CAFF',
  main: '#1890FF',
  dark: '#0C53B7',
  darker: '#04297A',
};
const SUCCESS = {
  lighter: '#E9FCD4',
  light: '#AAF27F',
  main: '#54D62C',
  dark: '#229A16',
  darker: '#08660D',
};
const WARNING = {
  lighter: '#FFF7CD',
  light: '#FFE16A',
  main: '#FFC107',
  dark: '#B78103',
  darker: '#7A4F01',
};
const ERROR = {
  lighter: '#FFE7D9',
  light: '#FFA48D',
  main: '#FF4842',
  dark: '#B72136',
  darker: '#7A0C2E',
};

const GREY = {
  0: '#FFFFFF',
  100: '#F9FAFB',
  200: '#F4F6F8',
  300: '#DFE3E8',
  400: '#C4CDD5',
  500: '#919EAB',
  600: '#637381',
  700: '#454F5B',
  800: '#212B36',
  900: '#161C24',
  500_8: alpha('#919EAB', 0.08),
  500_12: alpha('#919EAB', 0.12),
  500_16: alpha('#919EAB', 0.16),
  500_24: alpha('#919EAB', 0.24),
  500_32: alpha('#919EAB', 0.32),
  500_48: alpha('#919EAB', 0.48),
  500_56: alpha('#919EAB', 0.56),
  500_80: alpha('#919EAB', 0.8),
};


const COMMON = {
  common: { black: '#000', white: '#fff' },
  primary: { ...PRIMARY, contrastText: '#fff' },
  secondary: { ...SECONDARY, contrastText: '#fff' },
  info: { ...INFO, contrastText: '#fff' },
  success: { ...SUCCESS, contrastText: GREY[800] },
  warning: { ...WARNING, contrastText: GREY[800] },
  error: { ...ERROR, contrastText: '#fff' },
  grey: GREY,
  divider: GREY[500_24],
  action: {
    hover: GREY[500_8],
    selected: GREY[500_16],
    disabled: GREY[500_80],
    disabledBackground: GREY[500_24],
    focus: GREY[500_24],
    hoverOpacity: 0.09,
    disabledOpacity: 0.48,
  },
};

const palette = {
  light: {
    ...PRIMARY,
    ...COMMON,
    mode: 'light',
    text: { primary: GREY[800], secondary: GREY[600], disabled: GREY[500] },
    background: { paper: '#fff', default: '#fff', neutral: GREY[200] },
    action: { active: GREY[600], ...COMMON.action , ...PRIMARY.light},
  },
  dark: {
    ...PRIMARY,
    ...COMMON,
    mode: 'dark',
    text: { primary: 'grey.700', secondary: GREY[500], disabled: GREY[600] },
    background: { paper: GREY[800], default: GREY[700], neutral: GREY[500_16] },
    action: { active: GREY[500], ...COMMON.action , ...PRIMARY.dark },
  },
};

export default palette;
