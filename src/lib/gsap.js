'use client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { useGSAP } from '@gsap/react';

// Registro único dos plugins — importe gsap daqui em vez de 'gsap' direto
gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, DrawSVGPlugin, useGSAP);

export { gsap, ScrollTrigger, useGSAP };
