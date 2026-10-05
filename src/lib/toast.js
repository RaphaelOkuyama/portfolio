'use client';
import { useEffect, useState } from 'react';

// Avisos (sonner) baixados só no primeiro uso: quase ninguém chega a ver um, e o pacote saía
// no JS inicial da página. O <Toaster> monta junto e o aviso sai depois que ele estiver ouvindo
let loading = null;
let mountToaster = null;
let toasterReady = null;

function load() {
  if (!loading) {
    loading = Promise.all([
      import('sonner'),
      new Promise((resolve) => { toasterReady = resolve; }),
    ]).then(([mod]) => mod.toast);
    import('sonner').then((mod) => mountToaster?.(() => mod.Toaster));
  }
  return loading;
}

const call = (method) => (...args) => {
  load().then((t) => (method ? t[method] : t)(...args));
};

// Mesma forma do toast do sonner; ids fixos no lugar do id devolvido (a chamada é assíncrona)
export const toast = Object.assign(call(null), {
  loading: call('loading'),
  success: call('success'),
  error: call('error'),
});

export function LazyToaster(props) {
  const [Toaster, setToaster] = useState(null);
  useEffect(() => {
    mountToaster = setToaster;
    return () => { mountToaster = null; };
  }, []);
  // Montado: libera os avisos que estavam esperando
  useEffect(() => {
    if (Toaster) toasterReady?.();
  }, [Toaster]);
  return Toaster ? <Toaster {...props} /> : null;
}
