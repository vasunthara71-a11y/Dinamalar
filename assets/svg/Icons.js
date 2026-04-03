import React from 'react';
import { Svg, Path, Circle } from 'react-native-svg';

// Social Media Icons
export const FacebookIcon = (props) => (
  <Svg 
    stroke="currentColor" 
    fill="currentColor" 
    strokeWidth="0" 
    viewBox="0 0 320 512" 
    height={props.size || "1em"} 
    width={props.size || "1em"} 
    xmlns="http://www.w3.org/2000/svg" 
    style={{ padding: '2.5px' }}
    {...props}
  >
    <Path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
  </Svg>
);

export const TwitterIcon = (props) => (
  <Svg 
    stroke="currentColor" 
    fill="currentColor" 
    strokeWidth="0" 
    viewBox="0 0 512 512" 
    height={props.size || "1em"} 
    width={props.size || "1em"} 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
  </Svg>
);

export const WhatsAppIcon = (props) => (
  <Svg 
    stroke="currentColor" 
    fill="currentColor" 
    strokeWidth="0" 
    viewBox="0 0 512 512" 
    height={props.size || "1em"} 
    width={props.size || "1em"} 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path d="M260.062 32C138.605 32 40.134 129.701 40.134 250.232c0 41.23 11.532 79.79 31.559 112.687L32 480l121.764-38.682c31.508 17.285 67.745 27.146 106.298 27.146C381.535 468.464 480 370.749 480 250.232 480 129.701 381.535 32 260.062 32zm109.362 301.11c-5.174 12.827-28.574 24.533-38.899 25.072-10.314.547-10.608 7.994-66.84-16.434-56.225-24.434-90.052-83.844-92.719-87.67-2.669-3.812-21.78-31.047-20.749-58.455 1.038-27.413 16.047-40.346 21.404-45.725 5.351-5.387 11.486-6.352 15.232-6.413 4.428-.072 7.296-.132 10.573-.011 3.274.124 8.192-.685 12.45 10.639 4.256 11.323 14.443 39.153 15.746 41.989 1.302 2.839 2.108 6.126.102 9.771-2.012 3.653-3.042 5.935-5.961 9.083-2.935 3.148-6.174 7.042-8.792 9.449-2.92 2.665-5.97 5.572-2.9 11.269 3.068 5.693 13.653 24.356 29.779 39.736 20.725 19.771 38.598 26.329 44.098 29.317 5.515 3.004 8.806 2.67 12.226-.929 3.404-3.599 14.639-15.746 18.596-21.169 3.955-5.438 7.661-4.373 12.742-2.329 5.078 2.052 32.157 16.556 37.673 19.551 5.51 2.989 9.193 4.529 10.51 6.9 1.317 2.38.901 13.531-4.271 26.359z" />
  </Svg>
);

export const TelegramIcon = (props) => (
  <Svg 
    stroke="currentColor" 
    fill="currentColor" 
    strokeWidth="0" 
    viewBox="0 0 448 512" 
    height={props.size || "1em"} 
    width={props.size || "1em"} 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path d="M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284 16.2 252.2c-22.1-6.9-22.5-22.1 4.6-32.7L418.2 66.4c18.4-6.9 34.5 4.1 28.5 32.2z" />
  </Svg>
);

export const ShareIcon = (props) => (
  <Svg 
    stroke="currentColor" 
    fill="currentColor" 
    strokeWidth="0" 
    viewBox="0 0 512 512" 
    height={props.size || "1em"} 
    width={props.size || "1em"} 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path d="M444.7 230.4l-141.1-132c-1.7-1.6-3.3-2.5-5.6-2.4-4.4.2-10 3.3-10 8v66.2c0 2-1.6 3.8-3.6 4.1C144.1 195.8 85 300.8 64.1 409.8c-.8 4.3 5 8.3 7.7 4.9 51.2-64.5 113.5-106.6 212-107.4 2.2 0 4.2 2.6 4.2 4.8v65c0 7 9.3 10.1 14.5 5.3l142.1-134.3c2.6-2.4 3.4-5.2 3.5-8.4-.1-3.2-.9-6.9-3.4-9.3z" />
  </Svg>
);

export const SpeakerIcon = (props) => (
  <Svg 
    stroke="currentColor" 
    fill="currentColor" 
    strokeWidth="0" 
    viewBox="0 0 24 24" 
    height={props.size || "1em"} 
    width={props.size || "1em"} 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </Svg>
);

// Export all social icons as a single object
export const SocialIcons = {
  Facebook: FacebookIcon,
  Twitter: TwitterIcon,
  WhatsApp: WhatsAppIcon,
  Telegram: TelegramIcon,
  Share: ShareIcon,
};

export const SignOut = ({ color = 'rgb(69, 79, 91)', size = 16, style = {} }) => (
  <Svg 
    stroke={color} 
    fill="none" 
    strokeWidth="2" 
    viewBox="0 0 24 24" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={{ marginLeft: 10, ...style }}
  >
    <Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <Path d="M10 17l5-5-5-5" />
    <Path d="M15 12H3" />
  </Svg>
);

export const Home = ({ color = 'rgb(69, 79, 91)', size = 20, style = {} }) => (
  <Svg 
    stroke={color} 
    fill={color}
    strokeWidth="0" 
    viewBox="0 0 512 512" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="32" 
      d="M80 212v236a16 16 0 0016 16h96V328a24 24 0 0124-24h80a24 24 0 0124 24v136h96a16 16 0 0016-16V212"
    />
    <Path 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="32" 
      d="M480 256L266.89 52c-5-5.28-16.69-5.34-21.78 0L32 256m368-77V64h-48v69"
    />
  </Svg>
);

export const RightArrow = ({ color = 'currentColor', size = 16, style = {} }) => (
  <Svg 
    viewBox="0 0 24 24" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path 
      d="M7 6l-.112 .006a1 1 0 0 0 -.669 1.619l3.501 4.375l-3.5 4.375a1 1 0 0 0 .78 1.625h6a1 1 0 0 0 .78 -.375l4 -5a1 1 0 0 0 0 -1.25l-4 -5a1 1 0 0 0 -.78 -.375h-6z" 
      strokeWidth="0" 
      fill={color}
    />
  </Svg>
);

export const DinamDinam = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg 
    stroke={color} 
    fill={color}
    strokeWidth="0" 
    viewBox="0 0 24 24" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path fill="none" d="M0 0h24v24H0V0z" />
    <Path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM5 7V5h14v2H5zm2 4h10v2H7zm0 4h7v2H7z" />
  </Svg>
);

export const Joshiyam = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg 
    stroke={color} 
    fill={color}
    strokeWidth="0" 
    viewBox="0 0 24 24" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path fill="none" d="M0 0h24v24H0V0z" />
    <Path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zm-2 5.79V18h-3.52L12 20.48 9.52 18H6v-3.52L3.52 12 6 9.52V6h3.52L12 3.52 14.48 6H18v3.52L20.48 12 18 14.48zM12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
  </Svg>
);

export const Aanmigam = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg 
    stroke={color} 
    fill={color}
    strokeWidth="0" 
    viewBox="0 0 24 24" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path d="M20 11v2h-2L15 3V1h-2v2h-2.03V1h-2v2.12L6 13H4v-2H2v11h9v-5h2v5h9V11h-2zm-4.69 0H8.69l.6-2h5.42l.6 2zm-1.2-4H9.89l.6-2h3.02l.6 2zM20 20h-5v-5H9v5H4v-5h3.49l.6-2h7.82l.6 2H20v5z" />
  </Svg>
);

export const Varavaram = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg 
    stroke={color} 
    fill={color}
    strokeWidth="0" 
    viewBox="0 0 24 24" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path fill="none" d="M0 0h24v24H0V0z" />
    <Path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l2 2H20v10zm-6.92-3.96L12.39 17 15 15.47 17.61 17l-.69-2.96 2.3-1.99-3.03-.26L15 9l-1.19 2.79-3.03.26z" />
  </Svg>
);

// ✅ Inaippumalar — the flower SVG you shared
export const Malargal = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 24 24"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <Path fill="none" d="M0 0h24v24H0V0z" />
    <Path d="M15.49 9.63c-.18-2.79-1.31-5.51-3.43-7.63a12.188 12.188 0 00-3.55 7.63c1.28.68 2.46 1.56 3.49 2.63 1.03-1.06 2.21-1.94 3.49-2.63zm-3.44-4.44c.63 1.03 1.07 2.18 1.3 3.38-.47.3-.91.63-1.34.98-.42-.34-.87-.67-1.33-.97.25-1.2.71-2.35 1.37-3.39zM12 15.45a12.11 12.11 0 00-3.06-3.2c-.13-.09-.27-.16-.4-.26.13.09.27.17.39.25A11.777 11.777 0 002 10c0 5.32 3.36 9.82 8.03 11.49.63.23 1.29.4 1.97.51.68-.12 1.33-.29 1.97-.51C18.64 19.82 22 15.32 22 10c-4.18 0-7.85 2.17-10 5.45zm1.32 4.15c-.44.15-.88.27-1.33.37-.44-.09-.87-.21-1.28-.36-3.29-1.18-5.7-3.99-6.45-7.35 1.1.26 2.15.71 3.12 1.33l-.02.01c.13.09.26.18.39.25l.07.04c.99.72 1.84 1.61 2.51 2.65L12 19.1l1.67-2.55a10.19 10.19 0 012.53-2.66l.07-.05c.09-.05.18-.11.27-.17l-.01-.02c.98-.65 2.07-1.13 3.21-1.4-.75 3.37-3.15 6.18-6.42 7.35zm-4.33-7.32c-.02-.01-.04-.03-.05-.04 0 0 .01 0 .01.01.01.01.02.02.04.03z" />
  </Svg>
);

export const Special = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg 
    stroke={color} 
    fill={color}
    strokeWidth="0" 
    viewBox="0 0 24 24" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path d="M9.68 13.69L12 11.93l2.31 1.76-.88-2.85L15.75 9h-2.84L12 6.19 11.09 9H8.25l2.31 1.84-.88 2.85zM20 10c0-4.42-3.58-8-8-8s-8 3.58-8 8c0 2.03.76 3.87 2 5.28V23l6-2 6 2v-7.72A7.96 7.96 0 0020 10zm-8-6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6zm0 15l-4 1.02v-3.1c1.18.68 2.54 1.08 4 1.08s2.82-.4 4-1.08v3.1L12 19z" />
  </Svg>
);

export const Kovil = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 24 24"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path d="M6.6 11h10.8l-.9-3h-9zM20 11v2H4v-2H2v11h8v-5h4v5h8V11zM15.9 6L15 3V1h-2v2h-2.03V1h-2v2.12L8.1 6z" />
  </Svg>
);

export const Calendar = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg 
    stroke={color} 
    fill={color}
    strokeWidth="0" 
    viewBox="0 0 16 16" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-5 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z" />
    <Path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
  </Svg>
);

export const Cinema = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 256 256"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <Path d="M224,216H183.36A103.95,103.95,0,1,0,128,232h96a8,8,0,0,0,0-16ZM40,128a88,88,0,1,1,88,88A88.1,88.1,0,0,1,40,128Zm88-24a24,24,0,1,0-24-24A24,24,0,0,0,128,104Zm0-32a8,8,0,1,1-8,8A8,8,0,0,1,128,72Zm24,104a24,24,0,1,0-24,24A24,24,0,0,0,152,176Zm-32,0a8,8,0,1,1,8,8A8,8,0,0,1,120,176Zm56-24a24,24,0,1,0-24-24A24,24,0,0,0,176,152Zm0-32a8,8,0,1,1-8,8A8,8,0,0,1,176,120ZM80,104a24,24,0,1,0,24,24A24,24,0,0,0,80,104Zm0,32a8,8,0,1,1,8-8A8,8,0,0,1,80,136Z" />
  </Svg>
);

export const District = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 512 512"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <Circle cx="256" cy="192" r="32" />
    <Path d="M256 32c-88.22 0-160 68.65-160 153 0 40.17 18.31 93.59 54.42 158.78 29 52.34 62.55 99.67 80 123.22a31.75 31.75 0 0051.22 0c17.42-23.55 51-70.88 80-123.22C397.69 278.61 416 225.19 416 185c0-84.35-71.78-153-160-153zm0 224a64 64 0 1164-64 64.07 64.07 0 01-64 64z" />
  </Svg>
);

export const UllurSeithigal = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg 
    stroke={color} 
    fill={color}
    strokeWidth="0" 
    viewBox="0 0 512 512" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path d="M256 192a32 32 0 1 0 32-32 32 32 0 0 0-32 32z" />
    <Path d="M256 32c-88.22 0-160 68.65-160 153 0 40.17 18.31 93.59 54.42 158.78 29 52.34 62.55 99.67 80 123.22a31.75 31.75 0 0051.22 0c17.42-23.55 51-70.88 80-123.22C397.69 278.61 416 225.19 416 185c0-84.35-71.78-153-160-153zm0 224a64 64 0 1164-64 64.07 64.07 0 01-64 64z" />
  </Svg>
);

// ✅ Photo — camera icon you shared
export const Photo = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 24 24"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path d="M14.12 4l1.83 2H20v12H4V6h4.05l1.83-2h4.24M15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2zm-3 7c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
  </Svg>
);


export const UlagaTamilar = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg 
    stroke={color} 
    fill={color}
    strokeWidth="0" 
    viewBox="0 0 24 24" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path d="M22 3l-1.67 1.67L18.67 3 17 4.67 15.33 3l-1.66 1.67L12 3l-1.67 1.67L8.67 3 7 4.67 5.33 3 3.67 4.67 2 3v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V3zM11 19H4v-6h7v6zm9 0h-7v-2h7v2zm0-4h-7v-2h7v2zm0-4H4V8h16v3z" />
  </Svg>
);

export const Light = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 24 24"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path d="M12 9c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
  </Svg>
);

export const Comment = ({ color = 'currentColor', size = 28, style = {} }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 512 512"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <Path d="M448 0H64C28.7 0 0 28.7 0 64v288c0 35.3 28.7 64 64 64h96v84c0 9.8 11.2 15.5 19.1 9.7L304 416h144c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64z" />
  </Svg>
);

export const CommentForChat = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 32 32"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <Path d="M 3 6 L 3 26 L 12.585938 26 L 16 29.414063 L 19.414063 26 L 29 26 L 29 6 Z M 5 8 L 27 8 L 27 24 L 18.585938 24 L 16 26.585938 L 13.414063 24 L 5 24 Z M 9 11 L 9 13 L 23 13 L 23 11 Z M 9 15 L 9 17 L 23 17 L 23 15 Z M 9 19 L 9 21 L 19 21 L 19 19 Z" />
  </Svg>
);

export const Shorts = ({ color = 'currentColor', size = 25, style = {} }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 16 16"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <Path d="M6 3a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM1 3a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" />
    <Path d="M9 6h.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 7.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 16H2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h7zm6 8.73V7.27l-3.5 1.555v4.35l3.5 1.556zM1 8v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1z" />
    <Path d="M9 6a3 3 0 1 0 0-6 3 3 0 0 0 6 0zM7 3a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" />
  </Svg>
);

export const PhotoGallery = ({ color = 'currentColor', size = 25, style = {} }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 24 24"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <Path d="M11.024 11.536 10 10l-2 3h9l-3.5-5z" />
    <Circle cx="9.503" cy="7.497" r="1.503" />
    <Path d="M19 2H6c-1.206 0-3 .799-3 3v14c0 2.201 1.794 3 3 3h15v-2H6.012C5.55 19.988 5 19.806 5 19s.55-.988 1.012-1H21V4c0-1.103-.897-2-2-2zm0 14H5V5c0-.806.55-.988 1-1h13v12z" />
  </Svg>
);

export const SpecialCalendar = ({ color = 'rgb(9, 109, 210)', size = 22, style = {} }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 512 512"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <Path d="M32 456a24 24 0 0024 24h400a24 24 0 0024-24V176H32zm80-238.86a9.14 9.14 0 019.14-9.14h109.72a9.14 9.14 0 019.14 9.14v109.72a9.14 9.14 0 01-9.14 9.14H121.14a9.14 9.14 0 01-9.14-9.14zM456 64h-55.92V32h-48v32H159.92V32h-48v32H56a23.8 23.8 0 00-24 23.77V144h448V87.77A23.8 23.8 0 00456 64z" />
  </Svg>
);

export const Bookmark = ({ color = 'currentColor', size = 30, style = {} }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 24 24"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path d="M17 11v6.97l-5-2.14-5 2.14V5h6V3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V11h-2zm4-4h-2v2h-2V7h-2V5h2V3h2v2h2v2z" />
  </Svg>
);

export const BookmarkSaved = ({ color = 'currentColor', size = 30, style = {} }) => (
  <Svg
    stroke={color}
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 24 24"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={{ fontSize: '30px', ...style }}
  >
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path d="M19 21l-7-3-7 3V5c0-1.1.9-2 2-2h7a5.002 5.002 0 005 7.9V21zM17.83 9L15 6.17l1.41-1.41 1.41 1.41 3.54-3.54 1.41 1.41L17.83 9z" />
  </Svg>
);

export const Editor = ({ color = 'currentColor', size = 18, style = {} }) => (
  <Svg
    stroke={color}
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 24 24"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={{ fontSize: '18px', marginRight: '3px', marginLeft: '-1px', ...style }}
  >
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
    <Path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" />
  </Svg>
);

export const ThreadsIcon = ({ color = 'currentColor', size = 18, style = {} }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 448 512"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={{ padding: '0px', fontSize: '19px', ...style }}
  >
    <Path d="M331.5 235.7c2.2 .9 4.2 1.9 6.3 2.8c29.2 14.1 50.6 35.2 61.8 61.4c15.7 36.5 17.2 95.8-30.3 143.2c-36.2 36.2-80.3 52.5-142.6 53h-.3c-70.2-.5-124.1-24.1-160.4-70.2c-32.3-41-48.9-98.1-49.5-169.6V256v-.2C17 184.3 33.6 127.2 65.9 86.2C102.2 40.1 156.2 16.5 226.4 16h.3c70.3 .5 124.9 24 162.3 69.9c18.4 22.7 32 50 40.6 81.7l-40.4 10.8c-7.1-25.8-17.8-47.8-32.2-65.4c-29.2-35.8-73-54.2-130.5-54.6c-57 .5-100.1 18.8-128.2 54.4C72.1 146.1 58.5 194.3 58 256c.5 61.7 14.1 109.9 40.3 143.3c28 35.6 71.2 53.9 128.2 54.4c51.4-.4 85.4-12.6 113.7-40.9c32.3-32.2 31.7-71.8 21.4-95.9c-6.1-14.2-17.1-26-31.9-34.9c-3.7 26.9-11.8 48.3-24.7 64.8c-17.1 21.8-41.4 33.6-72.7 35.3c-23.6 1.3-46.3-4.4-63.9-16c-20.8-13.8-33-34.8-34.3-59.3c-2.5-48.3 35.7-83 95.2-86.4c21.1-1.2 40.9-.3 59.2 2.8c-2.4-14.8-7.3-26.6-14.6-35.2c-10-11.7-25.6-17.7-46.2-17.8H227c-16.6 0-39 4.6-53.3 26.3l-34.4-23.6c19.2-29.1 50.3-45.1 87.8-45.1h.8c62.6 .4 99.9 39.5 103.7 107.7l-.2 .2zm-156 68.8c1.3 25.1 28.4 36.8 54.6 35.3c25.6-1.4 54.6-11.4 59.5-73.2c-13.2-2.9-27.8-4.4-43.4-4.4c-4.8 0-9.6 .1-14.4 .4c-42.9 2.4-57.2 23.2-56.2 41.8l-.1 .1z" />
  </Svg>
);

export const YouTubeIcon = ({ color = 'currentColor', size = 18, style = {} }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 576 512"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={{ padding: '0px', fontSize: '19px', ...style }}
  >
    <Path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
  </Svg>
);

export const InstagramIcon = ({ color = 'currentColor', size = 18, style = {} }) => (
  <Svg
    stroke={color}
    fill={color}
    strokeWidth="0"
    viewBox="0 0 448 512"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    style={{ padding: '0px', fontSize: '19px', ...style }}
  >
    <Path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
  </Svg>
);

export const TrendingIcon = ({ color = 'rgb(9, 109, 210)', size = 22, style = {} }) => (
  <Svg 
    stroke={color} 
    fill="none" 
    strokeWidth="2" 
    viewBox="0 0 24 24" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <Path d="M3 17l6 -6l4 4l8 -8" />
    <Path d="M14 7l7 0l0 7" />
  </Svg>
);

export const DocumentIcon = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg 
    stroke={color} 
    fill="none" 
    strokeWidth="32" 
    viewBox="0 0 512 512" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path strokeLinejoin="round" d="M368 415.86V72a24.07 24.07 0 00-24-24H72a24.07 24.07 0 00-24 24v352a40.12 40.12 0 0040 40h328" />
    <Path strokeLinejoin="round" d="M416 464h0a48 48 0 01-48-48V128h72a24 24 0 0124 24v264a48 48 0 01-48 48z" />
    <Path strokeLinecap="round" strokeLinejoin="round" d="M240 128h64m-64 64h64m-192 64h192m-192 64h192m-192 64h192" />
    <Path fill={color} d="M176 208h-64a16 16 0 01-16-16v-64a16 16 0 0116-16h64a16 16 0 0116 16v64a16 16 0 01-16 16z" />
  </Svg>
);

export const LatestVideoIcon = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg 
    stroke={color} 
    fill={color} 
    strokeWidth="0" 
    viewBox="0 0 24 24" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path fill="none" d="M0 0h24v24H0V0z" />
    <Path fill={color} d="M10 16.5l6-4.5-6-4.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
  </Svg>
);

export const PhotoIcon = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg 
    stroke="currentColor" 
    fill="currentColor" 
    strokeWidth="0" 
    viewBox="0 0 24 24" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path fill="none" d="M0 0h24v24H0V0z" />
    <Path d="M14.12 4l1.83 2H20v12H4V6h4.05l1.83-2h4.24M15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2zm-3 7c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
  </Svg>
);

export const AudioIcon = ({ color = 'currentColor', size = 18, style = {} }) => (
  <Svg 
    stroke="currentColor" 
    fill="currentColor" 
    strokeWidth="0" 
    viewBox="0 0 352 512" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path d="M336 192h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256v-48c0-8.84-7.16-16-16-16zM176 352c53.02 0 96-42.98 96-96h-85.33c-5.89 0-10.67-3.58-10.67-8v-16c0-4.42 4.78-8 10.67-8H272v-32h-85.33c-5.89 0-10.67-3.58-10.67-8v-16c0-4.42 4.78-8 10.67-8H272v-32h-85.33c-5.89 0-10.67-3.58-10.67-8v-16c0-4.42 4.78-8 10.67-8H272c0-53.02-42.98-96-96-96S80 42.98 80 96v160c0 53.02 42.98 96 96 96z" />
  </Svg>
);

export const FlashIcon = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg 
    stroke="currentColor" 
    fill="currentColor" 
    strokeWidth="0" 
    viewBox="0 0 24 24" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path fill="none" d="M0 0h24v24H0z" />
    <Path d="M7 2v11h3v9l7-12h-4l4-8z" />
  </Svg>
);

export const Logout = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg 
    stroke={color} 
    fill={color} 
    strokeWidth="0" 
    viewBox="0 0 24 24" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={style}
  >
    <Path d="M16 13v-2H7V8l-5 4 5 4v-3z" />
    <Path d="M20 3h-9c-1.103 0-2 .897-2 2v4h2V5h9v14h-9v-4H9v4c0 1.103.897 2 2 2h9c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2z" />
  </Svg>
);

export const Login = ({ color = 'currentColor', size = 20, style = {} }) => (
  <Svg 
    stroke={color} 
    fill="none" 
    strokeWidth="2" 
    viewBox="0 0 24 24" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    height={size} 
    width={size} 
    xmlns="http://www.w3.org/2000/svg" 
    style={{ marginLeft: 10, ...style }}
  >
    <Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <Path d="M10 17l5-5-5-5" />
    <Path d="M15 12H3" />
  </Svg>
);
