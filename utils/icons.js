import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

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

export const LiveIcon = (props) => (
  <Svg 
    stroke="currentColor" 
    fill="currentColor" 
    strokeWidth="0" 
    viewBox="0 0 24 24" 
    height={props.size || "1em"} 
    width={props.size || "1em"} 
    xmlns="http://www.w3.org/2000/svg" 
    style={{ fontSize: '14px' }}
    {...props}
  >
    <Path fill="none" d="M24 24H0V0h24v24z" />
    <Circle cx="9" cy="12" r="8" fill={props.redColor ||  "#0000FF"} />
    <Path d="M17 4.26v2.09a5.99 5.99 0 010 11.3v2.09c3.45-.89 6-4.01 6-7.74s-2.55-6.85-6-7.74z" fill={props.blueColor || "#FF0000"} />
  </Svg>
);

// Export all icons as a single object
export const SocialIcons = {
  Facebook: FacebookIcon,
  Twitter: TwitterIcon,
  WhatsApp: WhatsAppIcon,
  Telegram: TelegramIcon,
  Share: ShareIcon,
  Live: LiveIcon,
};

// Default export
export default SocialIcons;
