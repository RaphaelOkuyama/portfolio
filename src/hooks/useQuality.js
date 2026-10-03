'use client';
import { useEffect } from 'react';
import { readQuality } from '../lib/journey/quality';
import { journeyStore } from '../store/journey';

// Qualidade inicial: a que a pessoa escolheu antes, ou o mínimo
export function useQuality() {
  useEffect(() => {
    journeyStore.getState().setInitialQuality(readQuality(window.localStorage));
  }, []);
}
