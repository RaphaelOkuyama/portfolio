// Roda inline no <head>, antes da hidratação, para o tema salvo não piscar.
// Mesma regra de normalizeTheme (palette.js): 'day'/'light' → dia, o resto → noite.
export const THEME_BOOT_SCRIPT =
  "(function(){var t='night';try{var s=localStorage.getItem('theme');if(s==='day'||s==='light')t='day';}catch(e){}document.documentElement.setAttribute('data-theme',t);})();";
