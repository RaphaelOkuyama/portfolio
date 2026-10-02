// Roda inline no <head>, antes da hidratação, para tema e idioma salvos não piscarem.
// Tema: mesma regra de normalizeTheme (palette.js): 'day'/'light' → dia, o resto → noite.
// Idioma: o salvo (LANG_KEY); sem ele, o do navegador (pt* → pt, qualquer outro → en). Vai em
// <html lang> (o CSS de components/Lang.js mostra o texto certo) e em data-language (SettingsContext).
// Quem já viu o ensō (VISITED_KEY em loader.js) ganha data-visited: o CSS esconde o loader.
export const LANG_KEY = 'lang';

export const THEME_BOOT_SCRIPT =
  "(function(){var d=document.documentElement,t='night',l='pt';try{var s=localStorage.getItem('theme');if(s==='day'||s==='light')t='day';if(localStorage.getItem('oku-visited'))d.setAttribute('data-visited','');var g=localStorage.getItem('lang');if(g==='pt'||g==='en')l=g;else{var n=(navigator.languages&&navigator.languages[0])||navigator.language||'pt';l=/^pt/i.test(n)?'pt':'en';}}catch(e){}d.setAttribute('data-theme',t);d.setAttribute('data-language',l);d.lang=l==='pt'?'pt-BR':'en';})();";
