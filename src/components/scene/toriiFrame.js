import { Vector3 } from 'three';
import { groundHeight } from '../../lib/journey/ground';
import { getCameraCurve } from './useCameraMap';
import { GROUND } from './config';

// Referencial do torii no caminho: para frente (a tangente do caminho), para a direita e o
// ângulo que vira o +z local de uma peça para quem vem pelo caminho
export function toriiFrame(toriiT) {
  const curve = getCameraCurve();
  const point = curve.getPointAt(toriiT);
  const tangent = curve.getTangentAt(toriiT, new Vector3());
  const forward = new Vector3(tangent.x, 0, tangent.z).normalize();
  const side = new Vector3(-forward.z, 0, forward.x);
  const facing = Math.atan2(-forward.x, -forward.z);
  return { point, forward, side, facing };
}

// Posição no chão a `right` unidades para a direita do caminho e `ahead` além do portão
export function besideTorii(toriiT, right, ahead) {
  const { point, forward, side, facing } = toriiFrame(toriiT);
  const x = point.x + side.x * right + forward.x * ahead;
  const z = point.z + side.z * right + forward.z * ahead;
  return { x, z, y: groundHeight(x, z, GROUND), facing };
}
