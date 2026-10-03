import { describe, it, expect } from 'vitest';
import { Box3, Vector3 } from 'three';
import { iwakuraGeometry } from '../../src/components/scene/iwakuraGeometry';

const box = (g) => new Box3().setFromBufferAttribute(g.attributes.position);

describe('磐座 iwakura', () => {
  const parts = iwakuraGeometry();

  it('a pedra assenta no chão (base em y = 0) e é mais alta que larga', () => {
    const b = box(parts.rock);
    expect(b.min.y).toBeCloseTo(0, 5);
    const size = b.getSize(new Vector3());
    expect(size.y).toBeGreaterThan(size.z);
  });

  it('a corda dá a volta inteira na pedra, no terço de cima, rente à superfície', () => {
    const rock = box(parts.rock);
    const rope = box(parts.rope);
    const center = rope.getCenter(new Vector3());
    // Altura: acima do meio da pedra e abaixo do topo
    expect(center.y).toBeGreaterThan((rock.min.y + rock.max.y) / 2);
    expect(center.y).toBeLessThan(rock.max.y);
    // Envolve a pedra pelos quatro lados, sem sobrar longe dela
    expect(rope.min.x).toBeLessThan(0);
    expect(rope.max.x).toBeGreaterThan(0);
    expect(rope.min.z).toBeLessThan(0);
    expect(rope.max.z).toBeGreaterThan(0);
    expect(rope.max.x - rope.min.x).toBeLessThan((rock.max.x - rock.min.x) * 1.15);
  });

  it('três papéis 紙垂 (4 degraus cada) e quatro tufos de palha pendurados na frente (+z)', () => {
    // Cada degrau de papel é um plano indexado (4 vértices)
    expect(parts.paper.attributes.position.count).toBe(3 * 4 * 4);
    expect(box(parts.paper).getCenter(new Vector3()).z).toBeGreaterThan(0);
    expect(box(parts.straw).getCenter(new Vector3()).z).toBeGreaterThan(0);
    // Pendurados abaixo da corda
    expect(box(parts.paper).max.y).toBeLessThanOrEqual(box(parts.rope).max.y);
  });

  it('é determinística e fica em cache (a mesma pedra em toda visita)', () => {
    expect(iwakuraGeometry()).toBe(parts);
    expect(parts.rock.attributes.color).toBeTruthy();
    expect(parts.rope.attributes.color).toBeTruthy();
  });
});
