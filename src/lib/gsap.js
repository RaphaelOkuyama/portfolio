'use client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';

// Registro único dos plugins — importe gsap daqui em vez de 'gsap' direto
gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, DrawSVGPlugin, SplitText, Draggable, InertiaPlugin, CustomEase, useGSAP);

// Impacto do carimbo hanko: desce rápido, passa um pouco e assenta
CustomEase.create('hanko', 'M0,0 C0.14,0 0.24,1.18 0.42,1.12 0.56,1.07 0.66,0.97 0.78,0.99 0.86,1.01 0.94,1 1,1');

export { gsap, ScrollTrigger, SplitText, Draggable, CustomEase, useGSAP };
