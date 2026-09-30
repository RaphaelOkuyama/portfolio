'use client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { useGSAP } from '@gsap/react';

// Registro único dos plugins — importe gsap daqui em vez de 'gsap' direto
gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, DrawSVGPlugin, SplitText, Draggable, InertiaPlugin, useGSAP);

export { gsap, ScrollTrigger, SplitText, Draggable, useGSAP };
