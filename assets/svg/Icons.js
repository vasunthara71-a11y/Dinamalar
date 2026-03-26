import React from 'react';
import { Svg, Path, Circle } from 'react-native-svg';

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

export const SpecialCalendar = ({ color = '#096dd2', size = 22, style = {} }) => (
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
