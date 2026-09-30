import { CatmullRomCurve3, Vector3 } from 'three';
import { CAMERA_PATH } from './config';

// Curva única da câmera, compartilhada pela câmera e pelos objetos posicionados ao longo dela
export function createCameraCurve() {
  return new CatmullRomCurve3(CAMERA_PATH.map((p) => new Vector3(...p)));
}
