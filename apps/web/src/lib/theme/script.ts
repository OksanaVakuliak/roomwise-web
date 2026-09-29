import {
  DARK_SCHEME_QUERY,
  THEME_ATTRIBUTE,
  THEME_COLORS,
  THEME_STORAGE_KEY,
} from './constants';

export const themeInitScript = `(function(){try{var m=null;try{m=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}var d=m==="dark"||(m!=="light"&&window.matchMedia(${JSON.stringify(DARK_SCHEME_QUERY)}).matches);var t=d?"dark":"light";var c=${JSON.stringify(THEME_COLORS)};document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},t);var e=document.querySelector('meta[name="theme-color"]');if(!e){e=document.createElement("meta");e.name="theme-color";document.head.appendChild(e)}e.content=c[t]}catch(e){}})()`;
