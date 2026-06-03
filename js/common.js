export function $(s){return document.querySelector(s);} 
export function loadHigh(key){return parseInt(localStorage.getItem(key)||0,10);} 
export function saveHigh(key,val){localStorage.setItem(key,String(val));}
